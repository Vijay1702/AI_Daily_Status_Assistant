import { prisma } from '../utils/db.js';
import { DailyStatus } from '@prisma/client';
import { UpdateTimesheetInput } from '../utils/validation.js';

export class DailyStatusRepository {
  async findById(id: string): Promise<DailyStatus | null> {
    return prisma.dailyStatus.findUnique({
      where: { id },
    });
  }

  async findByUserIdAndDate(userId: string, workDate: Date): Promise<DailyStatus | null> {
    return prisma.dailyStatus.findUnique({
      where: {
        userId_workDate: {
          userId,
          workDate,
        },
      },
    });
  }

  async create(data: {
    userId: string;
    statusText: string;
    aiSummary: string;
    hours: number;
    workDate: Date;
    workingFlag: boolean;
  }): Promise<DailyStatus> {
    return prisma.dailyStatus.create({
      data,
    });
  }

  async update(id: string, data: UpdateTimesheetInput): Promise<DailyStatus> {
    return prisma.dailyStatus.update({
      where: { id },
      data: {
        ...(data.statusText && { statusText: data.statusText }),
        ...(data.aiSummary && { aiSummary: data.aiSummary }),
        ...(data.hours !== undefined && { hours: data.hours }),
        ...(data.workingFlag !== undefined && { workingFlag: data.workingFlag }),
      },
    });
  }

  async delete(id: string): Promise<DailyStatus> {
    return prisma.dailyStatus.delete({
      where: { id },
    });
  }

  async findByUserId(userId: string, skip: number = 0, take: number = 10): Promise<DailyStatus[]> {
    return prisma.dailyStatus.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { workDate: 'desc' },
    });
  }

  async findByUserIdAndMonth(userId: string, month: number, year: number): Promise<DailyStatus[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return prisma.dailyStatus.findMany({
      where: {
        userId,
        workDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { workDate: 'asc' },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.dailyStatus.count({
      where: { userId },
    });
  }

  async countByUserIdAndMonth(userId: string, month: number, year: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return prisma.dailyStatus.count({
      where: {
        userId,
        workDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  async getMonthlyStats(
    userId: string,
    month: number,
    year: number
  ): Promise<{
    totalWorkingDays: number;
    totalHours: number;
    averageHours: number;
  }> {
    const result = await prisma.dailyStatus.aggregate({
      where: {
        userId,
        workDate: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0),
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        hours: true,
      },
      _avg: {
        hours: true,
      },
    });

    const workingDaysCount = await prisma.dailyStatus.count({
      where: {
        userId,
        workDate: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0),
        },
        workingFlag: true,
      },
    });

    return {
      totalWorkingDays: workingDaysCount,
      totalHours: result._sum.hours || 0,
      averageHours: result._avg.hours || 0,
    };
  }
}

export const dailyStatusRepository = new DailyStatusRepository();
