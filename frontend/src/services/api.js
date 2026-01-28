import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE
    ? `${process.env.REACT_APP_API_BASE}/api`
    : "http://localhost:5000/api",
});

export function setApiToken(token) {
  
  console.log("[API] Token axios authorisation headers");
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    console.log("[API] Removing axios authorisation headers");
    delete api.defaults.headers.common.Authorization;
  }
}

// Debug interceptor
api.interceptors.request.use((config) => {
  console.log("[api] →", config.method?.toUpperCase(), config.url, {
    hasAuth: !!config.headers?.Authorization,
  });
  return config;
});

api.interceptors.response.use(
  (res) => {
    console.log("[api] ← response", res.config.url, res.status, res.data);
    return res;
  },
  (err) => {
    console.warn("[api] ← error", err.config?.url, err.response?.status, err.message);
    return Promise.reject(err);
  }
);


export default api;
