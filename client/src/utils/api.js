import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Create axios instance
const api = axios.create({
  baseURL: backendUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để thêm token
api.interceptors.request.use(
  async (config) => {
    const clerk = window.Clerk;

    if (clerk && clerk.session) {
      const token = await clerk.session.getToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để handle errors
api.interceptors.response.use(
  (response) => {
    // Return data directly (axios wraps response in { data, status, headers })
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - redirect to login
        // Clerk sẽ handle này
      } else if (status === 403) {
        // Forbidden
        console.error('Forbidden:', data.message);
      } else if (status === 404) {
        // Not found
        console.error('Not found:', data.message);
      } else if (status >= 500) {
        // Server error
        console.error('Server error:', data.message);
      }
      
      return Promise.reject({
        message: data?.message || 'An error occurred',
        status,
        data: data?.data || null,
      });
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 0,
      });
    } else {
      // Something else happened
      return Promise.reject({
        message: error.message || 'An error occurred',
        status: 0,
      });
    }
  }
);

export default api;

