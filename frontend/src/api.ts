import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (formData: any) => api.post('/api/v1/auth/login', formData);
export const registerParent = (data: any) => api.post('/api/v1/auth/register-parent', data);
export const getMe = () => api.get('/api/v1/users/me');

// Children (Parent)
export const createChild = (data: any) => api.post('/api/v1/children', data);
export const listChildren = () => api.get('/api/v1/children');
export const getChildSummary = (id: number) => api.get(`/api/v1/children/${id}/summary`);
export const getChild = (id: number) => api.get(`/api/v1/children/${id}`);
export const deleteChild = (id: number) => api.delete(`/api/v1/children/${id}`);

// Tasks
export const createTask = (data: any) => api.post('/api/v1/tasks', data);
export const listTasks = () => api.get('/api/v1/tasks');
export const deleteTask = (id: number) => api.delete(`/api/v1/tasks/${id}`);

// Submissions
export const submitTask = (data: any) => api.post('/api/v1/submissions', data);
export const getMySubmissions = () => api.get('/api/v1/submissions/my');
export const getPendingSubmissions = () => api.get('/api/v1/submissions/pending');
export const approveSubmission = (id: number) => api.post(`/api/v1/submissions/${id}/approve`);
export const rejectSubmission = (id: number) => api.post(`/api/v1/submissions/${id}/reject`);

// Points & Settings
export const getSettings = () => api.get('/api/v1/settings');
export const updateSettings = (data: any) => api.put('/api/v1/settings', data);

// Rewards
export const createReward = (data: any) => api.post('/api/v1/rewards', data);
export const listRewards = () => api.get('/api/v1/rewards');
export const deleteReward = (id: number) => api.delete(`/api/v1/rewards/${id}`);
export const redeemReward = (id: number) => api.post(`/api/v1/rewards/${id}/redeem`);
export const getPendingRedemptions = () => api.get('/api/v1/rewards/redemptions/pending');
export const approveRedemption = (id: number) => api.post(`/api/v1/rewards/redemptions/${id}/approve`);
export const rejectRedemption = (id: number) => api.post(`/api/v1/rewards/redemptions/${id}/reject`);


export default api;
