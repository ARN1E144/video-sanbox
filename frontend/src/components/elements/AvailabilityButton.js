// src/components/elements/AvailabilityButton.js

import React, { useCallback } from "react";

import { useRuntimeValue } from "../../hooks/useRuntimeValue";
import { useActionContext } from "../../context/ActionContext";

export default function AvailabilityButton({
  availableLabel = "Go Available",
  unavailableLabel = "Go Unavailable",

  availableColor = "#22c55e",
  unavailableColor = "#6b7280",

  disabled = false,

  style = {},
}) {

  // =====================================================
  // RUNTIME STATE
  // =====================================================

  const isAvailable =
    useRuntimeValue("availability.isAvailable") ?? false;


  // =====================================================
  // ACTION CONTEXT
  // =====================================================

  const {
    runAction,
  } = useActionContext();


  // =====================================================
  // TOGGLE AVAILABILITY
  // =====================================================

  const handleToggle = useCallback(
    async () => {

      if (disabled) {
        return;
      }


      const nextAvailability =
        !isAvailable;


      console.log(
        "[AvailabilityButton] Changing availability:",
        {
          current: isAvailable,
          next: nextAvailability,
        }
      );


      try {

        const result =
          await runAction(
            "call.setAvailability",
            {
              isAvailable:
                nextAvailability,
            }
          );


        console.log(
          "[AvailabilityButton] Action result:",
          result
        );


        if (!result?.ok) {

          console.warn(
            "[AvailabilityButton] Action failed:",
            result
          );

        }

      }
      catch (err) {

        console.error(
          "[AvailabilityButton] Failed to change availability:",
          err
        );

      }

    },
    [
      disabled,
      isAvailable,
      runAction,
    ]
  );


  // =====================================================
  // DISPLAY
  // =====================================================

  const label =
    isAvailable
      ? unavailableLabel
      : availableLabel;


  const backgroundColor =
    isAvailable
      ? unavailableColor
      : availableColor;


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}

      style={{
        padding: "10px 16px",

        border: "none",

        borderRadius: "6px",

        backgroundColor,

        color: "#fff",

        cursor:
          disabled
            ? "not-allowed"
            : "pointer",

        opacity:
          disabled
            ? 0.6
            : 1,

        fontSize: "14px",

        fontWeight: 600,

        transition:
          "background-color 0.2s ease",

        ...style,
      }}
    >

      {label}

    </button>

  );
}