import { dailyStatusRepository } from '../repositories/dailyStatus.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { CreateTimesheetInput } from '../utils/validation.js';
import logger from '../utils/logger.js';
import { DashboardStats, TimesheetEntry } from '../types/index.js';

export class TimesheetService {
  async createEntry(userId: string, input: CreateTimesheetInput): Promise<TimesheetEntry> {
    // Get user to fetch default hours
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Determine work date
    const workDate = input.workDate ? new Date(input.workDate) : new Date();
    workDate.setHours(0, 0, 0, 0);

    // Check for duplicate entry
    const existingEntry = await dailyStatusRepository.findByUserIdAndDate(userId, workDate);

    if (existingEntry) {
      throw new ConflictError('You already submitted a status for today. Please edit the existing entry or contact support.');
    }

    const hours = input.hours || user.dailyHours;

    logger.info(`Creating timesheet entry for user ${userId}`, {
      workDate,
      hours,
    });

    // Create database entry
    const entry = await dailyStatusRepository.create({
      userId,
      statusText: input.statusText,
      aiSummary: input.statusText.substring(0, 200),
      hours,
      workDate,
      workingFlag: input.workingFlag ?? true,
    });

    return this.formatEntry(entry);
  }

  async updateEntry(userId: string, entryId: string, input: any): Promise<TimesheetEntry> {
    // Verify entry belongs to user
    const entry = await dailyStatusRepository.findById(entryId);
    if (!entry || entry.userId !== userId) {
      throw new NotFoundError('Timesheet entry not found');
    }

    // Update entry
    const updated = await dailyStatusRepository.update(entryId, input);

    logger.info(`Updated timesheet entry ${entryId} for user ${userId}`);

    return this.formatEntry(updated);
  }

  async deleteEntry(userId: string, entryId: string): Promise<void> {
    // Verify entry belongs to user
    const entry = await dailyStatusRepository.findById(entryId);
    if (!entry || entry.userId !== userId) {
      throw new NotFoundError('Timesheet entry not found');
    }

    await dailyStatusRepository.delete(entryId);

    logger.info(`Deleted timesheet entry ${entryId} for user ${userId}`);
  }

  async getEntries(userId: string, page: number = 1, limit: number = 10): Promise<{
    items: TimesheetEntry[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const skip = (page - 1) * limit;
    const entries = await dailyStatusRepository.findByUserId(userId, skip, limit);
    const total = await dailyStatusRepository.countByUserId(userId);

    return {
      items: entries.map((e) => this.formatEntry(e)),
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async getAllEntries(page: number = 1, limit: number = 20): Promise<{
    items: (TimesheetEntry & { user: any })[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const skip = (page - 1) * limit;
    // We need to fetch all entries, ordered by date desc, including user info
    const prisma = (await import('../utils/db.js')).prisma;
    
    const [entries, total] = await Promise.all([
      prisma.dailyStatus.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, masterNo: true }
          }
        }
      }),
      prisma.dailyStatus.count()
    ]);

    return {
      items: entries.map((e: any) => ({ ...this.formatEntry(e), user: e.user })),
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async getMonthlyEntries(userId: string, month: number, year: number): Promise<TimesheetEntry[]> {
    const entries = await dailyStatusRepository.findByUserIdAndMonth(userId, month, year);
    return entries.map((e) => this.formatEntry(e));
  }

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const stats = await dailyStatusRepository.getMonthlyStats(userId, currentMonth, currentYear);

    // Calculate missing days
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const currentDay = today.getDate();
    const expectedWorkingDays = currentDay; // Days up to today
    const missingDays = Math.max(0, expectedWorkingDays - stats.totalWorkingDays);

    // Get current month entries count
    const entriesCount = await dailyStatusRepository.countByUserIdAndMonth(userId, currentMonth, currentYear);

    return {
      totalWorkingDays: stats.totalWorkingDays,
      totalHours: stats.totalHours,
      missingDays,
      currentMonthEntries: entriesCount,
      averageHours: stats.averageHours > 0 ? Math.round(stats.averageHours * 100) / 100 : 0,
    };
  }

  private formatEntry(entry: any): TimesheetEntry {
    return {
      id: entry.id,
      userId: entry.userId,
      statusText: entry.statusText,
      aiSummary: entry.aiSummary,
      hours: entry.hours,
      workDate: entry.workDate,
      workingFlag: entry.workingFlag,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }
}

export const timesheetService = new TimesheetService();
