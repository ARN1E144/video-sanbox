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

import fetchPendingCalls
  from "./call/fetchPendingCalls";


// =========================================================
// GROUP CALL ACTIONS
// =========================================================

import createGroupCall
  from "./call/group/createGroupCall";

import fetchPendingInvitations
  from "./call/group/fetchPendingInvitations";

import acceptInvitation
  from "./call/group/acceptInvitation";

import inviteGroupParticipants
  from "./call/group/inviteGroupParticipants";

import declineInvitation
  from "./call/group/declineInvitation";

import joinGroupCall
  from "./call/group/joinGroupCall";

import leaveGroupCall
  from "./call/group/leaveGroupCall";

import endGroupCall
  from "./call/group/endGroupCall";

import refreshGroupCall
  from "./call/group/refreshGroupCall";


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


import startTrainingSession
  from "./training/startTrainingSession";

import createTrainingSession
  from "./training/createTrainingSession";

import fetchPendingSessions
  from "./training/fetchPendingSessions";

import joinTrainingSession
  from "./training/joinTrainingSession";

import leaveTrainingSession
  from "./training/leaveTrainingSession";

import endTrainingSession
  from "./training/endTrainingSession";


// =========================================================
// COMPLIANCE
// =========================================================

import loadCompliance
  from "./compliance/load";

import requestEvidence
  from "./compliance/requestEvidence";

import uploadEvidence 
  from "./compliance/uploadEvidence";

import analyseEvidence 
  from "./compliance/analyseEvidence";


import {
  setColor,
  applyThemeAction,
} from "../runtime/actions/themeActions";


// =========================================================
// ACTION CONSTANTS
// =========================================================

