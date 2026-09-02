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
// NORMALISE CALL ID
// =====================================================

function normaliseCallId(
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
// NORMALISE USER ID
// =====================================================

function normaliseUserId(
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
// GROUP CALL SOCKET SERVICE
// =====================================================
//
// Client-side realtime signalling.
//
// Responsibilities:
//
//   - authenticate Socket.IO client
//   - connect to /group-calls namespace
//   - join group-call rooms
//   - leave group-call rooms
//   - receive realtime lifecycle events
//   - translate socket events into application events
//
// NOT responsible for:
//
//   - Agora media
//   - RuntimeState writes
//   - REST/API calls
//   - database lifecycle mutations
//
// The Runtime layer decides what to do with the events.
//
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
    // CURRENT CALL
    // ===================================================

    this.currentCallId =
      null;


    // ===================================================
    // CONNECTION STATE
    // ===================================================

    this.connected =
      false;


    // ===================================================
    // LISTENERS
    // ===================================================

    this.listeners =
      new Map();


    // ===================================================
    // INTERNAL SOCKET HANDLERS
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


    this.handleJoined =
      this.handleJoined.bind(
        this
      );


    this.handleInvitation =
      this.handleInvitation.bind(
        this
      );


    this.handleCallEnded =
      this.handleCallEnded.bind(
        this
      );


    this.handleParticipantLeft =
      this.handleParticipantLeft.bind(
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

    // ---------------------------------------------------
    // TOKEN
    // ---------------------------------------------------

    if (
      !token
    ) {

      console.warn(
        "[GroupCallSocket] connect skipped - missing token"
      );


      return null;

    }


    // ---------------------------------------------------
    // SERVER API
    // ---------------------------------------------------

    if (
      !SERVER_API
    ) {

      console.error(
        "[GroupCallSocket] REACT_APP_SERVER_API is not configured"
      );


      return null;

    }


    // ---------------------------------------------------
    // EXISTING SOCKET
    // ---------------------------------------------------

    if (
      this.socket &&
      this.token ===
      token
    ) {

      if (
        this.socket.connected
      ) {

        this.connected =
          true;

      }


      return this.socket;

    }


    // ---------------------------------------------------
    // DISPOSE OLD SOCKET
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


    // ---------------------------------------------------
    // SAVE TOKEN
    // ---------------------------------------------------

    this.token =
      token;


    // ---------------------------------------------------
    // CREATE SOCKET
    // ---------------------------------------------------
    //
    // REACT_APP_SERVER_API:
    //
    //   http://localhost:5000
    //
    // Namespace:
    //
    //   /group-calls
    //
    // Therefore:
    //
    //   http://localhost:5000/group-calls
    //
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
    // REGISTER SOCKET EVENTS
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


    this.socket.on(
      "group-call:joined",
      this.handleJoined
    );


    this.socket.on(
      "group-call:invited",
      this.handleInvitation
    );


    this.socket.on(
      "group-call:ended",
      this.handleCallEnded
    );


    this.socket.on(
      "group-call:participant-left",
      this.handleParticipantLeft
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
      this.handleJoined
    );


    this.socket.off(
      "group-call:invited",
      this.handleInvitation
    );


    this.socket.off(
      "group-call:ended",
      this.handleCallEnded
    );


    this.socket.off(
      "group-call:participant-left",
      this.handleParticipantLeft
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
    // SOCKET.IO RECONNECT
    // ---------------------------------------------------
    //
    // A reconnect creates a new socket connection on the
    // server. Therefore the server-side room membership
    // must be established again.
    //
    // ---------------------------------------------------

    if (
      this.currentCallId
    ) {

      console.log(
        "[GroupCallSocket] rejoining current call after reconnect",
        {

          callId:
            this.currentCallId,

        }
      );


      this.joinCall(
        this.currentCallId
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

      }
    );


    this.emit(
      "DISCONNECTED",
      {

        reason,

        callId:
          this.currentCallId,

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
  // SERVER ROOM JOIN ACK
  // =====================================================

  handleJoined(
    payload = {}
  ) {

    const callId =
      normaliseCallId(
        payload?.callId
      );


    console.log(
      "[GroupCallSocket] server confirmed call room",
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
  //
  // Backend event:
  //
  //   group-call:invited
  //
  // Runtime event:
  //
  //   GROUP_CALL_INVITED
  //
  // The backend currently broadcasts the event to the
  // whole /group-calls namespace.
  //
  // GroupCallSocketRuntime performs the final userId
  // filtering.
  //
  // =====================================================

  handleInvitation(
    payload = {}
  ) {

    const callId =
      normaliseCallId(
        payload?.callId
      );


    const userId =
      normaliseUserId(
        payload?.userId
      );


    const invitedBy =
      normaliseUserId(
        payload?.invitedBy
      );


    const normalisedPayload = {

      ...payload,

      callId,

      userId,

      invitedBy,

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

  handleCallEnded(
    payload = {}
  ) {

    const callId =
      normaliseCallId(
        payload?.callId
      );


    const normalisedPayload = {

      ...payload,

      callId,

      endedBy:
        normaliseUserId(
          payload?.endedBy
        ),

    };


    console.log(
      "[GroupCallSocket] GROUP_CALL_ENDED",
      {

        callId,

        reason:
          normalisedPayload.reason,

        endedBy:
          normalisedPayload.endedBy,

      }
    );


    this.emit(
      "GROUP_CALL_ENDED",
      normalisedPayload
    );


    // ---------------------------------------------------
    // Forget active call
    // ---------------------------------------------------

    if (
      callId &&
      this.currentCallId ===
      callId
    ) {

      this.currentCallId =
        null;

    }

  }


  // =====================================================
  // PARTICIPANT LEFT
  // =====================================================

  handleParticipantLeft(
    payload = {}
  ) {

    const callId =
      normaliseCallId(
        payload?.callId
      );


    const userId =
      normaliseUserId(
        payload?.userId
      );


    const normalisedPayload = {

      ...payload,

      callId,

      userId,

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
  // JOIN GROUP CALL ROOM
  // =====================================================

  joinCall(
    callId
  ) {

    const normalizedCallId =
      normaliseCallId(
        callId
      );


    if (
      !normalizedCallId
    ) {

      console.warn(
        "[GroupCallSocket] joinCall skipped - missing callId"
      );


      return false;

    }


    // ---------------------------------------------------
    // Always remember the call.
    //
    // This allows the connection handler to rejoin it
    // after a socket reconnect.
    // ---------------------------------------------------

    this.currentCallId =
      normalizedCallId;


    // ---------------------------------------------------
    // No socket yet.
    // ---------------------------------------------------

    if (
      !this.socket
    ) {

      console.warn(
        "[GroupCallSocket] joinCall waiting - socket not created",
        {

          callId:
            normalizedCallId,

        }
      );


      return false;

    }


    // ---------------------------------------------------
    // Socket not currently connected.
    // ---------------------------------------------------
    //
    // Do not emit yet.
    //
    // handleConnect() will rejoin automatically.
    //
    // ---------------------------------------------------

    if (
      !this.socket.connected
    ) {

      console.log(
        "[GroupCallSocket] joinCall waiting - socket reconnecting",
        {

          callId:
            normalizedCallId,

        }
      );


      return false;

    }


    console.log(
      "[GroupCallSocket] joining group call room",
      {

        callId:
          normalizedCallId,

        socketId:
          this.socket.id,

      }
    );


    this.socket.emit(
      "group-call:join",
      {

        callId:
          normalizedCallId,

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

    const normalizedCallId =
      normaliseCallId(
        callId
      );


    if (
      !normalizedCallId
    ) {

      return false;

    }


    if (
      this.socket &&
      this.socket.connected
    ) {

      console.log(
        "[GroupCallSocket] leaving group call room",
        {

          callId:
            normalizedCallId,

        }
      );


      this.socket.emit(
        "group-call:leave-room",
        {

          callId:
            normalizedCallId,

        }
      );

    }


    if (
      this.currentCallId ===
      normalizedCallId
    ) {

      this.currentCallId =
        null;

    }


    return true;

  }


  // =====================================================
  // CURRENT STATE
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
  // DISCONNECT CLIENT
  // =====================================================
  //
  // Used when the authenticated application session is
  // ending.
  //
  // This is different from leaving a group-call room.
  //
  // =====================================================

  disconnect() {

    if (
      !this.socket
    ) {

      this.connected =
        false;

      this.currentCallId =
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

    this.token =
      null;

  }

}


// =====================================================
// SINGLETON
// =====================================================

export default new GroupCallSocket();
