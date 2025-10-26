import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function Text({ label, style }) {
  const theme = useTheme();
  return (
    <div
      className="w-full h-full flex items-center justify-center text-center"
      style={{
        color: style?.color || theme.colors.textPrimary,
        fontSize: style?.fontSize || theme.typography.baseSize,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      {label || "Text Label"}
    </div>
  );
}
