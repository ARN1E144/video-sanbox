import axios from "axios";

// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_BASE
//     ? `${process.env.REACT_APP_API_BASE}/api`
//     : "http://localhost:5000/api" || "http://127.0.0.1:5000/api" || "http://192.168.1.99:5000/api",
// });


const host = window.location.hostname;

const API_BASE =
  host === "localhost"
    ? "http://localhost:5000"
    : `http://${host}:5000`;

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});


export function setApiToken(token) {
  
  console.log("[API] Token axios authorisation headers");
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    console.log("[API] Set axios authorisation header:", api.defaults.headers.common.Authorization);
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
