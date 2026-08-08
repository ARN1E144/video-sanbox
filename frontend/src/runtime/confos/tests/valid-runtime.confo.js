export default {

  id: "valid-runtime-test",

  name: "Valid Runtime Test",

  version: "1.0",

  type: "confo",


  tree: {

    id: "root",

    type: "Container",

    props: {
      layout: "vertical"
    },


    children: [

      {

        id: "agora1",

        type: "AgoraFeed",

        props: {

          channel: "{{call.channel}}"

        }

      },


      {

        id: "micButton1",

        type: "ControlButton",

        props: {

          label: "Toggle Mic",

          action: "call.toggleMic",

          targetId: "agora1"

        }

      }

    ]

  }

};