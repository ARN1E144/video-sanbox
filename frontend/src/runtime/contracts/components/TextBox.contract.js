export default {

  name: "TextBox",

  version: "1.0",

  category: "text",

  icon: "⌨️",

  builder: {

    roles: [
      "owner",
      "admin"
    ],

    visible: true

  },

  runtime: {

    roles: [
      "owner",
      "host",
      "participant",
      "viewer"
    ]

  },

  editableProps: {

    label: {
      type: "string",
      ui: "build",
      default: "Enter text..."
    },

    placeholder: {
      type: "string",
      ui: "build",
      default: "Enter text..."
    },

    value: {
      type: "string",
      ui: "runtime",
      default: ""
    },

    style: {
      type: "style",
      ui: "advanced",
      default: {
        backgroundColor: "#2C2C2E",
        color: "#FFFFFF",
        borderRadius: "8px"
      }
    }

  },

  bindings: {

    value: {
      source: "input.value",
      type: "string"
    }

  },

  actions: {

    inputs: [],

    outputs: [
      "chat.sendMessage",
      "runtime.setState"
    ]

  },

  events: {

    inputs: [],

    outputs: [
      "change",
      "submit"
    ]

  },

  targets: {

    accepts: [
      "ChatPanel"
    ]

  },

  validation: {}

};