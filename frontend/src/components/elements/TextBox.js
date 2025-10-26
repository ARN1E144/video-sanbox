import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { runAction } from "../../utils/actionExecutor";

export default function TextBox({
  label,
  style,
  onInputAction,
  apiUrl,
  apiMethod,
  apiHeaders,
  apiTarget,
  apiTargetField,
}) {
  const theme = useTheme();

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
        onInput={(e) => {
          const value = e.target.value;
          runAction(onInputAction, {
            value,
            label,
            url: apiUrl,
            method: apiMethod,
            headers: apiHeaders,
            targetId: apiTarget,
            targetField: apiTargetField,
          });
        }}
      />
    </div>
  );
}
