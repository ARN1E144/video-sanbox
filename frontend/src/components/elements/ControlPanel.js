// src/components/ui/ControlPanel.js

import React, { useMemo } from "react";
import * as Icons from "lucide-react";

import { useActionContext } from "../../context/ActionContext";
import { useAuth } from "../../context/AuthContext";

export default function ControlPanel({
  id,
  layout = "vertical",
  controls = [],
}) {
  const actionCtx = useActionContext();
  const { runAction, state } = actionCtx;

  const { role = "participant" } = useAuth() || {};

  const safeControls = Array.isArray(controls) ? controls : [];

  // =====================================================
  // 🔥 VISIBILITY ENGINE (V1 SIMPLE)
  // =====================================================

  const isVisible = (ctrl) => {
    const rules = ctrl.visibleWhen;
    if (!rules) return true;

    if (rules.role && !rules.role.includes(role)) return false;

    const callState = state?.call?.state;
    if (
      rules.callState &&
      callState &&
      !rules.callState.includes(callState)
    ) {
      return false;
    }

    return true;
  };

  const visibleControls = useMemo(
    () => safeControls.filter(isVisible),
    [safeControls, role, state?.call?.state]
  );

  // =====================================================
  // 🎮 ACTION EXECUTION
  // =====================================================

  const handleControlClick = async (ctrl) => {
    await actionCtx.runAction(ctrl.action, {
      targetId: ctrl.targetId,
      config: ctrl.config,
    })
  };

  // =====================================================
  // 🎨 RENDER
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
          <button
            key={ctrl.id}
            onClick={() => handleControlClick(ctrl)}
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "#fff",
              border: "1px solid #ddd",
            }}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}