import { apiService, ApiResponse } from './api';

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string | object;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure' | 'warning';
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  resource?: string;
  severity?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogResponse {
  success: boolean;
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
}

export interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  thisWeekLogs: number;
  thisMonthLogs: number;
  criticalLogs: number;
  failedActions: number;
  topActions: Array<{
    action: string;
    count: number;
  }>;
  topUsers: Array<{
    userEmail: string;
    count: number;
  }>;
}

export const auditService = {
  async getAuditLogs(filters?: AuditLogFilters): Promise<ApiResponse<AuditLog[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiService.get<AuditLog[]>(`/audit?${params.toString()}`);
    return response;
  },

  async getAuditLogById(id: string): Promise<ApiResponse<AuditLog>> {
    const response = await apiService.get<AuditLog>(`/audit/${id}`);
    return response;
  },

  async getAuditStats(): Promise<ApiResponse<AuditStats>> {
    const response = await apiService.get<AuditStats>('/audit/stats');
    return response;
  },

  async exportAuditLogs(filters?: AuditLogFilters): Promise<ApiResponse<{ downloadUrl: string }>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiService.post<{ downloadUrl: string }>(`/audit/export?${params.toString()}`);
    return response;
  },

  async clearAuditLogs(olderThan?: string): Promise<ApiResponse<{ deletedCount: number }>> {
    const response = await apiService.delete<{ deletedCount: number }>(`/audit/clear${olderThan ? `?olderThan=${olderThan}` : ''}`);
    return response;
  }
}; 