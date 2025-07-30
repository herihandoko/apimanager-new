import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Globe, Shield, Server, Mail, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import GeneralSettings from '@/components/settings/GeneralSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import SystemInfo from '@/components/settings/SystemInfo';
import APISettings from '@/components/settings/APISettings';
import { settingsService, type SystemSettings } from '@/services/settingsService';
import toast from 'react-hot-toast';

type TabType = 'general' | 'security' | 'email' | 'api' | 'system';

const tabs = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'api', label: 'API', icon: Zap },
  { id: 'system', label: 'System Info', icon: Server }
];

// Mock data for settings
const mockSettings: SystemSettings = {
  general: {
    siteName: 'API Manager',
    siteDescription: 'Modern API Management Platform',
    timezone: 'Asia/Jakarta',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24',
    language: 'en',
    maintenanceMode: false,
    maintenanceMessage: 'System is under maintenance. Please try again later.'
  },
  security: {
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    requireMFA: false,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    enableAuditLogs: true,
    enableIPWhitelist: false,
    allowedIPs: []
  },
  email: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpSecure: true,
    fromEmail: 'noreply@apimanager.com',
    fromName: 'API Manager',
    enableEmailNotifications: true
  },
  api: {
    rateLimitEnabled: true,
    rateLimitRequests: 100,
    rateLimitWindow: 60,
    enableAPIKeys: true,
    requireAPIKeyAuth: false,
    enableCORS: true,
    allowedOrigins: ['*'],
    enableSwagger: true
  }
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [settings, setSettings] = useState<SystemSettings>(mockSettings);
  const [isLoading, setIsLoading] = useState(false);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await settingsService.getSettings();
      setSettings(response.data);
    } catch (error: any) {
      toast.error(`Failed to load settings: ${error.message}`);
      // Keep using mock data if API fails
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGeneral = async (generalSettings: any) => {
    try {
      await settingsService.updateGeneralSettings(generalSettings);
      setSettings(prev => ({ ...prev, general: generalSettings }));
    } catch (error: any) {
      throw error;
    }
  };

  const handleSaveSecurity = async (securitySettings: any) => {
    try {
      await settingsService.updateSecuritySettings(securitySettings);
      setSettings(prev => ({ ...prev, security: securitySettings }));
    } catch (error: any) {
      throw error;
    }
  };

  const handleSaveEmail = async (emailSettings: any) => {
    try {
      await settingsService.updateEmailSettings(emailSettings);
      setSettings(prev => ({ ...prev, email: emailSettings }));
    } catch (error: any) {
      throw error;
    }
  };

  const handleSaveAPI = async (apiSettings: any) => {
    try {
      await settingsService.updateAPISettings(apiSettings);
      setSettings(prev => ({ ...prev, api: apiSettings }));
    } catch (error: any) {
      throw error;
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings
            settings={settings.general}
            onSave={handleSaveGeneral}
            isLoading={isLoading}
          />
        );
      case 'security':
        return (
          <SecuritySettings
            settings={settings.security}
            onSave={handleSaveSecurity}
            isLoading={isLoading}
          />
        );
      case 'email':
        return (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Email Settings
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Email configuration interface coming soon...
            </p>
          </div>
        );
      case 'api':
        return (
          <APISettings
            settings={settings.api}
            onSave={handleSaveAPI}
            isLoading={isLoading}
          />
        );
      case 'system':
        return <SystemInfo />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure system settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSettings}
            disabled={isLoading}
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 