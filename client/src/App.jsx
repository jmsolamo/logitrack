import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AlertToastProvider } from './components/ui/alert-toast-provider';
import LoginPage from './Pages/loginPage';
import RegistrationPage from './Pages/registrationPage';
import AdminRegistration from './Pages/admin/adminRegistration';
import AdminDashboard from './Pages/admin/adminDashboard';
import AdminLayout from './components/admin/AdminLayout';
import axios from 'axios';
import './App.css';

// Set global axios base URL if defined in environment variables
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
}

function App() {
  return (
    <BrowserRouter>
      <AlertToastProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/admin/register" element={<AdminRegistration />} />
          
          {/* Admin routes with sidebar layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </AlertToastProvider>
    </BrowserRouter>
  );
}

export default App;
