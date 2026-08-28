// src/runtime/auth/roles/rolePermissions.js

console.log("🔥 rolePermissions.js EXECUTED");

export const ROLE_PERMISSIONS = {

 owner: {

  canBuild: true,

  allowedElements: [
    "Container",
    "AgoraFeed",
    "VideoFeed",
    "ControlPanel",
    "ControlButton",
    "ChatPanel",
    "Text",
    "FetchCallsDebug",
    "AvailabilityButton"
  ],

  allowedActions: [
    // CALL
    "call.startCall",
    "call.acceptCall",
    "call.joinCall",
    "call.leaveCall",
    "call.endCall",
    "call.toggleMic",
    "call.toggleVideo",
    "call.spotlightUser",
    "call.fetchAvailableCalls",
    "call.setAvailability",
    "call.fetchPendingCalls",
    "call.joinInvitedCall",

    // AI INTERVIEW
    "interview.start",
    "interview.nextQuestion",
    "interview.submitAnswer",
    "interview.evaluate",
    "interview.complete",

    "video.toggleMic",
    "video.toggleVideo",
    "video.startRecording",
    "video.stopRecording",
    "video.uploadRecording"
  ]

},


  admin: {

    canBuild: true,

    allowedElements: [
      "Container",
      "AgoraFeed",
      "VideoFeed",
      "ControlPanel",
      "ControlButton",
      "ChatPanel",
      "Text",
      "AvailabilityButton"
    ],

     allowedActions: [
        "call.startCall",
        "call.acceptCall",
        "call.joinCall",
        "call.leaveCall",
        "call.endCall",
        "call.toggleMic",
        "call.toggleVideo",
        "call.spotlightUser",
        "call.fetchAvailableCalls",
        "call.setAvailability"
        ]

  },


  host: {

    canBuild: false,

    allowedElements: [
      "AgoraFeed",
      "VideoFeed",
      "ControlPanel",
      "ControlButton",
      "ChatPanel"
    ],

    allowedActions: [
      "call.acceptCall",
      "call.joinCall",
      "call.leaveCall",
      "call.endCall",
      "call.toggleMic",
      "call.toggleVideo",
      "call.spotlightUser"
    ]

  },


  participant: {

    canBuild: false,

    allowedElements: [
      "AgoraFeed",
      "VideoFeed",
      "ControlPanel",
      "ControlButton",
      "ChatPanel"
    ],

    allowedActions: [
      "call.joinCall",
      "call.leaveCall",
      "call.toggleMic",
      "call.toggleVideo"
    ]

  },


  viewer: {

    canBuild: false,

    allowedElements: [
      "AgoraFeed",
      "VideoFeed",
      "Text"
    ],

    allowedActions: [
      "call.joinCall",
      "call.leaveCall"
    ]

  }

};