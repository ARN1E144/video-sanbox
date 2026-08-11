import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/authApi";

export default function AuthPortal({ onAuthed }) {
  const { session, token, tenantId, register, login, logout } = useAuth();

  const [mode, setMode] = useState("login"); // login | register
  const [error, setError] = useState("");
  const [me, setMe] = useState(null);

  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  // forms
  const [reg, setReg] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    tenantName: "",
  });
  const [log, setLog] = useState({ email: "", password: "" });

  const refreshMembers = async () => {
    if (!token || !tenantId) return;
    console.log("[AuthPortal] Refreshing members for tenant:", tenantId);
    const res = await authApi.members(tenantId);
    setMembers(res.data?.members || []);
    console.log("[AuthPortal] Fetched members:", res.data?.members);

  };


  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    marginBottom: 8,
    borderRadius: 6,
    border: "1px solid #3a3a3a",
    background: "#0f172a",
    color: "#f8fafc",
    outline: "none",
  };

  const selectStyle = {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #3a3a3a",
    background: "#0f172a",
    color: "#f8fafc",
    outline: "none",
  };

  const buttonStyle = {
    padding: "9px 14px",
    borderRadius: 6,
    border: "1px solid #3a3a3a",
    background: "#1e293b",
    color: "#f8fafc",
    cursor: "pointer",
  };



  console.log("[AuthPortal] token:", token, "tenantId:", tenantId);

  useEffect(() => {
  setError("");

  if (!token) {
    setMe(null);
    return;
  }

  setMe(session?.me || null);

  if (typeof onAuthed === "function") {
    onAuthed();
  }
}, [token, session, onAuthed]);

  useEffect(() => {
    refreshMembers().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tenantId]);

  const onRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(reg);
    } catch (e2) {
      setError(e2.message);
    }
  };

  const onLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(log);
    } catch (e2) {
      setError(e2.message);
    }
  };

  const onInvite = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await authApi.invite(token, tenantId, { email: inviteEmail, role: inviteRole });
      setInviteEmail("");
      await refreshMembers();
    } catch (e2) {
      setError(e2.message);
    }
  };

  const onChangeRole = async (userId, role) => {
    setError("");
    try {
      await authApi.changeRole(token, tenantId, userId, role);
      await refreshMembers();
    } catch (e2) {
      setError(e2.message);
    }
  };

  return (
    <div style={{ padding: 16, color: "#ddd", overflow: "auto" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Auth Portal</h2>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => setMode("login")}>Login</button>
          <button onClick={() => setMode("register")}>Register</button>
          {token && <button onClick={logout}>Logout</button>}
        </div>
      </div>

      {error && (
        <div style={{ background: "#2a1212", border: "1px solid #5a2222", padding: 10, borderRadius: 8, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {!token ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, maxWidth: 520 }}>
          {mode === "register" ? (
            <form onSubmit={onRegister} style={{ background: "#141414", border: "1px solid #2a2a2a", padding: 12, borderRadius: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Register</div>

                <input
                  style={inputStyle}
                  placeholder="First name"
                  value={reg.firstName}
                  onChange={(e) =>
                    setReg({ ...reg, firstName: e.target.value })
                  }
                />

                <input
                  style={inputStyle}
                  placeholder="Last name"
                  value={reg.lastName}
                  onChange={(e) =>
                    setReg({ ...reg, lastName: e.target.value })
                  }
                />

                <input
                  style={inputStyle}
                  placeholder="Email"
                  value={reg.email}
                  onChange={(e) =>
                    setReg({ ...reg, email: e.target.value })
                  }
                />

                <input
                  style={inputStyle}
                  placeholder="Password"
                  type="password"
                  value={reg.password}
                  onChange={(e) =>
                    setReg({ ...reg, password: e.target.value })
                  }
                />

                <input
                  style={inputStyle}
                  placeholder="Tenant name"
                  value={reg.tenantName}
                  onChange={(e) =>
                    setReg({ ...reg, tenantName: e.target.value })
                  }
                />



              <button type="submit" style={{ marginTop: 10 }}>Create account</button>
            </form>
          ) : (
            <form onSubmit={onLogin} style={{ background: "#141414", border: "1px solid #2a2a2a", padding: 12, borderRadius: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Login</div>

              <input placeholder="Email" value={log.email} onChange={(e) => setLog({ ...log, email: e.target.value })} />
              <input placeholder="Password" type="password" value={log.password} onChange={(e) => setLog({ ...log, password: e.target.value })} />

              <button type="submit" style={{ marginTop: 10 }}>Sign in</button>
            </form>
          )}

          <div style={{ color: "#999", fontSize: 12 }}>
            Tip: this is intentionally ugly/minimal — we just want to stop using curl.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "#141414", border: "1px solid #2a2a2a", padding: 12, borderRadius: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Session</div>
            <div style={{ fontSize: 12, color: "#aaa" }}>tenantId: {tenantId || "n/a"}</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: "#aaa" }}>tenantId: {tenantId || "n/a"}</div>

              <div
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 999,
                  border: "1px solid #333",
                  background: "#0f0f0f",
                  color: "#ddd",
                }}
              >
                role: {me?.membership?.role || session?.membership?.role || "n/a"}
              </div>
            </div>

            <pre style={{ fontSize: 11, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(me || session, null, 2)}
            </pre>
          </div>

          <div style={{ background: "#141414", border: "1px solid #2a2a2a", padding: 12, borderRadius: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Tenant Members</div>

            <form onSubmit={onInvite} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input placeholder="invite email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} style={{ flex: 1 }} />
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="member">member</option>
                <option value="builder">builder</option>
                <option value="admin">admin</option>
              </select>
              <button type="submit">Invite</button>
            </form>

            <div style={{ maxHeight: 320, overflow: "auto", borderTop: "1px solid #2a2a2a", paddingTop: 10 }}>
              {members.map((m) => (
                <div key={m._id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #222" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>
                      {m.user?.firstName || ""} {m.user?.lastName || ""} — {m.user?.email || m.userId}
                    </div>
                    <div style={{ fontSize: 11, color: "#888" }}>
                      role: {m.role} | canBuild: {String(m.permissions?.canBuild)} | canInvite: {String(m.permissions?.canInvite)}
                    </div>
                  </div>

                  <select value={m.role} onChange={(e) => onChangeRole(m.userId, e.target.value)}>
                    <option value="member">member</option>
                    <option value="builder">builder</option>
                    <option value="admin">admin</option>
                    <option value="owner">owner</option>
                  </select>
                </div>
              ))}

              {members.length === 0 && <div style={{ color: "#777" }}>No members yet.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
