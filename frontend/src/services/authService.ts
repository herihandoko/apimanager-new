import { apiService } from './api';
import { User, LoginForm, RegisterForm } from '@/types';

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  message: string;
}

export const authService = {
  // Login user
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  // Register new user
  async register(userData: RegisterForm): Promise<RegisterResponse> {
    const response = await apiService.post<RegisterResponse>('/auth/register', userData);
    return response.data;
  },

  // Logout user
  async logout(): Promise<void> {
    await apiService.post('/auth/logout');
  },

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    const response = await apiService.get<User>('/auth/me');
    return response.data;
  },

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiService.put<User>('/auth/me', userData);
    return response.data;
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiService.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  // Refresh token
  async refreshToken(): Promise<{ token: string }> {
    const response = await apiService.post<{ token: string }>('/auth/refresh');
    return response.data;
  },
}; 