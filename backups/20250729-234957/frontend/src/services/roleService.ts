import { apiService, ApiResponse } from './api';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleData {
  name: string;
  description: string;
  permissions: string[];
  isActive?: boolean;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface RoleResponse {
  success: boolean;
  data: Role;
  message?: string;
}

export interface RolesResponse {
  success: boolean;
  data: Role[];
  message?: string;
}

export const roleService = {
  // Get all roles
  async getRoles(): Promise<ApiResponse<Role[]>> {
    const response = await apiService.get<Role[]>('/roles');
    return response;
  },

  // Get role by ID
  async getRoleById(id: string): Promise<ApiResponse<Role>> {
    const response = await apiService.get<Role>(`/roles/${id}`);
    return response;
  },

  // Create new role
  async createRole(roleData: CreateRoleData): Promise<ApiResponse<Role>> {
    const response = await apiService.post<Role>('/roles', roleData);
    return response;
  },

  // Update role
  async updateRole(id: string, roleData: UpdateRoleData): Promise<ApiResponse<Role>> {
    const response = await apiService.put<Role>(`/roles/${id}`, roleData);
    return response;
  },

  // Delete role
  async deleteRole(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await apiService.delete<{ success: boolean; message: string }>(`/roles/${id}`);
    return response;
  },

  // Get available permissions
  async getPermissions(): Promise<ApiResponse<string[]>> {
    const response = await apiService.get<string[]>('/roles/permissions');
    return response;
  }
}; 