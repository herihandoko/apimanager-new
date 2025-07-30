import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  LineChart, 
  Activity, 
  Users, 
  Key, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '@/services/api';

interface DashboardOverview {
  totalApiKeys: number;
  activeApiKeys: number;
  totalRequests24h: number;
  totalRequests7d: number;
  totalRequests30d: number;
  successRate: number;
  avgResponseTime: number;
}

interface RecentActivity {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  apiKeyName: string;
  createdAt: string;
}

interface AnalyticsData {
  period: string;
  requestData: Array<{
    date: string;
    count: number;
  }>;
  statusCodeDistribution: Array<{
    statusCode: number;
    count: number;
  }>;
  methodDistribution: Array<{
    method: string;
    count: number;
  }>;
  responseTimeStats: {
    average: number;
    minimum: number;
    maximum: number;
  };
}

interface DashboardData {
  overview: DashboardOverview;
  recentActivity: RecentActivity[];
  topApiKeys: any[];
}

// Mock data - in real app this would come from API
const overviewData = [
  {
    title: 'Total API Keys',
    value: '24',
    change: '+12%',
    changeType: 'increase',
    icon: Key,
    color: 'bg-blue-500',
  },
  {
    title: 'Active Users',
    value: '1,234',
    change: '+5%',
    changeType: 'increase',
    icon: Users,
    color: 'bg-green-500',
  },
  {
    title: 'Total Requests',
    value: '45.2K',
    change: '+18%',
    changeType: 'increase',
    icon: Activity,
    color: 'bg-purple-500',
  },
  {
    title: 'Success Rate',
    value: '98.5%',
    change: '+2.1%',
    changeType: 'increase',
    icon: CheckCircle,
    color: 'bg-emerald-500',
  },
];

const requestData = [
  { name: 'Mon', requests: 1200, errors: 12 },
  { name: 'Tue', requests: 1400, errors: 8 },
  { name: 'Wed', requests: 1100, errors: 15 },
  { name: 'Thu', requests: 1600, errors: 6 },
  { name: 'Fri', requests: 1800, errors: 10 },
  { name: 'Sat', requests: 900, errors: 5 },
  { name: 'Sun', requests: 1300, errors: 9 },
];

const statusData = [
  { name: 'Success', value: 98.5, color: '#10B981' },
  { name: 'Client Error', value: 1.2, color: '#F59E0B' },
  { name: 'Server Error', value: 0.3, color: '#EF4444' },
];

const recentActivity = [
  {
    id: 1,
    type: 'api_key_created',
    message: 'New API key created for user john.doe',
    time: '2 minutes ago',
    status: 'success',
  },
  {
    id: 2,
    type: 'user_login',
    message: 'User jane.smith logged in',
    time: '5 minutes ago',
    status: 'info',
  },
  {
    id: 3,
    type: 'api_request',
    message: 'High request volume detected',
    time: '10 minutes ago',
    status: 'warning',
  },
  {
    id: 4,
    type: 'user_registered',
    message: 'New user registered: bob.wilson',
    time: '15 minutes ago',
    status: 'success',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    overview: {
      totalApiKeys: 0,
      activeApiKeys: 0,
      totalRequests24h: 0,
      totalRequests7d: 0,
      totalRequests30d: 0,
      successRate: 0,
      avgResponseTime: 0
    },
    recentActivity: [],
    topApiKeys: []
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    period: '24h',
    requestData: [],
    statusCodeDistribution: [],
    methodDistribution: [],
    responseTimeStats: {
      average: 0,
      minimum: 0,
      maximum: 0
    }
  });

  useEffect(() => {
    fetchDashboardData();
    fetchAnalyticsData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/overview');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const response = await api.get('/dashboard/analytics?period=7d');
      if (response.data.success) {
        setAnalyticsData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate overview data from API response
  const overviewData = [
    {
      title: 'Total API Keys',
      value: dashboardData.overview.totalApiKeys.toString(),
      change: '+12%', // TODO: Calculate from historical data
      changeType: 'increase',
      icon: Key,
      color: 'bg-blue-500',
    },
    {
      title: 'Active API Keys',
      value: dashboardData.overview.activeApiKeys.toString(),
      change: '+5%', // TODO: Calculate from historical data
      changeType: 'increase',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Total Requests (24h)',
      value: dashboardData.overview.totalRequests24h.toLocaleString(),
      change: '+18%', // TODO: Calculate from historical data
      changeType: 'increase',
      icon: Activity,
      color: 'bg-purple-500',
    },
    {
      title: 'Success Rate',
      value: `${dashboardData.overview.successRate.toFixed(1)}%`,
      change: '+2.1%', // TODO: Calculate from historical data
      changeType: 'increase',
      icon: CheckCircle,
      color: 'bg-emerald-500',
    },
  ];

  // Process real chart data from analytics API
  const requestData = analyticsData.requestData.map(item => ({
    name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    requests: item.count,
    errors: 0 // TODO: Calculate errors from status codes
  }));

  // Calculate status distribution from real data
  const totalRequests = analyticsData.statusCodeDistribution.reduce((sum, item) => sum + item.count, 0);
  const successRequests = analyticsData.statusCodeDistribution
    .filter(item => item.statusCode >= 200 && item.statusCode < 300)
    .reduce((sum, item) => sum + item.count, 0);
  const clientErrors = analyticsData.statusCodeDistribution
    .filter(item => item.statusCode >= 400 && item.statusCode < 500)
    .reduce((sum, item) => sum + item.count, 0);
  const serverErrors = analyticsData.statusCodeDistribution
    .filter(item => item.statusCode >= 500)
    .reduce((sum, item) => sum + item.count, 0);

  const statusData = [
    { 
      name: 'Success', 
      value: totalRequests > 0 ? (successRequests / totalRequests * 100) : 0, 
      color: '#10B981' 
    },
    { 
      name: 'Client Error', 
      value: totalRequests > 0 ? (clientErrors / totalRequests * 100) : 0, 
      color: '#F59E0B' 
    },
    { 
      name: 'Server Error', 
      value: totalRequests > 0 ? (serverErrors / totalRequests * 100) : 0, 
      color: '#EF4444' 
    },
  ];

  // Convert recent activity to display format
  const recentActivity = dashboardData.recentActivity.map((activity, index) => ({
    id: activity.id || index.toString(),
    type: 'api_request',
    message: `${activity.method} ${activity.endpoint} - ${activity.statusCode}`,
    time: new Date(activity.createdAt).toLocaleString(),
    status: activity.statusCode >= 200 && activity.statusCode < 300 ? 'success' : 
            activity.statusCode >= 400 && activity.statusCode < 500 ? 'warning' : 'error',
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening with your API Manager.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => {
              fetchDashboardData();
              fetchAnalyticsData();
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </motion.div>

      {/* Overview Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {overviewData.map((item, index) => (
          <motion.div
            key={item.title}
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {item.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {item.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${item.color}`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              {item.changeType === 'increase' ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ml-1 ${
                item.changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {item.change}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                from last month
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Request Trends */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Request Trends (Last 7 Days)
            </h3>
            <LineChart className="w-5 h-5 text-gray-400" />
          </div>
          {requestData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={requestData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              No request data available
            </div>
          )}
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Response Status
            </h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          {statusData.some(item => item.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-6 mt-4">
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.name}: {item.value.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              No status data available
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700"
              >
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'warning' ? 'bg-yellow-500' :
                  activity.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {activity.time}
                  </p>
                </div>
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No recent activity
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
} 