import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import api from '@/services/api';

interface DatabaseConnection {
  id: string;
  name: string;
  host: string;
  database: string;
}

interface DynamicQuery {
  id: string;
  connectionId: string;
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
}

interface DynamicQueryFormProps {
  query?: DynamicQuery | null;
  onSuccess: () => void;
}

export default function DynamicQueryForm({ query, onSuccess }: DynamicQueryFormProps) {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [formData, setFormData] = useState({
    connectionId: '',
    name: '',
    description: '',
    query: '',
    method: 'GET',
    path: '',
    parameters: [],
    responseFormat: 'json',
    cacheEnabled: false,
    cacheDuration: 300,
    rateLimit: 1000,
    isActive: true
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    if (query) {
      setFormData({
        connectionId: query.connectionId,
        name: query.name,
        description: query.description,
        query: query.query,
        method: query.method,
        path: query.path,
        parameters: query.parameters || [],
        responseFormat: query.responseFormat,
        cacheEnabled: query.cacheEnabled,
        cacheDuration: query.cacheDuration,
        rateLimit: query.rateLimit,
        isActive: query.isActive
      });
    }
  }, [query]);

  const fetchConnections = async () => {
    try {
      const response = await api.get('/database-connections');
      setConnections(response.data.data);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (query) {
        await api.put(`/dynamic-queries/${query.id}`, formData);
      } else {
        await api.post('/dynamic-queries', formData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving query:', error);
      alert('Error saving query');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Query Name *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Get Users"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Database Connection *
          </label>
          <Select
            value={formData.connectionId}
            onChange={(e) => handleInputChange('connectionId', e.target.value)}
            required
          >
            <option value="">Select a connection</option>
            {connections.map((connection) => (
              <option key={connection.id} value={connection.id}>
                {connection.name} ({connection.host}/{connection.database})
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <Input
          type="text"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Query description"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            HTTP Method *
          </label>
          <Select
            value={formData.method}
            onChange={(e) => handleInputChange('method', e.target.value)}
            required
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API Path *
          </label>
          <Input
            type="text"
            value={formData.path}
            onChange={(e) => handleInputChange('path', e.target.value)}
            placeholder="/users"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          SQL Query *
        </label>
        <Textarea
          value={formData.query}
          onChange={(e) => handleInputChange('query', e.target.value)}
          placeholder="SELECT * FROM users WHERE active = 1"
          rows={6}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Response Format
          </label>
          <Select
            value={formData.responseFormat}
            onChange={(e) => handleInputChange('responseFormat', e.target.value)}
          >
            <option value="json">JSON</option>
            <option value="xml">XML</option>
            <option value="csv">CSV</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rate Limit (requests/min)
          </label>
          <Input
            type="number"
            value={formData.rateLimit}
            onChange={(e) => handleInputChange('rateLimit', parseInt(e.target.value))}
            placeholder="1000"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Checkbox
          id="cacheEnabled"
          checked={formData.cacheEnabled}
          onChange={(e) => handleInputChange('cacheEnabled', e.target.checked)}
        />
        <label htmlFor="cacheEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Enable Caching
        </label>
      </div>

      {formData.cacheEnabled && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cache Duration (seconds)
          </label>
          <Input
            type="number"
            value={formData.cacheDuration}
            onChange={(e) => handleInputChange('cacheDuration', parseInt(e.target.value))}
            placeholder="300"
          />
        </div>
      )}

      <div className="flex items-center space-x-4">
        <Checkbox
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => handleInputChange('isActive', e.target.checked)}
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Active
        </label>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : query ? 'Update Query' : 'Create Query'}
        </Button>
      </div>
    </form>
  );
} 