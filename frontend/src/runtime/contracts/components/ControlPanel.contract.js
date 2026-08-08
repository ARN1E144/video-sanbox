export default {

  name: "ControlPanel",

  version: "1.0",

  category: "controls",

  icon: "🎛️",

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

    layout: {

      type: "select",

      ui: "build",

      label: "Layout",

      default: "horizontal",

      options: [

        {
          label: "Horizontal",
          value: "horizontal"
        },

        {
          label: "Vertical",
          value: "vertical"
        }

      ]

    },

    position: {

      type: "select",

      ui: "build",

      label: "Position",

      default: "bottom",

      options: [

        {
          label: "Top",
          value: "top"
        },

        {
          label: "Bottom",
          value: "bottom"
        },

        {
          label: "Left",
          value: "left"
        },

        {
          label: "Right",
          value: "right"
        }

      ]

    },

    style: {

      type: "style",

      ui: "advanced",

      label: "Style",

      default: {}

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

    accepts: [
      "ControlButton"
    ],

    rejects: [
      "AgoraFeed",
      "VideoFeed",
      "ChatPanel",
      "Text",
      "TextBox"
    ]

  },

  validation: {

    required: [],

    optional: []

  }

};