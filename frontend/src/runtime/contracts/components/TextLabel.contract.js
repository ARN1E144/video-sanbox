export default {

  name: "TextLabel",

  version: "1.0",

  category: "text",

  icon: "🔤",

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
      label: "Text",
      default: "Text"
    },

    style: {
      type: "style",
      ui: "advanced",
      label: "Style",
      default: {
        color: "#FFFFFF",
        fontSize: "16px"
      }
    }

  },

  bindings: {

    text: {
      source: "text.value",
      type: "string"
    }

  },

  actions: {

    inputs: [],

    outputs: []

  },

  events: {

    inputs: [],

    outputs: []

  },

  targets: {

    accepts: []

  },

  validation: {}

};