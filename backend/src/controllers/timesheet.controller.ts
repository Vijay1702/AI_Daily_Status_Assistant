import { Request, Response } from 'express';
import { createTimesheetSchema, updateTimesheetSchema, paginationSchema } from '../utils/validation.js';
import { timesheetService } from '../services/timesheet.service.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export class TimesheetController {
  createEntry = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const input = createTimesheetSchema.parse(req.body);

    const entry = await timesheetService.createEntry(userId, input);

    res.status(201).json({
      success: true,
      data: entry,
      message: 'Timesheet entry created successfully',
    });
  });

  updateEntry = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;
    const input = updateTimesheetSchema.parse(req.body);

    const entry = await timesheetService.updateEntry(userId, id, input);

    res.json({
      success: true,
      data: entry,
      message: 'Timesheet entry updated successfully',
    });
  });

  deleteEntry = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    await timesheetService.deleteEntry(userId, id);

    res.json({
      success: true,
      message: 'Timesheet entry deleted successfully',
    });
  });

  getEntries = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { page, limit } = paginationSchema.parse(req.query);

    const result = await timesheetService.getEntries(userId, page, limit);

    res.json({
      success: true,
      data: result,
      message: 'Timesheet entries retrieved successfully',
    });
  });

  monitor = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { page, limit } = paginationSchema.parse(req.query);

    const result = await timesheetService.getEntries(userId, page, limit);

    res.json({
      success: true,
      data: result,
      message: 'Monitor entries retrieved successfully',
    });
  });

  getMonthlyEntries = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Month and year are required',
        message: 'Please provide month and year parameters',
      });
    }

    const entries = await timesheetService.getMonthlyEntries(
      userId,
      Number(month),
      Number(year)
    );

    res.json({
      success: true,
      data: entries,
      message: 'Monthly timesheet entries retrieved successfully',
    });
  });
}

export const timesheetController = new TimesheetController();
