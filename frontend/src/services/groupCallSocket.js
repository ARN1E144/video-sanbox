// src/services/groupCallSocket.js

import {
  io,
} from "socket.io-client";


// =====================================================
// CONFIG
// =====================================================

const SERVER_API =
  process.env.REACT_APP_SERVER_API;


// =====================================================
// NORMALISE ID
// =====================================================

function normaliseId(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  const result =
    String(
      value
    ).trim();


  return result ||
    null;

}


// =====================================================
// ROOM HELPERS
// =====================================================

function getUserRoom(
  userId
) {

  return (
    `user:${String(
      userId
    )}`
  );

}


function getGroupCallRoom(
  callId
) {

  return (
    `group-call:${String(
      callId
    )}`
  );

}


function getTrainingRoom(
  sessionId
) {

  return (
    `training-session:${String(
      sessionId
    )}`
  );

}


// =====================================================
// GROUP CALL / TRAINING SOCKET SERVICE
// =====================================================
//
// Pure Socket.IO transport.
//
// Responsibilities:
//
//   - connect / disconnect
//   - authentication transport
//   - user-room membership
//   - group-call room signalling
//   - training-session room signalling
//   - event normalisation
//
// NOT responsible for:
//
//   - React
//   - RuntimeState
//   - ActionContext
//   - Agora media
//   - REST API lifecycle mutations
//
// IMPORTANT:
//
// This file MUST remain independent from:
//
//   GroupCallSocketRuntime
//
// This prevents circular module initialisation.
// =====================================================

class GroupCallSocket {

  constructor() {

    // ===================================================
    // SOCKET
    // ===================================================

    this.socket =
      null;


    // ===================================================
    // AUTH
    // ===================================================

    this.token =
      null;


    // ===================================================
    // CURRENT ROOMS
    // ===================================================

    this.currentCallId =
      null;

    this.currentTrainingSessionId =
      null;


    // ===================================================
    // CONNECTION
    // ===================================================

    this.connected =
      false;


    // ===================================================
    // LISTENERS
    // ===================================================

    this.listeners =
      new Map();


    // ===================================================
    // SOCKET HANDLERS
    // ===================================================

    this.handleConnect =
      this.handleConnect.bind(
        this
      );


    this.handleDisconnect =
      this.handleDisconnect.bind(
        this
      );


    this.handleConnectError =
      this.handleConnectError.bind(
        this
      );


    this.handleGroupCallJoined =
      this.handleGroupCallJoined.bind(
        this
      );


    this.handleGroupCallInvitation =
      this.handleGroupCallInvitation.bind(
        this
      );


    this.handleGroupCallEnded =
      this.handleGroupCallEnded.bind(
        this
      );


    this.handleGroupCallParticipantLeft =
      this.handleGroupCallParticipantLeft.bind(
        this
      );


    this.handleTrainingJoined =
      this.handleTrainingJoined.bind(
        this
      );


    this.handleTrainingInvitation =
      this.handleTrainingInvitation.bind(
        this
      );


    this.handleTrainingStarted =
      this.handleTrainingStarted.bind(
        this
      );


    this.handleTrainingEnded =
      this.handleTrainingEnded.bind(
        this
      );


    this.handleTrainingParticipantLeft =
      this.handleTrainingParticipantLeft.bind(
        this
      );

  }


  // =====================================================
  // EVENT SYSTEM
  // =====================================================

  on(
    event,
    handler
  ) {

    if (
      typeof handler !==
      "function"
    ) {

      return () => {};

    }


    if (
      !this.listeners.has(
        event
      )
    ) {

      this.listeners.set(
        event,
        new Set()
      );

    }


    const handlers =
      this.listeners.get(
        event
      );


    handlers.add(
      handler
    );


    return () => {

      handlers.delete(
        handler
      );


      if (
        handlers.size ===
        0
      ) {

        this.listeners.delete(
          event
        );

      }

    };

  }


  emit(
    event,
    payload = {}
  ) {

    const handlers =
      this.listeners.get(
        event
      );


    if (
      !handlers
    ) {

      return;

    }


    handlers.forEach(
      handler => {

        try {

          handler(
            payload
          );

        }
        catch (error) {

          console.error(
            "[GroupCallSocket] listener failed",
            {
              event,
              error,
            }
          );

        }

      }
    );

  }


