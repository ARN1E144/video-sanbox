const TrainingInvitationContract = {

  name:
    "TrainingInvitation",

  type:
    "component",

  version:
    1,

  category:
    "call",

  description:
    "A client-side runtime component that detects pending training invitations and provides an in-app option to join.",


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

    label:
      "Training Invitation",

    icon:
      "📨",

    description:
      "Displays and handles targeted training invitations for clients.",

  },


  // =====================================================
  // ACTIONS
  // =====================================================

  actions: [],


  // =====================================================
  // RUNTIME
  // =====================================================

  runtime: {

    state: {

      reads: [
        "call.pendingInvitation",
        "call.hasPendingInvitation",
      ],

      writes: [],

    },

    actions: [
      "call.fetchPendingCalls",
      "call.joinInvitedCall",
    ],

  },


  // =====================================================
  // TARGETS
  // =====================================================

  targets: [
    "call.joinInvitedCall",
  ],

};


export default TrainingInvitationContract;