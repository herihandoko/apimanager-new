import { apiService, ApiResponse } from './api';

export interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export interface SecuritySettings {
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  requireMFA: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  enableAuditLogs: boolean;
  enableIPWhitelist: boolean;
  allowedIPs: string[];
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;
  enableEmailNotifications: boolean;
}

export interface APISettings {
  rateLimitEnabled: boolean;
  rateLimitRequests: number;
  rateLimitWindow: number;
  enableAPIKeys: boolean;
  requireAPIKeyAuth: boolean;
  enableCORS: boolean;
  allowedOrigins: string[];
  enableSwagger: boolean;
}

export interface SystemSettings {
  general: GeneralSettings;
  security: SecuritySettings;
  email: EmailSettings;
  api: APISettings;
}

export interface UpdateSettingsData {
  general?: Partial<GeneralSettings>;
  security?: Partial<SecuritySettings>;
  email?: Partial<EmailSettings>;
  api?: Partial<APISettings>;
}

export const settingsService = {
  // Get all system settings
  async getSettings(): Promise<ApiResponse<SystemSettings>> {
    const response = await apiService.get<SystemSettings>('/settings');
    return response;
  },

  // Update general settings
  async updateGeneralSettings(settings: Partial<GeneralSettings>): Promise<ApiResponse<GeneralSettings>> {
    const response = await apiService.put<GeneralSettings>('/settings/general', settings);
    return response;
  },

  // Update security settings
  async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<ApiResponse<SecuritySettings>> {
    const response = await apiService.put<SecuritySettings>('/settings/security', settings);
    return response;
  },

  // Update email settings
  async updateEmailSettings(settings: Partial<EmailSettings>): Promise<ApiResponse<EmailSettings>> {
    const response = await apiService.put<EmailSettings>('/settings/email', settings);
    return response;
  },

  // Update API settings
  async updateAPISettings(settings: Partial<APISettings>): Promise<ApiResponse<APISettings>> {
    const response = await apiService.put<APISettings>('/settings/api', settings);
    return response;
  },

  // Test email configuration
  async testEmailSettings(): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await apiService.post<{ success: boolean; message: string }>('/settings/email/test');
    return response;
  },

  // Get system information
  async getSystemInfo(): Promise<ApiResponse<{
    version: string;
    uptime: number;
    memory: { used: number; total: number };
    disk: { used: number; total: number };
    database: { status: string; version: string };
  }>> {
    const response = await apiService.get<{
      version: string;
      uptime: number;
      memory: { used: number; total: number };
      disk: { used: number; total: number };
      database: { status: string; version: string };
    }>('/settings/system-info');
    return response;
  },

  // Backup system
  async createBackup(): Promise<ApiResponse<{ backupId: string; filename: string; size: number }>> {
    const response = await apiService.post<{ backupId: string; filename: string; size: number }>('/settings/backup');
    return response;
  },

  // Restore system
  async restoreBackup(backupId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await apiService.post<{ success: boolean; message: string }>(`/settings/restore/${backupId}`);
    return response;
  }
}; 