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

function getChatRoom(
conversationId
) {

return (
`chat:${String(
      conversationId
    )}`
);

}

// =====================================================
// GROUP CALL / TRAINING / CHAT SOCKET SERVICE
// =====================================================
//
// Pure Socket.IO transport.
//
// Responsibilities:
//
//   CORE
//   - connect / disconnect
//   - authentication transport
//
//   GROUP CALL
//   - room membership
//   - signalling
//   - invitations
//   - participant lifecycle
//
//   TRAINING
//   - room membership
//   - signalling
//   - invitations
//   - participant lifecycle
//
//   CHAT
//   - conversation room membership
//   - invitations
//   - message delivery
//   - message edits
//   - message deletion
//   - typing indicators
//   - read receipts
//   - participant lifecycle
//   - conversation lifecycle
//
// NOT responsible for:
//
//   - React
//   - RuntimeState
//   - ActionContext
//   - Agora media
//   - REST persistence
//   - database lifecycle rules
//
// IMPORTANT:
//
// This service is intentionally independent from:
//
//   GroupCallSocketRuntime
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
// ACTIVE ROOMS
// ===================================================

this.currentCallId =
  null;


this.currentTrainingSessionId =
  null;


this.currentChatConversationId =
  null;


// ===================================================
// CHAT ROOM REGISTRY
// ===================================================
//
// A socket may belong to more than one chat
// conversation.
//
// The active conversation above remains the primary
// conversation used by ChatPanel/runtime.
//
// ===================================================

this.chatConversationIds =
  new Set();


// ===================================================
// CONNECTION
// ===================================================

this.connected =
  false;


// ===================================================
// APPLICATION LISTENERS
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


// ---------------------------------------------------
// GROUP CALL
// ---------------------------------------------------

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


// ---------------------------------------------------
// TRAINING
// ---------------------------------------------------

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


// ---------------------------------------------------
// CHAT
// ---------------------------------------------------

this.handleChatJoined =
  this.handleChatJoined.bind(
    this
  );


this.handleChatInvitation =
  this.handleChatInvitation.bind(
    this
  );


this.handleChatMessage =
  this.handleChatMessage.bind(
    this
  );


this.handleChatMessageUpdated =
  this.handleChatMessageUpdated.bind(
    this
  );


this.handleChatMessageDeleted =
  this.handleChatMessageDeleted.bind(
    this
  );


this.handleChatRead =
  this.handleChatRead.bind(
    this
  );


this.handleChatTyping =
  this.handleChatTyping.bind(
    this
  );


this.handleChatConversationClosed =
  this.handleChatConversationClosed.bind(
    this
  );


this.handleChatParticipantJoined =
  this.handleChatParticipantJoined.bind(
    this
  );


