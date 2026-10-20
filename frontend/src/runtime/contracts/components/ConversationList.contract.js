// =====================================================
// CONVERSATION LIST CONTRACT
// =====================================================
//
// Defines the runtime contract for the ConversationList
// component.
//
// ConversationList is responsible for:
//
// - loading project conversations
// - displaying active conversations
// - displaying pending invitations
// - selecting a conversation
// - accepting invitations
// - declining invitations
//
// It does NOT own ChatPanel state or message rendering.
//
// =====================================================

const ConversationListContract = {

  // ===================================================
  // IDENTITY
  // ===================================================

  name:
    "ConversationList",

  version:
    "1.0",

  category:
    "communication",

  description:
    "A runtime-driven conversation list for project-scoped chat conversations and conversation invitations.",


  // ===================================================
  // BUILDER
  // ===================================================

  builder: {

    roles: [
      "owner",
      "admin",
      "host",
    ],

  },


  // ===================================================
  // RUNTIME
  // ===================================================

  runtime: {

    roles: [
      "owner",
      "admin",
      "host",
      "participant",
      "viewer",
    ],

  },


  // ===================================================
  // BINDINGS
  // ===================================================

  bindings: {

    conversations: {

      key:
        "chat.conversations",

      type:
        "array",

      description:
        "Project-scoped conversations available to the current user.",

    },


    conversationId: {

      key:
        "chat.conversationId",

      type:
        "string",

      description:
        "Currently selected conversation ID.",

    },


    projectId: {

      key:
        "project.id",

      type:
        "string",

      description:
        "Current project ID used to scope conversations.",

    },

  },


  // ===================================================
  // PROPS
  // ===================================================

  props: {

    title: {

      type:
        "string",

      default:
        "Conversations",

      description:
        "Heading displayed above the conversation list.",

    },


    style: {

      type:
        "object",

      default:
        {},

      description:
        "Additional inline styles applied to the conversation list container.",

    },

  },


  // ===================================================
  // ACTIONS
  // ===================================================

  actions: [

    {

      value:
        "chat.loadConversations",

      label:
        "Load Conversations",

      category:
        "chat",

      targets: [
        "ConversationList",
      ],

      description:
        "Loads the current user's project-scoped conversations and pending invitations.",

    },


    {

      value:
        "chat.acceptConversationInvitation",

      label:
        "Accept Conversation Invitation",

      category:
        "chat",

      targets: [
        "ConversationList",
      ],

      params: {

        conversationId: {

          type:
            "string",

          required:
            true,

          description:
            "Conversation invitation to accept.",

        },

      },

      description:
        "Accepts a pending invitation to a conversation.",

    },


    {

      value:
        "chat.declineConversationInvitation",

      label:
        "Decline Conversation Invitation",

      category:
        "chat",

      targets: [
        "ConversationList",
      ],

      params: {

        conversationId: {

          type:
            "string",

          required:
            true,

          description:
            "Conversation invitation to decline.",

        },

      },

      description:
        "Declines a pending invitation to a conversation.",

    },

  ],


  // ===================================================
  // EVENTS
  // ===================================================

  events: [

    {

      value:
        "chat.conversationsLoaded",

      label:
        "Conversations Loaded",

      description:
        "Emitted after project conversations have been loaded.",

    },


    {

      value:
        "chat.invitationAccepted",

      label:
        "Conversation Invitation Accepted",

      description:
        "Emitted after a conversation invitation is accepted.",

    },


    {

      value:
        "chat.invitationDeclined",

      label:
        "Conversation Invitation Declined",

      description:
        "Emitted after a conversation invitation is declined.",

    },

  ],


  // ===================================================
  // TARGETS
  // ===================================================

  targets: [

    {

      type:
        "ConversationList",

      description:
        "A ConversationList component instance.",

    },


    {

      type:
        "ChatPanel",

      description:
        "A ChatPanel that consumes the selected conversation.",

    },

  ],


  // ===================================================
  // CONDITIONS
  // ===================================================

  conditions: [

    {

      value:
        "chat.hasConversations",

      label:
        "Chat Has Conversations",

      description:
        "True when at least one conversation is available.",

      evaluate:
        "chat.conversations.length > 0",

    },


    {

      value:
        "chat.hasPendingConversationInvitations",

      label:
        "Has Pending Conversation Invitations",

      description:
        "True when one or more conversations contain a pending invitation for the current user.",

      evaluate:
        "chat.conversations.some(conversation => conversation.participants.some(participant => participant.status === 'invited'))",

    },


    {

      value:
        "chat.hasSelectedConversation",

      label:
        "Chat Has Selected Conversation",

      description:
        "True when a conversation is currently selected.",

      evaluate:
        "!!chat.conversationId",

    },

  ],


  // ===================================================
  // STATE
  // ===================================================

  state: {

    conversations: {

      key:
        "chat.conversations",

      type:
        "array",

      default:
        [],

    },


    conversationId: {

      key:
        "chat.conversationId",

      type:
        "string",

      default:
        null,

    },


    projectId: {

      key:
        "project.id",

      type:
        "string",

      default:
        null,

    },

  },


  // ===================================================
  // VALIDATION
  // ===================================================

  validation: {

    required: [],

    optional: [
      "title",
      "style",
    ],

  },


  // ===================================================
  // EDITABLE PROPERTIES
  // ===================================================

  editableProps: [

    "title",

    "style",

  ],


  // ===================================================
  // GUARANTEES
  // ===================================================

  guarantees: {

    projectScoped:
      true,

    runtimeDriven:
      true,

    supportsConversationSelection:
      true,

    supportsConversationInvitations:
      true,

    supportsInvitationAcceptance:
      true,

    supportsInvitationDecline:
      true,

    supportsMultipleConversations:
      true,

    doesNotOwnMessages:
      true,

  },

};


export default ConversationListContract;