import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useActionContext } from "../../context/ActionContext";
import { useRuntimeState } from "../../context/RuntimeStateContext";
import { runActionTrace } from "../../runtime/runActionTrace";

export default function TextBox(props) {
  const {
    label,
    style,
    value,
    text,
    onInputAction,
    apiUrl,
    apiMethod,
    apiHeaders,
    apiTarget,
    apiTargetField,
    draftKey = "draftMessage",
    ...rest
  } = props;

  const theme = useTheme();
  const actionCtx = useActionContext();
  const runtime = useRuntimeState(); // ✅ IMPORTANT FIX

  const handleInput = (e) => {
    const newValue = e.target.value;

    // local UI state sync
    actionCtx.set(draftKey, newValue);

    if (!onInputAction) return;

    runActionTrace(onInputAction, runtime, {
      value: newValue,
      label,
      url: apiUrl,
      method: apiMethod || "GET",
      headers: apiHeaders,
      targetId: apiTarget,
      targetField: apiTargetField,
    });
  };

  const displayValue = value ?? text ?? actionCtx.get(draftKey) ?? "";

  return (
    <div className="w-full h-full flex items-center justify-center">
      <input
        type="text"
        placeholder={label || "Enter text..."}
        className="w-full h-full px-3 text-sm outline-none rounded"
        style={{
          backgroundColor:
            style?.backgroundColor ||
            theme.colors.surface ||
            "#1A1A1D",
          color:
            style?.color ||
            theme.colors.textPrimary ||
            "#FFFFFF",
          borderRadius: style?.borderRadius || 8,
          border: style?.border || "1px solid #333",
        }}
        value={displayValue}
        onChange={handleInput}
        {...rest}
      />
    </div>
  );
}