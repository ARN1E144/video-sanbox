export default {
  name: "ChatPanel",
  version: "1.0",
  category: "communication",

  builder: {
    roles: ["owner", "admin"],
    visible: true
  },

  runtime: {
    roles: ["owner", "host", "participant", "viewer"]
  },

  editableProps: {},

  bindings: {
    inputs: [],
    outputs: []
  },

  actions: {
    inputs: [],
    outputs: []
  },

  events: {
    inputs: [],
    outputs: []
  },

  targets: {
    accepts: [],
    runtime: []
  },

  validation: {
    required: [],
    optional: []
  }
}