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

import joinInvitedCall
  from "./call/joinInvitedCall";

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

import completeInterview
  from "./interview/completeInterview";

import fetchPendingCalls
  from "./call/fetchPendingCalls";


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

  CALL_JOIN_INVITED:
    "call.joinInvitedCall",

  CALL_LEAVE:
    "call.leaveCall",

  CALL_END:
    "call.endCall",

  CALL_FETCH:
    "call.fetchAvailableCalls",

  CALL_FETCH_PENDING:
    "call.fetchPendingCalls",

  CALL_SPOTLIGHT:
    "call.spotlightUser",

  CALL_AVAILABILITY:
    "call.setAvailability",


  // =======================================================
  // CALL MEDIA
  // =======================================================

  CALL_TOGGLE_MIC:
    "call.toggleMic",

  CALL_TOGGLE_VIDEO:
    "call.toggleVideo",


  // =======================================================
  // LOCAL / VIDEO SYSTEM
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

  INTERVIEW_COMPLETE:
    "interview.complete",


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


// =========================================================
// ACTION REGISTRY
// =========================================================

export const actionRegistry = {

  // =======================================================
  // CALL SYSTEM
  // =======================================================

  call: {

    // ---------------------------------------------------
    // START CALL
    // ---------------------------------------------------

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


    // ---------------------------------------------------
    // ACCEPT QUEUE CALL
    // ---------------------------------------------------

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


    // ---------------------------------------------------
    // JOIN EXISTING CALL
    // ---------------------------------------------------

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


    // ---------------------------------------------------
    // JOIN TARGETED INVITATION
    // ---------------------------------------------------

    joinInvitedCall: createAction({

      value:
        ACTIONS.CALL_JOIN_INVITED,

      label:
        "Join Invited Call",

      category:
        "call",

      run:
        joinInvitedCall,

      targets: [
        "AgoraFeed",
        "CallPanel",
      ],

    }),


    // ---------------------------------------------------
    // LEAVE CALL
    // ---------------------------------------------------

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


    // ---------------------------------------------------
    // END CALL
    // ---------------------------------------------------

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
        "AgoraFeed",
      ],

    }),


    // ---------------------------------------------------
    // FETCH QUEUE CALLS
    // ---------------------------------------------------

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

    // ---------------------------------------------------
    // FETCH PENDING CALLS
    // ---------------------------------------------------



    fetchPendingCalls: createAction({

      value:
        ACTIONS.CALL_FETCH_PENDING,

      label:
        "Fetch Pending Calls",

      category:
        "call",

      run:
        fetchPendingCalls,

      targets: [
        "CallPanel",
      ],

    }),


    // ---------------------------------------------------
    // SPOTLIGHT
    // ---------------------------------------------------

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


    // ---------------------------------------------------
    // TOGGLE MIC
    // ---------------------------------------------------

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


    // ---------------------------------------------------
    // TOGGLE VIDEO
    // ---------------------------------------------------

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


    // ---------------------------------------------------
    // AVAILABILITY
    // ---------------------------------------------------

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


    complete: createAction({

      value:
        ACTIONS.INTERVIEW_COMPLETE,

      label:
        "Complete Interview",

      category:
        "interview",

      run:
        completeInterview,

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
    callActions:
      Object.keys(
        actionRegistry.call || {}
      ),

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
  "[CALL TARGETED ACTION DEBUG]",
  {

    joinInvitedCall:
      actionRegistry.call?.joinInvitedCall,

    joinInvitedCallRun:
      typeof actionRegistry.call?.joinInvitedCall?.run,

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