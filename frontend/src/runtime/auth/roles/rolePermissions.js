// src/runtime/auth/roles/rolePermissions.js

console.log(
  "🔥 rolePermissions.js EXECUTED"
);


// =====================================================
// ROLE PERMISSIONS
// =====================================================

export const ROLE_PERMISSIONS = {

  // =====================================================
  // OWNER
  // =====================================================

  owner: {

    canBuild:
      true,

    allowedElements: [

      // -----------------------------------------------
      // CORE
      // -----------------------------------------------

      "Container",

      "Text",

      "ControlPanel",

      "ControlButton",


      // -----------------------------------------------
      // VIDEO
      // -----------------------------------------------

      "AgoraFeed",

      "RemoteVideoGrid",

      "VideoFeed",

      "MediaFeed",


      // -----------------------------------------------
      // CALL
      // -----------------------------------------------

      "ChatPanel",

      "AvailabilityButton",

      "FetchCallsDebug",


      // -----------------------------------------------
      // GROUP CALL
      // -----------------------------------------------

      "ParticipantSelector",

      "IncomingGroupCallAlert",

      "GroupCallControls",

      // -----------------------------------------------
      // REMOTE TRAINING
      // -----------------------------------------------
      
      "TrainingInvitation",
    ],


    allowedActions: [

      // =================================================
      // STANDARD CALL
      // =================================================

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


      // =================================================
      // GROUP CALL
      // =================================================

      "call.createGroupCall",

      "call.fetchPendingInvitations",

      "call.acceptInvitation",

      "call.declineInvitation",

      "call.joinGroupCall",

      "call.refreshGroupCall",

      "call.inviteGroupParticipants",

      "call.leaveGroupCall",

      "call.endGroupCall",


      // =================================================
      // AI INTERVIEW
      // =================================================

      "interview.start",

      "interview.nextQuestion",

      "interview.submitAnswer",

      "interview.evaluate",

      "interview.complete",


      // =================================================
      // VIDEO
      // =================================================

      "video.toggleMic",

      "video.toggleVideo",

      "video.startRecording",

      "video.stopRecording",

      "video.uploadRecording",


      // =================================================
      // TRAINING
      // =================================================

      "training.createSession",

      "training.startSession",

      "training.fetchPendingSessions",

      "training.joinSession",

      "training.leaveSession",

      "training.endSession",

    ],

  },


  // =====================================================
  // ADMIN
  // =====================================================

  admin: {

    canBuild:
      true,

    allowedElements: [

      "Container",

      "Text",

      "AgoraFeed",

      "RemoteVideoGrid",

      "VideoFeed",

      "ControlPanel",

      "ControlButton",

      "ChatPanel",

      "AvailabilityButton",

      "ParticipantSelector",

      "IncomingGroupCallAlert",

      "GroupCallControls",

      "TrainingInvitation"

    ],


    allowedActions: [

      // -----------------------------------------------
      // STANDARD CALL
      // -----------------------------------------------

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


      // -----------------------------------------------
      // GROUP CALL
      // -----------------------------------------------

      "call.createGroupCall",

      "call.fetchPendingInvitations",

      "call.acceptInvitation",

      "call.declineInvitation",

      "call.joinGroupCall",

      "call.refreshGroupCall",

      "call.inviteGroupParticipants",

      "call.leaveGroupCall",

      "call.endGroupCall",

      // =================================================
      // TRAINING
      // =================================================

      "training.createSession",

      "training.startSession",

      "training.fetchPendingSessions",

      "training.joinSession",

      "training.leaveSession",

      "training.endSession",

    ],

  },


  // =====================================================
  // HOST
  // =====================================================

  host: {

    canBuild:
      false,

    allowedElements: [

      "AgoraFeed",

      "RemoteVideoGrid",

      "VideoFeed",

      "ControlPanel",

      "ControlButton",

      "ChatPanel",


      // -----------------------------------------------
      // GROUP CALL EXPERIENCE
      // -----------------------------------------------

      "ParticipantSelector",

      "IncomingGroupCallAlert",

      "GroupCallControls",

    ],


    allowedActions: [

      // -----------------------------------------------
      // STANDARD CALL
      // -----------------------------------------------

      "call.acceptCall",

      "call.joinCall",

      "call.leaveCall",

      "call.endCall",

      "call.toggleMic",

      "call.toggleVideo",

      "call.spotlightUser",


      // -----------------------------------------------
      // GROUP CALL
      // -----------------------------------------------

      "call.createGroupCall",

      "call.fetchPendingInvitations",

      "call.acceptInvitation",

      "call.declineInvitation",

      "call.joinGroupCall",

      "call.refreshGroupCall",

      "call.inviteGroupParticipants",

      "call.leaveGroupCall",

      "call.endGroupCall",

      // =================================================
      // TRAINING
      // =================================================

      "training.createSession",

      "training.startSession",

      "training.fetchPendingSessions",

      "training.joinSession",

      "training.leaveSession",

      "training.endSession",

    ],

  },


  // =====================================================
  // PARTICIPANT
  // =====================================================

  participant: {

    canBuild:
      false,

    allowedElements: [

      "AgoraFeed",

      "RemoteVideoGrid",

      "VideoFeed",

      "ControlPanel",

      "ControlButton",

      "ChatPanel",

      "Text",
      


      // -----------------------------------------------
      // GROUP CALL PARTICIPANT EXPERIENCE
      // -----------------------------------------------

      "IncomingGroupCallAlert",

      "GroupCallControls",

       // -----------------------------------------------
      // REMOTE TRAINING
      // -----------------------------------------------
      
      "TrainingInvitation",

    ],


    allowedActions: [

      // -----------------------------------------------
      // STANDARD CALL
      // -----------------------------------------------

      "call.joinCall",

      "call.leaveCall",

      "call.toggleMic",

      "call.toggleVideo",


      // -----------------------------------------------
      // GROUP CALL
      // -----------------------------------------------

      "call.fetchPendingInvitations",

      "call.acceptInvitation",

      "call.declineInvitation",

      "call.joinGroupCall",

      // Used by realtime socket lifecycle reconciliation.
      "call.refreshGroupCall",

      "call.leaveGroupCall",

      // =================================================
      // TRAINING
      // =================================================

      "training.fetchPendingSessions",

      "training.joinSession",

      "training.leaveSession",

    ],

  },


  // =====================================================
  // VIEWER
  // =====================================================

  viewer: {

    canBuild:
      false,

    allowedElements: [

      "AgoraFeed",

      "RemoteVideoGrid",

      "VideoFeed",

      "Text",

    ],


    allowedActions: [

      "call.joinCall",

      "call.leaveCall",

    ],

  },

}; 