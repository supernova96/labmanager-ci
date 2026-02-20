import axios from 'axios';
import { OfflineManager } from './OfflineManager';

const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config) => {
        const user = localStorage.getItem('user');
        if (user) {
            const { token } = JSON.parse(user);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for Offline Support & Auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!window.navigator.onLine || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            const config = error.config;
            // Save mutations (POST, PUT, DELETE) to offline queue
            if (config && config.method && config.method !== 'get') {
                OfflineManager.saveRequest(config);
                // Return a fake success response to prevent UI crash
                return Promise.resolve({
                    data: { message: 'Solicitud guardada sin conexión' },
                    status: 200,
                    headers: {},
                    config: config,
                    offline: true // Flag for UI if needed
                });
            }
        }

        if (error.response && error.response.status === 401) {
            // Auto logout on token expiration
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
