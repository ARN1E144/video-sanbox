import React, { useState } from "react";
import { useRuntimeState } from "../context/RuntimeStateContext";
import { useActionContext } from "../context/ActionContext";

export default function RuntimeTestPanel() {
  const runtime = useRuntimeState();
  const actions = useActionContext();

  const [key, setKey] = useState("media.micEnabled");
  const [value, setValue] = useState(true);

  const [log, setLog] = useState([]);

  const parseValue = (v) => {
    if (v === "true") return true;
    if (v === "false") return false;
    if (!isNaN(v)) return Number(v);
    return v;
  };

  const pushLog = (msg) => {
    setLog((prev) => [{ msg, time: Date.now() }, ...prev.slice(0, 20)]);
  };

  // =====================================================
  // STATE TEST
  // =====================================================
  const handleSetState = () => {
    runtime.beginTransaction();
    runtime.queueSet(key, value);
    runtime.commit();

    console.log(
      "[RUNTIME TEST PANEL]: SET STATE",
      key,
      value
    );

    pushLog(`STATE SET → ${key} = ${JSON.stringify(value)}`);
  };

  // =====================================================
  // ACTION TEST
  // =====================================================
  const handleAction = async () => {
    await actions.runRuntimeAction("agora.toggleMic", {
      source: "runtime-test-panel",
    });

    pushLog("ACTION → agora.toggleMic");
  };

  // =====================================================
  // TRIGGER TEST
  // =====================================================
  const handleTriggerTest = () => {
    runtime.beginTransaction();
    runtime.queueSet("media.micEnabled", true);
    runtime.commit();

    pushLog("TRIGGER TEST → media.micEnabled = true");
  };

  // =====================================================
  // COMPUTED TEST
  // =====================================================
  const handleComputedTest = () => {
    const current = runtime.get("media.micEnabled");

    runtime.set("media.micEnabled", !current);

    runtime.compute("test.doubleMic", (state) => {
      return state.media?.micEnabled ? 2 : 0;
    });

    pushLog("COMPUTED TEST → test.doubleMic updated");
  };

  const handleToggleMicState = () => {
  const current =
    runtime.get(
      "media.micEnabled"
    );

  runtime.beginTransaction();

  runtime.queueSet(
    "media.micEnabled",
    !current
  );

  runtime.commit();

  pushLog(
    `TOGGLE → media.micEnabled = ${!current}`
  );
};

  console.log("[TEST PANEL] ACTIONS CTX:", actions);

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        width: 320,
        background: "#111",
        color: "#fff",
        border: "1px solid #333",
        borderRadius: 12,
        padding: 12,
        zIndex: 999999,
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: 10 }}>
        Runtime Test Panel
      </div>

      <input
        value={key}
        onChange={(e) => setKey(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <input
        value={String(value)}
        onChange={(e) => setValue(parseValue(e.target.value))}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <button onClick={handleSetState} style={{ width: "100%", marginBottom: 6 }}>
        Set Runtime State
      </button>

      <button onClick={handleAction} style={{ width: "100%", marginBottom: 6 }}>
        Run Action (toggleMic)
      </button>

      <button onClick={handleTriggerTest} style={{ width: "100%" }}>
        Trigger Test
      </button>

      <button onClick={handleComputedTest} style={{ width: "100%", marginTop: 6 }}>
        Test Computed Graph
      </button>

      <button
        onClick={handleToggleMicState}
        style={{
            width: "100%",
            marginTop: 6,
        }}
        >
        Toggle Mic Runtime State
        </button>

      <div style={{ marginTop: 10, maxHeight: 140, overflow: "auto" }}>
        {log.map((l, i) => (
          <div key={i} style={{ opacity: 0.8, marginBottom: 4 }}>
            {new Date(l.time).toLocaleTimeString()} → {l.msg}
          </div>
        ))}
      </div>
    </div>
  );
}