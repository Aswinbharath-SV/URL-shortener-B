import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './hooks/useNotification';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import MyUrls from './pages/MyUrls';
import AnalyticsDetail from './pages/AnalyticsDetail';
import PublicAnalytics from './pages/PublicAnalytics';
import WorkspacePage from './pages/WorkspacePage';

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* 1. PUBLIC MARKETING FLOWS */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/public-analytics/:shortCode" element={<PublicAnalytics />} />

              {/* 2. AUTHENTICATION MODULE ROUTER */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
              </Route>

              {/* 3. PROTECTED DASHBOARD CORE SYSTEM */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-urls" element={<MyUrls />} />
                <Route path="/analytics/:id" element={<AnalyticsDetail />} />
                <Route path="/workspaces" element={<WorkspacePage />} />
              </Route>

              {/* 4. REDIRECT FALLBACK */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
