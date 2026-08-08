export default {

  name: "MicButton",

  version: "1.0",

  category: "controls",

  icon: "🎙️",



  builder: {

    roles: [
      "owner",
      "admin"
    ],

    visible:true

  },


  runtime: {

    roles:[
      "owner",
      "host",
      "participant",
      "viewer"
    ]

  },



  editableProps:{


    label:{

      type:"string",

      ui:"build",

      default:"Mic On"

    },


    style:{

      type:"style",

      ui:"advanced",

      default:{

        backgroundColor:"#7C3AED",

        color:"#FFFFFF",

        borderRadius:"8px",

        padding:"16px"

      }

    }


  },



  bindings:{


    micEnabled:{

      source:"media.micEnabled",

      type:"boolean"

    }

  },



  actions:{


    inputs:[],


    outputs:[

      "call.toggleMic"

    ]

  },



  events:{


    inputs:[],


    outputs:[

      "click"

    ]

  },



  targets:{


    accepts:[

      "AgoraFeed"

    ]

  },



  validation:{


    required:[

      "action"

    ]

  }


};