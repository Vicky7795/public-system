import axios from 'axios';


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

// Response interceptor to handle session expiration (401 errors)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            let role = 'Citizen';
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (user && user.role) role = user.role;
            } catch {
                // Ignore parse errors, default to Citizen
            }

            localStorage.removeItem('token');
            localStorage.removeItem('user');

            if (role === 'Officer') {
                window.location.href = '/officer/login';
            } else if (role === 'Admin') {
                // Adjust if a specific Admin login exists, else officer
                window.location.href = '/officer/login'; 
            } else {
                window.location.href = '/citizen/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
