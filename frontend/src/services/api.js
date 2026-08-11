
// src/services/api.js

import axios from "axios";


// =====================================================
// API BASE
// =====================================================

const host = window.location.hostname;

// Development API host.
//
// When the frontend is accessed from another device,
// localhost would refer to THAT device rather than
// the Mac running the backend.

const DEV_API_HOST = "192.168.0.111";

// If running the frontend on the Mac itself:
//   http://localhost:3000
//
// use:
//   http://localhost:5000
//
// If running from another device:
//   http://192.168.0.111:3000
//
// use:
//   http://192.168.0.111:5000

const API_BASE =
  host === "localhost"
    ? "http://localhost:5000"
    : `http://${host}:5000`;

console.log("[API] Frontend host:", host);
console.log("[API] Using API base:", API_BASE);



// =====================================================
// AXIOS INSTANCE
// =====================================================

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

// =====================================================
// AUTH STORAGE
// =====================================================

const LS_KEY = "vs_auth";

// =====================================================
// PUBLIC ENDPOINTS
//
// These endpoints MUST work without an access token.
//
// Login/register are the important ones here because
// they are responsible for creating the access token.
// =====================================================

const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
];

// =====================================================
// GET CURRENT ACCESS TOKEN
// =====================================================

function getStoredAccessToken() {
  try {
    const raw = localStorage.getItem(LS_KEY);

    if (!raw) {
      console.log("[API AUTH DEBUG] No vs_auth in localStorage");
      return null;
    }

    const stored = JSON.parse(raw);

    const token =
      stored?.tokens?.accessToken || null;

    console.log("[API AUTH DEBUG]", {
      hasVsAuth: true,
      hasTokens: !!stored?.tokens,
      hasAccessToken: !!token,
      tokenLength: token?.length || 0,
    });

    return token;

  } catch (error) {
    console.warn(
      "[API] Failed to read stored auth:",
      error
    );

    return null;
  }
}

// =====================================================
// SET API TOKEN
//
// Kept for compatibility with AuthContext.
// The request interceptor also reads the token directly
// from localStorage, so this is an additional safeguard.
// =====================================================

export function setApiToken(token) {
  console.log(
    "[API] Setting axios authorisation token"
  );

  if (token) {
    api.defaults.headers.common.Authorization =
      `Bearer ${token}`;

    console.log(
      "[API] Axios authorisation header set"
    );
  } else {
    console.log(
      "[API] Removing axios authorisation header"
    );

    delete api.defaults.headers.common.Authorization;
  }
}

// =====================================================
// CHECK WHETHER REQUEST IS PUBLIC
// =====================================================

function isPublicEndpoint(url = "") {
  return PUBLIC_ENDPOINTS.some((endpoint) =>
    url.includes(endpoint)
  );
}

// =====================================================
// REQUEST INTERCEPTOR
//
// Always attach the latest token for protected requests.
//
// Public requests such as /auth/login and /auth/register
// are deliberately allowed through without a token.
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();

    const url = config.url || "";
    const publicRequest = isPublicEndpoint(url);

    // ===================================================
    // PUBLIC REQUEST
    // ===================================================

    if (publicRequest) {
      console.log(
        "[api] →",
        config.method?.toUpperCase(),
        url,
        {
          public: true,
          hasAuth: false,
        }
      );

      // Make absolutely sure an old Authorization header
      // cannot accidentally be attached to login/register.
      if (config.headers) {
        delete config.headers.Authorization;
      }

      return config;
    }

    // ===================================================
    // PROTECTED REQUEST WITH TOKEN
    // ===================================================

    if (token) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;

      console.log(
        "[api] →",
        config.method?.toUpperCase(),
        url,
        {
          public: false,
          hasAuth: true,
        }
      );

      return config;
    }

    // ===================================================
    // PROTECTED REQUEST WITHOUT TOKEN
    // ===================================================

    console.warn(
      "[API] No access token available for protected request:",
      url
    );

    if (config.headers) {
      delete config.headers.Authorization;
    }

    console.log(
      "[api] →",
      config.method?.toUpperCase(),
      url,
      {
        public: false,
        hasAuth: false,
      }
    );

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  (response) => {
    console.log(
      "[api] ← response",
      response.config.url,
      response.status,
      response.data
    );

    return response;
  },

  (error) => {
    console.warn(
      "[api] ← error",
      error.config?.url,
      error.response?.status,
      error.response?.data ||
        error.message
    );

    return Promise.reject(error);
  }
);

// =====================================================
// EXPORT
// =====================================================

export default api;
