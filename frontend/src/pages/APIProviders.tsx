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
  XCircle,
  Server,
  Database,
  Network,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import APIProviderModal from '@/components/api-providers/APIProviderModal';
import { apiProviderService, type APIProvider } from '@/services/apiProviderService';
import toast from 'react-hot-toast';

// Mock data for API Providers
const mockAPIProviders = [
  {
    id: 'cmdn31fxg0000cenoohlxq5a7',
    name: 'JSONPlaceholder',
    description: 'JSONPlaceholder API untuk testing dan prototyping',
    baseUrl: 'https://jsonplaceholder.typicode.com',
    documentation: 'https://jsonplaceholder.typicode.com/',
    requiresAuth: false,
    authType: 'none',
    authConfig: {},
    rateLimit: 1000,
    timeout: 10000,
    isActive: true,
    lastTested: '2024-01-15T10:30:00Z',
    testStatus: 'success',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    endpoints: [
      { path: '/todos/{id}', method: 'GET', description: 'Get todo by ID' },
      { path: '/todos', method: 'GET', description: 'Get all todos' },
      { path: '/posts/{id}', method: 'GET', description: 'Get post by ID' },
      { path: '/posts', method: 'GET', description: 'Get all posts' },
      { path: '/posts', method: 'POST', description: 'Create new post' },
      { path: '/posts/{id}', method: 'PUT', description: 'Update post' },
      { path: '/posts/{id}', method: 'PATCH', description: 'Patch post' },
      { path: '/posts/{id}', method: 'DELETE', description: 'Delete post' },
      { path: '/users/{id}', method: 'GET', description: 'Get user by ID' },
      { path: '/users', method: 'GET', description: 'Get all users' },
      { path: '/comments', method: 'GET', description: 'Get all comments' },
      { path: '/comments/{id}', method: 'GET', description: 'Get comment by ID' },
      { path: '/albums/{id}', method: 'GET', description: 'Get album by ID' },
      { path: '/albums', method: 'GET', description: 'Get all albums' },
      { path: '/photos', method: 'GET', description: 'Get all photos' },
      { path: '/photos/{id}', method: 'GET', description: 'Get photo by ID' }
    ],
    usage: {
      total: 15420,
      today: 234,
      thisMonth: 5430
    }
  },
  {
    id: 'cmdn3dyeb0000cvpz77dizu2l',
    name: 'RSUD Banten SIMRS',
    description: 'Sistem Informasi Manajemen Rumah Sakit (SIMRS) RSUD Banten',
    baseUrl: 'https://simrs.bantenprov.go.id',
    documentation: 'https://simrs.bantenprov.go.id/service/medifirst2000/',
    requiresAuth: true,
    authType: 'bearer',
    authConfig: {
      headerName: 'X-AUTH-TOKEN',
      headerValue: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbi5tYXN0ZXIifQ.4DXzZ_36kwFZbmmAVP86Rvot4jkQKsqIN9SwELAxUK0vw2veSDJjvJR-H6bedUvL3aEHg1X876kzJl4k595H4g'
    },
    rateLimit: 100,
    timeout: 30000,
    isActive: true,
    lastTested: '2024-01-15T10:30:00Z',
    testStatus: 'success',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    endpoints: [
      { path: '/service/medifirst2000/get-tempat-tidur', method: 'GET', description: 'Get data tempat tidur RSUD Banten' },
      { path: '/service/medifirst2000/get-pasien-bydepartemen', method: 'GET', description: 'Get data pasien per department RSUD Banten' },
      { path: '/service/medifirst2000/auth/sign-in', method: 'POST', description: 'Login ke SIMRS RSUD Banten' }
    ],
    usage: {
      total: 8900,
      today: 45,
      thisMonth: 1230
    }
  },
  {
    id: 'cmdn31fyy000xcenouqe8dhgc',
    name: 'OpenWeatherMap',
    description: 'Weather data API service',
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    documentation: 'https://openweathermap.org/api',
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
    endpoints: [
      { path: '/weather', method: 'GET', description: 'Get current weather data' },
      { path: '/forecast', method: 'GET', description: 'Get weather forecast' }
    ],
    usage: {
      total: 3200,
      today: 0,
      thisMonth: 0
    }
  }
];

