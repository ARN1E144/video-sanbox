import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function MicButton({ label, style }) {
  const theme = useTheme();
  return (
    <button
      className="w-full h-full flex items-center justify-center text-sm font-medium transition hover:opacity-90"
      style={{
        backgroundColor: style?.backgroundColor || theme.colors.accent,
        color: style?.color || theme.colors.textPrimary,
        borderRadius: style?.borderRadius || theme.radius.md,
        padding: style?.padding || theme.spacing.md,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      {label || "Button"}
    </button>
  );
}
