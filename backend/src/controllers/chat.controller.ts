import { Request, Response } from 'express';
import { chatMessageSchema, createChatSessionSchema, paginationSchema } from '../utils/validation.js';
import { chatSessionRepository, messageRepository } from '../repositories/chatSession.repository.js';
import { timesheetService } from '../services/timesheet.service.js';
import { aiService } from '../services/ai.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export class ChatController {
  createSession = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const input = createChatSessionSchema.parse(req.body);

    const session = await chatSessionRepository.create({
      userId,
      sessionTitle: input.sessionTitle,
    });

    res.status(201).json({
      success: true,
      data: session,
    });
  });

  sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { content, sessionId } = chatMessageSchema.parse(req.body);

    let session;

    // Create session if not provided
    if (!sessionId) {
      session = await chatSessionRepository.create({
        userId,
        sessionTitle: `Chat - ${new Date().toLocaleDateString()}`,
      });
    } else {
      session = await chatSessionRepository.findById(sessionId);
      if (!session || session.userId !== userId) {
        throw new NotFoundError('Chat session not found');
      }
    }

    // Save user message
    const userMessage = await messageRepository.create({
      sessionId: session.id,
      role: 'user',
      content,
    });

    // Get user for AI configuration
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Set AI model based on user preference
    aiService.setModel(user.preferredModel);

    // Try to create timesheet entry from the message
    let entryCreated = false;
    let entry: any = null;
    let aiResponse = '';

    try {
      entry = await timesheetService.createEntry(userId, {
        statusText: content,
      });
      entryCreated = true;

      aiResponse = `Thank you for your update! I've recorded your work status:

**Summary:** ${entry.aiSummary}

**Hours:** ${entry.hours}
**Date:** ${entry.workDate.toLocaleDateString()}

Your entry has been saved to your timesheet. You can view it on your dashboard anytime.`;
    } catch (error: any) {
      if (error.message?.includes('already submitted')) {
        aiResponse = error.message;
      } else {
        // Generate a conversational response if timesheet creation failed
        logger.warn('Timesheet creation failed:', error);
        aiResponse = await aiService.generateResponse(content);
      }
    }

    // Save AI response
    const assistantMessage = await messageRepository.create({
      sessionId: session.id,
      role: 'assistant',
      content: aiResponse,
    });

    res.json({
      success: true,
      data: {
        session,
        userMessage,
        assistantMessage,
        entryCreated,
        entry: entryCreated ? entry : null,
      },
    });
  });

  getHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { sessionId } = req.params;
    const { page, limit } = paginationSchema.parse(req.query);

    const session = await chatSessionRepository.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new NotFoundError('Chat session not found');
    }

    const skip = (page - 1) * limit;
    const messages = await messageRepository.findBySessionId(sessionId, skip, limit);
    const total = await messageRepository.countBySessionId(sessionId);

    res.json({
      success: true,
      data: {
        session,
        messages,
        total,
        page,
        limit,
        hasMore: skip + limit < total,
      },
    });
  });

  getSessions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { page, limit } = paginationSchema.parse(req.query);

    const skip = (page - 1) * limit;
    const sessions = await chatSessionRepository.findByUserId(userId, skip, limit);
    const total = await chatSessionRepository.countByUserId(userId);

    res.json({
      success: true,
      data: {
        sessions,
        total,
        page,
        limit,
        hasMore: skip + limit < total,
      },
    });
  });

  deleteSession = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { sessionId } = req.params;

    const session = await chatSessionRepository.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new NotFoundError('Chat session not found');
    }

    // Delete all messages first
    await messageRepository.deleteBySessionId(sessionId);

    // Delete session
    await chatSessionRepository.delete(sessionId);

    res.json({
      success: true,
      message: 'Chat session deleted successfully',
    });
  });
}

export const chatController = new ChatController();
