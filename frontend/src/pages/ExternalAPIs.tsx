import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Copy, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  RefreshCw,
  Calendar,
  Activity,
  Shield,
  AlertTriangle,
  Download,
  Upload,
  Globe,
  Zap,
  Settings,
  TestTube,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import ExternalAPIModal from '@/components/external-apis/ExternalAPIModal';
import TestAPIModal from '@/components/external-apis/TestAPIModal';
import { externalAPIService, type ExternalAPI } from '@/services/externalAPIService';
import toast from 'react-hot-toast';

// Mock data
const mockExternalAPIs: ExternalAPI[] = [
  {
    id: '1',
    name: 'JSONPlaceholder Todos',
    description: 'JSONPlaceholder API untuk testing todos',
    baseUrl: 'https://jsonplaceholder.typicode.com',
    endpoint: '/todos/{id}',
    method: 'GET',
    requiresAuth: false,
    authType: 'none',
    rateLimit: 1000,
    timeout: 10000,
    isActive: true,
    lastTested: '2024-01-15T10:30:00Z',
    testStatus: 'success',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    usage: {
      total: 15420,
      today: 234,
      thisMonth: 5430
    }
  },
  {
    id: '2',
    name: 'JSONPlaceholder Posts',
    description: 'JSONPlaceholder API untuk testing posts',
    baseUrl: 'https://jsonplaceholder.typicode.com',
    endpoint: '/posts/{id}',
    method: 'GET',
    requiresAuth: false,
    authType: 'none',
    rateLimit: 500,
    timeout: 10000,
    isActive: true,
    lastTested: '2024-01-14T15:45:00Z',
    testStatus: 'success',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-14T15:45:00Z',
    usage: {
      total: 8900,
      today: 45,
      thisMonth: 1230
    }
  },
  {
    id: '3',
    name: 'Weather API',
    description: 'External weather service API',
    baseUrl: 'https://api.weatherapi.com',
    endpoint: '/v1/current.json',
    method: 'GET',
    requiresAuth: true,
    authType: 'api_key',
    authConfig: {
      headerName: 'X-API-Key',
      headerValue: 'your-api-key-here'
    },
    rateLimit: 100,
    timeout: 5000,
    isActive: false,
    lastTested: '2024-01-10T08:20:00Z',
    testStatus: 'error',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-10T08:20:00Z',
    usage: {
      total: 3200,
      today: 0,
      thisMonth: 0
    }
  }
];

export default function ExternalAPIs() {
  const [externalAPIs, setExternalAPIs] = useState<ExternalAPI[]>(mockExternalAPIs);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedAPI, setSelectedAPI] = useState<ExternalAPI | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAPI = () => {
    setSelectedAPI(null);
    setShowCreateModal(true);
  };

  const handleEditAPI = (api: ExternalAPI) => {
    setSelectedAPI(api);
    setShowEditModal(true);
  };

  const handleDeleteAPI = async (apiId: string) => {
    if (confirm('Are you sure you want to delete this external API?')) {
      try {
        await externalAPIService.deleteExternalAPI(apiId);
        setExternalAPIs(prev => prev.filter(api => api.id !== apiId));
        toast.success('External API deleted successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete external API');
      }
    }
  };

  const handleTestAPI = (api: ExternalAPI) => {
    setSelectedAPI(api);
    setShowTestModal(true);
  };

  const handleToggleStatus = async (apiId: string) => {
    try {
      const currentAPI = externalAPIs.find(api => api.id === apiId);
      if (!currentAPI) return;
      
      const updatedAPI = await externalAPIService.toggleExternalAPIStatus(apiId, !currentAPI.isActive);
      setExternalAPIs(prev => prev.map(api => 
        api.id === apiId ? { ...api, isActive: updatedAPI.isActive } : api
      ));
      toast.success('API status updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update API status');
    }
  };

  const handleSubmitAPI = async (apiData: ExternalAPI) => {
    setIsLoading(true);
    try {
      if (apiData.id) {
        // Update existing API
        const { id, ...updateData } = apiData;
        const updatedAPI = await externalAPIService.updateExternalAPI({ id, ...updateData });
        setExternalAPIs(prev => prev.map(api => 
          api.id === id ? updatedAPI : api
        ));
      } else {
        // Create new API
        const { id, ...createData } = apiData;
        const newAPI = await externalAPIService.createExternalAPI(createData);
        setExternalAPIs(prev => [...prev, newAPI]);
      }
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadExternalAPIs = async () => {
    try {
      const apis = await externalAPIService.getExternalAPIs();
      setExternalAPIs(apis);
    } catch (error: any) {
      console.error('Failed to load external APIs:', error);
      // Keep using mock data for now
    }
  };

  // Load external APIs on component mount
  useEffect(() => {
    loadExternalAPIs();
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getTestStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredAPIs = externalAPIs.filter(api => {
    const matchesSearch = api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         api.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         api.baseUrl.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && api.isActive) ||
                         (statusFilter === 'inactive' && !api.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            External APIs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage external API integrations and configurations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            onClick={handleCreateAPI}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add External API
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <Input
                placeholder="Search APIs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All APIs</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total APIs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{externalAPIs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {externalAPIs.filter(api => api.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Errors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {externalAPIs.filter(api => api.testStatus === 'error').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Calls</p>
                             <p className="text-2xl font-bold text-gray-900 dark:text-white">
                 {externalAPIs.reduce((sum, api) => sum + (api.usage?.total || 0), 0).toLocaleString()}
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* API List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            External APIs ({filteredAPIs.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  API
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Endpoint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Test Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAPIs.map((api) => (
                <tr key={api.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {api.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {api.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="font-mono text-xs">{api.method}</div>
                      <div className="text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {api.baseUrl}{api.endpoint}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(api.isActive)}`}>
                      {api.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTestStatusIcon(api.testStatus)}
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {api.testStatus ? api.testStatus.charAt(0).toUpperCase() + api.testStatus.slice(1) : 'Not Tested'}
                      </span>
                    </div>
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                     <div>
                       <div>Total: {api.usage?.total?.toLocaleString() || '0'}</div>
                       <div className="text-gray-500 dark:text-gray-400">
                         Today: {api.usage?.today || '0'}
                       </div>
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                     {api.updatedAt ? formatDate(api.updatedAt) : 'N/A'}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestAPI(api)}
                      >
                        <TestTube className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAPI(api)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                                             <Button
                         variant="outline"
                         size="sm"
                         onClick={() => api.id && handleToggleStatus(api.id)}
                       >
                        {api.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                                             <Button
                         variant="outline"
                         size="sm"
                         onClick={() => api.id && handleDeleteAPI(api.id)}
                       >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredAPIs.length === 0 && (
        <div className="text-center py-12">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No external APIs found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get started by adding your first external API integration.
          </p>
          <Button onClick={handleCreateAPI}>
            <Plus className="w-4 h-4 mr-2" />
            Add External API
          </Button>
        </div>
      )}

      {/* Modals */}
      <ExternalAPIModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSubmitAPI}
        isLoading={isLoading}
      />

      <ExternalAPIModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleSubmitAPI}
        api={selectedAPI}
        isLoading={isLoading}
      />

      {selectedAPI && selectedAPI.id && (
        <TestAPIModal
          isOpen={showTestModal}
          onClose={() => setShowTestModal(false)}
          api={selectedAPI as ExternalAPI & { id: string }}
        />
      )}
    </div>
  );
} 