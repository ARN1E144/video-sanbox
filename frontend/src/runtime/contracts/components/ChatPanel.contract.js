export default {

  name: "ChatPanel",

  version: "1.0",

  category: "communication",

  icon: "💬",


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

    style: {

      type: "object",

      ui: "advanced",

      label: "Style",

      default: {

        backgroundColor: "#1A1A1D",

        color: "#FFFFFF",

        borderRadius: 8

      }

    }

  },



  bindings: {

    messages: {

      source: "chat.messages",

      type: "array"

    },

    users: {

      source: "chat.users",

      type: "array"

    }

  },



  actions: {

    inputs: [

      "chat.sendMessage",

      "chat.clearMessages"

    ],

    outputs: []

  },



  events: {

    inputs: [],

    outputs: [

      "chat.messageSent",

      "chat.messageReceived"

    ]

  },



  targets: {

    accepts: [

      "ControlButton"

    ],

    rejects: [

      "AgoraFeed",

      "VideoFeed",

      "Text"

    ]

  },



  validation: {

    requires: []

  }


};