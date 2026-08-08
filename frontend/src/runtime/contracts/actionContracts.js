export default {


"call.startCall": {

    sources:[
        "ControlButton"
    ],

    targets:[
        "AgoraFeed"
    ],

    category:"call",

    description:
      "Creates and starts a call session"

},



"call.joinCall": {

    sources:[
        "ControlButton",
        "AgoraFeed"
    ],

    targets:[
        "AgoraFeed"
    ],

    category:"call",

    description:
      "Joins an existing RTC channel"

},



"call.leaveCall": {

    sources:[
        "ControlButton",
        "AgoraFeed"
    ],

    targets:[
        "AgoraFeed"
    ],

    category:"call"

},



"call.toggleMic": {

    sources:[
        "ControlButton"
    ],

    targets:[
        "AgoraFeed"
    ],

    category:"media",

    description:
      "Toggle microphone state"

},



"call.toggleVideo": {

    sources:[
        "ControlButton"
    ],

    targets:[
        "AgoraFeed"
    ],

    category:"media"

},



"media.play": {

    sources:[
        "ControlButton"
    ],

    targets:[
        "VideoFeed"
    ],

    category:"media"

},



"media.pause": {

    sources:[
        "ControlButton"
    ],

    targets:[
        "VideoFeed"
    ],

    category:"media"

},



"media.stop": {

    sources:[
        "ControlButton"
    ],

    targets:[
        "VideoFeed"
    ],

    category:"media"

}



};