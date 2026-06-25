import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  masterNo: z.string().min(1, 'Master number is required'),
  dailyHours: z.number().int().min(1).max(24).default(8),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  masterNo: z.string().min(1, 'Master number is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  dailyHours: z.number().int().min(1).max(24).optional(),
  preferredModel: z.enum(['llama3', 'qwen3', 'mistral']).optional(),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format').optional(),
});

// Chat schemas
export const chatMessageSchema = z.object({
  sessionId: z.string().nullable().optional(),
  content: z.string().min(1, 'Message cannot be empty').max(5000),
});

export const sendChatMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000),
});

export const createChatSessionSchema = z.object({
  sessionTitle: z.string().min(1, 'Session title is required'),
});

// Timesheet schemas
export const createTimesheetSchema = z.object({
  statusText: z.string().min(10, 'Status text must be at least 10 characters'),
  hours: z.number().int().min(0).max(24).optional(),
  workDate: z.string().datetime().optional(),
  workingFlag: z.boolean().default(true),
});

export const updateTimesheetSchema = z.object({
  statusText: z.string().min(10).optional(),
  aiSummary: z.string().optional(),
  hours: z.number().int().min(0).max(24).optional(),
  workingFlag: z.boolean().optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(500)).default('10'),
});

// Query schemas
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const monthYearSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>;
export type CreateTimesheetInput = z.infer<typeof createTimesheetSchema>;
export type UpdateTimesheetInput = z.infer<typeof updateTimesheetSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type DateRangeParams = z.infer<typeof dateRangeSchema>;
export type MonthYearParams = z.infer<typeof monthYearSchema>;
