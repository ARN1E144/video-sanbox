export default {

  name: "Container",

  version: "1.1",

  category: "layout",

  icon: "📦",


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

    backgroundColor: {

      type: "string",

      ui: "build",

      label: "Background Color",

      default: "#181818",

      group: "style"

    },


    borderRadius: {

      type: "number",

      ui: "advanced",

      label: "Border Radius",

      default: 12,

      group: "style"

    },


    layout: {

      type: "select",

      ui: "build",

      label: "Layout",

      default: "vertical",

      group: "layout",

      options: [

        {
          label: "Free",
          value: "free"
        },

        {
          label: "Vertical",
          value: "vertical"
        },

        {
          label: "Horizontal",
          value: "horizontal"
        }

      ]

    },


    collapsible: {

      type: "boolean",

      ui: "build",

      label: "Collapsible",

      default: false,

      group: "layout"

    },


    defaultCollapsed: {

      type: "boolean",

      ui: "advanced",

      label: "Default Collapsed",

      default: false,

      group: "layout"

    },


    label: {

      type: "string",

      ui: "advanced",

      label: "Container Label",

      default: "Container",

      group: "layout"

    }

  },


  bindings: {

    inputs: [],

    outputs: []

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

    accepts: [

      "Container",

      "AppBar",

      "Text",

      "TextBox",

      "VideoFeed",

      "AgoraFeed",

      "ChatPanel",

      "ControlPanel",

      "ControlButton"

    ],


    rejects: [

      "Runtime",

      "Action",

      "Service"

    ]

  },


  validation: {

    requires: []

  }

};
