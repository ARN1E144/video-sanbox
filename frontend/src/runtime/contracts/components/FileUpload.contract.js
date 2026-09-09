export default {

  name: "FileUpload",

  version: "1.0",

  category: "input",

  icon: "📎",


  builder: {

    roles: [
      "owner",
      "admin",
      "builder",
    ],

    visible: true,

  },


  runtime: {

    roles: [

      "owner",
      "admin",
      "builder",

      "host",
      "participant",
      "member",
      "viewer",

    ],

  },


  editableProps: {

    label: {

      type: "string",

      ui: "build",

      default: "Choose file",

    },


    accept: {

      type: "string",

      ui: "build",

      default: "",

    },


    multiple: {

      type: "boolean",

      ui: "build",

      default: false,

    },


    bindTo: {

      type: "string",

      ui: "runtime",

      default: "fileUpload",

    },


    action: {

      type: "action",

      ui: "build",

      default: "",

    },


    params: {

      type: "object",

      ui: "build",

      label: "Action Parameters",

      default: {},

    },


    style: {

      type: "style",

      ui: "advanced",

      default: {
        borderRadius: "8px",
      },

    },

  },


  bindings: {

    value: {

      source: "file",

      type: "object",

    },

  },


  actions: {

    inputs: [],

    outputs: [
      "runtime.setState",
    ],

  },


  events: {

    inputs: [],

    outputs: [
      "change",
      "select",
    ],

  },


  targets: {

    accepts: [

      "Container",

      "ControlPanel",

      "Form",

    ],

  },


  validation: {},

};