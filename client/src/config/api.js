import axios from 'axios';

// Get the server URL from environment variable or default to localhost for development
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

// Create axios instance with base URL
const api = axios.create({
  baseURL: SERVER_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging (optional, can be removed in production)
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;