  // =====================================================
  // CONNECT
  // =====================================================

  connect(
    token
  ) {

    if (
      !token
    ) {

      console.warn(
        "[GroupCallSocket] connect skipped - missing token"
      );


      return null;

    }


    if (
      !SERVER_API
    ) {

      console.error(
        "[GroupCallSocket] REACT_APP_SERVER_API is not configured"
      );


      return null;

    }


    // ---------------------------------------------------
    // Existing authenticated socket
    // ---------------------------------------------------

    if (
      this.socket &&
      this.token ===
        token
    ) {

      this.connected =
        Boolean(
          this.socket.connected
        );


      return this.socket;

    }


    // ---------------------------------------------------
    // Remove old socket
    // ---------------------------------------------------

    if (
      this.socket
    ) {

      try {

        this.removeSocketListeners();

        this.socket.disconnect();

      }
      catch (error) {

        console.warn(
          "[GroupCallSocket] stale socket cleanup failed",
          error
        );

      }

    }


    this.token =
      token;


    // ---------------------------------------------------
    // Socket.IO namespace
    // ---------------------------------------------------

    const endpoint =
      `${SERVER_API}/group-calls`;


    this.socket =
      io(
        endpoint,
        {

          auth: {

            token,

          },

          transports: [
            "websocket",
            "polling",
          ],

          withCredentials:
            true,

          autoConnect:
            true,

          reconnection:
            true,

          reconnectionAttempts:
            Infinity,

          reconnectionDelay:
            1000,

          reconnectionDelayMax:
            5000,

        }
      );


    // ===================================================
    // SOCKET EVENTS
    // ===================================================

    this.socket.on(
      "connect",
      this.handleConnect
    );


    this.socket.on(
      "disconnect",
      this.handleDisconnect
    );


    this.socket.on(
      "connect_error",
      this.handleConnectError
    );


    // ===================================================
    // GROUP CALL EVENTS
    // ===================================================

    this.socket.on(
      "group-call:joined",
      this.handleGroupCallJoined
    );


    this.socket.on(
      "group-call:invited",
      this.handleGroupCallInvitation
    );


    this.socket.on(
      "group-call:ended",
      this.handleGroupCallEnded
    );


    this.socket.on(
      "group-call:participant-left",
      this.handleGroupCallParticipantLeft
    );


    // ===================================================
    // TRAINING EVENTS
    // ===================================================

    this.socket.on(
      "training-session:joined",
      this.handleTrainingJoined
    );


    this.socket.on(
      "training-session:invited",
      this.handleTrainingInvitation
    );


    this.socket.on(
      "training-session:started",
      this.handleTrainingStarted
    );


    this.socket.on(
      "training-session:ended",
      this.handleTrainingEnded
    );


    this.socket.on(
      "training-session:participant-left",
      this.handleTrainingParticipantLeft
    );


    console.log(
      "[GroupCallSocket] socket created",
      {
        endpoint,
      }
    );


    return this.socket;

  }


  // =====================================================
  // REMOVE SOCKET LISTENERS
  // =====================================================

  removeSocketListeners() {

    if (
      !this.socket
    ) {

      return;

    }


    this.socket.off(
      "connect",
      this.handleConnect
    );


    this.socket.off(
      "disconnect",
      this.handleDisconnect
    );


    this.socket.off(
      "connect_error",
      this.handleConnectError
    );


    this.socket.off(
      "group-call:joined",
      this.handleGroupCallJoined
    );


    this.socket.off(
      "group-call:invited",
      this.handleGroupCallInvitation
    );


    this.socket.off(
      "group-call:ended",
      this.handleGroupCallEnded
    );


    this.socket.off(
      "group-call:participant-left",
      this.handleGroupCallParticipantLeft
    );


    this.socket.off(
      "training-session:joined",
      this.handleTrainingJoined
    );


    this.socket.off(
      "training-session:invited",
      this.handleTrainingInvitation
    );


    this.socket.off(
      "training-session:started",
      this.handleTrainingStarted
    );


    this.socket.off(
      "training-session:ended",
      this.handleTrainingEnded
    );


    this.socket.off(
      "training-session:participant-left",
      this.handleTrainingParticipantLeft
    );

  }


