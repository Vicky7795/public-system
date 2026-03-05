import axios from 'axios';

const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
const PROD_API = 'https://public-system-1.onrender.com/api';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (isProduction ? PROD_API : '/api'),
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = token;
    }
    return config;
});

export default api;
