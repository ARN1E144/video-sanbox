import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { callApi } from "../services/callApi";

export default function CallsPortal() {
  const { token, role } = useAuth();
  const isEmployee = useMemo(() => role === "owner" || role === "admin" || role === "builder", [role]);

  const [error, setError] = useState("");
  const [calls, setCalls] = useState([]);
  const [myCall, setMyCall] = useState(null);

  const refresh = async () => {
    if (!token) return;
    setError("");
    try {
      if (isEmployee) {
        const res = await callApi.available(token);
        setCalls(res.calls || []);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    refresh();
    if (!token || !isEmployee) return;

    const t = setInterval(refresh, 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isEmployee]);

  const requestCall = async () => {
    setError("");
    try {
      const res = await callApi.createCall(token);
      setMyCall(res.call);
    } catch (e) {
      setError(e.message);
    }
  };

  const accept = async (callId) => {
    setError("");
    try {
      const res = await callApi.accept(token, callId);
      // At this point you have channelName and can route into your Agora join flow
      alert(`Accepted call. Channel: ${res.call.channelName}`);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ padding: 16, color: "#ddd" }}>
      <h2 style={{ marginTop: 0 }}>Calls</h2>

      {error && (
        <div style={{ background: "#2a1212", border: "1px solid #5a2222", padding: 10, borderRadius: 8, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {!token && <div>Please login first.</div>}

      {token && !isEmployee && (
        <div style={{ maxWidth: 520, background: "#141414", border: "1px solid #2a2a2a", padding: 12, borderRadius: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Client</div>
          <button onClick={requestCall}>Request a call</button>

          {myCall && (
            <pre style={{ marginTop: 10, fontSize: 12 }}>
              {JSON.stringify(myCall, null, 2)}
            </pre>
          )}
        </div>
      )}

      {token && isEmployee && (
        <div style={{ background: "#141414", border: "1px solid #2a2a2a", padding: 12, borderRadius: 10 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 700 }}>Employee Queue</div>
            <button onClick={refresh} style={{ marginLeft: "auto" }}>Refresh</button>
          </div>

          {calls.length === 0 ? (
            <div style={{ color: "#888" }}>No waiting calls.</div>
          ) : (
            calls.map((c) => (
              <div key={c._id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderTop: "1px solid #222" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>
                    {c.client ? `${c.client.firstName || ""} ${c.client.lastName || ""} (${c.client.email})` : String(c.clientUserId)}
                  </div>
                  <div style={{ fontSize: 11, color: "#888" }}>
                    status: {c.status} | channel: {c.channelName}
                  </div>
                </div>
                <button onClick={() => accept(c._id)}>Accept</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
