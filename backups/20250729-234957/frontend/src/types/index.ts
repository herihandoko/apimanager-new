// User types
export interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  avatar?: string
  isActive: boolean
  isVerified: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
  role?: Role
  apiKeys?: ApiKey[]
}

// Role types
export interface Role {
  id: string
  name: string
  description?: string
  permissions: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  users?: User[]
}

// API Key types
export interface ApiKey {
  id: string
  name: string
  key: string
  description?: string
  permissions: string[]
  rateLimit: number
  ipWhitelist: string[]
  isActive: boolean
  expiresAt?: string
  lastUsedAt?: string
  createdAt: string
  updatedAt: string
  user?: User
}

// API Log types
export interface ApiLog {
  id: string
  apiKeyId?: string
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  ipAddress: string
  userAgent?: string
  requestBody?: any
  responseBody?: any
  error?: string
  createdAt: string
  apiKey?: ApiKey
}

// Audit Log types
export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  details?: any
  ipAddress?: string
  userAgent?: string
  createdAt: string
  user?: User
}

// Dashboard types
export interface DashboardOverview {
  totalApiKeys: number
  activeApiKeys: number
  totalRequests24h: number
  totalRequests7d: number
  totalRequests30d: number
  successRate: number
  avgResponseTime: number
}

export interface RecentActivity {
  id: string
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  apiKeyName: string
  createdAt: string
}

export interface TopApiKey {
  id: string
  name: string
  description?: string
  requestCount: number
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
}

export interface CreateApiKeyForm {
  name: string
  description?: string
  permissions: string[]
  rateLimit: number
  ipWhitelist: string[]
  expiresAt?: string
}

export interface CreateUserForm {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
  roleId?: string
}

export interface CreateRoleForm {
  name: string
  description?: string
  permissions: string[]
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// Navigation types
export interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  current?: boolean
  badge?: number
}

// Chart types
export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface TimeSeriesData {
  date: string
  value: number
}

// System types
export interface SystemConfig {
  app_settings?: {
    appName: string
    version: string
    maintenanceMode: boolean
    maxApiKeysPerUser: number
    defaultRateLimit: number
    sessionTimeout: number
  }
  security_settings?: {
    passwordMinLength: number
    requireMFA: boolean
    maxLoginAttempts: number
    lockoutDuration: number
    sessionTimeout: number
  }
}

export interface SystemHealth {
  status: string
  timestamp: string
  uptime: number
  responseTime: number
  services: {
    database: {
      status: string
      responseTime: number
    }
  }
  statistics: {
    totalUsers: number
    totalApiKeys: number
    totalAuditLogs: number
    totalApiLogs: number
  }
} 