// src/components/elements/Select.js

import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useRuntimeState } from "../../context/RuntimeStateContext";

export default function Select(props) {
  const {
    label = "Select",
    options = [],
    bindTo = "",
    value,
    placeholder = "Select an option...",
    disabled = false,
    style = {},
    emit,
    ...rest
  } = props;

  const theme = useTheme();
  const runtime = useRuntimeState();

  const runtimeValue = bindTo
    ? runtime.get(bindTo)
    : undefined;

  const displayValue = bindTo
    ? runtimeValue ?? ""
    : value ?? "";

  const handleChange = (event) => {
    const newValue = event.target.value;

    if (bindTo) {
      runtime.set(bindTo, newValue);

      console.log("[Select] RUNTIME WRITE", {
        stateKey: bindTo,
        value: newValue,
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center gap-1">
      {label && (
        <label
          className="text-sm"
          style={{
            color:
              theme.colors.textSecondary ||
              "#A1A1AA",
          }}
        >
          {label}
        </label>
      )}

      <select
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
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

          borderRadius:
            style?.borderRadius ||
            8,

          border:
            style?.border ||
            "1px solid #333",

          ...style,
        }}
        {...rest}
      >
        <option value="">
          {placeholder}
        </option>

        {options.map((option, index) => {
          const item =
            typeof option === "object"
              ? option
              : {
                  value: option,
                  label: option,
                };

          return (
            <option
              key={
                item.value ??
                item.id ??
                index
              }
              value={
                item.value ??
                item.id ??
                ""
              }
            >
              {item.label ??
                item.name ??
                item.title ??
                item.value}
            </option>
          );
        })}
      </select>
    </div>
  );
}