  // =====================================================
  // CONNECTED
  // =====================================================

  handleConnect() {

    this.connected =
      true;


    console.log(
      "[GroupCallSocket] connected",
      {

        socketId:
          this.socket?.id,

        currentCallId:
          this.currentCallId,

        currentTrainingSessionId:
          this.currentTrainingSessionId,

      }
    );


    this.emit(
      "CONNECTED",
      {

        socketId:
          this.socket?.id,

      }
    );


    // ---------------------------------------------------
    // Rejoin active group call
    // ---------------------------------------------------

    if (
      this.currentCallId
    ) {

      this.joinCall(
        this.currentCallId
      );

    }


    // ---------------------------------------------------
    // Rejoin active training
    // ---------------------------------------------------

    if (
      this.currentTrainingSessionId
    ) {

      this.joinTrainingSession(
        this.currentTrainingSessionId
      );

    }

  }


  // =====================================================
  // DISCONNECTED
  // =====================================================

  handleDisconnect(
    reason
  ) {

    this.connected =
      false;


    console.log(
      "[GroupCallSocket] disconnected",
      {

        reason,

        callId:
          this.currentCallId,

        trainingSessionId:
          this.currentTrainingSessionId,

      }
    );


    this.emit(
      "DISCONNECTED",
      {

        reason,

        callId:
          this.currentCallId,

        trainingSessionId:
          this.currentTrainingSessionId,

      }
    );

  }


  // =====================================================
  // CONNECT ERROR
  // =====================================================

  handleConnectError(
    error
  ) {

    this.connected =
      false;


    console.error(
      "[GroupCallSocket] connection error",
      error
    );


    this.emit(
      "CONNECT_ERROR",
      {
        error,
      }
    );

  }


  // =====================================================
  // GROUP CALL JOINED
  // =====================================================

  handleGroupCallJoined(
    payload = {}
  ) {

    const callId =
      normaliseId(
        payload?.callId
      );


    console.log(
      "[GroupCallSocket] group call room joined",
      {

        callId,

        socketId:
          this.socket?.id,

      }
    );


    this.emit(
      "CALL_JOINED",
      {

        callId,

        payload,

      }
    );

  }


  // =====================================================
  // GROUP CALL INVITATION
  // =====================================================

  handleGroupCallInvitation(
    payload = {}
  ) {

    const normalisedPayload = {

      ...payload,

      callId:
        normaliseId(
          payload?.callId
        ),

      userId:
        normaliseId(
          payload?.userId
        ),

      invitedBy:
        normaliseId(
          payload?.invitedBy
        ),

    };


    console.log(
      "[GroupCallSocket] GROUP_CALL_INVITED",
      normalisedPayload
    );


    this.emit(
      "GROUP_CALL_INVITED",
      normalisedPayload
    );

  }


  // =====================================================
  // GROUP CALL ENDED
  // =====================================================

  handleGroupCallEnded(
    payload = {}
  ) {

    const normalisedPayload = {

      ...payload,

      callId:
        normaliseId(
          payload?.callId
        ),

      endedBy:
        normaliseId(
          payload?.endedBy
        ),

    };


    console.log(
      "[GroupCallSocket] GROUP_CALL_ENDED",
      normalisedPayload
    );


    this.emit(
      "GROUP_CALL_ENDED",
      normalisedPayload
    );


    if (
      this.currentCallId ===
      normalisedPayload.callId
    ) {

      this.currentCallId =
        null;

    }

  }


  // =====================================================
  // GROUP CALL PARTICIPANT LEFT
  // =====================================================

  handleGroupCallParticipantLeft(
    payload = {}
  ) {

    const normalisedPayload = {

      ...payload,

      callId:
        normaliseId(
          payload?.callId
        ),

      userId:
        normaliseId(
          payload?.userId
        ),

    };


    console.log(
      "[GroupCallSocket] GROUP_CALL_PARTICIPANT_LEFT",
      normalisedPayload
    );


    this.emit(
      "GROUP_CALL_PARTICIPANT_LEFT",
      normalisedPayload
    );

  }


  // =====================================================
  // TRAINING JOINED
  // =====================================================

