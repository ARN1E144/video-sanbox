// src/services/callApi.js
import { http } from "./http";

const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

function logRequest(name, url, opts) {
  console.groupCollapsed(`[callApi] ${name} → request`);
  console.log("URL:", url);
  console.log("Method:", opts?.method || "GET");
  console.log("Token present:", !!opts?.token);
  if (opts?.body) console.log("Body:", opts.body);
  console.log("Raw options:", opts);
  console.trace("Call stack (who triggered this)");
  console.groupEnd();
}

function logSuccess(name, url, result) {
  console.groupCollapsed(`[callApi] ${name} ✅ success`);
  console.log("URL:", url);
  console.log("Result:", result);
  console.groupEnd();
}

function logFailure(name, url, err) {
  console.groupCollapsed(`[callApi] ${name} ❌ failure`);
  console.log("URL:", url);
  console.log("Error:", err);

  // Common shapes depending on your http() helper
  if (err?.status) console.log("err.status:", err.status);
  if (err?.message) console.log("err.message:", err.message);
  if (err?.response) {
    console.log("err.response.status:", err.response.status);
    console.log("err.response.data:", err.response.data);
    console.log("err.response.headers:", err.response.headers);
  }
  if (err?.data) console.log("err.data:", err.data);

  console.trace("Failure stack");
  console.groupEnd();
}

async function safeHttp(name, url, opts) {
  logRequest(name, url, opts);

  try {
    const result = await http(url, opts);

    // Your http() might return { ok, data } OR raw data OR Response-like object
    logSuccess(name, url, result);
    return result;
  } catch (err) {
    logFailure(name, url, err);
    throw err;
  }
}

export const callApi = {
  createCall(token) {
    const url = `${API}/api/calls/`;
    return safeHttp("createCall", url, { method: "POST", token });
  },

  available(token) {
    const url = `${API}/api/calls/available`;
    return safeHttp("available", url, { token });
  },

  accept(token, callId) {
    const url = `${API}/api/calls/${callId}/accept`;
    return safeHttp("accept", url, { method: "POST", token });
  },

  end(token, callId) {
    const url = `${API}/api/calls/${callId}/end`;
    return safeHttp("end", url, { method: "POST", token });
  },
};