this.handleChatParticipantLeft =
  this.handleChatParticipantLeft.bind(
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
// Remove stale socket
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
// Namespace
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
// CORE SOCKET EVENTS
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


// ===================================================
// CHAT EVENTS
// ===================================================

this.socket.on(
  "chat:joined",
  this.handleChatJoined
);


this.socket.on(
  "chat:invited",
  this.handleChatInvitation
);


this.socket.on(
  "chat:message",
  this.handleChatMessage
);


// ---------------------------------------------------
// IMPORTANT
//
// Server currently emits:
//
//   chat:message-edited
//
// We normalise that internally to:
//
//   CHAT_MESSAGE_UPDATED
// ---------------------------------------------------

this.socket.on(
  "chat:message-edited",
  this.handleChatMessageUpdated
);


this.socket.on(
  "chat:message-deleted",
  this.handleChatMessageDeleted
);


this.socket.on(
  "chat:read",
  this.handleChatRead
);


this.socket.on(
  "chat:typing",
  this.handleChatTyping
);


// ---------------------------------------------------
// IMPORTANT
//
// Server currently emits:
//
//   chat:closed
//
// We normalise that internally to:
//
//   CHAT_CONVERSATION_CLOSED
// ---------------------------------------------------

this.socket.on(
  "chat:closed",
  this.handleChatConversationClosed
);


this.socket.on(
  "chat:participant-joined",
  this.handleChatParticipantJoined
);


this.socket.on(
  "chat:participant-left",
  this.handleChatParticipantLeft
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


// ---------------------------------------------------
// Core
// ---------------------------------------------------

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


// ---------------------------------------------------
// Group Call
// ---------------------------------------------------

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


// ---------------------------------------------------
// Training
// ---------------------------------------------------

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


// ---------------------------------------------------
// Chat
// ---------------------------------------------------

this.socket.off(
  "chat:joined",
  this.handleChatJoined
);


this.socket.off(
  "chat:invited",
  this.handleChatInvitation
);


this.socket.off(
  "chat:message",
  this.handleChatMessage
);


this.socket.off(
  "chat:message-edited",
  this.handleChatMessageUpdated
);


this.socket.off(
  "chat:message-deleted",
  this.handleChatMessageDeleted
);


this.socket.off(
  "chat:read",
  this.handleChatRead
);


this.socket.off(
  "chat:typing",
  this.handleChatTyping
);


this.socket.off(
  "chat:closed",
  this.handleChatConversationClosed
);


this.socket.off(
  "chat:participant-joined",
  this.handleChatParticipantJoined
);


this.socket.off(
  "chat:participant-left",
  this.handleChatParticipantLeft
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

    currentChatConversationId:
      this.currentChatConversationId,

    chatConversationCount:
      this.chatConversationIds.size,

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
// Rejoin Group Call
// ---------------------------------------------------

if (
  this.currentCallId
) {

  this.joinCall(
    this.currentCallId
  );

}


// ---------------------------------------------------
// Rejoin Training
// ---------------------------------------------------

if (
  this.currentTrainingSessionId
) {

  this.joinTrainingSession(
    this.currentTrainingSessionId
  );

}


// ---------------------------------------------------
// Rejoin all Chat rooms
// ---------------------------------------------------
//
// Multiple conversations can be joined.
//
// ===================================================

this.chatConversationIds.forEach(
  conversationId => {

    this.joinChat(
      conversationId
    );

  }
);


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

    chatConversationId:
      this.currentChatConversationId,

    chatConversationCount:
      this.chatConversationIds.size,

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

    conversationId:
      this.currentChatConversationId,

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
// CHAT JOINED
// =====================================================

handleChatJoined(
payload = {}
) {


const conversationId =
  normaliseId(
    payload?.conversationId
  );


if (
  conversationId
) {

  this.chatConversationIds.add(
    conversationId
  );

}


console.log(
  "[GroupCallSocket] chat room joined",
  {

    conversationId,

    socketId:
      this.socket?.id,

  }
);


this.emit(
  "CHAT_JOINED",
  {

    conversationId,

    payload,

  }
);


}

// =====================================================
// CHAT INVITATION
// =====================================================

handleChatInvitation(
payload = {}
) {


const normalisedPayload = {

  ...payload,

  conversationId:
    normaliseId(
      payload?.conversationId
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
  "[GroupCallSocket] CHAT_INVITED",
  normalisedPayload
);


this.emit(
  "CHAT_INVITED",
  normalisedPayload
);


}

// =====================================================
// CHAT MESSAGE
// =====================================================

handleChatMessage(
payload = {}
) {


const message =
  payload?.message ||
  payload;


const conversationId =
  normaliseId(
    message?.conversationId ||
    payload?.conversationId ||
    this.currentChatConversationId
  );


const messageId =
  normaliseId(
    message?.messageId ||
    message?.id ||
    message?._id
  );


const senderUserId =
  normaliseId(
    message?.senderUserId ||
    message?.userId ||
    message?.senderId
  );


const normalisedMessage = {

  ...message,

  conversationId,

  messageId,

  senderUserId,

};


const normalisedPayload = {

  ...payload,

  conversationId,

  message:
    normalisedMessage,

};


console.log(
  "[GroupCallSocket] CHAT_MESSAGE",
  {

    conversationId,

    messageId,

    senderUserId,

  }
);


this.emit(
  "CHAT_MESSAGE",
  normalisedPayload
);


}

// =====================================================
// CHAT MESSAGE UPDATED
// =====================================================

handleChatMessageUpdated(
payload = {}
) {


const message =
  payload?.message ||
  payload;


const conversationId =
  normaliseId(
    message?.conversationId ||
    payload?.conversationId ||
    this.currentChatConversationId
  );


const messageId =
  normaliseId(
    message?.messageId ||
    message?.id ||
    message?._id
  );


const normalisedMessage = {

  ...message,

  conversationId,

  messageId,

};


const normalisedPayload = {

  ...payload,

  conversationId,

  message:
    normalisedMessage,

};


console.log(
  "[GroupCallSocket] CHAT_MESSAGE_UPDATED",
  {

    conversationId,

    messageId,

  }
);


this.emit(
  "CHAT_MESSAGE_UPDATED",
  normalisedPayload
);


}

// =====================================================
// CHAT MESSAGE DELETED
// =====================================================

handleChatMessageDeleted(
payload = {}
) {


const message =
  payload?.message ||
  {};


const conversationId =
  normaliseId(
    payload?.conversationId ||
    message?.conversationId ||
    this.currentChatConversationId
  );


const messageId =
  normaliseId(
    payload?.messageId ||
    message?.messageId ||
    message?.id ||
    message?._id
  );


const normalisedPayload = {

  ...payload,

  conversationId,

  messageId,

  deletedAt:
    payload?.deletedAt ||
    null,

};


console.log(
  "[GroupCallSocket] CHAT_MESSAGE_DELETED",
  normalisedPayload
);


this.emit(
  "CHAT_MESSAGE_DELETED",
  normalisedPayload
);


}

// =====================================================
// CHAT READ
// =====================================================

handleChatRead(
payload = {}
) {


const normalisedPayload = {

  ...payload,

  conversationId:
    normaliseId(
      payload?.conversationId
    ),

  userId:
    normaliseId(
      payload?.userId
    ),

  lastMessageId:
    normaliseId(
      payload?.lastMessageId
    ),

  readAt:
    payload?.readAt ||
    null,

};


console.log(
  "[GroupCallSocket] CHAT_READ",
  normalisedPayload
);


this.emit(
  "CHAT_READ",
  normalisedPayload
);


}

// =====================================================
// CHAT TYPING
// =====================================================

handleChatTyping(
payload = {}
) {


const normalisedPayload = {

  ...payload,

  conversationId:
    normaliseId(
      payload?.conversationId
    ),

  userId:
    normaliseId(
      payload?.userId
    ),

  isTyping:
    payload?.isTyping === true,

};


console.log(
  "[GroupCallSocket] CHAT_TYPING",
  normalisedPayload
);


this.emit(
  "CHAT_TYPING",
  normalisedPayload
);


}

// =====================================================
// CHAT CONVERSATION CLOSED
// =====================================================

handleChatConversationClosed(
payload = {}
) {


const conversationId =
  normaliseId(
    payload?.conversationId
  );


const normalisedPayload = {

  ...payload,

  conversationId,

  closedBy:
    normaliseId(
      payload?.closedBy
    ),

  closedAt:
    payload?.closedAt ||
    null,

};


console.log(
  "[GroupCallSocket] CHAT_CONVERSATION_CLOSED",
  normalisedPayload
);


this.emit(
  "CHAT_CONVERSATION_CLOSED",
  normalisedPayload
);


if (
  conversationId
) {

  this.chatConversationIds.delete(
    conversationId
  );

}


if (
  this.currentChatConversationId ===
  conversationId
) {

  this.currentChatConversationId =
    null;

}


}

// =====================================================
// CHAT PARTICIPANT JOINED
// =====================================================

handleChatParticipantJoined(
payload = {}
) {


const normalisedPayload = {

  ...payload,

  conversationId:
    normaliseId(
      payload?.conversationId
    ),

  userId:
    normaliseId(
      payload?.userId
    ),

  joinedAt:
    payload?.joinedAt ||
    null,

};


console.log(
  "[GroupCallSocket] CHAT_PARTICIPANT_JOINED",
  normalisedPayload
);


this.emit(
  "CHAT_PARTICIPANT_JOINED",
  normalisedPayload
);


}

// =====================================================
// CHAT PARTICIPANT LEFT
// =====================================================

handleChatParticipantLeft(
payload = {}
) {


const normalisedPayload = {

  ...payload,

  conversationId:
    normaliseId(
      payload?.conversationId
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
  "[GroupCallSocket] CHAT_PARTICIPANT_LEFT",
  normalisedPayload
);


this.emit(
  "CHAT_PARTICIPANT_LEFT",
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
// JOIN CHAT CONVERSATION
// =====================================================
//
// Adds the conversation to the local room registry.
//
// Reconnect automatically rejoins all tracked rooms.
//
// =====================================================

joinChat(
conversationId
) {


const normalisedConversationId =
  normaliseId(
    conversationId
  );


if (
  !normalisedConversationId
) {

  console.warn(
    "[GroupCallSocket] joinChat skipped - missing conversationId"
  );


  return false;

}


this.currentChatConversationId =
  normalisedConversationId;


this.chatConversationIds.add(
  normalisedConversationId
);


if (
  !this.socket
) {

  console.warn(
    "[GroupCallSocket] joinChat waiting - socket not created",
    {

      conversationId:
        normalisedConversationId,

    }
  );


  return false;

}


if (
  !this.socket.connected
) {

  console.log(
    "[GroupCallSocket] joinChat waiting - socket not connected",
    {

      conversationId:
        normalisedConversationId,

    }
  );


  return false;

}


console.log(
  "[GroupCallSocket] joining chat conversation",
  {

    conversationId:
      normalisedConversationId,

    room:
      getChatRoom(
        normalisedConversationId
      ),

    socketId:
      this.socket.id,

  }
);


this.socket.emit(
  "chat:join",
  {

    conversationId:
      normalisedConversationId,

  }
);


return true;


}

// =====================================================
// LEAVE CHAT CONVERSATION
// =====================================================

leaveChat(
conversationId =
this.currentChatConversationId
) {


const normalisedConversationId =
  normaliseId(
    conversationId
  );


if (
  !normalisedConversationId
) {

  return false;

}


if (
  this.socket &&
  this.socket.connected
) {

  console.log(
    "[GroupCallSocket] leaving chat conversation",
    {

      conversationId:
        normalisedConversationId,

    }
  );


  // IMPORTANT:
  // Server listens for chat:leave-room.
  this.socket.emit(
    "chat:leave-room",
    {

      conversationId:
        normalisedConversationId,

    }
  );

}


this.chatConversationIds.delete(
  normalisedConversationId
);


if (
  this.currentChatConversationId ===
  normalisedConversationId
) {

  this.currentChatConversationId =
    null;

}


return true;


}

// =====================================================
// SEND CHAT MESSAGE
// =====================================================
//
// Transport helper only.
//
// Normal persistence remains REST-driven through the
// chat routes.
//
// This method is retained for compatibility with
// existing Confo actions/components.
//
// =====================================================

sendChatMessage(
conversationId,
message
) {


const normalisedConversationId =
  normaliseId(
    conversationId ||
    this.currentChatConversationId
  );


if (
  !normalisedConversationId
) {

  console.warn(
    "[GroupCallSocket] sendChatMessage skipped - missing conversationId"
  );


  return false;

}


if (
  !this.socket ||
  !this.socket.connected
) {

  console.warn(
    "[GroupCallSocket] sendChatMessage skipped - socket not connected"
  );


  return false;

}


if (
  !this.chatConversationIds.has(
    normalisedConversationId
  )
) {

  console.warn(
    "[GroupCallSocket] sendChatMessage skipped - conversation room not joined",
    {

      conversationId:
        normalisedConversationId,

    }
  );


  return false;

}


console.log(
  "[GroupCallSocket] sending chat message",
  {

    conversationId:
      normalisedConversationId,

  }
);


this.socket.emit(
  "chat:message",
  {

    conversationId:
      normalisedConversationId,

    message,

  }
);


return true;


}

// =====================================================
// UPDATE CHAT MESSAGE
// =====================================================
//
// Retained as a compatibility transport method.
//
// The current server HTTP API remains authoritative
// for message edits.
//
// =====================================================

updateChatMessage(
conversationId,
messageId,
updates
) {


const normalisedConversationId =
  normaliseId(
    conversationId ||
    this.currentChatConversationId
  );


const normalisedMessageId =
  normaliseId(
    messageId
  );


if (
  !normalisedConversationId ||
  !normalisedMessageId
) {

  return false;

}


if (
  !this.socket ||
  !this.socket.connected
) {

  return false;

}


if (
  !this.chatConversationIds.has(
    normalisedConversationId
  )
) {

  return false;

}


this.socket.emit(
  "chat:message-update",
  {

    conversationId:
      normalisedConversationId,

    messageId:
      normalisedMessageId,

    updates:
      updates || {},

  }
);


return true;


}

// =====================================================
// DELETE CHAT MESSAGE
// =====================================================
//
// Retained for compatibility.
//
// The current server HTTP API remains authoritative
// for deletion.
//
// =====================================================

deleteChatMessage(
conversationId,
messageId
) {


const normalisedConversationId =
  normaliseId(
    conversationId ||
    this.currentChatConversationId
  );


const normalisedMessageId =
  normaliseId(
    messageId
  );


if (
  !normalisedConversationId ||
  !normalisedMessageId
) {

  return false;

}


if (
  !this.socket ||
  !this.socket.connected
) {

  return false;

}


if (
  !this.chatConversationIds.has(
    normalisedConversationId
  )
) {

  return false;

}


this.socket.emit(
  "chat:message-delete",
  {

    conversationId:
      normalisedConversationId,

    messageId:
      normalisedMessageId,

  }
);


return true;


}

// =====================================================
// CHAT TYPING
// =====================================================

setChatTyping(
conversationId,
isTyping
) {


const normalisedConversationId =
  normaliseId(
    conversationId ||
    this.currentChatConversationId
  );


if (
  !normalisedConversationId
) {

  return false;

}


if (
  !this.socket ||
  !this.socket.connected
) {

  return false;

}


if (
  !this.chatConversationIds.has(
    normalisedConversationId
  )
) {

  return false;

}


this.socket.emit(
  isTyping === true
    ? "chat:typing"
    : "chat:stop-typing",
  {

    conversationId:
      normalisedConversationId,

    isTyping:
      isTyping === true,

  }
);


return true;


}

// =====================================================
// MARK CHAT AS READ
// =====================================================

markChatRead(
conversationId,
lastMessageId =
null
) {


const normalisedConversationId =
  normaliseId(
    conversationId ||
    this.currentChatConversationId
  );


if (
  !normalisedConversationId
) {

  return false;

}


if (
  !this.socket ||
  !this.socket.connected
) {

  return false;

}


if (
  !this.chatConversationIds.has(
    normalisedConversationId
  )
) {

  return false;

}


this.socket.emit(
  "chat:read",
  {

    conversationId:
      normalisedConversationId,

    lastMessageId:
      normaliseId(
        lastMessageId
      ),

  }
);


return true;


}

// =====================================================
// CLOSE CHAT CONVERSATION
// =====================================================
//
// Retained as a compatibility method.
//
// Current authoritative implementation is REST:
//
// POST /api/chat/conversations/:conversationId/close
//
// =====================================================

closeChatConversation(
conversationId =
this.currentChatConversationId
) {


const normalisedConversationId =
  normaliseId(
    conversationId
  );


if (
  !normalisedConversationId
) {

  return false;

}


if (
  !this.socket ||
  !this.socket.connected
) {

  return false;

}


if (
  !this.chatConversationIds.has(
    normalisedConversationId
  )
) {

  return false;

}


this.socket.emit(
  "chat:conversation-close",
  {

    conversationId:
      normalisedConversationId,

  }
);


return true;


}

// =====================================================
// CHAT PARTICIPANT LEAVE
// =====================================================
//
// Alias retained for compatibility.
//
// =====================================================

leaveChatConversation(
conversationId =
this.currentChatConversationId
) {


return this.leaveChat(
  conversationId
);


}

// =====================================================
// GET STATE
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

  currentChatConversationId:
    this.currentChatConversationId,

  chatConversationIds:
    Array.from(
      this.chatConversationIds
    ),

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


  this.currentChatConversationId =
    null;


  this.chatConversationIds =
    new Set();


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

    chatConversationId:
      this.currentChatConversationId,

    chatConversationCount:
      this.chatConversationIds.size,

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


this.currentChatConversationId =
  null;


this.chatConversationIds =
  new Set();


this.token =
  null;


}

}

// =====================================================
// SINGLETON
// =====================================================

export default new GroupCallSocket();
