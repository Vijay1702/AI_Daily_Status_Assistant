import cron from 'node-cron';
import { prisma } from '../utils/db.js';
import { reportService } from '../services/report.service.js';
import { emailService } from '../services/email.service.js';
import { monthlyReportRepository } from '../repositories/monthlyReport.repository.js';
import logger from '../utils/logger.js';

export function scheduleReportJob() {
  // Run on the last day of each month at 11 PM (23:00)
  // This cron will run daily, but we'll check if it's the last day
  cron.schedule('0 23 * * *', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if tomorrow is the first day of the month (meaning today is the last day)
    if (tomorrow.getDate() !== 1) {
      logger.debug('Not the last day of the month, skipping report generation');
      return;
    }

    logger.info('Starting monthly report generation job...');

    try {
      // Get all active users
      const users = await prisma.user.findMany();

      const month = today.getMonth() + 1;
      const year = today.getFullYear();

      for (const user of users) {
        try {
          logger.info(`Generating report for user ${user.id} (${month}/${year})`);

          // Check if report already exists for this month
          const existingReport = await monthlyReportRepository.findByUserIdAndMonth(
            user.id,
            month,
            year
          );

          if (existingReport && existingReport.emailSent) {
            logger.info(`Report already sent for user ${user.id}`);
            continue;
          }

          // Generate report
          const filePath = await reportService.generateMonthlyReport(user.id, month, year);

          // Send email with report
          await emailService.sendMonthlyReportEmail(user.name, user.email, month, year, filePath);

          // Update report as sent
          const report = await monthlyReportRepository.findByUserIdAndMonth(user.id, month, year);
          if (report) {
            await monthlyReportRepository.update(report.id, {
              emailSent: true,
            });
          }

          logger.info(`Report generated and sent for ${user.email}`);
        } catch (error) {
          logger.error(`Error generating report for user ${user.id}:`, error);
        }
      }

      logger.info('Monthly report generation job completed');
    } catch (error) {
      logger.error('Error in report job:', error);
    }
  });

  logger.info('Report job scheduled for monthly execution at 11 PM on last day of month');
}