  handleTrainingJoined(
    payload = {}
  ) {

    const sessionId =
      normaliseId(
        payload?.sessionId
      );


    console.log(
      "[GroupCallSocket] training room joined",
      {

        sessionId,

        socketId:
          this.socket?.id,

      }
    );


    this.emit(
      "TRAINING_SESSION_JOINED",
      {

        sessionId,

        payload,

      }
    );

  }


  // =====================================================
  // TRAINING INVITATION
  // =====================================================

  handleTrainingInvitation(
    payload = {}
  ) {

    const normalisedPayload = {

      ...payload,

      sessionId:
        normaliseId(
          payload?.sessionId
        ),

      userId:
        normaliseId(
          payload?.userId
        ),

      invitedBy:
        normaliseId(
          payload?.invitedBy
        ),

    };


    console.log(
      "[GroupCallSocket] TRAINING_SESSION_INVITED",
      normalisedPayload
    );


    this.emit(
      "TRAINING_SESSION_INVITED",
      normalisedPayload
    );

  }


  // =====================================================
  // TRAINING STARTED
  // =====================================================

  handleTrainingStarted(
    payload = {}
  ) {

    const normalisedPayload = {

      ...payload,

      sessionId:
        normaliseId(
          payload?.sessionId
        ),

      startedBy:
        normaliseId(
          payload?.startedBy
        ),

    };


    console.log(
      "[GroupCallSocket] TRAINING_SESSION_STARTED",
      normalisedPayload
    );


    this.emit(
      "TRAINING_SESSION_STARTED",
      normalisedPayload
    );

  }


  // =====================================================
  // TRAINING ENDED
  // =====================================================

  handleTrainingEnded(
    payload = {}
  ) {

    const normalisedPayload = {

      ...payload,

      sessionId:
        normaliseId(
          payload?.sessionId
        ),

      endedBy:
        normaliseId(
          payload?.endedBy
        ),

      endedAt:
        payload?.endedAt ||
        null,

    };


    console.log(
      "[GroupCallSocket] TRAINING_SESSION_ENDED",
      normalisedPayload
    );


    this.emit(
      "TRAINING_SESSION_ENDED",
      normalisedPayload
    );


    if (
      this.currentTrainingSessionId ===
      normalisedPayload.sessionId
    ) {

      this.currentTrainingSessionId =
        null;

    }

  }


  // =====================================================
  // TRAINING PARTICIPANT LEFT
  // =====================================================

  handleTrainingParticipantLeft(
    payload = {}
  ) {

    const normalisedPayload = {

      ...payload,

      sessionId:
        normaliseId(
          payload?.sessionId
        ),

      userId:
        normaliseId(
          payload?.userId
        ),

      leftAt:
        payload?.leftAt ||
        null,

    };


    console.log(
      "[GroupCallSocket] TRAINING_SESSION_PARTICIPANT_LEFT",
      normalisedPayload
    );


    this.emit(
      "TRAINING_SESSION_PARTICIPANT_LEFT",
      normalisedPayload
    );

  }


  // =====================================================
  // JOIN GROUP CALL ROOM
  // =====================================================

  joinCall(
    callId
  ) {

    const normalisedCallId =
      normaliseId(
        callId
      );


    if (
      !normalisedCallId
    ) {

      console.warn(
        "[GroupCallSocket] joinCall skipped - missing callId"
      );


      return false;

    }


    this.currentCallId =
      normalisedCallId;


    if (
      !this.socket
    ) {

      console.warn(
        "[GroupCallSocket] joinCall waiting - socket not created",
        {

          callId:
            normalisedCallId,

        }
      );


      return false;

    }


    if (
      !this.socket.connected
    ) {

      console.log(
        "[GroupCallSocket] joinCall waiting - socket not connected",
        {

          callId:
            normalisedCallId,

        }
      );


      return false;

    }


    console.log(
      "[GroupCallSocket] joining group call room",
      {

        callId:
          normalisedCallId,

        room:
          getGroupCallRoom(
            normalisedCallId
          ),

        socketId:
          this.socket.id,

      }
    );


    this.socket.emit(
      "group-call:join",
      {

        callId:
          normalisedCallId,

      }
    );


    return true;

  }


