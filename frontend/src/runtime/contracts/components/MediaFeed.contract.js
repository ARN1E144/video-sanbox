export default {

  name:
    "MediaFeed",

  version:
    "1.0",

  category:
    "media",

  icon:
    "🌐",


  // ===================================================
  // BUILDER
  // ===================================================

  builder: {

    roles: [

      "owner",

      "admin",

    ],

    visible:
      true,

  },


  // ===================================================
  // RUNTIME
  // ===================================================

  runtime: {

    roles: [

      "owner",

      "admin",

      "builder",

      "host",

      "participant",

      "viewer",

    ],

  },


  // ===================================================
  // EDITABLE PROPERTIES
  // ===================================================

  editableProps: {

    source: {

      type:
        "string",

    },

    sourceType: {

      type:
        "string",

    },

    title: {

      type:
        "string",

    },

    autoPlay: {

      type:
        "boolean",

    },

    muted: {

      type:
        "boolean",

    },

    controls: {

      type:
        "boolean",

    },

    loop: {

      type:
        "boolean",

    },

    playsInline: {

      type:
        "boolean",

    },

    objectFit: {

      type:
        "string",

    },

    borderRadius: {

      type:
        "number|string",

    },

  },


  // ===================================================
  // RUNTIME BINDINGS
  // ===================================================

  bindings: {

    source: {

      type:
        "string",

    },

    playing: {

      type:
        "boolean",

    },

    currentTime: {

      type:
        "number",

    },

    duration: {

      type:
        "number",

    },

  },


  // ===================================================
  // ACTIONS
  // ===================================================

  actions: {

    inputs: [

      "media.load",

      "media.play",

      "media.pause",

      "media.stop",

      "media.seek",

      "media.restart",

      "media.setVolume",

      "media.setSource",

    ],

    outputs: [],

  },


  // ===================================================
  // EVENTS
  // ===================================================

  events: {

    inputs:
      [],

    outputs: [

      "media.loaded",

      "media.playing",

      "media.paused",

      "media.ended",

      "media.error",

      "media.timeChanged",

    ],

  },


  // ===================================================
  // TARGETS
  // ===================================================

  targets: {

    accepts: [

      "VideoSource",

      "Stream",

      "MediaSource",

    ],

    rejects: [

      "call.toggleMic",

      "call.joinCall",

    ],

  },


  // ===================================================
  // VALIDATION
  // ===================================================

  validation: {

    required: [

      "source",

    ],

  },

};