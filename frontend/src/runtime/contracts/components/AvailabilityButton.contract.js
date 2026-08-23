const AvailabilityButtonContract = {
  name: "AvailabilityButton",

  type: "component",

  description:
    "A runtime-driven button that allows a user to control their availability for receiving calls.",

  props: {
    mode: {
      type: "string",
      default: "manual",
      enum: [
        "manual",
        "alwaysAvailable",
        "alwaysUnavailable",
      ],
      description:
        "Controls how the user's availability is managed.",
    },

    availableLabel: {
      type: "string",
      default: "Go Available",
      description:
        "Label shown when the user is currently unavailable.",
    },

    unavailableLabel: {
      type: "string",
      default: "Go Unavailable",
      description:
        "Label shown when the user is currently available.",
    },

    availableColor: {
      type: "string",
      default: "#22c55e",
      description:
        "Background colour shown when the user is unavailable and can become available.",
    },

    unavailableColor: {
      type: "string",
      default: "#6b7280",
      description:
        "Background colour shown when the user is currently available.",
    },

    disabled: {
      type: "boolean",
      default: false,
      description:
        "Disables the availability control.",
    },

    style: {
      type: "object",
      default: {},
      description:
        "Additional inline styles applied to the button.",
    },
  },

  runtime: {
    state: {
      reads: [
        "availability.isAvailable",
      ],
    },

    actions: [
      "call.setAvailability",
    ],
  },
};

export default AvailabilityButtonContract;