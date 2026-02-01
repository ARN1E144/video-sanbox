import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { authApi } from "../services/authApi";
import { setApiToken } from "../services/api";
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

  useEffect(() => {
  console.log("[Auth] session", session);
}, [session]);

  const save = (next) => {

    console.log("[AuthProvider] Save Session Tokens", next);

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
      setApiToken(token); // ensure axios is primed (important on reload)
      const res = await authApi.me();
      mergeSave({ me:res.data });
      return res.data;
    };


    const register = async (payload) => {
      const res = await authApi.register(payload);
      const data = res.data;
      const nextToken = data?.tokens?.accessToken;

      if (!nextToken) {
        save(data);
        return data;
      }

      setApiToken(nextToken);
      const meRes = await authApi.me();

      save({ ...data, me: meRes.data });
      return data;
    };


    const login = async (payload) => {
  console.log("[AuthProvider] login", payload);

  const res = await authApi.login(payload);
  const data = res.data;

  console.log("[AuthProvider] login response", data);

  const nextToken = data?.tokens?.accessToken;
          if (!nextToken) {
            save(data);
            return data;
          }
          
          // ✅ Set token FIRST
          setApiToken(nextToken);

          // ✅ Now authenticated requests work
          const meRes = await authApi.me();

          save({ ...data, me : meRes.data });

          return data;
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
