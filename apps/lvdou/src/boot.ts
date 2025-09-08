import axios from 'axios';
import { getToken } from './config';

const { VITE_BASE_API } = import.meta.env;
console.log('[VITE_BASE_API]', VITE_BASE_API);
axios.defaults.baseURL = VITE_BASE_API || 'http://127.0.0.1:3080/api';

axios.interceptors.request.use(function (config) {
    if (getToken()) {
        config.headers['Authorization'] = 'Bearer ' + getToken();
    }

    return config;
});
