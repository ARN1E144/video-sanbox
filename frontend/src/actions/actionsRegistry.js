
// src/actions/actionsRegistry.js

import startStream
  from "./video/startStream";

import stopStream
  from "./video/stopStream";

import startRecording
  from "./video/startRecording";

import stopRecording
  from "./video/stopRecording";

import loadVideo
  from "./video/loadVideo";

import loadRemote
  from "./video/loadRemote";

import togglePlay
  from "./video/togglePlay";

import toggleMicLocal
  from "./video/toggleMic";

import toggleVideoLocal
  from "./video/toggleVideo";


import startCall
  from "./call/startCall";

import acceptCall
  from "./call/acceptCall";

import leaveCall
  from "./call/leaveCall";

import endCall
  from "./call/endCall";

import joinCall
  from "./call/joinCall";

import fetchAvailableCalls
  from "./call/fetchAvailableCalls";

import spotlightUser
  from "./call/spotlightUser";

import toggleMic
  from "./call/toggleMic";

import toggleVideo
  from "./call/toggleVideo";

import setAvailability
  from "./call/setAvailability";


import startInterview
  from "./interview/startInterview";

import nextQuestion
  from "./interview/nextQuestion";

import submitAnswer
  from "./interview/submitAnswer";

import evaluateInterview
  from "./interview/evaluateInterview";

import uploadRecording
  from "./video/uploadRecording";


import {
  setColor,
  applyThemeAction,
} from "../runtime/actions/themeActions";


// =========================================================
// ACTION CONSTANTS
// =========================================================

export const ACTIONS = {

  // =======================================================
  // CALL LIFECYCLE
  // =======================================================

  CALL_START:
    "call.startCall",

  CALL_ACCEPT:
    "call.acceptCall",

  CALL_JOIN:
    "call.joinCall",

  CALL_LEAVE:
    "call.leaveCall",

  CALL_END:
    "call.endCall",

  CALL_FETCH:
    "call.fetchAvailableCalls",

  CALL_SPOTLIGHT:
    "call.spotlightUser",

  CALL_AVAILABILITY:
    "call.setAvailability",


  // =======================================================
  // CALL MEDIA
  //
  // Used by AgoraFeed / real-time calls.
  // =======================================================

  CALL_TOGGLE_MIC:
    "call.toggleMic",

  CALL_TOGGLE_VIDEO:
    "call.toggleVideo",


  // =======================================================
  // LOCAL / VIDEO SYSTEM
  //
  // Used by VideoFeed / local media.
  // =======================================================

  VIDEO_START_STREAM:
    "video.startStream",

  VIDEO_STOP_STREAM:
    "video.stopStream",

  VIDEO_LOAD_VIDEO:
    "video.loadVideo",

  VIDEO_LOAD_REMOTE:
    "video.loadRemote",

  VIDEO_TOGGLE_PLAY:
    "video.togglePlay",

  VIDEO_TOGGLE_MIC:
    "video.toggleMic",

  VIDEO_TOGGLE_VIDEO:
    "video.toggleVideo",

  VIDEO_START_RECORDING:
    "video.startRecording",

  VIDEO_STOP_RECORDING:
    "video.stopRecording",
  
  VIDEO_UPLOAD_RECORDING:
  "video.uploadRecording",


  // =======================================================
  // INTERVIEW
  // =======================================================

  INTERVIEW_START:
    "interview.start",

  INTERVIEW_NEXT_QUESTION:
    "interview.nextQuestion",

  INTERVIEW_SUBMIT_ANSWER:
    "interview.submitAnswer",

  INTERVIEW_EVALUATE:
    "interview.evaluate",


  // =======================================================
  // THEME
  // =======================================================

  THEME_SET_COLOR:
    "theme.setColor",

  THEME_APPLY:
    "theme.apply",

};


// =========================================================
// ACTION ALIASES
// =========================================================

export const actionAliases = {

  "agora.toggleMic":
    "call.toggleMic",

  "agora.toggleVideo":
    "call.toggleVideo",

};


// =========================================================
// HELPERS
// =========================================================

const createAction = ({
  value,
  label,
  category,
  run,
  targets = [],
}) => ({
  value,
  label,
  category,
  run,
  targets,
});


const requireCallJoined = (
  ctx,
  label
) => {

  if (
    !ctx?.get?.("call.joined")
  ) {

    ctx?.notify?.(
      `${label} requires active call`
    );

    return false;
  }

  return true;
};


