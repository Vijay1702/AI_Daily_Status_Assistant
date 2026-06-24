import { prisma } from '../utils/db.js';
import { MonthlyReport } from '@prisma/client';

export class MonthlyReportRepository {
  async findById(id: string): Promise<MonthlyReport | null> {
    return prisma.monthlyReport.findUnique({
      where: { id },
    });
  }

  async create(data: {
    userId: string;
    month: number;
    year: number;
    filePath: string;
  }): Promise<MonthlyReport> {
    return prisma.monthlyReport.create({
      data: {
        ...data,
        emailSent: false,
      },
    });
  }

  async update(id: string, data: Partial<MonthlyReport>): Promise<MonthlyReport> {
    return prisma.monthlyReport.update({
      where: { id },
      data,
    });
  }

  async findByUserIdAndMonth(userId: string, month: number, year: number): Promise<MonthlyReport | null> {
    return prisma.monthlyReport.findUnique({
      where: {
        userId_month_year: {
          userId,
          month,
          year,
        },
      },
    });
  }

  async findByUserId(userId: string, skip: number = 0, take: number = 10): Promise<MonthlyReport[]> {
    return prisma.monthlyReport.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findNotEmailed(): Promise<MonthlyReport[]> {
    return prisma.monthlyReport.findMany({
      where: { emailSent: false },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.monthlyReport.count({
      where: { userId },
    });
  }
}

export const monthlyReportRepository = new MonthlyReportRepository();
