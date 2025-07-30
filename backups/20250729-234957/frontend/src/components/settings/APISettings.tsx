import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Zap, Shield, Globe, Key, Gauge, AlertTriangle, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type { APISettings as APISettingsType } from '@/services/settingsService';
import toast from 'react-hot-toast';

interface APISettingsProps {
  settings: APISettingsType;
  onSave: (settings: Partial<APISettingsType>) => Promise<void>;
  isLoading?: boolean;
}

const rateLimitWindows = [
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 3600, label: '1 hour' },
  { value: 86400, label: '1 day' }
];

const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://yourdomain.com',
  'https://api.yourdomain.com'
];

export default function APISettings({ settings, onSave, isLoading = false }: APISettingsProps) {
  const [formData, setFormData] = useState<APISettingsType>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [newOrigin, setNewOrigin] = useState('');

  const handleInputChange = (field: keyof APISettingsType, value: string | boolean | number | string[]) => {
    setFormData((prev: APISettingsType) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddOrigin = () => {
    if (newOrigin.trim() && !formData.allowedOrigins.includes(newOrigin.trim())) {
      handleInputChange('allowedOrigins', [...formData.allowedOrigins, newOrigin.trim()]);
      setNewOrigin('');
    }
  };

  const handleRemoveOrigin = (origin: string) => {
    handleInputChange('allowedOrigins', formData.allowedOrigins.filter(o => o !== origin));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      toast.success('API settings updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update API settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setFormData({
      rateLimitEnabled: true,
      rateLimitRequests: 100,
      rateLimitWindow: 60,
      enableAPIKeys: true,
      requireAPIKeyAuth: false,
      enableCORS: true,
      allowedOrigins: ['*'],
      enableSwagger: true
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Zap className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              API Settings
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure API behavior, rate limiting, and security settings
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetToDefaults}
          disabled={isSaving}
        >
          Reset to Defaults
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Rate Limiting Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Gauge className="w-5 h-5 text-orange-600" />
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              Rate Limiting
            </h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Rate Limiting
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Limit the number of requests per time window
                </p>
              </div>
              <Switch
                checked={formData.rateLimitEnabled}
                onChange={(checked) => handleInputChange('rateLimitEnabled', checked)}
              />
            </div>

            {formData.rateLimitEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Requests per Window
                  </label>
                  <Input
                    type="number"
                    value={formData.rateLimitRequests}
                    onChange={(e) => handleInputChange('rateLimitRequests', parseInt(e.target.value))}
                    min="1"
                    max="10000"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Window
                  </label>
                  <Select
                    value={formData.rateLimitWindow.toString()}
                    onChange={(e) => handleInputChange('rateLimitWindow', parseInt(e.target.value))}
                  >
                    {rateLimitWindows.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* API Key Authentication Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Key className="w-5 h-5 text-green-600" />
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              API Key Authentication
            </h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable API Keys
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow users to create and manage API keys
                </p>
              </div>
              <Switch
                checked={formData.enableAPIKeys}
                onChange={(checked) => handleInputChange('enableAPIKeys', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Require API Key Authentication
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Force all API requests to include a valid API key
                </p>
              </div>
              <Switch
                checked={formData.requireAPIKeyAuth}
                onChange={(checked) => handleInputChange('requireAPIKeyAuth', checked)}
                disabled={!formData.enableAPIKeys}
              />
            </div>
          </div>
        </div>

        {/* CORS Configuration Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Globe className="w-5 h-5 text-blue-600" />
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              CORS Configuration
            </h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable CORS
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow cross-origin requests from web browsers
                </p>
              </div>
              <Switch
                checked={formData.enableCORS}
                onChange={(checked) => handleInputChange('enableCORS', checked)}
              />
            </div>

            {formData.enableCORS && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allowed Origins
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Add domains that are allowed to make cross-origin requests. Use * for all origins (not recommended for production).
                </p>
                
                <div className="space-y-2">
                  {formData.allowedOrigins.map((origin, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={origin}
                        onChange={(e) => {
                          const newOrigins = [...formData.allowedOrigins];
                          newOrigins[index] = e.target.value;
                          handleInputChange('allowedOrigins', newOrigins);
                        }}
                        placeholder="https://example.com"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveOrigin(origin)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newOrigin}
                      onChange={(e) => setNewOrigin(e.target.value)}
                      placeholder="https://example.com"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOrigin())}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddOrigin}
                      disabled={!newOrigin.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('allowedOrigins', ['*'])}
                  >
                    Allow All Origins (*)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('allowedOrigins', defaultOrigins)}
                    className="ml-2"
                  >
                    Use Default Origins
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* API Documentation Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              API Documentation
            </h4>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Swagger Documentation
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Provide interactive API documentation at /api-docs
              </p>
            </div>
            <Switch
              checked={formData.enableSwagger}
              onChange={(checked) => handleInputChange('enableSwagger', checked)}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="submit"
            disabled={isSaving || isLoading}
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