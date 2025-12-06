// src/components/elements/TextBox.js
import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { runAction } from "../../utils/actionExecutor";
import { useActionContext } from "../../context/ActionContext";

export default function TextBox(props) {
  const {
    label,
    style,

    // live-bound values (from ActionContext bindings)
    value,
    text,

    // action wiring
    onInputAction,
    apiUrl,
    apiMethod,
    apiHeaders,
    apiTarget,
    apiTargetField,

    ...rest
  } = props;

  const theme = useTheme();
  const actionCtx = useActionContext();

  const handleInput = (e) => {
    const newValue = e.target.value;
    if (!onInputAction) return;

    runAction(onInputAction, actionCtx, {
      value: newValue,
      label,
      url: apiUrl,
      method: apiMethod || "GET",
      headers: apiHeaders,
      targetId: apiTarget,
      targetField: apiTargetField,
    });
  };

  // If this TextBox is ever used as an API target, it can bind to `value` or `text`
  const displayValue = value ?? text ?? "";

  return (
    <div className="w-full h-full flex items-center justify-center">
      <input
        type="text"
        placeholder={label || "Enter text..."}
        className="w-full h-full px-3 text-sm outline-none rounded"
        style={{
          backgroundColor:
            style?.backgroundColor || theme.colors.surface || "#1A1A1D",
          color: style?.color || theme.colors.textPrimary || "#FFFFFF",
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
