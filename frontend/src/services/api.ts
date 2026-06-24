import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse } from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth APIs
  async register(data: {
    email: string;
    password: string;
    name: string;
    masterNo: string;
    dailyHours?: number;
  }) {
    return this.client.post<ApiResponse<any>>('/auth/register', data);
  }

  async login(data: { email: string; password: string }) {
    return this.client.post<ApiResponse<any>>('/auth/login', data);
  }

  async logout() {
    return this.client.post<ApiResponse<void>>('/auth/logout');
  }

  async getProfile() {
    return this.client.get<ApiResponse<any>>('/auth/profile');
  }

  async updateProfile(data: Partial<{
    name: string;
    masterNo: string;
    email: string;
    dailyHours: number;
    preferredModel: string;
    reminderTime: string;
  }>) {
    return this.client.put<ApiResponse<any>>('/auth/profile', data);
  }

  // Chat APIs
  async createChatSession(sessionTitle: string) {
    return this.client.post<ApiResponse<any>>('/chat/session', { sessionTitle });
  }

  async sendChatMessage(content: string, sessionId?: string) {
    return this.client.post<ApiResponse<any>>('/chat/message', {
      content,
      sessionId,
    });
  }

  async getChatHistory(sessionId: string, page = 1, limit = 50) {
    return this.client.get<ApiResponse<any>>(`/chat/${sessionId}/history`, {
      params: { page, limit },
    });
  }

  async getChatSessions(page = 1, limit = 10) {
    return this.client.get<ApiResponse<any>>('/chat/sessions', {
      params: { page, limit },
    });
  }

  async deleteChatSession(sessionId: string) {
    return this.client.delete<ApiResponse<void>>(`/chat/${sessionId}`);
  }

  // Timesheet APIs
  async createTimesheet(data: {
    statusText: string;
    hours?: number;
    workDate?: string;
    workingFlag?: boolean;
  }) {
    return this.client.post<ApiResponse<any>>('/timesheet', data);
  }

  async getTimesheet(page = 1, limit = 10) {
    return this.client.get<ApiResponse<any>>('/timesheet', {
      params: { page, limit },
    });
  }

  async getMonthlyTimesheet(month: number, year: number) {
    return this.client.get<ApiResponse<any>>('/timesheet', {
      params: { month, year },
    });
  }

  async updateTimesheet(id: string, data: any) {
    return this.client.put<ApiResponse<any>>(`/timesheet/${id}`, data);
  }

  async deleteTimesheet(id: string) {
    return this.client.delete<ApiResponse<void>>(`/timesheet/${id}`);
  }

  // Dashboard APIs
  async getDashboardStats() {
    return this.client.get<ApiResponse<any>>('/dashboard/stats');
  }

  async getDashboardCharts() {
    return this.client.get<ApiResponse<any>>('/dashboard/charts');
  }
}

export const apiClient = new ApiClient();