const safeAgora = (ctx) => {

  if (!ctx?.agora) {

    ctx?.notify?.(
      "Agora engine unavailable"
    );

    return null;
  }

  return ctx.agora;
};


// =========================================================
// ACTION REGISTRY
// =========================================================

export const actionRegistry = {

  // =======================================================
  // CALL SYSTEM
  // =======================================================

  call: {

    startCall: createAction({

      value:
        ACTIONS.CALL_START,

      label:
        "Start Call",

      category:
        "call",

      run:
        startCall,

      targets: [
        "CallPanel",
        "AgoraFeed",
      ],

    }),


    acceptCall: createAction({

      value:
        ACTIONS.CALL_ACCEPT,

      label:
        "Accept Call",

      category:
        "call",

      run:
        acceptCall,

      targets: [
        "CallPanel",
        "AgoraFeed",
      ],

    }),


    joinCall: createAction({

      value:
        ACTIONS.CALL_JOIN,

      label:
        "Join Call",

      category:
        "call",

      run:
        joinCall,

      targets: [
        "AgoraFeed",
      ],

    }),


    leaveCall: createAction({

      value:
        ACTIONS.CALL_LEAVE,

      label:
        "Leave Call",

      category:
        "call",

      run:
        leaveCall,

      targets: [
        "AgoraFeed",
      ],

    }),


    endCall: createAction({

      value:
        ACTIONS.CALL_END,

      label:
        "End Call",

      category:
        "call",

      run:
        endCall,

      targets: [
        "CallPanel",
      ],

    }),


    fetchAvailableCalls: createAction({

      value:
        ACTIONS.CALL_FETCH,

      label:
        "Fetch Available Calls",

      category:
        "call",

      run:
        fetchAvailableCalls,

      targets: [
        "CallPanel",
      ],

    }),


    spotlightUser: createAction({

      value:
        ACTIONS.CALL_SPOTLIGHT,

      label:
        "Spotlight User",

      category:
        "call",

      run:
        spotlightUser,

      targets: [
        "AgoraFeed",
      ],

    }),


    toggleMic: createAction({

      value:
        ACTIONS.CALL_TOGGLE_MIC,

      label:
        "Toggle Mic",

      category:
        "call",

      run:
        toggleMic,

      targets: [
        "AgoraFeed",
      ],

    }),


    toggleVideo: createAction({

      value:
        ACTIONS.CALL_TOGGLE_VIDEO,

      label:
        "Toggle Video",

      category:
        "call",

      run:
        toggleVideo,

      targets: [
        "AgoraFeed",
      ],

    }),


    setAvailability: createAction({

      value:
        ACTIONS.CALL_AVAILABILITY,

      label:
        "Set Availability",

      category:
        "call",

      run:
        setAvailability,

      targets: [
        "AvailabilityButton",
      ],

    }),

  },


  // =======================================================
  // VIDEO / LOCAL MEDIA SYSTEM
  // =======================================================

  video: {

    startStream: createAction({

      value:
        ACTIONS.VIDEO_START_STREAM,

      label:
        "Start Stream",

      category:
        "video",

      run:
        startStream,

      targets: [
        "VideoFeed",
      ],

    }),


    stopStream: createAction({

      value:
        ACTIONS.VIDEO_STOP_STREAM,

      label:
        "Stop Stream",

      category:
        "video",

      run:
        stopStream,

      targets: [
        "VideoFeed",
      ],

    }),


    loadVideo: createAction({

      value:
        ACTIONS.VIDEO_LOAD_VIDEO,

      label:
        "Load Video",

      category:
        "video",

      run:
        loadVideo,

      targets: [
        "VideoFeed",
      ],

    }),


    loadRemote: createAction({

      value:
        ACTIONS.VIDEO_LOAD_REMOTE,

      label:
        "Load Remote",

      category:
        "video",

      run:
        loadRemote,

      targets: [
        "VideoFeed",
      ],

    }),


    togglePlay: createAction({

      value:
        ACTIONS.VIDEO_TOGGLE_PLAY,

      label:
        "Toggle Play",

      category:
        "video",

      run:
        togglePlay,

      targets: [
        "VideoFeed",
      ],

    }),


    // -------------------------------------------------------
    // LOCAL MICROPHONE
    // -------------------------------------------------------

    toggleMic: createAction({

      value:
        ACTIONS.VIDEO_TOGGLE_MIC,

      label:
        "Toggle Mic",

      category:
        "video",

      run:
        toggleMicLocal,

      targets: [
        "VideoFeed",
      ],

    }),


    // -------------------------------------------------------
    // LOCAL CAMERA
    // -------------------------------------------------------

    toggleVideo: createAction({

      value:
        ACTIONS.VIDEO_TOGGLE_VIDEO,

      label:
        "Toggle Video",

      category:
        "video",

      run:
        toggleVideoLocal,

      targets: [
        "VideoFeed",
      ],

    }),


    // -------------------------------------------------------
    // LOCAL RECORDING
    // -------------------------------------------------------

    startRecording: createAction({

      value:
        ACTIONS.VIDEO_START_RECORDING,

      label:
        "Start Recording",

      category:
        "video",

      run:
        startRecording,

      targets: [
        "VideoFeed",
      ],

    }),


    stopRecording: createAction({

      value:
        ACTIONS.VIDEO_STOP_RECORDING,

      label:
        "Stop Recording",

      category:
        "video",

      run:
        stopRecording,

      targets: [
        "VideoFeed",
      ],

    }),

    uploadRecording: createAction({

      value:
        ACTIONS.VIDEO_UPLOAD_RECORDING,

      label:
        "Upload Recording",

      category:
        "video",

      run:
        uploadRecording,

      targets: [
        "VideoFeed",
      ],

    }),

  },


  // =======================================================
  // AI INTERVIEW SYSTEM
  // =======================================================

  interview: {

    start: createAction({

      value:
        ACTIONS.INTERVIEW_START,

      label:
        "Start Interview",

      category:
        "interview",

      run:
        startInterview,

      targets: [
        "InterviewPanel",
      ],

    }),


    nextQuestion: createAction({

      value:
        ACTIONS.INTERVIEW_NEXT_QUESTION,

      label:
        "Next Question",

      category:
        "interview",

      run:
        nextQuestion,

      targets: [
        "InterviewPanel",
      ],

    }),


    submitAnswer: createAction({

      value:
        ACTIONS.INTERVIEW_SUBMIT_ANSWER,

      label:
        "Submit Answer",

      category:
        "interview",

      run:
        submitAnswer,

      targets: [
        "InterviewPanel",
      ],

    }),


    evaluate: createAction({

      value:
        ACTIONS.INTERVIEW_EVALUATE,

      label:
        "Evaluate Interview",

      category:
        "interview",

      run:
        evaluateInterview,

      targets: [
        "InterviewPanel",
      ],

    }),

  },


  // =======================================================
  // THEME SYSTEM
  // =======================================================

  theme: {

    setColor: createAction({

      value:
        ACTIONS.THEME_SET_COLOR,

      label:
        "Set Theme Color",

      category:
        "theme",

      run:
        setColor,

    }),


    apply: createAction({

      value:
        ACTIONS.THEME_APPLY,

      label:
        "Apply Theme",

      category:
        "theme",

      run:
        applyThemeAction,

    }),

  },

};


