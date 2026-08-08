export default {

  name: "Text",

  version: "1.0",

  category: "text",

  icon: "🔤",


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

      default:"Text"

    },


    style:{

      type:"style",

      ui:"advanced",

      default:{

        color:"#FFFFFF",

        fontSize:"16px"

      }

    }

  },



  bindings:{},



  actions:{

    inputs:[],

    outputs:[]

  },



  events:{

    inputs:[],

    outputs:[]

  },



  targets:{


    accepts:[]

  },



  validation:{}

};