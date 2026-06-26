// Type definitions for the application

export interface AuthPayload {
  id: string;
  email: string;
  masterNo: string;
}

export interface JwtPayload extends AuthPayload {
  iat: number;
  exp: number;
}

export interface TaskCategory {
  name: string;
  percentage: number;
}

export interface AIResponse {
  summary: string;
  tasks: string[];
  hours: number;
  workingFlag: boolean;
  categories?: TaskCategory[];
  blockers?: string[];
  nextActions?: string[];
  sentiment?: 'positive' | 'neutral' | 'concerning';
  confidence?: number;
}

export interface DailyStatusInput {
  statusText: string;
  hours?: number;
  workDate?: Date;
}

export interface TimesheetEntry {
  id: string;
  userId: string;
  statusText: string;
  aiSummary: string;
  hours: number;
  workDate: Date;
  workingFlag: boolean;
  aiAnalysis?: {
    categories?: TaskCategory[];
    blockers?: string[];
    nextActions?: string[];
    sentiment?: string;
    confidence?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalWorkingDays: number;
  totalHours: number;
  missingDays: number;
  currentMonthEntries: number;
  averageHours: number;
}

export interface ChartData {
  monthly: Array<{ month: string; hours: number }>;
  daily: Array<{ date: string; hours: number }>;
  categories: Array<{ category: string; count: number }>;
}

export interface UserProfile {
  id: string;
  name: string;
  masterNo: string;
  email: string;
  dailyHours: number;
  preferredModel: string;
  reminderTime: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    aiAnalysis?: AIResponse;
    sentiment?: string;
  };
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  sessionTitle: string;
  sessionContext?: string;
  messageCount?: number;
  createdAt: Date;
}

export interface MonthlyReportData {
  id: string;
  userId: string;
  month: number;
  year: number;
  filePath: string;
  emailSent: boolean;
  totalHours?: number;
  totalTasks?: number;
  createdAt: Date;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

