import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, Database, HardDrive, Activity, RefreshCw, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { settingsService } from '@/services/settingsService';
import toast from 'react-hot-toast';

interface SystemInfoData {
  version: string;
  uptime: number;
  memory: { used: number; total: number };
  disk: { used: number; total: number };
  database: { status: string; version: string };
}

export default function SystemInfo() {
  const [systemInfo, setSystemInfo] = useState<SystemInfoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const loadSystemInfo = async () => {
    try {
      const response = await settingsService.getSystemInfo();
      setSystemInfo(response.data);
    } catch (error: any) {
      toast.error(`Failed to load system info: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSystemInfo();
    setIsRefreshing(false);
    toast.success('System info refreshed');
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await settingsService.createBackup();
      toast.success(`Backup created successfully: ${response.data.filename}`);
    } catch (error: any) {
      toast.error(`Failed to create backup: ${error.message}`);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getPercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected':
      case 'online':
        return 'text-green-600';
      case 'disconnected':
      case 'offline':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!systemInfo) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">Failed to load system information</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Server className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              System Information
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor system health and performance
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
          >
            <Download className="w-4 h-4 mr-2" />
            Backup
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Version */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Version</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{systemInfo.version}</p>
            </div>
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatUptime(systemInfo.uptime)}</p>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Database</p>
              <p className={`text-lg font-semibold ${getStatusColor(systemInfo.database.status)}`}>
                {systemInfo.database.status}
              </p>
            </div>
          </div>
        </div>

        {/* Database Version */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">DB Version</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{systemInfo.database.version}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Memory & Disk Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Memory Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Activity className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Memory Usage</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">RAM utilization</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Used</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatBytes(systemInfo.memory.used)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatBytes(systemInfo.memory.total)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getPercentage(systemInfo.memory.used, systemInfo.memory.total)}%` }}
              ></div>
            </div>
            <div className="text-right text-sm text-gray-600 dark:text-gray-400">
              {getPercentage(systemInfo.memory.used, systemInfo.memory.total)}% used
            </div>
          </div>
        </div>

        {/* Disk Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <HardDrive className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Disk Usage</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Storage utilization</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Used</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatBytes(systemInfo.disk.used)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatBytes(systemInfo.disk.total)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getPercentage(systemInfo.disk.used, systemInfo.disk.total)}%` }}
              ></div>
            </div>
            <div className="text-right text-sm text-gray-600 dark:text-gray-400">
              {getPercentage(systemInfo.disk.used, systemInfo.disk.total)}% used
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 