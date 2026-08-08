export default {

  name: "AppBar",

  version: "1.0",

  category: "layout",

  icon: "🧭",

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
      label: "Header Label",
      default: "App Header"
    },

    style: {
      type: "object",
      ui: "advanced",
      label: "Style",
      default: {
        backgroundColor: "#000000",
        color: "#FFFFFF",
        fontSize: "18px"
      }
    }

  },

  bindings: {},

  actions: {
    inputs: [],
    outputs: []
  },

  events: {
    inputs: [],
    outputs: []
  },

  targets: {
    accepts: [],
    rejects: []
  },

  validation: {}

};