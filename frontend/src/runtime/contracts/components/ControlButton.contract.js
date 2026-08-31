export default {

  // =====================================================
  // IDENTITY
  // =====================================================

  name:
    "ControlButton",

  version:
    "1.0",

  category:
    "controls",

  icon:
    "🔘",


  // =====================================================
  // BUILDER
  // =====================================================

  builder: {

    roles: [
      "owner",
      "admin",
      "builder",
    ],

    visible:
      true,

  },


  // =====================================================
  // RUNTIME
  // =====================================================

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


  // =====================================================
  // EDITABLE PROPERTIES
  // =====================================================

  editableProps: {

    label: {

      type:
        "string",

      ui:
        "build",

      default:
        "Button",

    },

    icon: {

      type:
        "string",

      ui:
        "build",

      default:
        "",

    },

    action: {

      type:
        "action",

      ui:
        "build",

      default:
        "",

    },

    params: {

      type:
        "object",

      ui:
        "build",

      label:
        "Action Parameters",

      default:
        {},

    },

    targetId: {

      type:
        "component",

      ui:
        "build",

      label:
        "Target",

      default:
        "",

    },


    style: {

      type:
        "style",

      ui:
        "advanced",

      label:
        "Style",

      default:
        {},

    },

  },


  // =====================================================
  // BINDINGS
  // =====================================================

  bindings: {

    inputs: [],

    outputs: [],

  },


  // =====================================================
  // ACTIONS
  // =====================================================

  actions: {

    inputs: [],

    outputs: [

      // -------------------------------------------------
      // CALL
      // -------------------------------------------------

      "call.startCall",

      "call.acceptCall",

      "call.joinCall",

      "call.leaveCall",

      "call.endCall",

      "call.fetchAvailableCalls",

      "call.spotlightUser",

      "call.toggleMic",

      "call.toggleVideo",

      "call.setAvailability",


      // -------------------------------------------------
      // LOCAL VIDEO
      // -------------------------------------------------

      "video.startStream",

      "video.stopStream",

      "video.loadVideo",

      "video.loadRemote",

      "video.togglePlay",

      "video.toggleMic",

      "video.toggleVideo",

      "video.startRecording",

      "video.stopRecording",

      "video.uploadRecording",


      // -------------------------------------------------
      // INTERVIEW
      // -------------------------------------------------

      "interview.start",

      "interview.submitAnswer",

      "interview.nextQuestion",

      "interview.complete",

      "interview.evaluate",


      // -------------------------------------------------
      // CHAT
      // -------------------------------------------------

      "chat.sendMessage",


      // -------------------------------------------------
      // RUNTIME
      // -------------------------------------------------

      "runtime.navigate",

      "runtime.show",

      "runtime.hide",

      "runtime.toggle",


      // -------------------------------------------------
      // THEME
      // -------------------------------------------------

      "theme.setColor",

      "theme.apply",

    ],

  },


  // =====================================================
  // EVENTS
  // =====================================================

  events: {

    inputs: [],

    outputs: [

      "click",

      "press",

      "release",

    ],

  },


  // =====================================================
  // TARGETS
  // =====================================================

  targets: {

    accepts: [

      // -------------------------------------------------
      // CALL
      // -------------------------------------------------

      "AgoraFeed",

      "CallPanel",

      "AvailabilityButton",


      // -------------------------------------------------
      // VIDEO
      // -------------------------------------------------

      "VideoFeed",


      // -------------------------------------------------
      // INTERVIEW
      // -------------------------------------------------

      "InterviewPanel",


      // -------------------------------------------------
      // OTHER
      // -------------------------------------------------

      "ChatPanel",

      "Container",

      "Text",

      "TextLabel",

    ],


    runtime: [

      "call",

      "media",

      "interview",

      "chat",

      "navigation",

    ],

  },


  // =====================================================
  // VALIDATION
  // =====================================================

  validation: {

    required: [

      "action",

    ],

    optional: [

      "targetId",

      "condition",

      "params",

    ],

  },

};