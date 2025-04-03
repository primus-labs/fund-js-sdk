import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { REQUESTTIMEOUT,SERVICEBASEURL } from '../config/constants';



const axiosInstance: AxiosInstance = axios.create({
  baseURL: SERVICEBASEURL,
  withCredentials: false,
  timeout: REQUESTTIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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
