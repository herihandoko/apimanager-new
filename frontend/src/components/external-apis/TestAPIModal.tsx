import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TestTube, Play, Copy, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import toast from 'react-hot-toast';

interface ExternalAPI {
  id: string;
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

interface TestAPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  api: ExternalAPI;
}

interface TestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  duration: number;
  timestamp: string;
}

export default function TestAPIModal({
  isOpen,
  onClose,
  api,
}: TestAPIModalProps) {
  const [testParams, setTestParams] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<TestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Build the full URL
      let fullUrl = api.baseUrl + api.endpoint;
      
      // Replace path parameters
      if (testParams) {
        const params = JSON.parse(testParams);
        Object.keys(params).forEach(key => {
          fullUrl = fullUrl.replace(`{${key}}`, params[key]);
        });
      }

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (api.requiresAuth && api.authConfig) {
        headers[api.authConfig.headerName!] = api.authConfig.headerValue!;
      }

      // Prepare request options
      const requestOptions: RequestInit = {
        method: api.method,
        headers,
      };

      // Add body for non-GET requests
      if (api.method !== 'GET' && requestBody) {
        requestOptions.body = requestBody;
      }

      const startTime = Date.now();
      
      // Make the request
      const res = await fetch(fullUrl, requestOptions);
      const duration = Date.now() - startTime;

      // Get response data
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      // Convert headers to object
      const headersObj: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headersObj[key] = value;
      });

      const testResponse: TestResponse = {
        status: res.status,
        statusText: res.statusText,
        headers: headersObj,
        data,
        duration,
        timestamp: new Date().toISOString(),
      };

      setResponse(testResponse);
      toast.success('API test completed successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to test API');
      toast.error('API test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadResponse = () => {
    if (!response) return;

    const dataStr = JSON.stringify(response, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `api-test-${api.name}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-yellow-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatDuration = (duration: number) => {
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
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
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative inline-block w-full max-w-6xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl z-[9999]"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <TestTube className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Test API: {api.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Test the external API connection and view response
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Request Configuration */}
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                      Request Configuration
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Full URL
                        </label>
                        <div className="flex">
                          <Input
                            value={`${api.baseUrl}${api.endpoint}`}
                            readOnly
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(`${api.baseUrl}${api.endpoint}`)}
                            className="ml-2"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          HTTP Method
                        </label>
                        <Input
                          value={api.method}
                          readOnly
                          className="font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Path Parameters (JSON)
                        </label>
                        <Textarea
                          value={testParams}
                          onChange={(e) => setTestParams(e.target.value)}
                          placeholder='{"id": "1", "userId": "123"}'
                          rows={3}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Replace path parameters like {"{id}"} in the endpoint
                        </p>
                      </div>

                      {api.method !== 'GET' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Request Body (JSON)
                          </label>
                          <Textarea
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                            placeholder='{"key": "value"}'
                            rows={4}
                          />
                        </div>
                      )}

                      {api.requiresAuth && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                          <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                            <span className="text-sm text-yellow-800 dark:text-yellow-200">
                              Authentication required: {api.authType}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleTest}
                    disabled={isLoading || !api.isActive}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Testing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Play className="w-4 h-4 mr-2" />
                        Test API
                      </div>
                    )}
                  </Button>

                  {!api.isActive && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
                        <span className="text-sm text-red-800 dark:text-red-200">
                          API is currently inactive
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Response */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Response
                    </h4>
                    {response && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadResponse}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                        <span className="text-sm text-red-800 dark:text-red-200 font-medium">
                          Error
                        </span>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {error}
                      </p>
                    </div>
                  )}

                  {response && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
                      {/* Response Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Response Received
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className={`font-mono ${getStatusColor(response.status)}`}>
                            {response.status} {response.statusText}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDuration(response.duration)}
                          </span>
                        </div>
                      </div>

                      {/* Response Headers */}
                      <div>
                        <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
                          Headers
                        </h5>
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 p-3 max-h-32 overflow-y-auto">
                          <pre className="text-xs text-gray-600 dark:text-gray-400">
                            {JSON.stringify(response.headers, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {/* Response Body */}
                      <div>
                        <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
                          Response Body
                        </h5>
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 p-3 max-h-64 overflow-y-auto">
                          <pre className="text-xs text-gray-600 dark:text-gray-400">
                            {typeof response.data === 'string' 
                              ? response.data 
                              : JSON.stringify(response.data, null, 2)
                            }
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {!response && !error && !isLoading && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
                      <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Click "Test API" to send a request and view the response
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
} 