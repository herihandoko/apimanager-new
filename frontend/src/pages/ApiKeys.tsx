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
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiKeyService, ApiKey, ApiKeyStats } from '@/services/apiKeyService';
import ApiKeyModal from '@/components/apikeys/ApiKeyModal';
import toast from 'react-hot-toast';

// Mock data as fallback
const mockApiKeys: ApiKey[] = [
  {
    id: '1',
    name: 'Production API Key',
    key: 'pk_live_1234567890abcdef',
    description: 'Main production API key for client applications',
    permissions: ['read', 'write'],
    rateLimit: 1000,
    isActive: true,
    lastUsed: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    expiresAt: '2025-01-01T00:00:00Z',
    userId: 'user1',
    usage: {
      total: 15420,
      today: 234,
      thisMonth: 5430
    }
  },
  {
    id: '2',
    name: 'Development Key',
    key: 'pk_test_abcdef1234567890',
    description: 'Development and testing API key',
    permissions: ['read'],
    rateLimit: 100,
    isActive: true,
    lastUsed: '2024-01-14T15:45:00Z',
    createdAt: '2024-01-10T00:00:00Z',
    expiresAt: null,
    userId: 'user1',
    usage: {
      total: 5430,
      today: 45,
      thisMonth: 1230
    }
  },
  {
    id: '3',
    name: 'Mobile App Key',
    key: 'pk_mobile_9876543210fedcba',
    description: 'API key for mobile application',
    permissions: ['read', 'write'],
    rateLimit: 500,
    isActive: false,
    lastUsed: '2024-01-10T08:20:00Z',
    createdAt: '2024-01-05T00:00:00Z',
    expiresAt: '2024-02-01T00:00:00Z',
    userId: 'user1',
    usage: {
      total: 8900,
      today: 0,
      thisMonth: 2100
    }
  }
];

const mockStats: ApiKeyStats = {
  totalKeys: 3,
  activeKeys: 2,
  expiringSoon: 1,
  totalRequests: 29750
};

export default function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
  const [stats, setStats] = useState<ApiKeyStats>(mockStats);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadApiKeys();
    loadStats();
  }, []);

  const loadApiKeys = async () => {
    setIsLoading(true);
    try {
      const response = await apiKeyService.getApiKeys();
      if (!response || !response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid API response: missing API keys array');
      }
      setApiKeys(response.data);
    } catch (error: any) {
      toast.error(`Failed to load API keys: ${error.message}`);
      // Keep using mock data if API fails
      setApiKeys(mockApiKeys);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiKeyService.getApiKeyStats();
      if (response && response.data) {
        setStats(response.data);
      }
    } catch (error: any) {
      // Keep using mock stats if API fails
      setStats(mockStats);
    }
  };

  const handleCreateApiKey = () => {
    setSelectedApiKey(null);
    setShowCreateModal(true);
  };

  const handleEditApiKey = (apiKey: ApiKey) => {
    setSelectedApiKey(apiKey);
    setShowEditModal(true);
  };

  const handleDeleteApiKey = async (apiKeyId: string) => {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      try {
        await apiKeyService.deleteApiKey(apiKeyId);
        setApiKeys(apiKeys.filter(key => key.id !== apiKeyId));
        toast.success('API key deleted successfully');
        loadStats(); // Refresh stats
      } catch (error: any) {
        toast.error(`Failed to delete API key: ${error.message}`);
      }
    }
  };

  const handleRegenerateApiKey = async (apiKeyId: string) => {
    if (confirm('Are you sure you want to regenerate this API key? The old key will be invalidated.')) {
      try {
        const response = await apiKeyService.regenerateApiKey(apiKeyId);
        setApiKeys(apiKeys.map(key => 
          key.id === apiKeyId ? response.data : key
        ));
        toast.success('API key regenerated successfully');
      } catch (error: any) {
        toast.error(`Failed to regenerate API key: ${error.message}`);
      }
    }
  };

  const handleApiKeySuccess = (newApiKey?: any) => {
    loadApiKeys(); // Always reload data from API
    loadStats(); // Refresh stats
    if (newApiKey) {
      toast.success('API key created successfully!');
    } else {
      toast.success('API key updated successfully!');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('API key copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy API key');
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKey(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20' 
      : 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
  };

  const filteredKeys = apiKeys.filter(key => {
    const matchesSearch = 
      key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && key.isActive) ||
      (statusFilter === 'inactive' && !key.isActive);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            API Keys
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your API keys and monitor their usage
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadApiKeys}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleCreateApiKey}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create API Key
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Keys</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalKeys}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Keys</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeKeys}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.expiringSoon}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalRequests.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search API keys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* API Keys Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  API Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredKeys.map((apiKey) => (
                <tr key={apiKey.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {apiKey.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {apiKey.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {showKey[apiKey.id] ? apiKey.key : '••••••••••••••••'}
                      </code>
                      <button
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showKey[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(apiKey.key)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(apiKey.isActive)}`}>
                      {apiKey.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div>
                      <div className="font-medium">{apiKey.usage.today}</div>
                      <div className="text-gray-500 dark:text-gray-400">today</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(apiKey.lastUsed)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {apiKey.expiresAt ? formatDate(apiKey.expiresAt) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleEditApiKey(apiKey)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleRegenerateApiKey(apiKey.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteApiKey(apiKey.id)}
                        className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modals */}
      <ApiKeyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleApiKeySuccess}
      />
      
      <ApiKeyModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        apiKey={selectedApiKey}
        onSuccess={handleApiKeySuccess}
      />
    </div>
  );
} 