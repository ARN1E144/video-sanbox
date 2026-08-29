const ParticipantSelectorContract = {

  name:
    "ParticipantSelector",

  type:
    "component",

  version:
    1,

  category:
    "call",

  description:
    "A runtime-driven selector that allows a host to choose a tenant member as the recipient of a targeted call or training session.",


  // =====================================================
  // PROPS
  // =====================================================

  props: {

    label: {
      type:
        "string",

      default:
        "Invite Participant",

      description:
        "Label displayed above the participant selector.",
    },

    placeholder: {
      type:
        "string",

      default:
        "Select participant",

      description:
        "Placeholder displayed when no participant is selected.",
    },

    roleFilter: {
      type:
        "string",

      default:
        "",

      description:
        "Optional membership role used to filter selectable participants.",
    },

  },


  // =====================================================
  // BUILDER
  // =====================================================

  builder: {

    label:
      "Participant Selector",

    icon:
      "👤",

    description:
      "Select a tenant member to receive a targeted call or training session.",

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
        "call.recipientId",
      ],

      writes: [
        "call.recipientId",
      ],

    },

    actions: [],

  },


  // =====================================================
  // TARGETS
  // =====================================================

  targets: [

    "call.startCall",

  ],

};


export default ParticipantSelectorContract;