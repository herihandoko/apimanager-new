import { apiService, ApiResponse } from './api';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  description: string;
  permissions: string[];
  rateLimit: number;
  isActive: boolean;
  lastUsed: string;
  createdAt: string;
  expiresAt: string | null;
  userId: string;
  usage: {
    total: number;
    today: number;
    thisMonth: number;
  };
}

export interface CreateApiKeyData {
  name: string;
  description: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: string;
}

export interface UpdateApiKeyData {
  name?: string;
  description?: string;
  permissions?: string[];
  rateLimit?: number;
  isActive?: boolean;
  expiresAt?: string;
}

export interface ApiKeyResponse {
  success: boolean;
  data: ApiKey;
  message?: string;
}

export interface ApiKeysResponse {
  success: boolean;
  data: ApiKey[];
  message?: string;
}

export interface ApiKeyStats {
  totalKeys: number;
  activeKeys: number;
  expiringSoon: number;
  totalRequests: number;
}

export const apiKeyService = {
  // Get all API keys
  async getApiKeys(): Promise<ApiKeysResponse> {
    const response = await apiService.get<ApiKey[]>('/apikeys');
    return response;
  },

  // Get API key by ID
  async getApiKeyById(id: string): Promise<ApiKeyResponse> {
    const response = await apiService.get<ApiKey>(`/apikeys/${id}`);
    return response;
  },

  // Create new API key
  async createApiKey(apiKeyData: CreateApiKeyData): Promise<ApiKeyResponse> {
    const response = await apiService.post<ApiKey>('/apikeys', apiKeyData);
    return response;
  },

  // Update API key
  async updateApiKey(id: string, apiKeyData: UpdateApiKeyData): Promise<ApiKeyResponse> {
    const response = await apiService.put<ApiKey>(`/apikeys/${id}`, apiKeyData);
    return response;
  },

  // Delete API key
  async deleteApiKey(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await apiService.delete<{ success: boolean; message: string }>(`/apikeys/${id}`);
    return response;
  },

  // Regenerate API key
  async regenerateApiKey(id: string): Promise<ApiKeyResponse> {
    const response = await apiService.post<ApiKey>(`/apikeys/${id}/regenerate`);
    return response;
  },

  // Get API key usage
  async getApiKeyUsage(id: string): Promise<ApiResponse<{
    total: number;
    today: number;
    thisMonth: number;
    history: Array<{
      date: string;
      requests: number;
    }>;
  }>> {
    const response = await apiService.get<{
      total: number;
      today: number;
      thisMonth: number;
      history: Array<{
        date: string;
        requests: number;
      }>;
    }>(`/apikeys/${id}/usage`);
    return response;
  },

  // Get API key statistics
  async getApiKeyStats(): Promise<ApiResponse<ApiKeyStats>> {
    const response = await apiService.get<ApiKeyStats>('/apikeys/stats');
    return response;
  },

  // Validate API key
  async validateApiKey(key: string): Promise<ApiResponse<{
    isValid: boolean;
    permissions: string[];
    rateLimit: number;
    usage: {
      total: number;
      today: number;
      thisMonth: number;
    };
  }>> {
    const response = await apiService.post<{
      isValid: boolean;
      permissions: string[];
      rateLimit: number;
      usage: {
        total: number;
        today: number;
        thisMonth: number;
      };
    }>('/apikeys/validate', { key });
    return response;
  }
}; 