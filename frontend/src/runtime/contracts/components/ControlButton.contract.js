export default {

  name: "ControlButton",

  version: "1.0",

  category: "controls",

  icon: "🔘",



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
    default: "Button"
  },

  icon: {
    type: "string",
    ui: "build",
    default: ""
  },

  action: {
    type: "action",
    ui: "build",
    default: ""
  },

  params: {
    type: "object",
    ui: "build",
    label: "Action Parameters",
    default: {}
  },

  targetId: {
    type: "component",
    ui: "build",
    label: "Target",
    default: ""
  },

  condition: {
    type: "condition",
    ui: "advanced",
    label: "Condition",
    default: ""
  },

  style: {
    type: "style",
    ui: "advanced",
    label: "Style",
    default: {}
  },

},



  bindings: {

    inputs: [],

    outputs: []

  },



  actions: {


    inputs: [],


    outputs: [

      "call.startCall",

      "call.joinCall",

      "call.leaveCall",

      "call.toggleMic",

      "call.toggleVideo",

      "media.play",

      "media.pause",

      "media.stop",

      "chat.sendMessage",

      "runtime.navigate",

      "runtime.show",

      "runtime.hide",

      "runtime.toggle"

    ]

  },



  events: {

    inputs: [],


    outputs: [

      "click",

      "press",

      "release"

    ]

  },



  targets: {

    accepts:[
      "AgoraFeed",
      "VideoFeed",
      "ChatPanel",
      "Container"
    ],

    runtime:[
      "call",
      "media",
      "navigation",
      "chat"
    ]

    },



  validation: {


    required: [

      "action"

    ],


    optional: [

      "targetId",
      "condition",
      "params"

    ]

  }


};