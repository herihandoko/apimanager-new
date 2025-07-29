import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Shield, Save, Loader } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { roleService, Role, CreateRoleData, UpdateRoleData } from '@/services/roleService';
import toast from 'react-hot-toast';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role | null;
  onSuccess: (newRole?: any) => void;
}

// Available permissions
const availablePermissions = [
  // User permissions
  { category: 'Users', permissions: ['user:read', 'user:create', 'user:update', 'user:delete'] },
  // Role permissions
  { category: 'Roles', permissions: ['role:read', 'role:create', 'role:update', 'role:delete'] },
  // API Key permissions
  { category: 'API Keys', permissions: ['apikey:read', 'apikey:create', 'apikey:update', 'apikey:delete'] },
  // Audit permissions
  { category: 'Audit', permissions: ['audit:read', 'audit:export'] },
  // System permissions
  { category: 'System', permissions: ['system:read', 'system:update', 'system:backup'] }
];

export default function RoleModal({ isOpen, onClose, role, onSuccess }: RoleModalProps) {
  const isEditMode = !!role;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateRoleData>({
    name: '',
    description: '',
    permissions: [],
    isActive: true
  });

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isActive: role.isActive
      });
    } else {
      setFormData({
        name: '',
        description: '',
        permissions: [],
        isActive: true
      });
    }
  }, [role]);

  const handleInputChange = (field: keyof CreateRoleData, value: string | boolean | string[]) => {
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

  const handleSelectAll = (category: string) => {
    const categoryPermissions = availablePermissions.find(cat => cat.category === category)?.permissions || [];
    const hasAllPermissions = categoryPermissions.every(p => formData.permissions.includes(p));
    
    setFormData(prev => ({
      ...prev,
      permissions: hasAllPermissions
        ? prev.permissions.filter(p => !categoryPermissions.includes(p))
        : [...new Set([...prev.permissions, ...categoryPermissions])]
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Role name is required');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Role description is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isEditMode && role) {
        const updateData: UpdateRoleData = {
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          isActive: formData.isActive
        };
        
        await roleService.updateRole(role.id, updateData);
        toast.success('Role updated successfully');
        onSuccess();
      } else {
        const newRole = await roleService.createRole(formData);
        toast.success('Role created successfully');
        onSuccess(newRole.data);
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9995]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isEditMode ? 'Edit Role' : 'Add New Role'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter role name"
                  leftIcon={<Shield className="w-4 h-4" />}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter role description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => handleInputChange('isActive', e.target.value === 'active')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Permissions
                </label>
                <span className="text-sm text-gray-500">
                  {formData.permissions.length} selected
                </span>
              </div>
              
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {availablePermissions.map((category) => (
                  <div key={category.category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.category}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleSelectAll(category.category)}
                        className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        {category.permissions.every(p => formData.permissions.includes(p)) ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {category.permissions.map((permission) => (
                        <label key={permission} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission)}
                            onChange={() => handlePermissionToggle(permission)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {permission}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isEditMode ? 'Update Role' : 'Create Role'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
} 