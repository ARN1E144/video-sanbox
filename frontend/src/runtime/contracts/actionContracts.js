// src/runtime/contracts/actionContracts.js


// =====================================================
// ACTION CONTRACTS
// =====================================================
//
// Defines the valid:
//
// source component
//      ↓
// runtime action
//      ↓
// target component
//
// This file MUST use:
//
// sourceTypes
// targetTypes
//
// because ContractValidator expects those names.
//
// =====================================================

const actionContracts = {

  // ===================================================
  // CALL
  // ===================================================

  "call.startCall": {

    sourceTypes: [
      "ControlButton",
    ],

    targetTypes: [
      "AgoraFeed",
      "CallPanel",
    ],

    category:
      "call",

    description:
      "Creates and starts a call session.",

  },


  "call.acceptCall": {

    sourceTypes: [
      "ControlButton",
    ],

    targetTypes: [
      "AgoraFeed",
      "CallPanel",
    ],

    category:
      "call",

    description:
      "Accepts an incoming call.",

  },


  "call.joinCall": {

    sourceTypes: [
      "ControlButton",
      "AgoraFeed",
    ],

    targetTypes: [
      "AgoraFeed",
    ],

    category:
      "call",

    description:
      "Joins an existing RTC channel.",

  },


  "call.leaveCall": {

    sourceTypes: [
      "ControlButton",
      "AgoraFeed",
    ],

    targetTypes: [
      "AgoraFeed",
    ],

    category:
      "call",

    description:
      "Leaves the active RTC channel.",

  },


  "call.endCall": {

    sourceTypes: [
      "ControlButton",
      "CallPanel",
    ],

    targetTypes: [
      "CallPanel",
      "AgoraFeed",
    ],

    category:
      "call",

    description:
      "Ends the active call session.",

  },


  "call.fetchAvailableCalls": {

    sourceTypes: [
      "ControlButton",
      "CallPanel",
    ],

    targetTypes: [
      "CallPanel",
    ],

    category:
      "call",

    description:
      "Loads available call sessions.",

  },


  "call.spotlightUser": {

    sourceTypes: [
      "ControlButton",
      "AgoraFeed",
    ],

    targetTypes: [
      "AgoraFeed",
    ],

    category:
      "call",

    description:
      "Spotlights a participant.",

  },


  "call.toggleMic": {

    sourceTypes: [
      "ControlButton",
      "AgoraFeed",
    ],

    targetTypes: [
      "AgoraFeed",
    ],

    category:
      "media",

    description:
      "Toggles the microphone.",

  },


  "call.toggleVideo": {

    sourceTypes: [
      "ControlButton",
      "AgoraFeed",
    ],

    targetTypes: [
      "AgoraFeed",
    ],

    category:
      "media",

    description:
      "Toggles the camera.",

  },


  "call.setAvailability": {

    sourceTypes: [
      "AvailabilityButton",
      "ControlButton",
    ],

    targetTypes: [
      "AvailabilityButton",
    ],

    category:
      "call",

    description:
      "Changes call availability.",

  },


  // ===================================================
  // LOCAL VIDEO
  // ===================================================

  "video.startStream": {

    sourceTypes: [
      "ControlButton",
      "VideoFeed",
    ],

    targetTypes: [
      "VideoFeed",
    ],

    category:
      "video",

    description:
      "Starts local media playback/streaming.",

  },


  "video.stopStream": {

    sourceTypes: [
      "ControlButton",
      "VideoFeed",
    ],

    targetTypes: [
      "VideoFeed",
    ],

    category:
      "video",

    description:
      "Stops local media playback/streaming.",

  },


  "video.loadVideo": {

    sourceTypes: [
      "ControlButton",
      "VideoFeed",
    ],

    targetTypes: [
      "VideoFeed",
    ],

    category:
      "video",

    description:
      "Loads a video source.",

  },


  "video.loadRemote": {

    sourceTypes: [
      "ControlButton",
      "VideoFeed",
    ],

    targetTypes: [
      "VideoFeed",
    ],

    category:
      "video",

    description:
      "Loads a remote media source.",

  },


  "video.togglePlay": {

    sourceTypes: [
      "ControlButton",
      "VideoFeed",
    ],

    targetTypes: [
      "VideoFeed",
    ],

    category:
      "video",

    description:
      "Toggles local video playback.",

  },


  "video.toggleMic": {

    sourceTypes: [
      "ControlButton",
      "VideoFeed",
    ],

    targetTypes: [
      "VideoFeed",
      "InterviewPanel",
    ],

    category:
      "media",

    description:
      "Toggles the local microphone.",

  },


  "video.toggleVideo": {

    sourceTypes: [
      "ControlButton",
      "VideoFeed",
    ],

    targetTypes: [
      "VideoFeed",
      "InterviewPanel",
    ],

    category:
      "media",

    description:
      "Toggles the local camera.",

  },


  "video.startRecording": {

    sourceTypes: [
      "ControlButton",
      "VideoFeed",
      "InterviewPanel",
    ],

    targetTypes: [
      "VideoFeed",
      "InterviewPanel",
    ],

    category:
      "recording",

    description:
      "Starts recording from a VideoFeed.",

  },


  "video.stopRecording": {

    sourceTypes: [
      "ControlButton",
      "VideoFeed",
      "InterviewPanel",
    ],

    targetTypes: [
      "VideoFeed",
      "InterviewPanel",
    ],

    category:
      "recording",

    description:
      "Stops recording from a VideoFeed.",

  },


  "video.uploadRecording": {

    sourceTypes: [
      "ControlButton",
      "VideoFeed",
      "InterviewPanel",
    ],

    targetTypes: [
      "VideoFeed",
      "InterviewPanel",
    ],

    category:
      "recording",

    description:
      "Uploads a completed recording.",

  },


  // ===================================================
  // INTERVIEW
  // ===================================================

  "interview.start": {

    sourceTypes: [
      "ControlButton",
      "InterviewPanel",
    ],

    targetTypes: [
      "InterviewPanel",
    ],

    category:
      "interview",

    description:
      "Starts a new interview.",

  },


  "interview.submitAnswer": {

    sourceTypes: [
      "ControlButton",
      "InterviewPanel",
    ],

    targetTypes: [
      "InterviewPanel",
    ],

    category:
      "interview",

    description:
      "Persists the candidate answer.",

  },


  "interview.nextQuestion": {

    sourceTypes: [
      "ControlButton",
      "InterviewPanel",
    ],

    targetTypes: [
      "InterviewPanel",
    ],

    category:
      "interview",

    description:
      "Advances to the next interview question.",

  },


  "interview.complete": {

    sourceTypes: [
      "ControlButton",
      "InterviewPanel",
    ],

    targetTypes: [
      "InterviewPanel",
    ],

    category:
      "interview",

    description:
      "Completes the current interview.",

  },


  "interview.evaluate": {

    sourceTypes: [
      "ControlButton",
      "InterviewPanel",
    ],

    targetTypes: [
      "InterviewPanel",
    ],

    category:
      "interview",

    description:
      "Evaluates the completed interview with AI.",

  },


  // ===================================================
  // THEME
  // ===================================================

  "theme.setColor": {

    sourceTypes: [
      "ControlButton",
      "ColorPicker",
    ],

    targetTypes: [
      "App",
      "Container",
      "Text",
      "TextLabel",
      "Button",
    ],

    category:
      "theme",

    description:
      "Changes the active theme colour.",

  },


  "theme.apply": {

    sourceTypes: [
      "ControlButton",
    ],

    targetTypes: [
      "App",
      "Container",
    ],

    category:
      "theme",

    description:
      "Applies the current theme.",

  },

};


export default actionContracts;