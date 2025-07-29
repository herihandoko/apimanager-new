import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Server, Settings, Shield, Zap, Clock, AlertCircle, Plus, Database } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import toast from 'react-hot-toast';

interface APIProvider {
  id?: string;
  name: string;
  description: string;
  baseUrl: string;
  documentation?: string;
  requiresAuth: boolean;
  authType: 'none' | 'api_key' | 'bearer' | 'basic';
  authConfig?: {
    headerName?: string;
    headerValue?: string;
  };
  rateLimit: number;
  timeout: number;
  isActive: boolean;
  endpoints: Array<{
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    description: string;
  }>;
}

interface APIProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (provider: APIProvider) => Promise<void>;
  provider?: APIProvider;
  isLoading?: boolean;
}

const defaultProvider: APIProvider = {
  name: '',
  description: '',
  baseUrl: '',
  documentation: '',
  requiresAuth: false,
  authType: 'none',
  authConfig: {},
  rateLimit: 1000,
  timeout: 10000,
  isActive: true,
  endpoints: []
};

export default function APIProviderModal({
  isOpen,
  onClose,
  onSubmit,
  provider,
  isLoading = false,
}: APIProviderModalProps) {
  const [formData, setFormData] = useState<APIProvider>(defaultProvider);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [endpointPath, setEndpointPath] = useState('');
  const [endpointMethod, setEndpointMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [endpointDescription, setEndpointDescription] = useState('');

  const isEdit = !!provider?.id;

  useEffect(() => {
    if (provider) {
      setFormData(provider);
    } else {
      setFormData(defaultProvider);
    }
    setErrors({});
  }, [provider, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Provider name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.baseUrl.trim()) {
      newErrors.baseUrl = 'Base URL is required';
    } else if (!isValidUrl(formData.baseUrl)) {
      newErrors.baseUrl = 'Please enter a valid URL';
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

    if (formData.endpoints.length === 0) {
      newErrors.endpoints = 'At least one endpoint is required';
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

  const addEndpoint = () => {
    if (!endpointPath.trim() || !endpointDescription.trim()) {
      toast.error('Please fill in both path and description for the endpoint');
      return;
    }

    const newEndpoint = {
      path: endpointPath,
      method: endpointMethod,
      description: endpointDescription
    };

    setFormData(prev => ({
      ...prev,
      endpoints: [...prev.endpoints, newEndpoint]
    }));

    // Clear endpoint form
    setEndpointPath('');
    setEndpointMethod('GET');
    setEndpointDescription('');

    // Clear endpoint error
    if (errors.endpoints) {
      setErrors(prev => ({
        ...prev,
        endpoints: ''
      }));
    }
  };

  const removeEndpoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      endpoints: prev.endpoints.filter((_, i) => i !== index)
    }));
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
      toast.success(`API Provider ${isEdit ? 'updated' : 'created'} successfully`);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} API provider`);
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
                    <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {isEdit ? 'Edit API Provider' : 'Add New API Provider'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Configure API provider and its endpoints
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

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
                        Provider Name *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter provider name"
                        error={errors.name}
                      />
                    </div>
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
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description *
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe this API provider"
                      rows={3}
                      error={errors.description}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Documentation URL
                    </label>
                    <Input
                      value={formData.documentation || ''}
                      onChange={(e) => handleInputChange('documentation', e.target.value)}
                      placeholder="https://docs.example.com"
                    />
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
                            <option value="none">None</option>
                            <option value="api_key">API Key</option>
                            <option value="bearer">Bearer Token</option>
                            <option value="basic">Basic Auth</option>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Header Name
                          </label>
                          <Input
                            value={formData.authConfig?.headerName || ''}
                            onChange={(e) => handleAuthConfigChange('headerName', e.target.value)}
                            placeholder="X-API-Key"
                            error={errors.headerName}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Header Value
                          </label>
                          <Input
                            value={formData.authConfig?.headerValue || ''}
                            onChange={(e) => handleAuthConfigChange('headerValue', e.target.value)}
                            placeholder="your-api-key"
                            error={errors.headerValue}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rate Limiting & Timeout */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Rate Limiting & Timeout
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rate Limit (requests/hour)
                      </label>
                      <Input
                        type="number"
                        value={formData.rateLimit}
                        onChange={(e) => handleInputChange('rateLimit', parseInt(e.target.value))}
                        placeholder="1000"
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
                        placeholder="10000"
                        error={errors.timeout}
                      />
                    </div>
                  </div>
                </div>

                {/* Endpoints */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Database className="w-4 h-4 mr-2" />
                    Endpoints ({formData.endpoints.length})
                  </h4>
                  
                  {/* Add Endpoint Form */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Method
                      </label>
                      <Select
                        value={endpointMethod}
                        onChange={(e) => setEndpointMethod(e.target.value as any)}
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Path
                      </label>
                      <Input
                        value={endpointPath}
                        onChange={(e) => setEndpointPath(e.target.value)}
                        placeholder="/api/endpoint"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <Input
                        value={endpointDescription}
                        onChange={(e) => setEndpointDescription(e.target.value)}
                        placeholder="Describe this endpoint"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        onClick={addEndpoint}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Endpoints List */}
                  {formData.endpoints.length > 0 ? (
                    <div className="space-y-2">
                      {formData.endpoints.map((endpoint, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                              endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                              endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                              endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {endpoint.method}
                            </span>
                            <div>
                              <div className="font-mono text-sm">{endpoint.path}</div>
                              <div className="text-xs text-gray-500">{endpoint.description}</div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeEndpoint(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No endpoints added yet
                    </div>
                  )}
                  
                  {errors.endpoints && (
                    <p className="text-red-600 text-sm mt-2">{errors.endpoints}</p>
                  )}
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
                      Active
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
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
                      <div className="flex items-center">
                        <Server className="w-4 h-4 mr-2" />
                        {isEdit ? 'Update Provider' : 'Create Provider'}
                      </div>
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