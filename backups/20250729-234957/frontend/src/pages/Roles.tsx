import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Shield,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  UserCheck,
  UserX,
  Activity,
  Key,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { roleService, Role } from '@/services/roleService';
import RoleModal from '@/components/roles/RoleModal';
import toast from 'react-hot-toast';

// Mock data for roles (fallback)
const mockRoles: Role[] = [
  {
    id: 'cmdnqggav00007z9tx2q4knjc',
    name: 'admin',
    description: 'Administrator with full access',
    permissions: ['user:read', 'user:create', 'user:update', 'user:delete', 'role:read', 'role:create', 'role:update', 'role:delete', 'apikey:read', 'apikey:create', 'apikey:update', 'apikey:delete', 'audit:read', 'system:read', 'system:update'],
    isActive: true,
    createdAt: '2025-07-28T23:22:20.167Z',
    updatedAt: '2025-07-28T23:22:20.167Z'
  },
  {
    id: 'cmdnqggba00027z9tp6wgncs0',
    name: 'moderator',
    description: 'Moderator with user management access',
    permissions: ['user:read', 'user:update', 'apikey:read', 'apikey:update', 'audit:read'],
    isActive: true,
    createdAt: '2025-07-28T23:22:20.182Z',
    updatedAt: '2025-07-28T23:22:20.182Z'
  },
  {
    id: 'cmdnqggb600017z9tylfk4oy1',
    name: 'user',
    description: 'Regular user with limited access',
    permissions: ['apikey:read', 'apikey:create', 'apikey:update', 'apikey:delete'],
    isActive: true,
    createdAt: '2025-07-28T23:22:20.179Z',
    updatedAt: '2025-07-28T23:22:20.179Z'
  },
  {
    id: 'cmdnw02y00008yhxfbggyaqyc',
    name: 'senior-editor',
    description: 'Senior content editor with more permissions',
    permissions: ['apikey:read', 'apikey:create', 'apikey:update'],
    isActive: true,
    createdAt: '2025-07-29T01:57:34.056Z',
    updatedAt: '2025-07-29T01:57:42.423Z'
  }
];

interface RoleStats {
  totalRoles: number;
  activeRoles: number;
  inactiveRoles: number;
  totalPermissions: number;
  uniquePermissions: number;
  rolesWithFullAccess: number;
}

const mockStats: RoleStats = {
  totalRoles: 4,
  activeRoles: 4,
  inactiveRoles: 0,
  totalPermissions: 27,
  uniquePermissions: 15,
  rolesWithFullAccess: 1
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [stats, setStats] = useState<RoleStats>(mockStats);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load roles from API
  useEffect(() => {
    loadRoles();
    loadStats();
  }, []);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const response = await roleService.getRoles();
      
      // Check if response exists
      if (!response) {
        throw new Error('Invalid API response: no response');
      }
      
      // Check if roles array exists
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid API response: missing roles array');
      }
      
      setRoles(response.data);
    } catch (error: any) {
      toast.error(`Failed to load roles: ${error.message}`);
      // Fallback to mock data if API fails
      setRoles(mockRoles);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Calculate stats from roles data
      const totalRoles = roles.length;
      const activeRoles = roles.filter(role => role.isActive).length;
      const inactiveRoles = roles.filter(role => !role.isActive).length;
      
      // Calculate total permissions across all roles
      const allPermissions = roles.flatMap(role => role.permissions);
      const totalPermissions = allPermissions.length;
      const uniquePermissions = new Set(allPermissions).size;
      
      // Count roles with full access (admin-like permissions)
      const rolesWithFullAccess = roles.filter(role => 
        role.permissions.includes('user:delete') && 
        role.permissions.includes('role:delete') && 
        role.permissions.includes('apikey:delete')
      ).length;

      setStats({
        totalRoles,
        activeRoles,
        inactiveRoles,
        totalPermissions,
        uniquePermissions,
        rolesWithFullAccess
      });
    } catch (error: any) {
      // Keep using mock stats if calculation fails
      setStats(mockStats);
    }
  };

  // Filter roles based on search and filters
  const filteredRoles = roles.filter(role => {
    const matchesSearch = 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && role.isActive) ||
      (statusFilter === 'inactive' && !role.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const handleDeleteRole = async (roleId: string) => {
    if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      try {
        await roleService.deleteRole(roleId);
        setRoles(roles.filter(role => role.id !== roleId));
        toast.success('Role deleted successfully');
        loadStats(); // Refresh stats
      } catch (error: any) {
        toast.error(`Failed to delete role: ${error.message}`);
      }
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const handleAddRole = () => {
    setSelectedRole(null);
    setShowRoleModal(true);
  };

  const handleRoleSuccess = (newRole?: any) => {
    loadRoles(); // Always reload data from API
    loadStats(); // Refresh stats
    if (newRole) {
      toast.success('Role created successfully!');
    } else {
      toast.success('Role updated successfully!');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPermissions = (permissions: string[]) => {
    return permissions.slice(0, 3).join(', ') + (permissions.length > 3 ? ` +${permissions.length - 3} more` : '');
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
            Roles
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage roles and permissions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadRoles();
              loadStats();
            }}
            disabled={isLoading}
          >
            <Activity className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleAddRole}>
            <Plus className="w-4 h-4 mr-2" />
            Add Role
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
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRoles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Roles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeRoles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive Roles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inactiveRoles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Key className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Permissions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPermissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
              <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Permissions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.uniquePermissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Access Roles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rolesWithFullAccess}</p>
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
                placeholder="Search roles..."
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
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Roles Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Permissions
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
              {filteredRoles.map((role) => (
                <motion.tr
                  key={role.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {role.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {role.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[role.isActive ? 'active' : 'inactive']}`}>
                      {role.isActive ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatPermissions(role.permissions)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(role.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRole(role)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Modals */}
      <RoleModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSuccess={handleRoleSuccess}
      />
      
      <RoleModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        role={selectedRole}
        onSuccess={handleRoleSuccess}
      />
    </div>
  );
} 