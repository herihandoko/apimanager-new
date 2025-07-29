export interface DatabaseConnection {
  id: string;
  name: string;
  description: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  useSSL: boolean;
  useTunnel: boolean;
  tunnelConfig?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    queries: number;
    logs: number;
  };
}

export interface DynamicQuery {
  id: string;
  name: string;
  description: string;
  query: string;
  method: string;
  path: string;
  parameters: any[];
  responseFormat: string;
  cacheEnabled: boolean;
  cacheDuration: number;
  rateLimit: number;
  isActive: boolean;
  connectionId: string;
  createdAt: string;
  updatedAt: string;
  connection: {
    id: string;
    name: string;
    host: string;
    database: string;
  };
  _count: {
    logs: number;
  };
} 