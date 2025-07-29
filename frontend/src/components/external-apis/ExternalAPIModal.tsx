import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Settings, Shield, Zap, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import toast from 'react-hot-toast';

interface ExternalAPI {
  id?: string;
  name: string;
  description: string;
  baseUrl: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requiresAuth: boolean;
  authType: 'none' | 'api_key' | 'bearer' | 'basic';
  authConfig?: {
    headerName?: string;
    headerValue?: string;
  };
  rateLimit: number;
  timeout: number;
  isActive: boolean;
}

interface ExternalAPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (api: ExternalAPI) => Promise<void>;
  api?: ExternalAPI | null;
  isLoading?: boolean;
}

const defaultAPI: ExternalAPI = {
  name: '',
  description: '',
  baseUrl: '',
  endpoint: '',
  method: 'GET',
  requiresAuth: false,
  authType: 'none',
  rateLimit: 1000,
  timeout: 10000,
  isActive: true,
};

export default function ExternalAPIModal({
  isOpen,
  onClose,
  onSubmit,
  api,
  isLoading = false,
}: ExternalAPIModalProps) {
  const [formData, setFormData] = useState<ExternalAPI>(defaultAPI);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!api?.id;

  useEffect(() => {
    if (api) {
      setFormData(api);
    } else {
      setFormData(defaultAPI);
    }
    setErrors({});
  }, [api, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'API name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.baseUrl.trim()) {
      newErrors.baseUrl = 'Base URL is required';
    } else if (!isValidUrl(formData.baseUrl)) {
      newErrors.baseUrl = 'Please enter a valid URL';
    }

    if (!formData.endpoint.trim()) {
      newErrors.endpoint = 'Endpoint is required';
    }

    if (formData.requiresAuth && formData.authType !== 'none') {
      if (!formData.authConfig?.headerName?.trim()) {
        newErrors.headerName = 'Header name is required for authentication';
      }
      if (!formData.authConfig?.headerValue?.trim()) {
        newErrors.headerValue = 'Header value is required for authentication';
      }
    }

    if (formData.rateLimit <= 0) {
      newErrors.rateLimit = 'Rate limit must be greater than 0';
    }

    if (formData.timeout <= 0) {
      newErrors.timeout = 'Timeout must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleAuthConfigChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      authConfig: {
        ...prev.authConfig,
        [field]: value,
      },
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
      toast.success(`External API ${isEdit ? 'updated' : 'created'} successfully`);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} external API`);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-[9998]"
              onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl z-[9999]"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {isEdit ? 'Edit External API' : 'Add External API'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Configure external API integration
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        API Name *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter API name"
                        error={errors.name}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        HTTP Method
                      </label>
                      <Select
                        value={formData.method}
                        onChange={(e) => handleInputChange('method', e.target.value)}
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description *
                      </label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe what this API does"
                        rows={3}
                        error={errors.description}
                      />
                    </div>
                  </div>
                </div>

                {/* Endpoint Configuration */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Endpoint Configuration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Base URL *
                      </label>
                      <Input
                        value={formData.baseUrl}
                        onChange={(e) => handleInputChange('baseUrl', e.target.value)}
                        placeholder="https://api.example.com"
                        error={errors.baseUrl}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Endpoint *
                      </label>
                      <Input
                        value={formData.endpoint}
                        onChange={(e) => handleInputChange('endpoint', e.target.value)}
                        placeholder="/v1/resource/{id}"
                        error={errors.endpoint}
                      />
                    </div>
                  </div>
                </div>

                {/* Authentication */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Authentication
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Switch
                        checked={formData.requiresAuth}
                        onChange={(checked) => handleInputChange('requiresAuth', checked)}
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                        Requires Authentication
                      </span>
                    </div>
                    
                    {formData.requiresAuth && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Auth Type
                          </label>
                          <Select
                            value={formData.authType}
                            onChange={(e) => handleInputChange('authType', e.target.value)}
                          >
                            <option value="api_key">API Key</option>
                            <option value="bearer">Bearer Token</option>
                            <option value="basic">Basic Auth</option>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Header Name *
                          </label>
                          <Input
                            value={formData.authConfig?.headerName || ''}
                            onChange={(e) => handleAuthConfigChange('headerName', e.target.value)}
                            placeholder={formData.authType === 'api_key' ? 'X-API-Key' : 'Authorization'}
                            error={errors.headerName}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Header Value *
                          </label>
                          <Input
                            type="password"
                            value={formData.authConfig?.headerValue || ''}
                            onChange={(e) => handleAuthConfigChange('headerValue', e.target.value)}
                            placeholder="Enter your API key or token"
                            error={errors.headerValue}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance Settings */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Performance Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rate Limit (requests per minute)
                      </label>
                      <Input
                        type="number"
                        value={formData.rateLimit}
                        onChange={(e) => handleInputChange('rateLimit', parseInt(e.target.value))}
                        min="1"
                        error={errors.rateLimit}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Timeout (milliseconds)
                      </label>
                      <Input
                        type="number"
                        value={formData.timeout}
                        onChange={(e) => handleInputChange('timeout', parseInt(e.target.value))}
                        min="1000"
                        step="1000"
                        error={errors.timeout}
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Status
                  </h4>
                  <div className="flex items-center">
                    <Switch
                      checked={formData.isActive}
                      onChange={(checked) => handleInputChange('isActive', checked)}
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      Active (API will be available for use)
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {isEdit ? 'Updating...' : 'Creating...'}
                      </div>
                    ) : (
                      <>{isEdit ? 'Update API' : 'Create API'}</>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
} 