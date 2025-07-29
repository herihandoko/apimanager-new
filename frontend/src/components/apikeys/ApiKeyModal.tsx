import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader, Key, Calendar, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { apiKeyService, ApiKey, CreateApiKeyData, UpdateApiKeyData } from '@/services/apiKeyService';
import toast from 'react-hot-toast';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey?: ApiKey | null;
  onSuccess: (newApiKey?: any) => void;
}

const availablePermissions = [
  { value: 'read', label: 'Read', description: 'Allow reading data' },
  { value: 'write', label: 'Write', description: 'Allow creating and updating data' },
  { value: 'delete', label: 'Delete', description: 'Allow deleting data' },
  { value: 'admin', label: 'Admin', description: 'Full administrative access' }
];

const rateLimitOptions = [
  { value: 100, label: '100 requests/hour' },
  { value: 500, label: '500 requests/hour' },
  { value: 1000, label: '1,000 requests/hour' },
  { value: 5000, label: '5,000 requests/hour' },
  { value: 10000, label: '10,000 requests/hour' },
  { value: 50000, label: '50,000 requests/hour' },
  { value: 100000, label: '100,000 requests/hour' }
];

export default function ApiKeyModal({ isOpen, onClose, apiKey, onSuccess }: ApiKeyModalProps) {
  const isEditMode = !!apiKey;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateApiKeyData>({
    name: '',
    description: '',
    permissions: [],
    rateLimit: 1000
  });

  useEffect(() => {
    if (apiKey) {
      setFormData({
        name: apiKey.name,
        description: apiKey.description,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt || undefined
      });
    } else {
      setFormData({
        name: '',
        description: '',
        permissions: [],
        rateLimit: 1000
      });
    }
  }, [apiKey]);

  const handleInputChange = (field: keyof CreateApiKeyData, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleSelectAll = () => {
    setFormData(prev => ({
      ...prev,
      permissions: availablePermissions.map(p => p.value)
    }));
  };

  const handleClearAll = () => {
    setFormData(prev => ({
      ...prev,
      permissions: []
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('API key name is required');
      return false;
    }
    if (formData.permissions.length === 0) {
      toast.error('At least one permission is required');
      return false;
    }
    if (formData.rateLimit < 1) {
      toast.error('Rate limit must be at least 1');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isEditMode && apiKey) {
        const updateData: UpdateApiKeyData = {
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          rateLimit: formData.rateLimit,
          expiresAt: formData.expiresAt
        };
        await apiKeyService.updateApiKey(apiKey.id, updateData);
        toast.success('API key updated successfully');
        onSuccess();
      } else {
        const newApiKey = await apiKeyService.createApiKey(formData);
        toast.success('API key created successfully');
        onSuccess(newApiKey.data);
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9995] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditMode ? 'Edit API Key' : 'Create New API Key'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isEditMode ? 'Update API key settings' : 'Generate a new API key for external access'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                placeholder="Enter API key name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                placeholder="Enter description for this API key"
                rows={3}
              />
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Permissions *
              </h3>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePermissions.map(permission => (
                <label
                  key={permission.value}
                  className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission.value)}
                    onChange={() => handlePermissionToggle(permission.value)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {permission.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {permission.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Rate Limiting & Expiration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Rate Limiting & Expiration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rate Limit
                </label>
                <Select
                  value={formData.rateLimit}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('rateLimit', parseInt(e.target.value))}
                >
                  {rateLimitOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expiration Date
                </label>
                <Input
                  type="datetime-local"
                  value={formData.expiresAt || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('expiresAt', e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave empty for no expiration
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditMode ? 'Update API Key' : 'Create API Key'}
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
} 