export const ACTIONS = {

  // =======================================================
  // STANDARD CALL LIFECYCLE
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
  // GROUP CALL LIFECYCLE
  // =======================================================

  CALL_CREATE_GROUP:
    "call.createGroupCall",

  CALL_FETCH_PENDING_INVITATIONS:
    "call.fetchPendingInvitations",

  CALL_ACCEPT_INVITATION:
    "call.acceptInvitation",

  CALL_DECLINE_INVITATION:
    "call.declineInvitation",

  CALL_INVITE_PARTICIPANTS:
    "call.inviteGroupParticipants",

  CALL_JOIN_GROUP:
    "call.joinGroupCall",

  CALL_LEAVE_GROUP:
    "call.leaveGroupCall",

  CALL_END_GROUP:
    "call.endGroupCall",

  CALL_REFRESH_GROUP:
    "call.refreshGroupCall",


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
  // REMOTE TRAINING
  // =======================================================

  TRAINING_START_SESSION:
    "training.startSession",

  TRAINING_CREATE_SESSION:
    "training.createSession",

  TRAINING_FETCH_PENDING_SESSIONS:
    "training.fetchPendingSessions",

  TRAINING_JOIN_SESSION:
    "training.joinSession",

  TRAINING_LEAVE_SESSION:
    "training.leaveSession",

  TRAINING_END_SESSION:
    "training.endSession",


  // =======================================================
  // COMPLIANCE
  // =======================================================

  COMPLIANCE_LOAD:
    "compliance.load",
  
  COMPLIANCE_REQUEST_EVIDENCE: 
    "compliance.requestEvidence",

  COMPLIANCE_UPLOAD_EVIDENCE: 
    "compliance.uploadEvidence",

  COMPLIANCE_ANALYSE_EVIDENCE:
    "compliance.analyseEvidence",


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
// CONDITION PATH HELPER
// =========================================================

const conditionPath = ({
  path,
  label,
  type,
  options = [],
}) => ({

  path,

  label,

  type,

  options,

});


// =========================================================
// ACTION HELPER
// =========================================================
//
// nextActions
//   Available / logically valid follow-on actions.
//
// autoNextActions
//   Actions the runtime may execute automatically after
//   this action completes successfully.
//
// =========================================================

const createAction = ({

  value,

  label,

  category,

  run,

  targets = [],

  requires = [],

  produces = [],

  conditionPaths = [],

  nextActions = [],

  autoNextActions = [],

  params = {},

}) => ({

  value,

  label,

  category,

  run,

  targets,

  requires,

  produces,

  conditionPaths,

  nextActions,

  autoNextActions,

  params,

});


// =========================================================
// COMMON CONDITION PATH DEFINITIONS
// =========================================================

// =====================================================
// CALL
// =====================================================

const PATH_CALL_ID =
  conditionPath({
    path:
      "call.id",
    label:
      "Call ID",
    type:
      "string",
  });


const PATH_CALL_CHANNEL =
  conditionPath({
    path:
      "call.channel",
    label:
      "Call channel",
    type:
      "string",
  });


const PATH_CALL_STATE =
  conditionPath({
    path:
      "call.state",
    label:
      "Call state",
    type:
      "string",

    options: [
      "idle",
      "waiting",
      "ringing",
      "accepted",
      "joining",
      "joined",
      "connected",
      "join_failed",
      "ended",
    ],

  });


const PATH_CALL_JOINED =
  conditionPath({
    path:
      "call.joined",
    label:
      "Call joined",
    type:
      "boolean",
  });


const PATH_CALL_PARTICIPANTS =
  conditionPath({
    path:
      "call.participants",
    label:
      "Participant count",
    type:
      "number",
  });


const PATH_CALL_REMOTE_USERS =
  conditionPath({
    path:
      "call.remoteUsers",
    label:
      "Remote users",
    type:
      "object",
  });


// =====================================================
// GROUP CALL
// =====================================================

const PATH_CALL_TYPE =
  conditionPath({
    path:
      "call.type",
    label:
      "Call type",
    type:
      "string",

    options: [
      "queue",
      "targeted",
      "group",
    ],

  });


const PATH_CALL_INVITATION_STATUS =
  conditionPath({
    path:
      "call.invitationStatus",
    label:
      "Invitation status",
    type:
      "string",

    options: [
      "invited",
      "accepted",
      "declined",
      "joined",
      "left",
    ],

  });


const PATH_CALL_PENDING_INVITATIONS =
  conditionPath({
    path:
      "calls.pendingInvitations",
    label:
      "Pending group invitations",
    type:
      "object",
  });


// =====================================================
// MEDIA
// =====================================================

const PATH_MEDIA_MIC_ENABLED =
  conditionPath({
    path:
      "media.micEnabled",
    label:
      "Microphone enabled",
    type:
      "boolean",
  });


const PATH_MEDIA_VIDEO_ENABLED =
  conditionPath({
    path:
      "media.videoEnabled",
    label:
      "Video enabled",
    type:
      "boolean",
  });


const PATH_MEDIA_PLAYING =
  conditionPath({
    path:
      "media.playing",
    label:
      "Media playing",
    type:
      "boolean",
  });


const PATH_MEDIA_SOURCE =
  conditionPath({
    path:
      "media.source",
    label:
      "Media source",
    type:
      "string",
  });


const PATH_MEDIA_RECORDING =
  conditionPath({
    path:
      "media.recording",
    label:
      "Recording active",
    type:
      "boolean",
  });


const PATH_MEDIA_RECORDING_URL =
  conditionPath({
    path:
      "media.recordingUrl",
    label:
      "Recording URL",
    type:
      "string",
  });


// =====================================================
// AVAILABILITY
// =====================================================

const PATH_AVAILABILITY_STATUS =
  conditionPath({
    path:
      "availability.status",
    label:
      "Availability status",
    type:
      "string",

    options: [
      "available",
      "unavailable",
      "busy",
    ],

  });


// =====================================================
// TRAINING
// =====================================================

const PATH_TRAINING_SESSION_ID =
  conditionPath({
    path:
      "training.sessionId",

    label:
      "Training session ID",

    type:
      "string",
  });


const PATH_TRAINING_CHANNEL =
  conditionPath({
    path:
      "training.channel",

    label:
      "Training channel",

    type:
      "string",
  });


const PATH_TRAINING_STATUS =
  conditionPath({
    path:
      "training.status",

    label:
      "Training status",

    type:
      "string",

    options: [
      "idle",
      "inviting",
      "active",
      "ended",
    ],
  });


const PATH_TRAINING_PENDING_SESSIONS =
  conditionPath({
    path:
      "training.pendingSessions",

    label:
      "Pending training sessions",

    type:
      "object",
  });


// =====================================================
// INTERVIEW
// =====================================================

const PATH_INTERVIEW_ID =
  conditionPath({
    path:
      "interview.id",
    label:
      "Interview ID",
    type:
      "string",
  });


const PATH_INTERVIEW_STATUS =
  conditionPath({
    path:
      "interview.status",
    label:
      "Interview status",
    type:
      "string",

    options: [
      "idle",
      "active",
      "completed",
      "evaluated",
    ],

  });


const PATH_INTERVIEW_CURRENT_QUESTION =
  conditionPath({
    path:
      "interview.currentQuestion",
    label:
      "Current question",
    type:
      "string",
  });


const PATH_INTERVIEW_CURRENT_QUESTION_INDEX =
  conditionPath({
    path:
      "interview.currentQuestionIndex",
    label:
      "Question index",
    type:
      "number",
  });


const PATH_INTERVIEW_ANSWER =
  conditionPath({
    path:
      "interview.answer",
    label:
      "Current answer",
    type:
      "string",
  });


// =====================================================
// THEME
// =====================================================

const PATH_THEME_COLOR =
  conditionPath({
    path:
      "theme.color",
    label:
      "Theme colour",
    type:
      "string",
  });


const PATH_THEME_APPLIED =
  conditionPath({
    path:
      "theme.applied",
    label:
      "Theme applied",
    type:
      "boolean",
  });


// =========================================================
// ACTION REGISTRY
// =========================================================

export const actionRegistry = {

  // =======================================================
  // CALL SYSTEM
  // =======================================================

  call: {

    // =====================================================
    // STANDARD CALLS
    // =====================================================

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

      requires: [],

      produces: [
        "call.id",
        "call.channel",
        "call.state",
        "call.joined",
        "call.remoteUsers",
        "call.participants",
      ],

      conditionPaths: [
        PATH_CALL_ID,
        PATH_CALL_STATE,
        PATH_CALL_JOINED,
      ],

      nextActions: [
        "call.toggleMic",
        "call.toggleVideo",
        "call.spotlightUser",
        "call.leaveCall",
        "call.endCall",
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

      requires: [
        "call.id",
      ],

      produces: [
        "call.state",
      ],

      conditionPaths: [
        PATH_CALL_ID,
        PATH_CALL_STATE,
      ],

      nextActions: [
        "call.joinCall",
        "call.toggleMic",
        "call.toggleVideo",
        "call.endCall",
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

      requires: [
        "call.id",
        "call.channel",
      ],

      produces: [
        "call.joined",
        "call.state",
        "call.remoteUsers",
        "call.participants",
      ],

      conditionPaths: [
        PATH_CALL_ID,
        PATH_CALL_CHANNEL,
        PATH_CALL_JOINED,
        PATH_CALL_STATE,
      ],

      nextActions: [
        "call.toggleMic",
        "call.toggleVideo",
        "call.spotlightUser",
        "call.leaveCall",
        "call.endCall",
      ],

    }),


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

      requires: [
        "call.id",
        "call.channel",
      ],

      produces: [
        "call.joined",
        "call.state",
        "call.remoteUsers",
        "call.participants",
      ],

      conditionPaths: [
        PATH_CALL_ID,
        PATH_CALL_CHANNEL,
        PATH_CALL_JOINED,
        PATH_CALL_STATE,
      ],

      nextActions: [
        "call.toggleMic",
        "call.toggleVideo",
        "call.spotlightUser",
        "call.leaveCall",
        "call.endCall",
      ],

    }),


    inviteGroupParticipants: createAction({

      value:
        ACTIONS.CALL_INVITE_PARTICIPANTS,

      label:
        "Invite / Re-invite Group Participants",

      category:
        "call",

      run:
        inviteGroupParticipants,

      targets: [
        "ParticipantSelector",
        "CallPanel",
      ],

      requires: [
        "call.id",
      ],

      produces: [
        "call.participants",
      ],

      conditionPaths: [
        PATH_CALL_ID,
        PATH_CALL_TYPE,
        PATH_CALL_STATE,
        PATH_CALL_PARTICIPANTS,
      ],

      nextActions: [
        "call.inviteGroupParticipants",
        "call.fetchPendingInvitations",
      ],

      params: {

        callId: {

          type:
            "string",

          required:
            false,

        },

        userIds: {

          type:
            "array",

          itemType:
            "string",

          required:
            false,

        },

      },

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

      requires: [
        "call.joined",
      ],

      produces: [
        "call.joined",
        "call.state",
        "call.remoteUsers",
        "call.participants",
      ],

      conditionPaths: [
        PATH_CALL_JOINED,
        PATH_CALL_STATE,
      ],

      nextActions: [
        "call.joinCall",
        "call.endCall",
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
        "AgoraFeed",
      ],

      requires: [
        "call.id",
      ],

      produces: [
        "call.state",
        "call.joined",
      ],

      conditionPaths: [
        PATH_CALL_ID,
        PATH_CALL_STATE,
        PATH_CALL_JOINED,
      ],

      nextActions: [
        "call.fetchAvailableCalls",
        "call.fetchPendingCalls",
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

      produces: [
        "calls.available",
      ],

      conditionPaths: [],

      nextActions: [
        "call.acceptCall",
        "call.fetchAvailableCalls",
      ],

    }),


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

      produces: [
        "calls.pending",
      ],

      conditionPaths: [],

      nextActions: [
        "call.acceptCall",
        "call.fetchPendingCalls",
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

      requires: [
        "call.joined",
        "call.remoteUsers",
      ],

      produces: [],

      conditionPaths: [
        PATH_CALL_JOINED,
        PATH_CALL_PARTICIPANTS,
      ],

      nextActions: [
        "call.spotlightUser",
        "call.toggleMic",
        "call.toggleVideo",
        "call.leaveCall",
        "call.endCall",
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
        "RemoteVideoGrid",
      ],

      requires: [
        "call.joined",
      ],

      produces: [
        "media.micEnabled",
      ],

      conditionPaths: [
        PATH_CALL_JOINED,
        PATH_MEDIA_MIC_ENABLED,
      ],

      nextActions: [
        "call.toggleMic",
        "call.toggleVideo",
        "call.leaveCall",
        "call.endCall",
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
        "RemoteVideoGrid",
      ],

      requires: [
        "call.joined",
      ],

      produces: [
        "media.videoEnabled",
      ],

      conditionPaths: [
        PATH_CALL_JOINED,
        PATH_MEDIA_VIDEO_ENABLED,
      ],

      nextActions: [
        "call.toggleMic",
        "call.toggleVideo",
        "call.leaveCall",
        "call.endCall",
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

      produces: [
        "availability.status",
      ],

      conditionPaths: [
        PATH_AVAILABILITY_STATUS,
      ],

      nextActions: [
        "call.setAvailability",
        "call.fetchAvailableCalls",
      ],

    }),


    // =====================================================
    // GROUP CALL SYSTEM
    // =====================================================

    createGroupCall: createAction({

      value:
        ACTIONS.CALL_CREATE_GROUP,

      label:
        "Create Group Call",

      category:
        "call",

      run:
        createGroupCall,

      targets: [
        "ParticipantSelector",
        "CallPanel",
      ],

      requires: [],

      produces: [
        "call.id",
        "call.channel",
        "call.type",
        "call.state",
        "call.joined",
        "call.participants",
      ],

      conditionPaths: [
        PATH_CALL_ID,
        PATH_CALL_CHANNEL,
        PATH_CALL_TYPE,
        PATH_CALL_STATE,
        PATH_CALL_JOINED,
        PATH_CALL_PARTICIPANTS,
      ],

      nextActions: [
        "call.joinGroupCall",
        "call.endGroupCall",
      ],

      autoNextActions: [
        "call.joinGroupCall",
      ],

      params: {

        participantIds: {

          type:
            "array",

          itemType:
            "string",

          required:
            false,

        },

      },

    }),


    fetchPendingInvitations: createAction({

      value:
        ACTIONS.CALL_FETCH_PENDING_INVITATIONS,

      label:
        "Fetch Pending Group Invitations",

      category:
        "call",

      run:
        fetchPendingInvitations,

      targets: [
        "IncomingGroupCallAlert",
        "CallPanel",
      ],

      requires: [],

      produces: [
        "calls.pendingInvitations",
      ],

      conditionPaths: [
        PATH_CALL_PENDING_INVITATIONS,
      ],

      nextActions: [
        "call.acceptInvitation",
        "call.declineInvitation",
        "call.fetchPendingInvitations",
      ],

      params: {},

    }),


    acceptInvitation: createAction({

      value:
        ACTIONS.CALL_ACCEPT_INVITATION,

      label:
        "Accept Group Call Invitation",

      category:
        "call",

      run:
        acceptInvitation,

      targets: [
        "IncomingGroupCallAlert",
        "CallPanel",
      ],

      requires: [
        "call.id",
      ],

      produces: [
        "call.id",
        "call.channel",
        "call.type",
        "call.state",
        "call.joined",
        "call.participants",
      ],

      conditionPaths: [
        PATH_CALL_ID,
        PATH_CALL_CHANNEL,
        PATH_CALL_TYPE,
        PATH_CALL_STATE,
        PATH_CALL_JOINED,
        PATH_CALL_PARTICIPANTS,
      ],

      nextActions: [
        "call.joinGroupCall",
      ],

      autoNextActions: [],

      params: {

        callId: {

          type:
            "string",

          required:
            false,

        },

      },

    }),


    declineInvitation: createAction({

      value:
        ACTIONS.CALL_DECLINE_INVITATION,

      label:
        "Decline Group Call Invitation",

      category:
        "call",

      run:
        declineInvitation,

      targets: [
        "IncomingGroupCallAlert",
      ],

      requires: [
        "call.id",
      ],

      produces: [
        "calls.pendingInvitations",
      ],

      conditionPaths: [
        PATH_CALL_PENDING_INVITATIONS,
      ],

      nextActions: [],

      params: {

        callId: {

          type:
            "string",

          required:
            false,

        },

      },

    }),


    joinGroupCall: createAction({

      value:
        ACTIONS.CALL_JOIN_GROUP,

      label:
        "Join Group Call",

      category:
        "call",

      run:
        joinGroupCall,

      targets: [
        "AgoraFeed",
        "RemoteVideoGrid",
      ],

      requires: [
        "call.id",
      ],

      produces: [
        "call.joined",
        "call.state",
        "call.channel",
        "call.remoteUsers",
        "call.participants",
      ],

      conditionPaths: [
        PATH_CALL_ID,
        PATH_CALL_CHANNEL,
        PATH_CALL_STATE,
        PATH_CALL_JOINED,
        PATH_CALL_PARTICIPANTS,
        PATH_CALL_REMOTE_USERS,
      ],

      nextActions: [
        "call.toggleMic",
        "call.toggleVideo",
        "call.leaveGroupCall",
        "call.endGroupCall",
      ],

      params: {

        callId: {

          type:
            "string",

          required:
            false,

        },

      },

    }),


    refreshGroupCall: createAction({

      value:
        ACTIONS.CALL_REFRESH_GROUP,

      label:
        "Refresh Group Call",

      category:
        "call",

      run:
        refreshGroupCall,

      targets: [
        "RemoteVideoGrid",
        "AgoraFeed",
        "CallPanel",
      ],

      requires: [
        "call.id",
      ],

      produces: [
        "call.state",
        "call.channel",
        "call.type",
        "call.participants",
        "call.remoteUsers",
      ],

      conditionPaths: [
        PATH_CALL_ID,
        PATH_CALL_CHANNEL,
        PATH_CALL_STATE,
        PATH_CALL_JOINED,
        PATH_CALL_PARTICIPANTS,
        PATH_CALL_REMOTE_USERS,
      ],

      nextActions: [],

      autoNextActions: [],

      params: {

        callId: {

          type:
            "string",

          required:
            false,

        },

      },

    }),


    leaveGroupCall: createAction({

      value:
        ACTIONS.CALL_LEAVE_GROUP,

      label:
        "Leave Group Call",

      category:
        "call",

      run:
        leaveGroupCall,

      targets: [
        "AgoraFeed",
        "RemoteVideoGrid",
      ],

      requires: [
        "call.id",
        "call.joined",
      ],

      produces: [
        "call.joined",
        "call.state",
        "call.remoteUsers",
        "call.participants",
      ],

      conditionPaths: [
        PATH_CALL_ID,
        PATH_CALL_STATE,
        PATH_CALL_JOINED,
        PATH_CALL_PARTICIPANTS,
      ],

      nextActions: [],

      params: {

        callId: {

          type:
            "string",

          required:
            false,

        },

      },

    }),


    endGroupCall: createAction({

      value:
        ACTIONS.CALL_END_GROUP,

      label:
        "End Group Call",

      category:
        "call",

      run:
        endGroupCall,

      targets: [
        "CallPanel",
        "AgoraFeed",
        "RemoteVideoGrid",
      ],

      requires: [
        "call.id",
      ],

      produces: [
        "call.state",
        "call.joined",
        "call.remoteUsers",
        "call.participants",
      ],

      conditionPaths: [
        PATH_CALL_ID,
        PATH_CALL_STATE,
        PATH_CALL_JOINED,
        PATH_CALL_PARTICIPANTS,
      ],

      nextActions: [
        "call.fetchPendingInvitations",
      ],

      params: {

        callId: {

          type:
            "string",

          required:
            false,

        },

      },

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

      produces: [
        "media.playing",
      ],

      conditionPaths: [
        PATH_MEDIA_PLAYING,
      ],

      nextActions: [
        "video.togglePlay",
        "video.stopStream",
        "video.startRecording",
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

      produces: [
        "media.playing",
      ],

      conditionPaths: [
        PATH_MEDIA_PLAYING,
      ],

      nextActions: [
        "video.startStream",
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

      produces: [
        "media.source",
      ],

      conditionPaths: [
        PATH_MEDIA_SOURCE,
        PATH_MEDIA_PLAYING,
      ],

      nextActions: [
        "video.startStream",
        "video.togglePlay",
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

      produces: [
        "media.source",
        "media.playing",
      ],

      conditionPaths: [
        PATH_MEDIA_SOURCE,
        PATH_MEDIA_PLAYING,
      ],

      nextActions: [
        "video.startStream",
        "video.togglePlay",
        "video.startRecording",
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

      produces: [
        "media.playing",
      ],

      conditionPaths: [
        PATH_MEDIA_PLAYING,
      ],

      nextActions: [
        "video.togglePlay",
        "video.startRecording",
        "video.stopStream",
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

      produces: [
        "media.micEnabled",
      ],

      conditionPaths: [
        PATH_MEDIA_MIC_ENABLED,
      ],

      nextActions: [
        "video.toggleMic",
        "video.toggleVideo",
        "video.startRecording",
        "video.stopRecording",
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

      produces: [
        "media.videoEnabled",
      ],

      conditionPaths: [
        PATH_MEDIA_VIDEO_ENABLED,
      ],

      nextActions: [
        "video.toggleVideo",
        "video.toggleMic",
        "video.startRecording",
        "video.stopRecording",
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

      produces: [
        "media.recording",
      ],

      conditionPaths: [
        PATH_MEDIA_RECORDING,
        PATH_MEDIA_PLAYING,
      ],

      nextActions: [
        "video.stopRecording",
        "video.uploadRecording",
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

      requires: [
        "media.recording",
      ],

      produces: [
        "media.recording",
      ],

      conditionPaths: [
        PATH_MEDIA_RECORDING,
      ],

      nextActions: [
        "video.uploadRecording",
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

      requires: [
        "media.recording",
      ],

      produces: [
        "media.recordingUrl",
      ],

      conditionPaths: [
        PATH_MEDIA_RECORDING,
      ],

      nextActions: [],

    }),

  },


  // =======================================================
  // TRAINING SYSTEM
  // =======================================================

  training: {

    createSession: createAction({

      value:
        ACTIONS.TRAINING_CREATE_SESSION,

      label:
        "Create Training Session",

      category:
        "training",

      run:
        createTrainingSession,

      targets: [
        "ParticipantSelector",
      ],

      requires: [],

      produces: [
        "training.sessionId",
        "training.channel",
        "training.status",
        "training.participantIds",
        "training.joined",
      ],

      conditionPaths: [
        PATH_TRAINING_SESSION_ID,
        PATH_TRAINING_CHANNEL,
        PATH_TRAINING_STATUS,
      ],

      nextActions: [
        "training.startSession",
      ],

      params: {

        participantIds: {

          type:
            "array",

          itemType:
            "string",

          required:
            false,

        },

        userIds: {

          type:
            "array",

          itemType:
            "string",

          required:
            false,

        },

        selectedParticipantIds: {

          type:
            "array",

          itemType:
            "string",

          required:
            false,

        },

      },

    }),


    startSession: createAction({

      value:
        ACTIONS.TRAINING_START_SESSION,

      label:
        "Start Training Session",

      category:
        "training",

      run:
        startTrainingSession,

      targets: [
        "AgoraFeed",
        "TrainingInvitation",
      ],

      requires: [
        "training.sessionId",
      ],

      produces: [
        "training.sessionId",
        "training.channel",
        "training.status",
        "training.joined",

        "call.id",
        "call.channel",
        "call.joined",
      ],

      conditionPaths: [
        PATH_TRAINING_SESSION_ID,
        PATH_TRAINING_CHANNEL,
        PATH_TRAINING_STATUS,
        PATH_CALL_ID,
        PATH_CALL_CHANNEL,
        PATH_CALL_JOINED,
      ],

      nextActions: [
        "call.toggleMic",
        "call.toggleVideo",
        "training.endSession",
      ],

      params: {

        sessionId: {

          type:
            "string",

          required:
            false,

        },

      },

    }),


    fetchPendingSessions: createAction({

      value:
        ACTIONS.TRAINING_FETCH_PENDING_SESSIONS,

      label:
        "Fetch Pending Training Sessions",

      category:
        "training",

      run:
        fetchPendingSessions,

      targets: [
        "TrainingInvitation",
      ],

      produces: [
        "training.pendingSessions",
      ],

      conditionPaths: [
        PATH_TRAINING_PENDING_SESSIONS,
      ],

      nextActions: [
        "training.joinSession",
        "training.fetchPendingSessions",
      ],

      params: {},

    }),


    joinSession: createAction({

      value:
        ACTIONS.TRAINING_JOIN_SESSION,

      label:
        "Join Training Session",

      category:
        "training",

      run:
        joinTrainingSession,

      targets: [
        "TrainingInvitation",
        "AgoraFeed",
      ],

      requires: [
        "training.sessionId",
      ],

      produces: [
        "training.sessionId",
        "training.channel",
        "training.status",
        "training.joined",

        "call.joined",
        "call.remoteUsers",
        "call.participants",
      ],

      conditionPaths: [
        PATH_TRAINING_SESSION_ID,
        PATH_TRAINING_CHANNEL,
        PATH_TRAINING_STATUS,
        PATH_CALL_JOINED,
        PATH_CALL_PARTICIPANTS,
      ],

      nextActions: [
        "call.toggleMic",
        "call.toggleVideo",
        "training.leaveSession",
        "training.endSession",
      ],

      params: {

        sessionId: {

          type:
            "string",

          required:
            false,

        },

      },

    }),


    leaveSession: createAction({

      value:
        ACTIONS.TRAINING_LEAVE_SESSION,

      label:
        "Leave Training Session",

      category:
        "training",

      run:
        leaveTrainingSession,

      targets: [
        "AgoraFeed",
        "TrainingInvitation",
      ],

      requires: [
        "training.sessionId",
      ],

      produces: [
        "training.sessionId",
        "training.channel",
        "training.status",
        "training.joined",

        "call.joined",
      ],

      conditionPaths: [
        PATH_TRAINING_SESSION_ID,
        PATH_TRAINING_CHANNEL,
        PATH_TRAINING_STATUS,
        PATH_CALL_JOINED,
      ],

      nextActions: [
        "training.fetchPendingSessions",
      ],

      params: {

        sessionId: {

          type:
            "string",

          required:
            false,

        },

      },

    }),


    endSession: createAction({

      value:
        ACTIONS.TRAINING_END_SESSION,

      label:
        "End Training Session",

      category:
        "training",

      run:
        endTrainingSession,

      targets: [
        "AgoraFeed",
        "TrainingInvitation",
      ],

      requires: [
        "training.sessionId",
      ],

      produces: [
        "training.sessionId",
        "training.channel",
        "training.status",
        "training.joined",

        "call.joined",
      ],

      conditionPaths: [
        PATH_TRAINING_SESSION_ID,
        PATH_TRAINING_CHANNEL,
        PATH_TRAINING_STATUS,
        PATH_CALL_JOINED,
      ],

      nextActions: [
        "training.fetchPendingSessions",
      ],

      params: {

        sessionId: {

          type:
            "string",

          required:
            false,

        },

      },

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

      produces: [
        "interview.id",
        "interview.status",
        "interview.currentQuestion",
        "interview.currentQuestionIndex",
      ],

      conditionPaths: [
        PATH_INTERVIEW_ID,
        PATH_INTERVIEW_STATUS,
        PATH_INTERVIEW_CURRENT_QUESTION,
      ],

      nextActions: [
        "interview.submitAnswer",
        "interview.nextQuestion",
        "interview.complete",
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

      requires: [
        "interview.status",
      ],

      produces: [
        "interview.currentQuestion",
        "interview.currentQuestionIndex",
      ],

      conditionPaths: [
        PATH_INTERVIEW_STATUS,
        PATH_INTERVIEW_CURRENT_QUESTION_INDEX,
      ],

      nextActions: [
        "interview.submitAnswer",
        "interview.nextQuestion",
        "interview.complete",
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

      requires: [
        "interview.currentQuestion",
      ],

      produces: [
        "interview.answer",
      ],

      conditionPaths: [
        PATH_INTERVIEW_ANSWER,
        PATH_INTERVIEW_CURRENT_QUESTION,
      ],

      nextActions: [
        "interview.nextQuestion",
        "interview.complete",
        "interview.evaluate",
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

      requires: [
        "interview.id",
      ],

      produces: [
        "interview.evaluation",
      ],

      conditionPaths: [
        PATH_INTERVIEW_STATUS,
      ],

      nextActions: [
        "interview.complete",
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

      requires: [
        "interview.id",
      ],

      produces: [
        "interview.status",
        "interview.completedAt",
        "interview.aiEvaluation",
      ],

      conditionPaths: [
        PATH_INTERVIEW_STATUS,
      ],

      nextActions: [],

    }),

  },


  // =======================================================
  // COMPLIANCE SYSTEM
  // =======================================================

  compliance: {

    load: createAction({

      value:
        ACTIONS.COMPLIANCE_LOAD,

      label:
        "Load Compliance Data",

      category:
        "compliance",

      run:
        loadCompliance,

      targets: [
        "ComplianceDashboard",
        "ComplianceFramework",
        "ComplianceControl",
        "ComplianceEvidence",
        "ComplianceRisk",
        "ComplianceAction",
        "CompliancePolicy",
        "ComplianceAudit",
      ],

      requires: [],

      produces: [

        "compliance.organisation",

        "compliance.framework",

        "compliance.controls",

        "compliance.evidence",

        "compliance.risks",

        "compliance.actions",

        "compliance.policies",

        "compliance.suppliers",

        "compliance.training",

        "compliance.audits",

        "compliance.notifications",

        "compliance.activity",

        "compliance.metrics",

      ],

      conditionPaths: [],

      /*
       * Loading data does not recursively trigger itself.
       *
       * A UI refresh button, polling mechanism, or another
       * runtime trigger can explicitly invoke compliance.load.
       */
      nextActions: [],

      autoNextActions: [],

      params: {},

    }),


    // =====================================================
    // EVIDENCE
    // =====================================================

    requestEvidence: createAction({

      value:
        ACTIONS.COMPLIANCE_REQUEST_EVIDENCE,

      label:
        "Request Evidence",

      category:
        "compliance",

      run:
        requestEvidence,

      targets: [
        "ComplianceControl",
        "ComplianceEvidence",
        "ComplianceDashboard",
      ],

      requires: [
        "compliance.controls",
      ],

      produces: [
        "compliance.evidence",
        "compliance.controls",
      ],

      conditionPaths: [],

      /*
       * Do not automatically chain another action here.
       *
       * The evidenceRequested event can later be consumed
       * by RuntimeTriggers to perform things such as:
       *
       *   notify owner
       *   create task
       *   send reminder
       *   escalate overdue evidence
       */
      nextActions: [],

      autoNextActions: [],

      params: {

        controlId: {

          type:
            "string",

          required:
            true,

        },

        name: {

          type:
            "string",

          required:
            false,

        },

        description: {

          type:
            "string",

          required:
            false,

        },

        type: {

          type:
            "string",

          required:
            false,

        },

        dueDate: {

          type:
            "string",

          required:
            false,

        },

        requestedFor: {

          type:
            "string",

          required:
            false,

        },

      },

    }),

    uploadEvidence: createAction({
      value: ACTIONS.COMPLIANCE_UPLOAD_EVIDENCE,
      label: "Upload Evidence",
      category: "compliance",
      run: uploadEvidence,

      targets: [
        "ComplianceEvidence",
        "ComplianceControl",
        "ComplianceDashboard",
      ],

      requires: [
        "compliance.evidence",
      ],

      produces: [
        "compliance.evidence",
      ],

      conditionPaths: [],
      nextActions: [],
      autoNextActions: [],

      params: {
        evidenceId: {
          type: "string",
          required: true,
        },
        fileName: {
          type: "string",
          required: true,
        },
        fileUrl: {
          type: "string",
          required: false,
        },
      },
    }),

    analyseEvidence: createAction({
      value: ACTIONS.COMPLIANCE_ANALYSE_EVIDENCE,

      label: "Analyse Evidence",

      category: "compliance",

      run: analyseEvidence,

      targets: [
        "ComplianceEvidence",
        "ComplianceControl",
        "ComplianceDashboard",
      ],

      requires: [
        "compliance.evidence",
      ],

      produces: [
        "compliance.evidence",
      ],

      conditionPaths: [],

      nextActions: [],

      autoNextActions: [],

      params: {
        evidenceId: {
          type: "string",
          required: true,
        },
      },
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

      targets: [],

      produces: [
        "theme.color",
      ],

      conditionPaths: [
        PATH_THEME_COLOR,
      ],

      nextActions: [
        "theme.apply",
      ],

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

      targets: [],

      requires: [
        "theme.color",
      ],

      produces: [
        "theme.applied",
      ],

      conditionPaths: [
        PATH_THEME_COLOR,
        PATH_THEME_APPLIED,
      ],

      nextActions: [],

    }),

  },

};


// =========================================================
// LOOKUP HELPERS
// =========================================================

export const getAction = (
  value
) => {

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {

    return null;

  }


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

    trainingActions:
      Object.keys(
        actionRegistry.training || {}
      ),

    interviewActions:
      Object.keys(
        actionRegistry.interview || {}
      ),

    complianceActions:
      Object.keys(
        actionRegistry.compliance || {}
      ),

    groupCallActions: [
      "createGroupCall",
      "fetchPendingInvitations",
      "acceptInvitation",
      "declineInvitation",
      "joinGroupCall",
      "leaveGroupCall",
      "endGroupCall",
      "refreshGroupCall",
      "inviteGroupParticipants",
    ],

  }
);


console.log(
  "[GROUP CALL ACTION DEBUG]",
  {

    createGroupCall:
      actionRegistry.call?.createGroupCall,

    createGroupCallAutoNext:
      actionRegistry.call
        ?.createGroupCall
        ?.autoNextActions,

    acceptInvitation:
      actionRegistry.call
        ?.acceptInvitation,

    acceptInvitationAutoNext:
      actionRegistry.call
        ?.acceptInvitation
        ?.autoNextActions,

    joinGroupCall:
      actionRegistry.call
        ?.joinGroupCall,

    refreshGroupCall:
      actionRegistry.call
        ?.refreshGroupCall,

    leaveGroupCall:
      actionRegistry.call
        ?.leaveGroupCall,

    endGroupCall:
      actionRegistry.call
        ?.endGroupCall,

    inviteGroupParticipants:
      actionRegistry.call
        ?.inviteGroupParticipants,

  }
);


console.log(
  "[VIDEO RECORDING ACTION DEBUG]",
  {

    startRecording:
      actionRegistry
        .video
        ?.startRecording,

    startRecordingRun:
      typeof actionRegistry
        .video
        ?.startRecording
        ?.run,

    stopRecording:
      actionRegistry
        .video
        ?.stopRecording,

    stopRecordingRun:
      typeof actionRegistry
        .video
        ?.stopRecording
        ?.run,

    uploadRecording:
      actionRegistry
        .video
        ?.uploadRecording,

    uploadRecordingRun:
      typeof actionRegistry
        .video
        ?.uploadRecording
        ?.run,

  }
);


console.log(
  "[COMPLIANCE ACTION DEBUG]",
  {

    load:
      actionRegistry
        .compliance
        ?.load,

    loadRun:
      typeof actionRegistry
        .compliance
        ?.load
        ?.run,

    requestEvidence:
      actionRegistry
        .compliance
        ?.requestEvidence,

    requestEvidenceRun:
      typeof actionRegistry
        .compliance
        ?.requestEvidence
        ?.run,

    produces:
      actionRegistry
        .compliance
        ?.requestEvidence
        ?.produces,

    params:
      actionRegistry
        .compliance
        ?.requestEvidence
        ?.params,

  }
);