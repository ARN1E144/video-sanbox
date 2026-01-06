import React, { createContext, useContext, useMemo, useState } from "react";
import { authApi } from "../services/authApi";

const AuthContext = createContext(null);
const LS_KEY = "vs_auth";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || null;
    } catch {
      return null;
    }
  });

  const save = (next) => {
    setSession(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  };

  // ✅ merges into the latest session (prevents stale closure issues)
  const mergeSave = (patch) => {
    setSession((prev) => {
      const next = { ...(prev || {}), ...(patch || {}) };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clear = () => {
    setSession(null);
    localStorage.removeItem(LS_KEY);
  };

  const value = useMemo(() => {
    const token = session?.tokens?.accessToken || null;

    // Prefer tenantId from /api/me, then fallback to login/register payload
    const tenantId =
      session?.me?.membership?.tenantId ||
      session?.membership?.tenantId ||
      session?.tenant?.id ||
      null;

    const role =
      session?.me?.membership?.role ||
      session?.membership?.role ||
      session?.auth?.role ||
      null;

    const permissions =
      session?.me?.membership?.permissions ||
      session?.membership?.permissions ||
      null;

    const canBuild =
      permissions?.canBuild ??
      (role === "owner" || role === "admin" || role === "builder");

    const canInvite =
      permissions?.canInvite ??
      (role === "owner" || role === "admin");

    const refreshMe = async () => {
      if (!token) throw new Error("No access token");
      const me = await authApi.me(token);
      mergeSave({ me });
      return me;
    };

    const register = async (payload) => {
      const res = await authApi.register(payload);
      const nextToken = res?.tokens?.accessToken;

      if (nextToken) {
        const me = await authApi.me(nextToken);
        save({ ...res, me });
      } else {
        save(res);
      }

      return res;
    };

    const login = async (payload) => {
      const res = await authApi.login(payload);
      const nextToken = res?.tokens?.accessToken;

      if (nextToken) {
        const me = await authApi.me(nextToken);
        save({ ...res, me });
      } else {
        save(res);
      }

      return res;
    };

    return {
      session,
      token,
      tenantId,

      role,
      permissions,
      canBuild,
      canInvite,

      register,
      login,
      me: refreshMe,
      refreshMe,

      logout: clear,
    };
  }, [session]); // keep as-is (simple + correct)

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
