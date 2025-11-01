import axios from 'axios';

const client = axios.create
({
  baseURL: '/api',
  headers: 
  {
    Accept: 'application/json',
  },
  validateStatus: (status) => status >= 200 && status < 300,
});

export default client;