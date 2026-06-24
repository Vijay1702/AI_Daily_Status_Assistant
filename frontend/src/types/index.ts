// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Auth types
export interface User {
  id: string;
  name: string;
  masterNo: string;
  email: string;
  dailyHours: number;
  preferredModel: 'llama3' | 'qwen3' | 'mistral';
  reminderTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Chat types
export interface ChatSession {
  id: string;
  userId: string;
  sessionTitle: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

// Timesheet types
export interface TimesheetEntry {
  id: string;
  userId: string;
  statusText: string;
  aiSummary: string;
  hours: number;
  workDate: string;
  workingFlag: boolean;
  createdAt: string;
  updatedAt: string;
}

// Dashboard types
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

// Report types
export interface MonthlyReport {
  id: string;
  userId: string;
  month: number;
  year: number;
  filePath: string;
  emailSent: boolean;
  createdAt: string;
}
