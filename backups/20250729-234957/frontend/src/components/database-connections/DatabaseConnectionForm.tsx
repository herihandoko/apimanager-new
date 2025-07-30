import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import api from '@/services/api';

import { DatabaseConnection } from '@/types/database';

interface DatabaseConnectionFormProps {
  connection?: DatabaseConnection | null;
  onSuccess: () => void;
}

export default function DatabaseConnectionForm({ connection, onSuccess }: DatabaseConnectionFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    host: '',
    port: 3306,
    database: '',
    username: '',
    password: '',
    useSSL: false,
    useTunnel: false,
    tunnelConfig: {
      sshHost: '',
      sshPort: 22,
      sshUsername: '',
      sshPassword: '',
      localPort: 3307
    }
  });

  const [loading, setLoading] = useState(false);
  const [showTunnelConfig, setShowTunnelConfig] = useState(false);

  useEffect(() => {
    if (connection) {
      setFormData({
        name: connection.name,
        description: connection.description,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password || '',
        useSSL: connection.useSSL,
        useTunnel: connection.useTunnel,
        tunnelConfig: connection.tunnelConfig || {
          sshHost: '',
          sshPort: 22,
          sshUsername: '',
          sshPassword: '',
          localPort: 3307
        }
      });
      setShowTunnelConfig(connection.useTunnel);
    }
  }, [connection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        tunnelConfig: formData.useTunnel ? formData.tunnelConfig : null
      };

      if (connection) {
        await api.put(`/database-connections/${connection.id}`, data);
      } else {
        await api.post('/database-connections', data);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving connection:', error);
      alert('Error saving connection');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTunnelConfigChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      tunnelConfig: {
        ...prev.tunnelConfig,
        [field]: value
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Connection Name *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="My Database"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <Input
            type="text"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Database description"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Host *
          </label>
          <Input
            type="text"
            value={formData.host}
            onChange={(e) => handleInputChange('host', e.target.value)}
            placeholder="localhost"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Port *
          </label>
          <Input
            type="number"
            value={formData.port}
            onChange={(e) => handleInputChange('port', parseInt(e.target.value))}
            placeholder="3306"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Database Name *
          </label>
          <Input
            type="text"
            value={formData.database}
            onChange={(e) => handleInputChange('database', e.target.value)}
            placeholder="my_database"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username *
          </label>
          <Input
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder="root"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Password *
        </label>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          placeholder="Enter password"
          required
        />
      </div>

      <div className="flex items-center space-x-4">
        <Checkbox
          id="useSSL"
          checked={formData.useSSL}
          onChange={(e) => handleInputChange('useSSL', e.target.checked)}
        />
        <label htmlFor="useSSL" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Use SSL Connection
        </label>
      </div>

      <div className="flex items-center space-x-4">
        <Checkbox
          id="useTunnel"
          checked={formData.useTunnel}
          onChange={(e) => {
            handleInputChange('useTunnel', e.target.checked);
            setShowTunnelConfig(e.target.checked);
          }}
        />
        <label htmlFor="useTunnel" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Use SSH Tunnel
        </label>
      </div>

      {showTunnelConfig && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            SSH Tunnel Configuration
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SSH Host *
              </label>
              <Input
                type="text"
                value={formData.tunnelConfig.sshHost}
                onChange={(e) => handleTunnelConfigChange('sshHost', e.target.value)}
                placeholder="192.168.1.100"
                required={formData.useTunnel}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SSH Port
              </label>
              <Input
                type="number"
                value={formData.tunnelConfig.sshPort}
                onChange={(e) => handleTunnelConfigChange('sshPort', parseInt(e.target.value))}
                placeholder="22"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SSH Username *
              </label>
              <Input
                type="text"
                value={formData.tunnelConfig.sshUsername}
                onChange={(e) => handleTunnelConfigChange('sshUsername', e.target.value)}
                placeholder="sshuser"
                required={formData.useTunnel}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SSH Password *
              </label>
              <Input
                type="password"
                value={formData.tunnelConfig.sshPassword}
                onChange={(e) => handleTunnelConfigChange('sshPassword', e.target.value)}
                placeholder="sshpassword"
                required={formData.useTunnel}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Local Port
            </label>
            <Input
              type="number"
              value={formData.tunnelConfig.localPort}
              onChange={(e) => handleTunnelConfigChange('localPort', parseInt(e.target.value))}
              placeholder="3307"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : connection ? 'Update Connection' : 'Create Connection'}
        </Button>
      </div>
    </form>
  );
} 