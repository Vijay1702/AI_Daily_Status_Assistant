import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/layouts/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import ToastContainer from '@/components/ToastContainer';

// Pages
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ChatPage from '@/pages/ChatPage';
import SettingsPage from '@/pages/SettingsPage';
import ReportsPage from '@/pages/ReportsPage';

import MonitorPage from '@/pages/MonitorPage';

const queryClient = new QueryClient();

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Enable dark mode by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/chat" replace />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/monitor" element={<MonitorPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </BrowserRouter>
        <ToastContainer />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
