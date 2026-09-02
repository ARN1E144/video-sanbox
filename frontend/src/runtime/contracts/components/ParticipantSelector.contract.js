// src/runtime/contracts/components/ParticipantSelector.contract.js

const ParticipantSelectorContract = {

  name:
    "ParticipantSelector",

  type:
    "component",

  version:
    3,

  category:
    "communication",

  description:
    "A runtime-driven selector for choosing one or more tenant members for calls, training sessions, meetings and other participant-based workflows.",


  // =====================================================
  // PROPS
  // =====================================================

  props: {

    label: {

      type:
        "string",

      default:
        "Select Participants",

      description:
        "Label displayed above the participant selector.",

    },


    placeholder: {

      type:
        "string",

      default:
        "Search participants...",

      description:
        "Placeholder displayed in the participant search field.",

    },


    roleFilter: {

      type:
        "string",

      default:
        "",

      description:
        "Optional tenant membership role filter.",

    },


    multiple: {

      type:
        "boolean",

      default:
        true,

      description:
        "Allows multiple participants to be selected.",

    },


    selectionPath: {

      type:
        "string",

      default:
        "call.selectedParticipantIds",

      description:
        "Runtime state path receiving the selected participant IDs.",

    },

  },


  // =====================================================
  // BUILDER
  // =====================================================

  builder: {

    label:
      "Participant Selector",

    icon:
      "👥",

    description:
      "Select tenant members for a runtime workflow.",

  },


  // =====================================================
  // ACTIONS
  // =====================================================

  actions: {

    inputs: [],

    outputs: [],

  },


  // =====================================================
  // RUNTIME
  // =====================================================

  runtime: {

    state: {

      reads: [

        "selectionPath",

      ],

      writes: [

        "selectionPath",

      ],

    },

    actions: [],

  },


  // =====================================================
  // TARGETS
  // =====================================================

  targets: [

    "call.createGroupCall",

    "call.inviteGroupParticipants",

    "training.createSession",

  ],


  // =====================================================
  // EDITABLE PROPS
  // =====================================================

  editableProps: {

    label: {

      type:
        "string",

      label:
        "Label",

    },


    placeholder: {

      type:
        "string",

      label:
        "Placeholder",

    },


    roleFilter: {

      type:
        "string",

      label:
        "Role Filter",

    },


    multiple: {

      type:
        "boolean",

      label:
        "Allow Multiple",

    },


    selectionPath: {

      type:
        "string",

      label:
        "Selection Path",

    },

  },


  // =====================================================
  // BINDINGS
  // =====================================================

  bindings: {

    runtimeSelection:
      true,

  },


  // =====================================================
  // CAPABILITIES
  // =====================================================

  capabilities: {

    participantSelection:
      true,

    multipleSelection:
      true,

    tenantMembers:
      true,

  },

};


export default ParticipantSelectorContract;