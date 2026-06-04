import React, { useState } from "react";
import { useRuntimeState } from "../context/RuntimeStateContext";
import { useActionContext } from "../context/ActionContext";
import { Rnd } from "react-rnd";

export default function RuntimeTestPanel() {
  const runtime = useRuntimeState();
  const actions = useActionContext();

  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 320, height: 420 });

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
    setLog((prev) => [{ msg, time: Date.now() }, ...prev.slice(0, 30)]);
  };

  // =========================
  // STATE TEST
  // =========================
  const handleSetState = () => {
    runtime.beginTransaction();
    runtime.queueSet(key, value);
    runtime.commit();

    pushLog(`STATE SET → ${key} = ${JSON.stringify(value)}`);
  };

  // =========================
  // ACTION TEST
  // =========================
  const handleAction = async () => {
    await actions.runRuntimeAction("agora.toggleMic", {
      source: "runtime-test-panel",
    });

    pushLog("ACTION → agora.toggleMic");
  };

  // =========================
  // TRIGGER TEST
  // =========================
  const handleTriggerTest = () => {
    runtime.beginTransaction();
    runtime.queueSet("media.micEnabled", true);
    runtime.commit();

    pushLog("TRIGGER TEST → media.micEnabled = true");
  };

  // =========================
  // COMPUTED TEST
  // =========================
  const handleComputedTest = () => {
    const current = runtime.get("media.micEnabled");

    runtime.set("media.micEnabled", !current);

    runtime.compute("test.doubleMic", (state) => {
      return state.media?.micEnabled ? 2 : 0;
    });

    pushLog("COMPUTED TEST → test.doubleMic updated");
  };

  const handleToggleMicState = () => {
    const current = runtime.get("media.micEnabled");

    runtime.beginTransaction();
    runtime.queueSet("media.micEnabled", !current);
    runtime.commit();

    pushLog(`TOGGLE → media.micEnabled = ${!current}`);
  };

  return (
    <Rnd
      size={size}
      position={position}
      onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
      onResizeStop={(e, direction, ref, delta, pos) => {
        setSize({
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10),
        });
        setPosition(pos);
      }}
      minWidth={260}
      minHeight={300}
      bounds="window"
      style={{ zIndex: 999999 }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#111",
          color: "#fff",
          border: "1px solid #333",
          borderRadius: 12,
          padding: 12,
          fontSize: 12,
          display: "flex",
          flexDirection: "column",
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

        <button onClick={handleSetState} style={{ marginBottom: 6 }}>
          Set Runtime State
        </button>

        <button onClick={handleAction} style={{ marginBottom: 6 }}>
          Run Action (toggleMic)
        </button>

        <button onClick={handleTriggerTest}>Trigger Test</button>

        <button onClick={handleComputedTest} style={{ marginTop: 6 }}>
          Test Computed Graph
        </button>

        <button onClick={handleToggleMicState} style={{ marginTop: 6 }}>
          Toggle Mic Runtime State
        </button>

        <div
          style={{
            marginTop: 10,
            flex: 1,
            overflow: "auto",
            background: "#0a0a0a",
            padding: 6,
            borderRadius: 6,
          }}
        >
          {log.map((l, i) => (
            <div key={i} style={{ opacity: 0.8, marginBottom: 4 }}>
              {new Date(l.time).toLocaleTimeString()} → {l.msg}
            </div>
          ))}
        </div>
      </div>
    </Rnd>
  );
}