import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Shield, Lock, Clock, Users, Key } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import type { SecuritySettings as SecuritySettingsType } from '@/services/settingsService';
import toast from 'react-hot-toast';

interface SecuritySettingsProps {
  settings: SecuritySettingsType;
  onSave: (settings: Partial<SecuritySettingsType>) => Promise<void>;
  isLoading?: boolean;
}

export default function SecuritySettings({ settings, onSave, isLoading = false }: SecuritySettingsProps) {
  const [formData, setFormData] = useState<SecuritySettingsType>(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: keyof SecuritySettingsType, value: string | boolean | number | string[]) => {
    setFormData((prev: SecuritySettingsType) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      toast.success('Security settings updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center space-x-3">
        <Shield className="w-6 h-6 text-red-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Security Settings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure security policies and authentication settings
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Session Management */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Session Management
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Session Timeout (minutes)
              </label>
              <Input
                type="number"
                min="5"
                max="1440"
                value={formData.sessionTimeout}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                placeholder="30"
              />
            </div>
          </div>
        </div>

        {/* Login Security */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
            <Lock className="w-4 h-4 mr-2" />
            Login Security
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Login Attempts
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.maxLoginAttempts}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('maxLoginAttempts', parseInt(e.target.value))}
                placeholder="5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lockout Duration (minutes)
              </label>
              <Input
                type="number"
                min="5"
                max="1440"
                value={formData.lockoutDuration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('lockoutDuration', parseInt(e.target.value))}
                placeholder="15"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-blue-600" />
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  Require Multi-Factor Authentication
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Force users to enable MFA for enhanced security
                </p>
              </div>
            </div>
            <Switch
              checked={formData.requireMFA}
              onChange={(checked: boolean) => handleInputChange('requireMFA', checked)}
            />
          </div>
        </div>

        {/* Password Policy */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            Password Policy
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Password Length
              </label>
              <Input
                type="number"
                min="6"
                max="50"
                value={formData.passwordMinLength}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('passwordMinLength', parseInt(e.target.value))}
                placeholder="8"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  Require Uppercase Letters
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Passwords must contain at least one uppercase letter
                </p>
              </div>
              <Switch
                checked={formData.passwordRequireUppercase}
                onChange={(checked: boolean) => handleInputChange('passwordRequireUppercase', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  Require Lowercase Letters
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Passwords must contain at least one lowercase letter
                </p>
              </div>
              <Switch
                checked={formData.passwordRequireLowercase}
                onChange={(checked: boolean) => handleInputChange('passwordRequireLowercase', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  Require Numbers
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Passwords must contain at least one number
                </p>
              </div>
              <Switch
                checked={formData.passwordRequireNumbers}
                onChange={(checked: boolean) => handleInputChange('passwordRequireNumbers', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  Require Special Characters
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Passwords must contain at least one special character
                </p>
              </div>
              <Switch
                checked={formData.passwordRequireSymbols}
                onChange={(checked: boolean) => handleInputChange('passwordRequireSymbols', checked)}
              />
            </div>
          </div>
        </div>

        {/* Audit & Monitoring */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Audit & Monitoring
          </h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  Enable Audit Logs
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Log all user activities and system events
                </p>
              </div>
            </div>
            <Switch
              checked={formData.enableAuditLogs}
              onChange={(checked: boolean) => handleInputChange('enableAuditLogs', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  Enable IP Whitelist
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Restrict access to specific IP addresses
                </p>
              </div>
            </div>
            <Switch
              checked={formData.enableIPWhitelist}
              onChange={(checked: boolean) => handleInputChange('enableIPWhitelist', checked)}
            />
          </div>

          {formData.enableIPWhitelist && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Allowed IP Addresses (one per line)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                value={formData.allowedIPs.join('\n')}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('allowedIPs', e.target.value.split('\n').filter(ip => ip.trim()))}
                placeholder="192.168.1.1&#10;10.0.0.1&#10;172.16.0.1"
              />
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading || isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
} 