import { Request, Response } from 'express';
import { timesheetService } from '../services/timesheet.service.js';
import { dailyStatusRepository } from '../repositories/dailyStatus.repository.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export class DashboardController {
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const stats = await timesheetService.getDashboardStats(userId);

    res.json({
      success: true,
      data: stats,
      message: 'Dashboard statistics retrieved successfully',
    });
  });

  getCharts = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Get monthly hours chart data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const month = ((currentMonth - i - 1) % 12) + 1;
      const year = currentYear - (currentMonth - i - 1 < 1 ? 1 : 0);

      const stats = await dailyStatusRepository.getMonthlyStats(userId, month, year);
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'short' });

      monthlyData.push({
        month: monthName,
        hours: stats.totalHours,
      });
    }

    // Get daily trend data (last 30 days)
    const dailyData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const entry = await dailyStatusRepository.findByUserIdAndDate(userId, date);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      dailyData.push({
        date: dateStr,
        hours: entry?.hours || 0,
      });
    }

    // Get task categories (from current month)
    const entries = await dailyStatusRepository.findByUserIdAndMonth(userId, currentMonth, currentYear);

    const categoriesMap: Record<string, number> = {};
    entries.forEach((entry) => {
      const summary = entry.aiSummary || entry.statusText;
      // Extract first task as category
      const firstTask = summary.split(',')[0].trim().substring(0, 30);
      categoriesMap[firstTask] = (categoriesMap[firstTask] || 0) + 1;
    });

    const categories = Object.entries(categoriesMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        monthly: monthlyData,
        daily: dailyData,
        categories,
      },
      message: 'Chart data retrieved successfully',
    });
  });
}

export const dashboardController = new DashboardController();
