import RuntimeGraphValidator from "./RuntimeGraphValidator.js";



console.log(
"\nTEST 1 Valid ControlButton -> AgoraFeed\n"
);



const validGraph = {


components:[

    {
      id:"button1",
      type:"ControlButton",

      connections:[

        {
          action:"call.toggleMic",
          targetId:"agora1"
        }

      ]

    },


    {
      id:"agora1",
      type:"AgoraFeed"
    }


]


};



console.log(
RuntimeGraphValidator.validate(validGraph)
);






console.log(
"\nTEST 2 Invalid ControlButton -> VideoFeed\n"
);



const invalidGraph = {


components:[

    {
      id:"button1",
      type:"ControlButton",

      connections:[

        {
          action:"call.toggleMic",
          targetId:"video1"
        }

      ]

    },


    {
      id:"video1",
      type:"VideoFeed"
    }


]


};



console.log(
RuntimeGraphValidator.validate(invalidGraph)
);






console.log(
"\nTEST 3 Missing target\n"
);



const missingTarget = {


components:[

    {
      id:"button1",
      type:"ControlButton",

      connections:[

        {
          action:"call.toggleMic",
          targetId:"missing"
        }

      ]

    }


]


};



console.log(
RuntimeGraphValidator.validate(missingTarget)
);