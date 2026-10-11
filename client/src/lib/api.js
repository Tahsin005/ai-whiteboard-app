import axios from "axios";
import { getJWTToken } from "./auth.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let currentSocketId = null;

export const setApiSocketId = (socketId) => {
  currentSocketId = socketId;
};

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getJWTToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore token resolution errors for unauthenticated requests
    }

    if (currentSocketId) {
      config.headers["x-socket-id"] = currentSocketId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("API request unauthorized - session may have expired.");
    }
    return Promise.reject(error);
  }
);

export default api;
