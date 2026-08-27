import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('crm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle token expiry and global error toast alerts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    const msg = error.response && error.response.data && error.response.data.error
      ? error.response.data.error
      : 'Network error. Please make sure the server is running.';

    if (status === 401) {
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
      
      // Auto redirect to login page if unauthorized
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (status === 403) {
      message.error(msg || 'Access Forbidden: You are not authorized.');
    } else {
      message.error(msg);
    }

    return Promise.reject(error);
  }
);

export default api;
