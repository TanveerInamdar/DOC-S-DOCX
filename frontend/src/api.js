import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request interceptor to add auth headers if needed
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login or clear auth state
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  logout: () => api.post('/api/auth/logout'),
  getMe: () => api.get('/api/auth/me'),
};

export const patientsAPI = {
  getAll: () => api.get('/api/patients'),
  getById: (id) => api.get(`/api/patients/${id}`),
  getAppointments: (id) => api.get(`/api/patients/${id}/appointments`),
  getAISummary: (id) => api.get(`/api/patients/${id}/ai-summary`),
};

export const appointmentsAPI = {
  create: (appointment) => api.post('/api/appointments', appointment),
  update: (id, appointment) => api.put(`/api/appointments/${id}`, appointment),
};

export const adminAPI = {
  fixSeedPasswords: () => api.post('/api/admin/fix-seed-passwords', { key: 'let-me-fix' }),
};

export default api;