  // =====================================================
  // LEAVE GROUP CALL ROOM
  // =====================================================

  leaveCall(
    callId =
      this.currentCallId
  ) {

    const normalisedCallId =
      normaliseId(
        callId
      );


    if (
      !normalisedCallId
    ) {

      return false;

    }


    if (
      this.socket &&
      this.socket.connected
    ) {

      this.socket.emit(
        "group-call:leave-room",
        {

          callId:
            normalisedCallId,

        }
      );

    }


    if (
      this.currentCallId ===
      normalisedCallId
    ) {

      this.currentCallId =
        null;

    }


    return true;

  }


  // =====================================================
  // JOIN TRAINING SESSION ROOM
  // =====================================================

  joinTrainingSession(
    sessionId
  ) {

    const normalisedSessionId =
      normaliseId(
        sessionId
      );


    if (
      !normalisedSessionId
    ) {

      console.warn(
        "[GroupCallSocket] joinTrainingSession skipped - missing sessionId"
      );


      return false;

    }


    this.currentTrainingSessionId =
      normalisedSessionId;


    if (
      !this.socket
    ) {

      console.warn(
        "[GroupCallSocket] joinTrainingSession waiting - socket not created",
        {

          sessionId:
            normalisedSessionId,

        }
      );


      return false;

    }


    if (
      !this.socket.connected
    ) {

      console.log(
        "[GroupCallSocket] joinTrainingSession waiting - socket not connected",
        {

          sessionId:
            normalisedSessionId,

        }
      );


      return false;

    }


    console.log(
      "[GroupCallSocket] joining training session room",
      {

        sessionId:
          normalisedSessionId,

        room:
          getTrainingRoom(
            normalisedSessionId
          ),

        socketId:
          this.socket.id,

      }
    );


    this.socket.emit(
      "training-session:join",
      {

        sessionId:
          normalisedSessionId,

      }
    );


    return true;

  }


  // =====================================================
  // LEAVE TRAINING SESSION ROOM
  // =====================================================

  leaveTrainingSession(
    sessionId =
      this.currentTrainingSessionId
  ) {

    const normalisedSessionId =
      normaliseId(
        sessionId
      );


    if (
      !normalisedSessionId
    ) {

      return false;

    }


    if (
      this.socket &&
      this.socket.connected
    ) {

      console.log(
        "[GroupCallSocket] leaving training session room",
        {

          sessionId:
            normalisedSessionId,

        }
      );


      this.socket.emit(
        "training-session:leave-room",
        {

          sessionId:
            normalisedSessionId,

        }
      );

    }


    if (
      this.currentTrainingSessionId ===
      normalisedSessionId
    ) {

      this.currentTrainingSessionId =
        null;

    }


    return true;

  }


  // =====================================================
  // STATE
  // =====================================================

  getState() {

    return {

      connected:
        Boolean(
          this.socket?.connected
        ),

      socketId:
        this.socket?.id ||
        null,

      currentCallId:
        this.currentCallId,

      currentTrainingSessionId:
        this.currentTrainingSessionId,

    };

  }


  // =====================================================
  // IS CONNECTED
  // =====================================================

  isConnected() {

    return Boolean(
      this.socket &&
      this.socket.connected
    );

  }


  // =====================================================
  // DISCONNECT
  // =====================================================

  disconnect() {

    if (
      !this.socket
    ) {

      this.connected =
        false;

      this.currentCallId =
        null;

      this.currentTrainingSessionId =
        null;

      this.token =
        null;

      return;

    }


    console.log(
      "[GroupCallSocket] disconnecting",
      {

        socketId:
          this.socket.id,

        callId:
          this.currentCallId,

        trainingSessionId:
          this.currentTrainingSessionId,

      }
    );


    try {

      this.removeSocketListeners();

      this.socket.disconnect();

    }
    catch (error) {

      console.warn(
        "[GroupCallSocket] disconnect cleanup failed",
        error
      );

    }


    this.socket =
      null;

    this.connected =
      false;

    this.currentCallId =
      null;

    this.currentTrainingSessionId =
      null;

    this.token =
      null;

  }

}


// =====================================================
// SINGLETON
// =====================================================

export default new GroupCallSocket();