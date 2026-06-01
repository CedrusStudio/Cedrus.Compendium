import axios from 'axios';
import { getStoredApiKey } from '@/lib/apiKeyStorage';
import { API_KEY_HEADER } from '@/proxy';

const client = axios.create
({
  baseURL: '/api',
  headers: 
  {
    Accept: 'application/json',
  },
  validateStatus: (status) => status >= 200 && status < 300,
});

// Add API key interceptor
client.interceptors.request.use
(
  (config) => 
  {
    if (!config.method) return config;
    const method = config.method.toUpperCase();
    const isSearchPost = method === 'POST' && config.url?.includes('/search');
    if (method === 'GET' && isSearchPost) return config;
    
    const apiKey = getStoredApiKey();
    if (apiKey) 
    {
      config.headers[API_KEY_HEADER] = apiKey;
    }
    
    return config;
  },
  (error) => 
  {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
client.interceptors.response.use
(
  (response) => response,
  (error) => 
  {
    if (error.response?.status === 401) 
    {
      console.error('🔒 Authentication required: Please set your API key in settings');
    } 
    else if (error.response?.status === 403) 
    {
      console.error('🚫 Access denied: Invalid API key');
    }

    return Promise.reject(error);
  }
);

export default client;