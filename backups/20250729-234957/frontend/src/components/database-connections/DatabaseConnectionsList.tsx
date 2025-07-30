import React, { useState, useEffect } from 'react';
import { Plus, Database, TestTube, Eye, Edit, Trash2, MoreVertical, Code } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import api from '@/services/api';
import DatabaseConnectionForm from './DatabaseConnectionForm';

interface DatabaseConnection {
  id: string;
  name: string;
  description: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  useSSL: boolean;
  useTunnel: boolean;
  tunnelConfig?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    queries: number;
    logs: number;
  };
}

export default function DatabaseConnectionsList() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<DatabaseConnection | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await api.get('/database-connections');
      setConnections(response.data.data);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (connectionId: string) => {
    try {
      setTestingConnection(connectionId);
      const response = await api.post(`/database-connections/${connectionId}/test`);
      
      if (response.data.success) {
        alert('Connection test successful!');
      } else {
        alert('Connection test failed!');
      }
    } catch (error) {
      alert('Connection test failed!');
    } finally {
      setTestingConnection(null);
    }
  };

  const deleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;

    try {
      await api.delete(`/database-connections/${connectionId}`);
      fetchConnections();
    } catch (error) {
      console.error('Error deleting connection:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Database Connections
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your MySQL database connections
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Connection
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <Database className="w-8 h-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Connections
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {connections.length}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <TestTube className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Connections
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {connections.filter(c => c.isActive).length}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <Code className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Queries
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {connections.reduce((sum, c) => sum + c._count.queries, 0)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Logs
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {connections.reduce((sum, c) => sum + c._count.logs, 0)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Connections List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.map((connection) => (
          <Card key={connection.id} className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {connection.name}
                    </h3>
                    <Badge variant={connection.isActive ? 'success' : 'secondary'}>
                      {connection.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {connection.description}
                  </p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-20">Host:</span>
                      <span className="text-gray-900 dark:text-white">{connection.host}:{connection.port}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-20">Database:</span>
                      <span className="text-gray-900 dark:text-white">{connection.database}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-20">User:</span>
                      <span className="text-gray-900 dark:text-white">{connection.username}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Queries: {connection._count.queries}</span>
                    <span>•</span>
                    <span>Logs: {connection._count.logs}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testConnection(connection.id)}
                    disabled={testingConnection === connection.id}
                  >
                    <TestTube className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedConnection(connection);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteConnection(connection.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {connections.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No database connections
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get started by creating your first database connection.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Connection
            </Button>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedConnection(null);
        }}
        title={showCreateModal ? 'Add Database Connection' : 'Edit Database Connection'}
      >
        <DatabaseConnectionForm
          connection={selectedConnection}
          onSuccess={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedConnection(null);
            fetchConnections();
          }}
        />
      </Modal>
    </div>
  );
} 