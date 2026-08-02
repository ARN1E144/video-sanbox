import React, { useMemo } from "react";
import { useRuntimeValue } from "../../hooks/useRuntimeValue";
import { useAuth } from "../../context/AuthContext";
import { runActionTrace } from "../../runtime/runActionTrace";
import { useRuntimeState } from "../../context/RuntimeStateContext";
import ControlButtonBase from "../../ui/ControlButtonBase";
import { useActionContext } from "../../context/ActionContext";

export default function ControlPanel({ layout = "vertical", controls = [] }) {
  const runtime = useRuntimeState();
  const { runRuntimeAction } = useActionContext();

  const { role = "participant" } = useAuth() || {};
  const callState = useRuntimeValue("call.state");
  const joined = useRuntimeValue("call.joined");

  const safeControls = Array.isArray(controls) ? controls : [];

  // =====================================================
  // VISIBILITY FILTER
  // =====================================================
  const visibleControls = useMemo(()=>{

    return safeControls.filter((ctrl)=>{

        const rules = ctrl.visibleWhen;


        if(!rules)
            return true;


        if(
            rules.role &&
            !rules.role.includes(role)
        ){
            return false;
        }


        if(
            rules.callState &&
            !rules.callState.includes(callState)
        ){
            return false;
        }


        if(
            rules.joined !== undefined &&
            rules.joined !== joined
        ){
            return false;
        }


        return true;

    });


},[
    safeControls,
    role,
    callState,
    joined
]);

  // =====================================================
  // CLICK HANDLER (V1 SAFE RESOLUTION)
  // =====================================================
  const handleClick = async(ctrl)=>{

      const params = {

          ...ctrl.config,

          channel:
              ctrl.config?.channel ||
              runtime.get("call.channel"),

          uid:
              runtime.get("user.id"),

          targetId:
              ctrl.targetId
      };


      console.log(
          "[CONTROL CLICK]",
          ctrl
      );


      const result =
          await runRuntimeAction(
              ctrl.action,
              params
          );


      console.log(
          "[ACTION RESULT]",
          result
      );

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