// src/components/elements/Text.js
import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function Text(props) {
  const theme = useTheme();
  const { label, text, value, style, ...rest } = props;

  // Prefer live-bound text/value, then fallback to label
  const content =
    text ??
    value ??
    label ??
    "Text Label";

  return (
    <div
      className="w-full h-full flex items-center justify-center text-center"
      style={{
        color: style?.color || theme.colors.textPrimary,
        fontSize: style?.fontSize || theme.typography.baseSize,
        fontFamily: theme.typography.fontFamily,
        ...style,
      }}
      {...rest}
    >
      {content}
    </div>
  );
}