// =========================================================
// LOOKUP HELPERS
// =========================================================

export const getAction = (
  value
) => {

  const resolved =
    actionAliases[value] ||
    value;


  const [
    category,
    name,
  ] =
    resolved.split(".");


  return (
    actionRegistry
      ?.[category]
      ?.[name]
    ||
    null
  );

};


export const getAllActions = () => {

  return Object.values(
    actionRegistry
  )
    .flatMap(
      category =>
        Object.values(
          category
        )
    );

};


// =========================================================
// DEBUG
// =========================================================

console.log(
  "[ACTIONS REGISTRY LOADED]",
  {
    videoActions:
      Object.keys(
        actionRegistry.video || {}
      ),

    interviewActions:
      Object.keys(
        actionRegistry.interview || {}
      ),
  }
);


console.log(
  "[VIDEO RECORDING ACTION DEBUG]",
  {
    startRecording:
      actionRegistry.video?.startRecording,

    startRecordingRun:
      typeof actionRegistry.video?.startRecording?.run,

    stopRecording:
      actionRegistry.video?.stopRecording,

    stopRecordingRun:
      typeof actionRegistry.video?.stopRecording?.run,

    uploadRecording:
      actionRegistry.video?.uploadRecording,

    uploadRecordingRun:
      typeof actionRegistry.video?.uploadRecording?.run,
  }
);

