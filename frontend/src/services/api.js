import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
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

// Auth Service Endpoints
export const authService = {
  register: (formData) => API.post('/auth/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  login: (credentials) => API.post('/auth/login', credentials),
  getMe: () => API.get('/auth/me'),
  updateProfile: (formData) => API.put('/auth/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  logout: () => API.post('/auth/logout'),
};

// Chat Service Endpoints
export const chatService = {
  fetchChats: () => API.get('/chats'),
  accessChat: (userId) => API.post('/chats', { userId }),
  searchUsers: (query) => API.get(`/chats/users?search=${query}`),
};

// Message Service Endpoints
export const messageService = {
  fetchMessages: (chatId) => API.get(`/messages/${chatId}`),
  sendMessage: (formData) => API.post('/messages', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteMessage: (messageId) => API.delete(`/messages/${messageId}`),
};

export default API;
