import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AppointmentListPage from './pages/AppointmentListPage.jsx';
import AppointmentFormPage from './pages/AppointmentFormPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <AppointmentListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments/new"
        element={
          <ProtectedRoute>
            <AppointmentFormPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/appointments" replace />} />
    </Routes>
  );
}
