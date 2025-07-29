import React, { useState, useEffect } from 'react';
import { Plus, Code, Play, Edit, Trash2, Database, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import api from '@/services/api';
import DynamicQueryForm from './DynamicQueryForm';

interface DynamicQuery {
  id: string;
  name: string;
  description: string;
  query: string;
  method: string;
  path: string;
  parameters: any[];
  responseFormat: string;
  cacheEnabled: boolean;
  cacheDuration: number;
  rateLimit: number;
  isActive: boolean;
  connectionId: string;
  createdAt: string;
  updatedAt: string;
  connection: {
    id: string;
    name: string;
    host: string;
    database: string;
  };
  _count: {
    logs: number;
  };
}

export default function DynamicQueriesList() {
  const [queries, setQueries] = useState<DynamicQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<DynamicQuery | null>(null);
  const [testingQuery, setTestingQuery] = useState<string | null>(null);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dynamic-queries');
      setQueries(response.data.data);
    } catch (error) {
      console.error('Error fetching queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const testQuery = async (queryId: string) => {
    try {
      setTestingQuery(queryId);
      const response = await api.post(`/dynamic-queries/${queryId}/test`);
      
      if (response.data.success) {
        alert('Query test successful!');
      } else {
        alert('Query test failed!');
      }
    } catch (error) {
      alert('Query test failed!');
    } finally {
      setTestingQuery(null);
    }
  };

  const deleteQuery = async (queryId: string) => {
    if (!confirm('Are you sure you want to delete this query?')) return;

    try {
      await api.delete(`/dynamic-queries/${queryId}`);
      fetchQueries();
    } catch (error) {
      console.error('Error deleting query:', error);
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
            Dynamic Queries
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create APIs from database queries
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Query
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <Code className="w-8 h-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Queries
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {queries.length}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <Play className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Queries
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {queries.filter(q => q.isActive).length}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <Database className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Database Connections
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(queries.map(q => q.connection.id)).size}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Logs
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {queries.reduce((sum, q) => sum + q._count.logs, 0)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Queries List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {queries.map((query) => (
          <Card key={query.id} className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {query.name}
                    </h3>
                    <Badge variant={query.isActive ? 'success' : 'secondary'}>
                      {query.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {query.description}
                  </p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-16">Method:</span>
                      <Badge variant="outline" className="ml-2">
                        {query.method}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-16">Path:</span>
                      <span className="text-gray-900 dark:text-white font-mono text-xs">
                        {query.path}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-16">Database:</span>
                      <span className="text-gray-900 dark:text-white">
                        {query.connection.name}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    {query.cacheEnabled && (
                      <>
                        <Clock className="w-4 h-4" />
                        <span>{query.cacheDuration}s</span>
                      </>
                    )}
                    <Zap className="w-4 h-4" />
                    <span>{query.rateLimit}/min</span>
                    <span>•</span>
                    <span>Logs: {query._count.logs}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testQuery(query.id)}
                    disabled={testingQuery === query.id}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedQuery(query);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteQuery(query.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {queries.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No dynamic queries
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get started by creating your first dynamic query.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Query
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
          setSelectedQuery(null);
        }}
        title={showCreateModal ? 'Add Dynamic Query' : 'Edit Dynamic Query'}
      >
        <DynamicQueryForm
          query={selectedQuery}
          onSuccess={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedQuery(null);
            fetchQueries();
          }}
        />
      </Modal>
    </div>
  );
} 