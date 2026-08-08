export default {

  name: "ControlPanel",

  version: "1.0",

  category: "controls",

  icon: "🎛️",


  builder: {

    roles: [
      "owner",
      "admin"
    ],

    visible: true

  },


  runtime: {

    roles: [
      "owner",
      "host",
      "participant",
      "viewer"
    ]

  },



  editableProps: {


    layout: {

      type: "select",

      ui: "build",

      default: "vertical",

      options: [

        {
          label:"Vertical",
          value:"vertical"
        },

        {
          label:"Horizontal",
          value:"horizontal"
        }

      ]

    },


    position: {

      type:"select",

      ui:"build",

      default:"left",

      options:[

        {
          label:"Left",
          value:"left"
        },

        {
          label:"Right",
          value:"right"
        },

        {
          label:"Bottom",
          value:"bottom"
        }

      ]

    }

  },



  bindings: {


    controls: {

      type:"array",

      items:"ControlButton"

    }


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


    accepts: [

      "ControlButton"

    ],


    rejects: [

      "AgoraFeed",

      "VideoFeed",

      "ChatPanel"

    ]

  },



  validation: {


    required: [

      "controls"

    ]

  }


};