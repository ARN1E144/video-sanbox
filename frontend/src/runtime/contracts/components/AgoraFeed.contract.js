export default {
  name: "AgoraFeed",
  version: "1.0",
  category: "media",
  icon: "📡",

  builder: {
    roles: ["owner", "admin"],
    visible: true,
  },

  runtime: {
    roles: [
      "owner",
      "host",
      "participant",
      "viewer",
    ],
  },

  editableProps: {
    channel: {
      type: "string",
      ui: "build",
      label: "Channel",
      default: "",
    },

    uid: {
      type: "number",
      ui: "runtime",
      label: "User ID",
      default: 0,
    },

    autoJoin: {
      type: "boolean",
      ui: "build",
      label: "Auto Join",
      default: false,
    },

    publishLocal: {
      type: "boolean",
      ui: "build",
      label: "Publish Local",
      default: true,
    },

    muted: {
      type: "boolean",
      ui: "runtime",
      label: "Muted",
      default: false,
    },

    cameraOff: {
      type: "boolean",
      ui: "runtime",
      label: "Camera Off",
      default: false,
    },

    mirror: {
      type: "boolean",
      ui: "advanced",
      label: "Mirror",
      default: true,
    },

    objectFit: {
      type: "select",
      ui: "advanced",
      label: "Object Fit",
      default: "cover",

      options: [
        {
          label: "Cover",
          value: "cover",
        },
        {
          label: "Contain",
          value: "contain",
        },
      ],
    },

    borderRadius: {
      type: "number",
      ui: "advanced",
      label: "Border Radius",
      default: 12,
    },

    style: {
      type: "style",
      ui: "advanced",
      label: "Style",
      default: {},
    },
  },

  bindings: {
    inputs: {
      channel: {
        source: "call.channel",
        type: "string",
      },

      remoteUsers: {
        source: "call.remoteUsers",
        type: "array",
      },

      micEnabled: {
        source: "media.micEnabled",
        type: "boolean",
      },

      videoEnabled: {
        source: "media.videoEnabled",
        type: "boolean",
      },
    },

    outputs: {},
  },

  actions: {
    inputs: [
      "call.startCall",
      "call.joinCall",
      "call.leaveCall",
      "call.toggleMic",
      "call.toggleVideo",
      "call.setVolume",
    ],

    outputs: [],
  },

  events: {
    inputs: [],

    outputs: [
      "media.ready",
      "media.started",
      "media.stopped",
      "media.trackAdded",
      "media.trackRemoved",
    ],
  },

  targets: {
    accepts: [
      "ControlButton",
      "ControlPanel",
    ],

    rejects: [
      "AgoraFeed",
      "VideoFeed",
      "Text",
    ],
  },

  validation: {
    required: [],
    optional: [
      "channel",
    ],
  },
};