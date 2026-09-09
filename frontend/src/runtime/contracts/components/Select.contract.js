export default {
  name: "Select",
  version: "1.0",
  category: "input",
  icon: "🔽",

  builder: {
    roles: ["owner", "admin", "builder"],
    visible: true,
  },

  runtime: {
    roles: [
      "owner",
      "admin",
      "builder",
      "host",
      "participant",
      "member",
      "viewer",
    ],
  },

  editableProps: {
    label: {
      type: "string",
      ui: "build",
      default: "Select",
    },

    options: {
      type: "array",
      ui: "runtime",
      default: [],
    },

    bindTo: {
      type: "string",
      ui: "runtime",
      default: "",
    },

    value: {
      type: "string",
      ui: "runtime",
      default: "",
    },

    placeholder: {
      type: "string",
      ui: "build",
      default: "Select an option...",
    },

    style: {
      type: "style",
      ui: "advanced",
      default: {
        borderRadius: "8px",
      },
    },
  },

  bindings: {
    value: {
      source: "select.value",
      type: "string",
    },

    options: {
      source: "runtime",
      type: "array",
    },
  },

  actions: {
    inputs: [],

    outputs: [
      "runtime.setState",
    ],
  },

  events: {
    inputs: [],

    outputs: [
      "change",
      "select",
    ],
  },

  targets: {
    accepts: [
      "Container",
      "ControlPanel",
      "Form",
    ],
  },

  validation: {},
};