import React from 'react';
import { motion } from 'framer-motion';
import { X, User, Calendar, MapPin, Monitor, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AuditLog } from '@/services/auditService';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLog: AuditLog | null;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
    case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'failure': return <XCircle className="w-4 h-4 text-red-500" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    default: return <Shield className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    case 'failure': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    case 'warning': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
  }
};

export default function AuditLogModal({ isOpen, onClose, auditLog }: AuditLogModalProps) {
  if (!isOpen || !auditLog) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9995] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Audit Log Details
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ID: {auditLog.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Action and Resource */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Action</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {auditLog.action}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Monitor className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Resource</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {auditLog.resource}
              </p>
              {auditLog.resourceId && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ID: {auditLog.resourceId}
                </p>
              )}
            </div>
          </div>

          {/* Severity and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Severity</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(auditLog.severity)}`}>
                {auditLog.severity.charAt(0).toUpperCase() + auditLog.severity.slice(1)}
              </span>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(auditLog.status)}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(auditLog.status)}`}>
                {auditLog.status.charAt(0).toUpperCase() + auditLog.status.slice(1)}
              </span>
            </div>
          </div>

          {/* User Information */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <User className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">User Information</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">User ID</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{auditLog.userId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{auditLog.userEmail}</p>
              </div>
            </div>
          </div>

          {/* Location and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">IP Address</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{auditLog.ipAddress}</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Timestamp</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(auditLog.timestamp)}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Details</span>
            </div>
            <div className="text-sm text-gray-900 dark:text-white">
              {typeof auditLog.details === 'string' ? (
                <p className="whitespace-pre-wrap">{auditLog.details}</p>
              ) : (
                <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-600 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(auditLog.details, null, 2)}
                </pre>
              )}
            </div>
          </div>

          {/* User Agent */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Monitor className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">User Agent</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 break-all">
              {auditLog.userAgent}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
} 