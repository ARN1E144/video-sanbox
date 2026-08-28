export default {

  // =====================================================
  // IDENTITY
  // =====================================================

  name:
    "InterviewPanel",

  type:
    "InterviewPanel",

  version:
    1,

  category:
    "interview",


  // =====================================================
  // BUILDER
  // =====================================================

  builder: {

    roles: [
      "owner",
      "admin",
      "builder",
    ],

  },


  // =====================================================
  // RUNTIME
  // =====================================================

  runtime: {

    roles: [
      "owner",
      "admin",
      "builder",
      "member",
      "viewer",
    ],

  },


  // =====================================================
  // ACTIONS
  // =====================================================

  actions: {

    outputs: [],

    inputs: [

      "interview.start",

      "interview.submitAnswer",

      "interview.nextQuestion",

      "interview.complete",

      "interview.evaluate",

      "video.toggleMic",

      "video.toggleVideo",

    ],

  },


  // =====================================================
  // TARGETS
  // =====================================================

  targets: {

    accepts: [

      "VideoFeed",

      "TextBox",

      "ControlButton",

    ],

    rejects: [],

    runtime: [

      "interview",

      "media",

    ],

  },


  // =====================================================
  // VALIDATION
  // =====================================================

  validation: {

    required: [],

  },


  // =====================================================
  // EDITABLE PROPERTIES
  // =====================================================

  editableProps: {

    videoTargetId: {

      type:
        "string",

      label:
        "Video Target",

    },

  },


  // =====================================================
  // BINDINGS
  // =====================================================

  bindings: {

    interview:
      true,

    media:
      true,

  },


  // =====================================================
  // CAPABILITIES
  // =====================================================

  capabilities: {

    video:
      true,

    audio:
      true,

    interview:
      true,

    evaluation:
      true,

    transcription:
      true,

  },

};