import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';

import { env } from './utils/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { prisma } from './utils/db.js';
import logger from './utils/logger.js';
import { emailService } from './services/email.service.js';
import { aiService } from './services/ai.service.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import timesheetRoutes from './routes/timesheet.routes.js';
import chatRoutes from './routes/chat.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

// Jobs
import { scheduleReminderJob } from './jobs/reminder.job.js';
import { scheduleReportJob } from './jobs/report.job.js';

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(pinoHttp());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // increased for development/testing
  message: 'Too many login attempts, please try again later.',
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/timesheet', timesheetRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Status endpoint
app.get('/status', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const ollamaHealthy = await aiService.checkStatus();
    const emailConnected = await emailService.verifyConnection();

    res.json({
      status: 'ok',
      timestamp: new Date(),
      database: 'connected',
      ollama: ollamaHealthy ? 'connected' : 'disconnected',
      email: emailConnected ? 'connected' : 'disconnected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: 'Service unhealthy',
    });
  }
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const shutdownGracefully = async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdownGracefully);
process.on('SIGINT', shutdownGracefully);

// Start server
const port = env.PORT;

async function start() {
  try {
    // Verify database connection - wrap in try catch to allow startup even if DB fails
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('Database connected successfully');
    } catch (dbError) {
      logger.warn('Database connection issue (will retry):', dbError);
    }

    // Verify email service
    try {
      const emailConnected = await emailService.verifyConnection();
      if (emailConnected) {
        logger.info('Email service connected successfully');
      } else {
        logger.warn('Email service connection failed');
      }
    } catch (emailError) {
      logger.warn('Email service error:', emailError);
    }

    // Verify Ollama
    try {
      const ollamaHealthy = await aiService.checkStatus();
      if (ollamaHealthy) {
        logger.info('Ollama AI service connected successfully');
      } else {
        logger.warn('Ollama AI service connection failed');
      }
    } catch (ollamaError) {
      logger.warn('Ollama service error:', ollamaError);
    }

    // Schedule jobs
    try {
      scheduleReminderJob();
      scheduleReportJob();
    } catch (jobError) {
      logger.warn('Job scheduling error:', jobError);
    }

    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`Frontend URL: ${env.FRONTEND_URL}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
