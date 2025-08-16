import axios from 'axios';

// Create axios instance with base configuration using env variable
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000', // Use env variable with fallback
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (email, password, name) => api.post('/auth/signup', { email, password, name }),
  logout: () => api.post('/auth/logout'),
};

// Auction endpoints
export const auctionAPI = {
  getAll: (status) => api.get(`/auctions?status=${status}`),
  getById: (id) => api.get(`/auctions/${id}`),
  create: (auctionData) => api.post('/auctions', auctionData),
  placeBid: (auctionId, bidAmount) => api.post(`/auctions/${auctionId}/bids`, { amount: bidAmount }),
  makeDecision: (auctionId, decision) => api.post(`/auctions/${auctionId}/decision`, { decision }),
};

export default api;