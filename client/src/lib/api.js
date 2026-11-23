import axios from "axios";

// Local: API on port 5002. In production set VITE_API_URL to the API's address.
export const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5002").replace(/\/$/, "");
const API = axios.create({ baseURL: `${API_ORIGIN}/api` });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("st_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
API.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem("st_token")) {
      localStorage.removeItem("st_token");
      localStorage.removeItem("st_user");
      window.dispatchEvent(new Event("st:logout"));
    }
    return Promise.reject(err);
  }
);

// Image paths from the API are relative ("/uploads/..."); make them full URLs
export const img = (path) => (path ? (path.startsWith("http") || path.startsWith("blob:") ? path : API_ORIGIN + path) : "");

export const errorMessage = (err) =>
  err?.response?.data?.message || (err?.request && !err?.response ? "Can't reach the StyleTwin server. Is the API running?" : "Something went wrong.");

export default API;
