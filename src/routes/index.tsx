import { HashRouter, Routes, Route, Navigate } from 'react-router';
import { AuthLayout } from '@/core/ui/layout/AuthLayout';
import { ProtectedRoute } from '@/core/auth/ProtectedRoute';
import { MainLayout } from '@/core/ui/layout/MainLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { DashboardPage } from '@/features/auth/pages/DashboardPage';
import { SettingsPage } from '@/features/auth/pages/SettingsPage';
import { DocumentsPage } from '@/features/documents/pages/DocumentsPage';
import { DocumentDetailPage } from '@/features/documents/pages/DocumentDetailPage';
import { ReaderPage } from '@/features/reader/pages/ReaderPage';

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/documents/:id" element={<DocumentDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="/reader/:id" element={<ReaderPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
}
