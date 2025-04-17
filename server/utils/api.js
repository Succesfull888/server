import axios from 'axios';

let enqueueSnackbarRef;

// Create an instance of axios
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Set reference to enqueueSnackbar
export const setEnqueueSnackbarRef = (ref) => {
  enqueueSnackbarRef = ref;
};

// Add a request interceptor
api.interceptors.request.use(
  config => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    
    return config;
  },
  error => {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  response => {
    // Any status code that lies within the range of 2xx
    return response;
  },
  error => {
    // Any status codes that falls outside the range of 2xx
    const { status, data } = error.response || {};
    
    // Handle token expiration
    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      
      if (enqueueSnackbarRef) {
        enqueueSnackbarRef('Your session has expired. Please login again.', { variant: 'error' });
      }
    }
    
    // Handle server errors
    if (status === 500) {
      if (enqueueSnackbarRef) {
        enqueueSnackbarRef('Server error. Please try again later.', { variant: 'error' });
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;