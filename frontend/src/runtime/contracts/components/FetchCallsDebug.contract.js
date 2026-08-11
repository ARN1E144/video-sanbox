const FetchCallsDebugContract = {
  name: "FetchCallsDebug",
  version: "1.0",
  category: "debug",
  icon: "📋",

  builder: {
    roles: ["owner", "admin"],
    visible: true,
  },

  runtime: {
    roles: [
      "owner",
      "admin",
      "host",
      "participant",
      "viewer",
    ],
  },

  editableProps: {},

  bindings: {
    inputs: {
      availableCalls: {
        source: "calls.available",
        type: "array",
      },
    },

    outputs: {},
  },

  actions: {
    inputs: [],
    outputs: [],
  },

  events: {
    inputs: [],
    outputs: [],
  },

  targets: {
    accepts: [],
    rejects: [],
  },

  validation: {
    required: [],
    optional: [],
  },
};

export default FetchCallsDebugContract;