export default function APIProviders() {
  const [apiProviders, setApiProviders] = useState<APIProvider[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [showEndpointsModal, setShowEndpointsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<APIProvider | null>(null);

  // Load API providers from backend
  useEffect(() => {
    const loadAPIProviders = async () => {
      try {
        setIsLoadingData(true);
        const providers = await apiProviderService.getAPIProviders();
        setApiProviders(providers);
      } catch (error: any) {
        console.error('Failed to load API providers:', error);
        toast.error('Failed to load API providers');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadAPIProviders();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const handleCreateProvider = () => {
    setSelectedProvider(null);
    setShowCreateModal(true);
  };

  const handleEditProvider = (provider: APIProvider) => {
    setSelectedProvider(provider);
    setShowEditModal(true);
  };

  const handleSubmitProvider = async (providerData: APIProvider) => {
    setIsLoading(true);
    try {
      if (providerData.id) {
        // Update existing provider
        const updatedProvider = await apiProviderService.updateAPIProvider(providerData.id, providerData);
        setApiProviders(prev => prev.map(provider => 
          provider.id === providerData.id ? updatedProvider : provider
        ));
      } else {
        // Create new provider
        const newProvider = await apiProviderService.createAPIProvider(providerData);
        setApiProviders(prev => [...prev, newProvider]);
      }
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (providerId: string) => {
    try {
      const currentProvider = apiProviders.find(provider => provider.id === providerId);
      if (!currentProvider) return;
      
      // Update local state
      setApiProviders(prev => prev.map(provider => 
        provider.id === providerId ? { ...provider, isActive: !provider.isActive } : provider
      ));
      toast.success('Provider status updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update provider status');
    }
  };

  const handleDeleteProvider = (providerId: string) => {
    const provider = apiProviders.find(p => p.id === providerId);
    if (!provider) return;

    setProviderToDelete(provider);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!providerToDelete) return;

    try {
      await apiProviderService.deleteAPIProvider(providerToDelete.id!);
      setApiProviders(prev => prev.filter(provider => provider.id !== providerToDelete.id));
      toast.success('API provider deleted successfully');
      setShowDeleteModal(false);
      setProviderToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete API provider');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProviderToDelete(null);
  };

  const handleViewEndpoints = (provider: any) => {
    setSelectedProvider(provider);
    setShowEndpointsModal(true);
  };

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

  const getProviderIcon = (name: string) => {
    if (name.toLowerCase().includes('jsonplaceholder')) {
      return <Globe className="w-5 h-5 text-blue-600" />;
    } else if (name.toLowerCase().includes('rsud') || name.toLowerCase().includes('simrs')) {
      return <Building className="w-5 h-5 text-green-600" />;
    } else if (name.toLowerCase().includes('weather')) {
      return <Zap className="w-5 h-5 text-yellow-600" />;
    }
    return <Server className="w-5 h-5 text-gray-600" />;
  };

  const filteredProviders = apiProviders.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.baseUrl.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && provider.isActive) ||
                         (statusFilter === 'inactive' && !provider.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            API Providers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage API providers and their endpoints efficiently
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
            onClick={handleCreateProvider}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Provider
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
                placeholder="Search providers..."
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
                <option value="all">All Providers</option>
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
              <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Providers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{apiProviders.length}</p>
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
                {apiProviders.filter(provider => provider.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Network className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Endpoints</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {apiProviders.reduce((sum, provider) => sum + provider.endpoints.length, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {apiProviders.reduce((sum, provider) => sum + (provider.usage?.total || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Providers List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            API Providers ({filteredProviders.length})
          </h2>
        </div>
        
        {/* Loading State */}
        {isLoadingData && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-gray-600 dark:text-gray-400">Loading API providers...</span>
            </div>
          </div>
        )}
        
        {/* Table */}
        {!isLoadingData && (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Base URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Endpoints
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
              {filteredProviders.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getProviderIcon(provider.name)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {provider.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {provider.description}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                          ID: {provider.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="font-mono text-xs truncate max-w-xs">
                        {provider.baseUrl}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="font-semibold">{provider.endpoints.length} endpoints</div>
                      <div className="text-gray-500 dark:text-gray-400">
                        {provider.endpoints.slice(0, 2).map(e => e.method).join(', ')}
                        {provider.endpoints.length > 2 && '...'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(provider.isActive)}`}>
                      {provider.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTestStatusIcon(provider.testStatus)}
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {provider.testStatus ? provider.testStatus.charAt(0).toUpperCase() + provider.testStatus.slice(1) : 'Not Tested'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div>
                      <div>Total: {provider.usage?.total?.toLocaleString() || '0'}</div>
                      <div className="text-gray-500 dark:text-gray-400">
                        Today: {provider.usage?.today || '0'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {provider.updatedAt ? formatDate(provider.updatedAt) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-1">
                      {/* Primary Actions - Always Visible */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewEndpoints(provider)}
                        title="View Endpoints"
                        className="hidden sm:inline-flex"
                      >
                        <Database className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProvider(provider)}
                        title="Edit Provider"
                        className="hidden sm:inline-flex"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      {/* Dropdown Menu for Secondary Actions */}
                      <div className="relative dropdown-container">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenDropdown(openDropdown === provider.id ? null : (provider.id || null))}
                          title="More Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        
                        {openDropdown === provider.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  copyToClipboard(`curl -X GET "http://localhost:8000/api/proxy/provider/${provider.id}/endpoint" -H "X-API-Key: YOUR_API_KEY"`);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Copy className="w-4 h-4 mr-3" />
                                Copy API Call
                              </button>
                              <button
                                onClick={() => {
                                  handleToggleStatus(provider.id!);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                {provider.isActive ? <EyeOff className="w-4 h-4 mr-3" /> : <Eye className="w-4 h-4 mr-3" />}
                                {provider.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteProvider(provider.id!);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4 mr-3" />
                                Delete Provider
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Mobile: Show Delete Button Always */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProvider(provider.id!)}
                        className="sm:hidden text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 dark:border-red-700 dark:hover:border-red-600"
                        title="Delete API Provider"
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
        )}
      </div>

      {/* Empty State */}
      {filteredProviders.length === 0 && (
        <div className="text-center py-12">
          <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No API providers found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get started by adding your first API provider.
          </p>
          <Button onClick={handleCreateProvider}>
            <Plus className="w-4 h-4 mr-2" />
            Add Provider
          </Button>
        </div>
      )}

      {/* Modals */}
      <APIProviderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSubmitProvider}
        isLoading={isLoading}
      />

      <APIProviderModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleSubmitProvider}
        provider={selectedProvider}
        isLoading={isLoading}
      />

      {/* Endpoints Modal */}
      {selectedProvider && (
        <div className={`fixed inset-0 z-50 overflow-y-auto ${showEndpointsModal ? 'block' : 'hidden'}`}>
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEndpointsModal(false)} />
            <div className="relative inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {selectedProvider.name} - Endpoints
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEndpointsModal(false)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Provider ID:</span>
                    <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1">
                      {selectedProvider.id}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Base URL:</span>
                    <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1">
                      {selectedProvider.baseUrl}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Auth Type:</span>
                    <div className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1">
                      {selectedProvider.authType}
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Available Endpoints ({selectedProvider.endpoints.length})</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedProvider.endpoints.map((endpoint: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`curl -X ${endpoint.method} "http://localhost:8000/api/proxy/provider/${selectedProvider.id}${endpoint.path}" -H "X-API-Key: YOUR_API_KEY"`)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && providerToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={cancelDelete} />
            
            {/* Modal */}
            <div className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              
              {/* Title */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Delete API Provider
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete this API provider? This action cannot be undone.
                </p>
              </div>

              {/* Provider Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  {getProviderIcon(providerToDelete.name)}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {providerToDelete.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {providerToDelete.description}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-1">
                      {providerToDelete.baseUrl}
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-red-700 dark:text-red-300">
                    <strong>Warning:</strong> This will permanently delete the API provider and all associated data. 
                    Any active integrations using this provider will stop working.
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={cancelDelete}
                  className="px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Provider
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 