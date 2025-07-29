import { apiService } from './api';
import { User } from '@/types';

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  roleId: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface UserResponse {
  success: boolean;
  data: User;
  message?: string;
}

export interface UsersResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export const userService = {
  // Get all users
  async getUsers(): Promise<UsersResponse> {
    const response = await apiService.get<UsersResponse>('/users');
    return response.data;
  },

  // Get user by ID
  async getUserById(id: string): Promise<UserResponse> {
    const response = await apiService.get<UserResponse>(`/users/${id}`);
    return response.data;
  },

  // Create new user
  async createUser(userData: CreateUserData): Promise<UserResponse> {
    const response = await apiService.post<UserResponse>('/users', userData);
    return response.data;
  },

  // Update user
  async updateUser(id: string, userData: UpdateUserData): Promise<UserResponse> {
    const response = await apiService.put<UserResponse>(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiService.delete<{ success: boolean; message: string }>(`/users/${id}`);
    return response.data;
  },

  // Reset user password (admin only)
  async resetPassword(id: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await apiService.post<{ success: boolean; message: string }>(`/users/${id}/reset-password`, {
      newPassword
    });
    return response.data;
  },

  // Get user audit logs
  async getUserAuditLogs(id: string): Promise<{ success: boolean; data: any[] }> {
    const response = await apiService.get<{ success: boolean; data: any[] }>(`/users/${id}/audit-logs`);
    return response.data;
  }
}; 