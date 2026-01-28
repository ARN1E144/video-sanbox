import api from "./api";

export const authApi = {
  // Auth
  register(payload) {
    return api.post("/auth/register", payload);
  },

  login(payload) {
    return api.post("/auth/login", payload);
  },

  me() {
    return api.get("/me");
  },

  // Tenant / Members
  members(tenantId) {
    return api.get(`/tenant/${tenantId}/members`);
  },

  invite(tenantId, payload) {
    return api.post(`/tenant/${tenantId}/invite`, payload);
  },

  changeRole(tenantId, userId, role) {
    return api.patch(
      `/tenant/${tenantId}/members/${userId}/role`,
      { role }
    );
  },
};
