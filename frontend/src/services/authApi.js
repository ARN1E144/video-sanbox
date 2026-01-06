import { http } from "./http";

const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export const authApi = {
  register(payload) {
    return http(`${API}/auth/register`, { method: "POST", body: payload });
  },
  login(payload) {
    return http(`${API}/auth/login`, { method: "POST", body: payload });
  },
  me(token) {
    return http(`${API}/api/me`, { token });
  },
  members(token, tenantId) {
    return http(`${API}/api/tenant/${tenantId}/members`, { token });
  },
  invite(token, tenantId, payload) {
    return http(`${API}/api/tenant/${tenantId}/invite`, { method: "POST", token, body: payload });
  },
  changeRole(token, tenantId, userId, role) {
    return http(`${API}/api/tenant/${tenantId}/members/${userId}/role`, {
      method: "PATCH",
      token,
      body: { role },
    });
  },
};
