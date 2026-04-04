import axios from 'axios';
<<<<<<< HEAD
=======
import { auth } from '../config/firebase';
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e

// Set base URL
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
}

// Request interceptor to add token
axios.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
<<<<<<< HEAD
    // If 401, clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
=======
    const originalRequest = error.config;

    // Don't retry for auth check endpoint or if already retried
    if (originalRequest.url?.includes('/api/auth/check') || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Check if error is 401 and token expired
    if (error.response?.status === 401 && error.response?.data?.error?.includes('expired')) {
      originalRequest._retry = true;

      try {
        // Get fresh token from Firebase
        const user = auth.currentUser;
        if (user) {
          const freshToken = await user.getIdToken(true);
          localStorage.setItem('token', freshToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          return axios(originalRequest);
        } else {
          // No user logged in, clear token and redirect to login
          localStorage.removeItem('token');
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login';
          }
        }
      } catch (refreshError) {
        // Token refresh failed, clear token and redirect to login
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
      }
    }

    return Promise.reject(error);
  }
);

export default axios;
