import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse } from '@/types';
import { useToastStore } from '@/store/toast';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: (import.meta as any).env.VITE_API_BASE_URL ? `${(import.meta as any).env.VITE_API_BASE_URL}/api` : '/api',
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
      (response) => {
        // Show success toast for success responses with message
        if (response.data?.success && response.data?.message) {
          // Don't show toast for GET requests (data retrieval)
          if (response.config.method !== 'get') {
            try {
              const toastStore = useToastStore();
              toastStore.addToast(response.data.message, 'success');
            } catch (e) {
              // Toast store not available yet
            }
          }
        }
        return response;
      },
      (error: AxiosError) => {
        const originalRequest = error.config;
        
        // Redirect to login on 401, but ONLY if the request was not the login attempt itself
        if (error.response?.status === 401 && !originalRequest?.url?.includes('/auth/login')) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        
        // Show error toast
        try {
          const toastStore = useToastStore();
          const errorData = error.response?.data as any;
          const errorMessage = errorData?.message || errorData?.error || 'An error occurred';
          toastStore.addToast(errorMessage, 'error');
        } catch (e) {
          // Toast store not available yet, error will show in console
          console.error('Error:', error);
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

  // Chat APIs - Standup Conversation
  async sendChatMessage(content: string) {
    return this.client.post<ApiResponse<any>>('/chat/message', { content });
  }

  async getChatSession() {
    return this.client.get<ApiResponse<any>>('/chat/session');
  }

  async resetChatSession() {
    return this.client.post<ApiResponse<any>>('/chat/session/reset');
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

  async getMonitorReports(page = 1, limit = 20) {
    return this.client.get<ApiResponse<any>>('/timesheet/monitor', {
      params: { page, limit },
    });
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
