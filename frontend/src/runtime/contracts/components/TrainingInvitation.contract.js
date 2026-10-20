const TrainingInvitationContract = {

  // =====================================================
  // IDENTITY
  // =====================================================

  name:
    "TrainingInvitation",

  type:
    "component",

  version:
    1,

  category:
    "training",

  description:
    "A client-side runtime component that detects pending training-session invitations and provides an in-app option to join.",


  // =====================================================
  // PROPS
  // =====================================================

  props: {

    title: {

      type:
        "string",

      default:
        "Training invitation",

      description:
        "Heading displayed when a training invitation is received.",

    },

    waitingText: {

      type:
        "string",

      default:
        "Waiting for your training session...",

      description:
        "Text displayed while waiting for a training invitation.",

    },

  },


  // =====================================================
  // BUILDER
  // =====================================================

  builder: {

    roles: [
      "owner",
      "admin",
      "builder",
    ],

    label:
      "Training Invitation",

    icon:
      "📨",

    description:
      "Displays and handles targeted training invitations for clients.",

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
      "member",
      "participant",
      "viewer",
    ],

    state: {

      reads: [

        "training.pendingSessions",

        "training.pendingSession",

        "training.hasPendingSession",

        "training.sessionId",

        "training.status",

        "training.channel",

        "training.joined",

      ],

      writes: [],

    },

    actions: [

      "training.fetchPendingSessions",

      "training.joinTrainingSession",

    ],

  },


  // =====================================================
  // ACTIONS
  // =====================================================

  actions: {

    outputs: [

      "training.fetchPendingSessions",

      "training.joinTrainingSession",

    ],

    inputs: [],

  },


  // =====================================================
  // TARGETS
  // =====================================================

  targets: {

    accepts: [

      "ControlButton",

      "Text",

      "TextLabel",

      "Container",

    ],

    rejects: [],

    runtime: [

      "training",

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

    title: {

      type:
        "string",

      label:
        "Title",

    },

    waitingText: {

      type:
        "string",

      label:
        "Waiting Text",

    },

  },


  // =====================================================
  // BINDINGS
  // =====================================================

  bindings: {

    pendingSessions:
      true,

    pendingSession:
      true,

    hasPendingSession:
      true,

    sessionId:
      true,

    status:
      true,

    joined:
      true,

  },


  // =====================================================
  // CAPABILITIES
  // =====================================================

  capabilities: {

    training:
      true,

    invitations:
      true,

    realtime:
      true,

    agora:
      true,

  },

};


export default TrainingInvitationContract;
