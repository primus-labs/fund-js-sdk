import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { REQUESTTIMEOUT, baseURL } from '../config/constants';

const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  withCredentials: false,
  timeout: REQUESTTIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Do something before sending the request, such as adding an authentication token
    const token = localStorage.getItem('token');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (config.url === '/developer-center/app-sign') {
      console.log('test===', config);
      config.headers['Content-Type'] = `text/plain`;
    }

    config.cancelToken = new axios.CancelToken(() => {});
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error: AxiosError) => {
    if (error.response) {
      // The server returned a status code and the status code triggered an error
      switch (error.response.status) {
        case 401:
          console.error('Unauthorized, please log in');
          break;
        default:
          console.error('Other errors:', error.response.data);
      }
    } else if (error.request) {
      console.error(
        'The request was sent but no response was received:',
        error.request,
      );
    } else {
      console.error('Other errors:', error.message);
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
