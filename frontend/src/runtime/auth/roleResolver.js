// src/runtime/auth/roles/rolePermissions.js

console.log(
  "🔥 rolePermissions.js EXECUTED"
);


// =====================================================
// ROLE PERMISSIONS
// =====================================================
//
// This file controls:
//
// 1. Which components a role may use.
// 2. Which actions a role may execute.
// 3. Whether a role can build.
//
// IMPORTANT
// -----------------------------------------------------
// Component availability and action availability are
// separate permissions.
//
// A role being able to see ComplianceEvidence does not
// automatically mean it can execute every compliance
// action.
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
      "TextBox",
      "TextLabel",
      "AppBar",
      "ControlPanel",
      "ControlButton",


      // -----------------------------------------------
      // VIDEO
      // -----------------------------------------------

      "AgoraFeed",
      "RemoteVideoGrid",
      "VideoFeed",
      "MediaFeed",
      "FilePreview",


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


      // -----------------------------------------------
      // AI
      // -----------------------------------------------

      "InterviewPanel",


      // -----------------------------------------------
      // COMPLIANCE
      // -----------------------------------------------

      "ComplianceEvidence",

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


      // =================================================
      // COMPLIANCE
      // =================================================

      "compliance.load",
      "compliance.requestEvidence",
      "compliance.uploadEvidence",
      "compliance.analyseEvidence",
      "compliance.acceptEvidence",
      "compliance.rejectEvidence",
      "compliance.updateControlStatus",

    ],

  },


  // =====================================================
  // ADMIN
  // =====================================================

  admin: {

    canBuild:
      true,

    allowedElements: [

      // -----------------------------------------------
      // CORE
      // -----------------------------------------------

      "Container",
      "Text",
      "TextBox",
      "TextLabel",
      "AppBar",
      "ControlPanel",
      "ControlButton",


      // -----------------------------------------------
      // MEDIA
      // -----------------------------------------------

      "AgoraFeed",
      "RemoteVideoGrid",
      "VideoFeed",
      "MediaFeed",
      "FilePreview",


      // -----------------------------------------------
      // COMMUNICATION
      // -----------------------------------------------

      "ChatPanel",
      "AvailabilityButton",
      "ParticipantSelector",
      "IncomingGroupCallAlert",
      "GroupCallControls",
      "TrainingInvitation",


      // -----------------------------------------------
      // AI
      // -----------------------------------------------

      "InterviewPanel",


      // -----------------------------------------------
      // COMPLIANCE
      // -----------------------------------------------

      "ComplianceEvidence",

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
      // TRAINING
      // =================================================

      "training.createSession",
      "training.startSession",
      "training.fetchPendingSessions",
      "training.joinSession",
      "training.leaveSession",
      "training.endSession",


      // =================================================
      // COMPLIANCE
      // =================================================

      "compliance.load",
      "compliance.requestEvidence",
      "compliance.uploadEvidence",
      "compliance.analyseEvidence",
      "compliance.acceptEvidence",
      "compliance.rejectEvidence",
      "compliance.updateControlStatus",

    ],

  },


  // =====================================================
  // COMPLIANCE MANAGER
  // =====================================================

  compliance_manager: {

    canBuild:
      false,

    allowedElements: [

      "Container",
      "Text",
      "TextBox",
      "TextLabel",
      "AppBar",
      "ControlPanel",
      "ControlButton",

      "ComplianceEvidence",

    ],


    allowedActions: [

      "compliance.load",
      "compliance.requestEvidence",
      "compliance.uploadEvidence",
      "compliance.analyseEvidence",
      "compliance.acceptEvidence",
      "compliance.rejectEvidence",
      "compliance.updateControlStatus",

    ],

  },


  // =====================================================
  // CONTROL OWNER
  // =====================================================

  control_owner: {

    canBuild:
      false,

    allowedElements: [

      "Container",
      "Text",
      "TextLabel",
      "ControlPanel",
      "ControlButton",

      "ComplianceEvidence",

    ],


    allowedActions: [

      "compliance.load",
      "compliance.requestEvidence",
      "compliance.uploadEvidence",
      "compliance.analyseEvidence",
      "compliance.acceptEvidence",
      "compliance.rejectEvidence",
      "compliance.updateControlStatus",

    ],

  },


  // =====================================================
  // AUDITOR
  // =====================================================

  auditor: {

    canBuild:
      false,

    allowedElements: [

      "Container",
      "Text",
      "TextLabel",

      "ComplianceEvidence",

    ],


    allowedActions: [

      "compliance.load",

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


      // -----------------------------------------------
      // TRAINING
      // -----------------------------------------------

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

      "IncomingGroupCallAlert",
      "GroupCallControls",

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
      "call.refreshGroupCall",
      "call.leaveGroupCall",


      // -----------------------------------------------
      // TRAINING
      // -----------------------------------------------

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