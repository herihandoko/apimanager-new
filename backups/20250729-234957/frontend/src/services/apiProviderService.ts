import api from './api';

export interface APIProvider {
  id?: string;
  name: string;
  description: string;
  baseUrl: string;
  documentation?: string;
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
  endpoints: Array<{
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    description: string;
  }>;
  usage?: {
    total: number;
    today: number;
    thisMonth: number;
  };
}

export interface APIProviderStats {
  totalProviders: number;
  activeProviders: number;
  totalEndpoints: number;
  totalRequests: number;
}

class APIProviderService {
  // Get all API providers
  async getAPIProviders(): Promise<APIProvider[]> {
    try {
      const response = await api.get('/api-providers');
      return response.data.data || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch API providers');
    }
  }

  // Get single API provider
  async getAPIProvider(id: string): Promise<APIProvider> {
    try {
      const response = await api.get(`/api-providers/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch API provider');
    }
  }

  // Create new API provider
  async createAPIProvider(provider: Omit<APIProvider, 'id'>): Promise<APIProvider> {
    try {
      const response = await api.post('/api-providers', provider);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create API provider');
    }
  }

  // Update API provider
  async updateAPIProvider(id: string, provider: Partial<APIProvider>): Promise<APIProvider> {
    try {
      const response = await api.put(`/api-providers/${id}`, provider);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update API provider');
    }
  }

  // Delete API provider
  async deleteAPIProvider(id: string): Promise<void> {
    try {
      await api.delete(`/api-providers/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete API provider');
    }
  }

  // Toggle API provider status
  async toggleAPIProviderStatus(id: string, isActive: boolean): Promise<APIProvider> {
    try {
      const response = await api.patch(`/api-providers/${id}/status`, { isActive });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update API provider status');
    }
  }

  // Test API provider
  async testAPIProvider(id: string): Promise<any> {
    try {
      const response = await api.post(`/api-providers/${id}/test`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to test API provider');
    }
  }

  // Get API provider stats
  async getAPIProviderStats(): Promise<APIProviderStats> {
    try {
      const response = await api.get('/api-providers/stats');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch API provider stats');
    }
  }

  // Get API provider logs
  async getAPIProviderLogs(id: string, filters?: any): Promise<any[]> {
    try {
      const response = await api.get(`/api-providers/${id}/logs`, { params: filters });
      return response.data.data || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch API provider logs');
    }
  }
}

export const apiProviderService = new APIProviderService(); 