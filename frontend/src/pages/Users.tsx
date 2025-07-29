import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Shield,
  Mail,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  Users as UsersIcon,
  UserCheck,
  UserX,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { userService } from '@/services/userService';
import { User as UserType } from '@/types';

// Extended User type for mock data
interface ExtendedUser extends UserType {
  status: string;
  apiKeysCount: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  verifiedUsers: number;
  totalApiKeys: number;
  recentLogins: number;
}

import UserModal from '@/components/users/UserModal';
import toast from 'react-hot-toast';

// Mock data for users
const mockUsers: ExtendedUser[] = [
  {
    id: 'cmdnqggs000067z9tsi7yl4jq',
    firstName: 'Test',
    lastName: 'User',
    email: 'demo@apimanager.com',
    username: 'demo',
    role: { id: 'cmdnqggav00007z9tx2q4knjc', name: 'admin', description: 'Administrator with full access' },
    status: 'active',
    lastLogin: null,
    createdAt: '2025-07-28T23:22:20.784Z',
    isVerified: true,
    apiKeysCount: 0,
    isActive: true,
    updatedAt: '2025-07-29T01:54:18.323Z'
  },
  {
    id: 'cmdnqggk000047z9t2u1our26',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@apimanager.com',
    username: 'admin',
    role: { id: 'cmdnqggav00007z9tx2q4knjc', name: 'admin', description: 'Administrator with full access' },
    status: 'active',
    lastLogin: '2025-07-29T01:40:55.759Z',
    createdAt: '2025-07-28T23:22:20.496Z',
    isVerified: true,
    apiKeysCount: 3,
    isActive: true,
    updatedAt: '2025-07-29T01:40:55.760Z'
  }
];

const mockStats: UserStats = {
  totalUsers: 2,
  activeUsers: 2,
  inactiveUsers: 0,
  verifiedUsers: 2,
  totalApiKeys: 3,
  recentLogins: 1
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
};

const roleColors: Record<string, string> = {
  Admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  Moderator: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  User: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
};

export default function Users() {
  const [users, setUsers] = useState<ExtendedUser[]>(mockUsers);
  const [stats, setStats] = useState<UserStats>(mockStats);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await userService.getUsers();
      if (response && response.data && response.data.users) {
        setUsers(response.data.users.map((user: any) => ({
          ...user,
          status: user.isActive ? 'active' : 'inactive',
          apiKeysCount: user._count?.apiKeys || 0
        })));
      }
    } catch (error: any) {
      toast.error(`Failed to load users: ${error.message}`);
      // Keep using mock data if API fails
      setUsers(mockUsers);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Calculate stats from users data
      const totalUsers = users.length;
      const activeUsers = users.filter(user => user.status === 'active').length;
      const inactiveUsers = users.filter(user => user.status === 'inactive').length;
      const verifiedUsers = users.filter(user => user.isVerified).length;
      const totalApiKeys = users.reduce((sum, user) => sum + user.apiKeysCount, 0);
      const recentLogins = users.filter(user => {
        if (!user.lastLogin) return false;
        const lastLogin = new Date(user.lastLogin);
        const now = new Date();
        const diffDays = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 7; // Last 7 days
      }).length;

      setStats({
        totalUsers,
        activeUsers,
        inactiveUsers,
        verifiedUsers,
        totalApiKeys,
        recentLogins
      });
    } catch (error: any) {
      // Keep using mock stats if calculation fails
      setStats(mockStats);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await userService.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
        toast.success('User deleted successfully');
        loadStats(); // Refresh stats
      } catch (error: any) {
        toast.error(`Failed to delete user: ${error.message}`);
      }
    }
  };

  const handleEditUser = (user: ExtendedUser) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setShowCreateModal(true);
  };

  const handleUserSuccess = (newUser?: any) => {
    loadUsers(); // Always reload data from API
    loadStats(); // Refresh stats
    if (newUser) {
      toast.success('User created successfully!');
    } else {
      toast.success('User updated successfully!');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
            Users
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage users and their permissions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadUsers();
              loadStats();
            }}
            disabled={isLoading}
          >
            <Activity className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleAddUser}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inactiveUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Verified Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.verifiedUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total API Keys</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalApiKeys}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Logins</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.recentLogins}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  API Keys
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.filter(user => {
                const matchesSearch = 
                  user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  user.username.toLowerCase().includes(searchTerm.toLowerCase());
                
                const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
                const matchesRole = roleFilter === 'all' || user.role?.name === roleFilter;
                
                return matchesSearch && matchesStatus && matchesRole;
              }).map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[user.role?.name || 'User']}`}>
                      {user.role?.name || 'User'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[user.status]}`}>
                        {user.status}
                      </span>
                      {user.isVerified && (
                        <CheckCircle className="ml-2 w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.apiKeysCount} keys
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(user.createdAt)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                        }}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {users.filter(user => {
                const matchesSearch = 
                  user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  user.username.toLowerCase().includes(searchTerm.toLowerCase());
                
                const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
                const matchesRole = roleFilter === 'all' || user.role?.name === roleFilter;
                
                return matchesSearch && matchesStatus && matchesRole;
              }).length} of {users.length} users
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9995]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                User Details
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedUser.email}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Username:</span>
                  <p className="font-medium">@{selectedUser.username}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Role:</span>
                  <p className="font-medium">{selectedUser.role?.name}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <p className="font-medium">{selectedUser.status}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">API Keys:</span>
                  <p className="font-medium">{selectedUser.apiKeysCount}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Verified:</span>
                  <p className="font-medium">{selectedUser.isVerified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Created:</span>
                  <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedUser(null);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Shield className="w-4 h-4 mr-2" />
                    Permissions
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      <UserModal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
        }}
        user={selectedUser}
        onSuccess={handleUserSuccess}
      />
    </div>
  );
} 