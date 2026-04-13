import axios from 'axios';

const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = token;
    }
    return config;
});

export default api;
