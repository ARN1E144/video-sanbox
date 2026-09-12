// src/components/contracts/ChatPanel.contract.js

// =====================================================
// CHAT PANEL COMPONENT CONTRACT
// =====================================================
//
// Defines the runtime contract for the Confo ChatPanel.
//
// ChatPanel is a runtime-driven messaging component.
//
// Runtime flow:
//
//   ChatPanel
//       ↓
//   chat.messages
//       ↓
//   chat.sendMessage
//       ↓
//   backend persistence
//       ↓
//   chat.messageSent
//
// The component itself is responsible for rendering the
// current runtime message collection.
//
// =====================================================

export default {

  // ===================================================
  // IDENTITY
  // ===================================================

  name:
    "ChatPanel",

  version:
    "1.0",

  category:
    "communication",


  // ===================================================
  // DESCRIPTION
  // ===================================================

  description:
    "Project-scoped chat panel that renders and interacts with runtime-managed messages.",


  // ===================================================
  // BUILDER ACCESS
  // ===================================================
  //
  // Who can configure the component in the builder.
  //
  // ===================================================

  builder: {

    roles: [

      "owner",

      "admin",

    ],

  },


  // ===================================================
  // RUNTIME ACCESS
  // ===================================================
  //
  // Runtime roles allowed to use the component.
  //
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
  //
  // Runtime state consumed by the component.
  //
  // ===================================================

  bindings: {

    messages: {

      key:
        "chat.messages",

      type:
        "array",

      description:
        "Runtime collection of chat messages.",

    },

  },


  // ===================================================
  // PROPERTIES
  // ===================================================
  //
  // Configurable component properties.
  //
  // ===================================================

  props: {

    bindKey: {

      type:
        "string",

      default:
        "chat.messages",

      description:
        "Runtime state key containing chat messages.",

    },


    title: {

      type:
        "string",

      default:
        "Chat",

      description:
        "Title displayed in the chat panel header.",

    },

  },


  // ===================================================
  // ACTIONS
  // ===================================================
  //
  // Actions that can target ChatPanel.
  //
  // ===================================================

  actions: [

    {

      value:
        "chat.loadMessages",

      label:
        "Load Chat Messages",

      category:
        "chat",

      targets: [

        "ChatPanel",

      ],

      description:
        "Loads persisted project chat messages into runtime state.",

    },


    {

      value:
        "chat.sendMessage",

      label:
        "Send Message",

      category:
        "chat",

      targets: [

        "ChatPanel",

      ],

      params: {

        text: {

          type:
            "string",

          required:
            true,

          description:
            "Message text to send.",

        },

      },

      description:
        "Persists a message and appends it to the runtime chat message collection.",

    },

  ],


  // ===================================================
  // EVENTS
  // ===================================================
  //
  // Domain events emitted by the chat capability.
  //
  // ===================================================

  events: [

    {

      value:
        "chat.messagesLoaded",

      label:
        "Messages Loaded",

      description:
        "Emitted after persisted chat messages are loaded into runtime state.",

    },


    {

      value:
        "chat.messageSent",

      label:
        "Message Sent",

      description:
        "Emitted after a chat message has been successfully persisted and added to runtime state.",

    },

  ],


  // ===================================================
  // TARGETS
  // ===================================================
  //
  // Actions can explicitly target a ChatPanel instance.
  //
  // ===================================================

  targets: [

    {

      type:
        "ChatPanel",

      description:
        "A ChatPanel component instance.",

    },

  ],


  // ===================================================
  // CONDITIONS
  // ===================================================
  //
  // Conditions that can be evaluated against chat state.
  //
  // ===================================================

  conditions: [

    {

      value:
        "chat.hasMessages",

      label:
        "Chat Has Messages",

      description:
        "True when the chat contains one or more messages.",

      evaluate:
        "chat.messages.length > 0",

    },


    {

      value:
        "chat.isEmpty",

      label:
        "Chat Is Empty",

      description:
        "True when the chat contains no messages.",

      evaluate:
        "chat.messages.length === 0",

    },

  ],


  // ===================================================
  // RUNTIME STATE
  // ===================================================
  //
  // State written/read by the Chat capability.
  //
  // ===================================================

  state: {

    messages: {

      key:
        "chat.messages",

      type:
        "array",

      default:
        [],

    },

  },


  // ===================================================
  // CONTRACT GUARANTEES
  // ===================================================
  //
  // These describe the behaviour expected from a valid
  // ChatPanel implementation.
  //
  // ===================================================

  guarantees: {

    persistentMessages:
      true,

    projectScoped:
      true,

    runtimeDriven:
      true,

    supportsMultipleInstances:
      true,

    supportsDomainEvents:
      true,

  },

};
