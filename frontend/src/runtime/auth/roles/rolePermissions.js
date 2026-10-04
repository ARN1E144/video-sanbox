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
      // INPUT
      // -----------------------------------------------

      "FileUpload",
      "Select",

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
      // CHAT
      // =================================================

      "chat.sendMessage",
      "chat.loadMessages",
      "chat.createConversation",
      "chat.joinConversation",
      "chat.loadConversations",
      "chat.leaveConversation",
      "chat.markConversationRead",
      "chat.editMessage",
      "chat.deleteMessage",
      "chat.closeConversation",


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

      "Container",
      "Text",
      "AgoraFeed",
      "RemoteVideoGrid",
      "VideoFeed",
      "ControlPanel",
      "ControlButton",

      // INPUT
      "FileUpload",
      "Select",

      "ChatPanel",
      "AvailabilityButton",
      "ParticipantSelector",
      "IncomingGroupCallAlert",
      "GroupCallControls",
      "TrainingInvitation",

      // COMPLIANCE
      "ComplianceEvidence",

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
      // CHAT
      // =================================================

      "chat.sendMessage",
      "chat.loadMessages",
      "chat.createConversation",


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

    // Host represents a project Editor at runtime.
    // Editors can modify the project and execute it.
    canBuild:
      true,

    allowedElements: [

      "AgoraFeed",
      "RemoteVideoGrid",
      "VideoFeed",
      "ControlPanel",
      "ControlButton",
      "ChatPanel",
      "Select",

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
      // CHAT
      // =================================================

      "chat.sendMessage",
      "chat.loadMessages",
      "chat.createConversation",


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
      // AI INTERVIEW
      // =================================================

      "interview.start",
      "interview.nextQuestion",
      "interview.submitAnswer",
      "interview.evaluate",
      "interview.complete",

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
      // CHAT
      // =================================================

      "chat.sendMessage",
      "chat.loadMessages",


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

    // Viewers cannot modify the project.
    // They can still execute the application's
    // permitted runtime behaviour.
    canBuild:
      false,

    allowedElements: [

      "AgoraFeed",
      "RemoteVideoGrid",
      "VideoFeed",
      "Text",

    ],


    allowedActions: [

      // -----------------------------------------------
      // STANDARD CALL
      // -----------------------------------------------

      "call.joinCall",
      "call.leaveCall",

      // =================================================
      // VIDEO
      // =================================================

      "video.toggleMic",
      "video.toggleVideo",
      "video.startRecording",
      "video.stopRecording",
      "video.uploadRecording",


      // =================================================
      // AI INTERVIEW
      // =================================================

      "interview.start",
      "interview.nextQuestion",
      "interview.submitAnswer",
      "interview.complete",

    ],

  },

};