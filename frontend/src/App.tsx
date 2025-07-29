import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ApiKeys from './pages/ApiKeys'
import ExternalAPIs from './pages/ExternalAPIs'
import APIProviders from './pages/APIProviders'
import DatabaseConnections from './pages/DatabaseConnections'
import DynamicQueries from './pages/DynamicQueries'
import Users from './pages/Users'
import Roles from './pages/Roles'
import Audit from './pages/Audit'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="apikeys" element={<ApiKeys />} />
            <Route path="external-apis" element={<ExternalAPIs />} />
            <Route path="api-providers" element={<APIProviders />} />
            <Route path="database-connections" element={<DatabaseConnections />} />
            <Route path="dynamic-queries" element={<DynamicQueries />} />
            <Route path="users" element={<Users />} />
            <Route path="roles" element={<Roles />} />
            <Route path="audit" element={<Audit />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          
          {/* 404 route */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App 