import ExcelJS from 'exceljs';
import path from 'path';
import { promises as fs } from 'fs';
import { dailyStatusRepository } from '../repositories/dailyStatus.repository.js';
import { monthlyReportRepository } from '../repositories/monthlyReport.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import logger from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

export class ReportService {
  private reportsDir = path.join(process.cwd(), 'reports');

  constructor() {
    this.ensureReportsDir();
  }

  private async ensureReportsDir(): Promise<void> {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating reports directory:', error);
    }
  }

  async generateMonthlyReport(userId: string, month: number, year: number): Promise<string> {
    logger.info(`Generating monthly report for user ${userId}: ${month}/${year}`);

    // Get user info
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get monthly entries
    const entries = await dailyStatusRepository.findByUserIdAndMonth(userId, month, year);

    // Get stats
    const stats = await dailyStatusRepository.getMonthlyStats(userId, month, year);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Timesheet');

    // Set column widths
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Day', key: 'day', width: 12 },
      { header: 'Name', key: 'name', width: 15 },
      { header: 'Master No', key: 'masterNo', width: 12 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Hours', key: 'hours', width: 8 },
      { header: 'Working', key: 'working', width: 10 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Add data rows
    let rowIndex = 2;
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

    entries.forEach((entry) => {
      const date = new Date(entry.workDate);
      const dateStr = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });

      const row = worksheet.getRow(rowIndex);
      row.values = {
        date: dateStr,
        day: dayStr,
        name: user.name,
        masterNo: user.masterNo,
        description: entry.aiSummary || entry.statusText,
        hours: entry.hours,
        working: entry.workingFlag ? 'Yes' : 'No',
      };

      // Alternate row colors
      if (rowIndex % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' },
        };
      }

      row.alignment = {
        horizontal: 'left',
        vertical: 'middle',
        wrapText: true,
      };

      rowIndex++;
    });

    // Add summary rows
    const summaryStartRow = rowIndex + 1;

    // Total Working Days
    worksheet.getRow(summaryStartRow).values = {
      date: 'Total Working Days',
      hours: stats.totalWorkingDays,
    };
    const totalWorkingDaysRow = worksheet.getRow(summaryStartRow);
    totalWorkingDaysRow.font = { bold: true };
    totalWorkingDaysRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD966' },
    };

    // Total Hours
    worksheet.getRow(summaryStartRow + 1).values = {
      date: 'Total Hours',
      hours: stats.totalHours,
    };
    const totalHoursRow = worksheet.getRow(summaryStartRow + 1);
    totalHoursRow.font = { bold: true };
    totalHoursRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD966' },
    };

    // Average Hours
    const avgHours = entries.length > 0 ? (stats.totalHours / entries.length).toFixed(2) : 0;
    worksheet.getRow(summaryStartRow + 2).values = {
      date: 'Average Hours/Day',
      hours: avgHours,
    };
    const avgHoursRow = worksheet.getRow(summaryStartRow + 2);
    avgHoursRow.font = { bold: true };
    avgHoursRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD966' },
    };

    // Add title at top (insert row)
    worksheet.insertRow(1, []);
    const titleRow = worksheet.getRow(1);
    titleRow.values = [`Monthly Timesheet - ${monthName} ${year}`];
    titleRow.font = { bold: true, size: 14, color: { argb: 'FF366092' } };
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells('A1:G1');

    // Insert empty row
    worksheet.insertRow(2, []);

    // Save file
    const filename = `timesheet_${user.masterNo}_${month}_${year}.xlsx`;
    const filepath = path.join(this.reportsDir, filename);

    await workbook.xlsx.writeFile(filepath);

    logger.info(`Report saved to: ${filepath}`);

    // Save to database
    const report = await monthlyReportRepository.create({
      userId,
      month,
      year,
      filePath: filepath,
    });

    logger.info(`Report record created: ${report.id}`);

    return filepath;
  }

  async getReportFile(reportId: string, userId: string): Promise<Buffer> {
    const report = await monthlyReportRepository.findById(reportId);

    if (!report || report.userId !== userId) {
      throw new NotFoundError('Report not found');
    }

    try {
      const fileContent = await fs.readFile(report.filePath);
      return fileContent;
    } catch (error) {
      logger.error('Error reading report file:', error);
      throw new NotFoundError('Report file not found');
    }
  }

  async getReportHistory(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const reports = await monthlyReportRepository.findByUserId(userId, skip, limit);
    const total = await monthlyReportRepository.countByUserId(userId);

    return {
      items: reports,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }
}

export const reportService = new ReportService();
