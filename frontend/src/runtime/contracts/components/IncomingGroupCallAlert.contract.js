// src/runtime/contracts/components/IncomingGroupCallAlert.contract.js

export default {

  // =====================================================
  // IDENTITY
  // =====================================================

  name:
    "IncomingGroupCallAlert",

  type:
    "IncomingGroupCallAlert",

  version:
    1,

  category:
    "communication",


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
      "host",
      "member",
      "participant",
      "viewer",
    ],

  },


  // =====================================================
  // ACTIONS
  // =====================================================

  actions: {

    outputs: [],

    inputs: [

      "call.fetchPendingInvitations",

      "call.acceptInvitation",

      "call.declineInvitation",

      "call.joinGroupCall",

    ],

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

      "calls",

      "call",

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

    source: {

      type:
        "string",

      label:
        "Invitation Source",

    },

    emptyText: {

      type:
        "string",

      label:
        "Empty State Text",

    },

    compact: {

      type:
        "boolean",

      label:
        "Compact",

    },

  },


  // =====================================================
  // BINDINGS
  // =====================================================

  bindings: {

    calls:
      true,

    call:
      true,

  },


  // =====================================================
  // CAPABILITIES
  // =====================================================

  capabilities: {

    groupCall:
      true,

    invitations:
      true,

    realtime:
      true,

  },

};