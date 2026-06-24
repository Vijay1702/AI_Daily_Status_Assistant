import cron from 'node-cron';
import { prisma } from '../utils/db.js';
import { dailyStatusRepository } from '../repositories/dailyStatus.repository.js';
import { emailService } from '../services/email.service.js';
import logger from '../utils/logger.js';

export function scheduleReminderJob() {
  // Run every day at 6 PM (18:00)
  cron.schedule('0 18 * * *', async () => {
    logger.info('Starting daily reminder job...');

    try {
      // Get all active users
      const users = await prisma.user.findMany();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const user of users) {
        try {
          // Check if user has submitted status today
          const todayStatus = await dailyStatusRepository.findByUserIdAndDate(user.id, today);

          if (!todayStatus) {
            // Send reminder email
            await emailService.sendReminderEmail(user.name, user.email);

            // Log reminder
            await prisma.reminderLog.create({
              data: {
                userId: user.id,
                reminderDate: today,
                status: 'sent',
              },
            });

            logger.info(`Reminder sent to ${user.email}`);
          } else {
            // User already submitted, log as skipped
            await prisma.reminderLog.create({
              data: {
                userId: user.id,
                reminderDate: today,
                status: 'skipped',
              },
            });

            logger.info(`Reminder skipped for ${user.email} (already submitted)`);
          }
        } catch (error) {
          logger.error(`Error processing reminder for user ${user.id}:`, error);
        }
      }

      logger.info('Daily reminder job completed');
    } catch (error) {
      logger.error('Error in reminder job:', error);
    }
  });

  logger.info('Reminder job scheduled for daily execution at 6 PM');
}
