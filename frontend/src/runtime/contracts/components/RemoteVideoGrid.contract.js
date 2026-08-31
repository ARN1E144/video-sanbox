export default {

  name:
    "RemoteVideoGrid",

  version:
    "1.0",

  category:
    "media",

  icon:
    "👥",


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

    default:
      "call.remoteUsers",

  },

  columns: {

    type:
      "number",

    default:
      2,

  },

  gap: {

    type:
      "number",

    default:
      8,

  },

  emptyText: {

    type:
      "string",

    default:
      "No remote participants",

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

    participants: {

      type:
        "object",

    },

  },


  // ===================================================
  // ACTIONS
  // ===================================================

  actions: {

    inputs: [],

    outputs: [],

  },


  // ===================================================
  // EVENTS
  // ===================================================

  events: {

    inputs: [],

    outputs: [

      "participant.rendered",

      "participant.removed",

    ],

  },


  // ===================================================
  // TARGETS
  // ===================================================

  targets: {

    accepts: [

      "ParticipantSource",

      "RealtimeParticipants",

      "Call",

      "TrainingSession",

    ],

    rejects: [],

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