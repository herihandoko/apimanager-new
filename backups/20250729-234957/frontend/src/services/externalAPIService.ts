import api from './api';

export interface ExternalAPI {
  id?: string;
  name: string;
  description: string;
  baseUrl: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requiresAuth: boolean;
  authType: 'none' | 'api_key' | 'bearer' | 'basic';
  authConfig?: {
    headerName?: string;
    headerValue?: string;
  };
  rateLimit: number;
  timeout: number;
  isActive: boolean;
  lastTested?: string;
  testStatus?: 'success' | 'error' | 'pending';
  createdAt?: string;
  updatedAt?: string;
  usage?: {
    total: number;
    today: number;
    thisMonth: number;
  };
}

export interface CreateExternalAPIRequest {
  name: string;
  description: string;
  baseUrl: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requiresAuth: boolean;
  authType: 'none' | 'api_key' | 'bearer' | 'basic';
  authConfig?: {
    headerName?: string;
    headerValue?: string;
  };
  rateLimit: number;
  timeout: number;
  isActive: boolean;
}

export interface UpdateExternalAPIRequest extends Partial<CreateExternalAPIRequest> {
  id: string;
}

export interface TestAPIRequest {
  apiId: string;
  params?: Record<string, any>;
  body?: any;
}

export interface TestAPIResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  duration: number;
  timestamp: string;
}

class ExternalAPIService {
  // Get all external APIs
  async getExternalAPIs(): Promise<ExternalAPI[]> {
    try {
      const response = await api.get('/external-apis');
      return response.data.data || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch external APIs');
    }
  }

  // Get external API by ID
  async getExternalAPI(id: string): Promise<ExternalAPI> {
    try {
      const response = await api.get(`/external-apis/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch external API');
    }
  }

  // Create new external API
  async createExternalAPI(data: CreateExternalAPIRequest): Promise<ExternalAPI> {
    try {
      const response = await api.post('/external-apis', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create external API');
    }
  }

  // Update external API
  async updateExternalAPI(data: UpdateExternalAPIRequest): Promise<ExternalAPI> {
    try {
      const response = await api.put(`/external-apis/${data.id}`, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update external API');
    }
  }

  // Delete external API
  async deleteExternalAPI(id: string): Promise<void> {
    try {
      await api.delete(`/external-apis/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete external API');
    }
  }

  // Toggle external API status
  async toggleExternalAPIStatus(id: string, isActive: boolean): Promise<ExternalAPI> {
    try {
      const response = await api.patch(`/external-apis/${id}/status`, { isActive });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to toggle external API status');
    }
  }

  // Test external API
  async testExternalAPI(data: TestAPIRequest): Promise<TestAPIResponse> {
    try {
      const response = await api.post(`/external-apis/${data.apiId}/test`, {
        params: data.params,
        body: data.body,
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to test external API');
    }
  }

  // Get external API usage statistics
  async getExternalAPIUsage(id: string): Promise<{
    total: number;
    today: number;
    thisMonth: number;
    daily: Array<{ date: string; count: number }>;
    hourly: Array<{ hour: number; count: number }>;
  }> {
    try {
      const response = await api.get(`/external-apis/${id}/usage`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch external API usage');
    }
  }

  // Get external API logs
  async getExternalAPILogs(id: string, page = 1, limit = 50): Promise<{
    logs: Array<{
      id: string;
      timestamp: string;
      method: string;
      url: string;
      status: number;
      duration: number;
      ip: string;
      userAgent: string;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const response = await api.get(`/external-apis/${id}/logs`, {
        params: { page, limit },
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch external API logs');
    }
  }

  // Bulk operations
  async bulkDeleteExternalAPIs(ids: string[]): Promise<void> {
    try {
      await api.post('/external-apis/bulk-delete', { ids });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete external APIs');
    }
  }

  async bulkToggleExternalAPIs(ids: string[], isActive: boolean): Promise<void> {
    try {
      await api.post('/external-apis/bulk-toggle', { ids, isActive });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to toggle external APIs');
    }
  }

  // Import/Export
  async exportExternalAPIs(): Promise<Blob> {
    try {
      const response = await api.get('/external-apis/export', {
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to export external APIs');
    }
  }

  async importExternalAPIs(file: File): Promise<{
    imported: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/external-apis/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to import external APIs');
    }
  }

  // Validation
  async validateExternalAPI(data: CreateExternalAPIRequest): Promise<{
    isValid: boolean;
    errors: Record<string, string>;
    warnings: string[];
  }> {
    try {
      const response = await api.post('/external-apis/validate', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate external API');
    }
  }

  // Health check
  async healthCheck(id: string): Promise<{
    status: 'healthy' | 'unhealthy' | 'unknown';
    responseTime: number;
    lastChecked: string;
    error?: string;
  }> {
    try {
      const response = await api.get(`/external-apis/${id}/health`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check external API health');
    }
  }
}

export const externalAPIService = new ExternalAPIService();
export default externalAPIService; 