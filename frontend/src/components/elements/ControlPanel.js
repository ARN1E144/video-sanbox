import React, { useMemo } from "react";
import * as Icons from "lucide-react";
import { useRuntimeValue } from "../../hooks/useRuntimeValue";
import { useAuth } from "../../context/AuthContext";
import { runActionTrace } from "../../runtime/runActionTrace";
import { useRuntimeState } from "../../context/RuntimeStateContext";
import ControlButtonBase from "../../ui/ControlButtonBase";

export default function ControlPanel({ layout = "vertical", controls = [] }) {
  const runtime = useRuntimeState();

  const { role = "participant" } = useAuth() || {};
  const callState = useRuntimeValue("call.state");

  const safeControls = Array.isArray(controls) ? controls : [];

  // =====================================================
  // VISIBILITY FILTER
  // =====================================================
  const visibleControls = useMemo(() => {
    return safeControls.filter((ctrl) => {
      const rules = ctrl.visibleWhen;

      if (!rules) return true;
      if (rules.role && !rules.role.includes(role)) return false;
      if (rules.callState && callState && !rules.callState.includes(callState)) return false;

      return true;
    });
  }, [safeControls, role, callState]);

  // =====================================================
  // CLICK HANDLER (V1 SAFE RESOLUTION)
  // =====================================================
  const handleClick = async (ctrl) => {
    

    const params = {
      ...ctrl.config,

      channel:
        ctrl.config?.channel ||
        runtime.get("call.channel"),

      appId:
        runtime.get("agora.appId"),

      uid:
        runtime.get("user.id"),

      targetId:
        ctrl.targetId,
    };

    console.log("[CONTROL CLICK]", ctrl);
    console.log("[PARAMS]", params);
    console.log(
      "%c[CONTROLPANEL][RUNTIME CHANNEL]%c", 
      "background: #007acc; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;",
      "", // Resets the style for the actual data
      runtime.get("call.channel")
    );

    console.log(
      "%c[CONTROLPANEL][ALL RUNTIME STATE]%c", 
      "background: #e67e22; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;",
      "", // Resets the style for the actual data
      runtime.snapshot()
    );
    const result = await runActionTrace(ctrl.action, runtime, params);

    console.log("[ACTION RESULT]", result);

    // =====================================================
    // SAFE PATCH (DO NOT OVERWRITE WHOLE OBJECT)
    // =====================================================
    const existingBindings = runtime.get?.("bindings") || {};

    runtime.set?.("bindings", {
      ...existingBindings,
      [ctrl.targetId]: {
        ...existingBindings[ctrl.targetId],
        channel: params.channel,
      },
    });
  };

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div
      style={{
        display: "flex",
        flexDirection: layout === "vertical" ? "column" : "row",
        gap: 8,
      }}
    >
      {visibleControls.map((ctrl) => {
        const Icon = Icons?.[ctrl.icon] || Icons.Circle;

        return (
          <ControlButtonBase
            key={ctrl.id || ctrl.targetId}
            icon={ctrl.icon}
            label={ctrl.label}
            active={false}
            onClick={() => handleClick(ctrl)}
          />
        );
      })}
    </div>
  );
}