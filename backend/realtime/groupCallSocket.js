import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import Call from "../models/call.js";

import TrainingSession from "../models/TrainingSession.js";
import TrainingParticipant from "../models/TrainingParticipant.js";

import ChatConversation from "../models/ChatConversation.js";

import {
  applyGroupCallParticipantLeave,
} from "../services/groupCallLifecycle.js";


// =====================================================
// GROUP CALL / TRAINING / CHAT SOCKET
// =====================================================
//
// Shared Socket.IO transport for:
//
//   - Group Calls
//   - Remote Training
//   - Chat
//
// IMPORTANT:
//
// Database lifecycle remains owned by the relevant
// HTTP/domain layer.
//
// This module owns:
//
//   - socket authentication
//   - realtime signalling
//   - authenticated user-room membership
//   - group-call room membership
//   - training-session room membership
//   - chat conversation room membership
//   - chat typing signalling
//   - chat read signalling
//   - unexpected Group Call disconnect lifecycle
//
// It does NOT own:
//
//   - Agora media
//   - HTTP responses
//   - Group Call lifecycle rules
//   - Training Session lifecycle rules
//   - Chat message persistence
//   - Chat conversation creation
//
// Chat persistence remains:
//
//   ChatConversation
//        ↓
//   ChatMessage
//
// through the HTTP/domain routes.
//
// Socket.IO is realtime transport only.
//
// =====================================================


// =====================================================
// AUTHENTICATE SOCKET
// =====================================================

function authenticateSocket(
  socket
) {

  const token =
    socket.handshake?.auth?.token;


  if (
    !token
  ) {

    throw new Error(
      "AUTH_REQUIRED"
    );

  }


  const payload =
    jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    );


  if (
    !payload?.userId ||
    !payload?.tenantId
  ) {

    throw new Error(
      "INVALID_AUTH_TOKEN"
    );

  }


  return payload;

}


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
// GROUP CALL ROOM
// =====================================================

function getGroupCallRoom(
  callId
) {

  return (
    `group-call:${String(
      callId
    )}`
  );

}


// =====================================================
// TRAINING ROOM
// =====================================================

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
// CHAT ROOM
// =====================================================

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
// USER ROOM
// =====================================================
//
// Every authenticated socket joins:
//
//   user:<userId>
//
// Used for:
//
//   - group call invitations
//   - training invitations
//   - chat invitations
//   - future direct-user events
//
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


// =====================================================
// FIND GROUP CALL PARTICIPANT
// =====================================================

function findGroupCallParticipant(
  call,
  userId
) {

  return (
    call?.participants?.find(
      participant =>
        String(
          participant.userId
        ) ===
        String(
          userId
        )
    ) ||
    null
  );

}


// =====================================================
// FIND TRAINING PARTICIPANT
// =====================================================

async function findTrainingParticipant({
  sessionId,
  tenantId,
  userId,
}) {

  return TrainingParticipant.findOne({

    sessionId,

    tenantId,

    userId,

  });

}


// =====================================================
// CHAT PARTICIPANT USER ID
// =====================================================
//
// Supports the current V1 participant object:
//
//   {
//     userId,
//     name,
//     email,
//     status
//   }
//
// while remaining compatible with simpler historical
// representations.
// =====================================================

function getChatParticipantUserId(
  participant
) {

  if (
    participant === null ||
    participant === undefined
  ) {

    return null;

  }


  if (
    typeof participant !==
    "object"
  ) {

    return normaliseId(
      participant
    );

  }


  return (

    normaliseId(
      participant?.userId
    ) ||

    normaliseId(
      participant?.id
    ) ||

    normaliseId(
      participant?._id
    )

  );

}


// =====================================================
// CHECK CHAT PARTICIPATION
// =====================================================

function isChatParticipant(
  conversation,
  userId
) {

  const currentUserId =
    normaliseId(
      userId
    );


  if (
    !currentUserId
  ) {

    return false;

  }


  // ---------------------------------------------------
  // participants[]
  // ---------------------------------------------------

  if (
    Array.isArray(
      conversation?.participants
    )
  ) {

    const match =
      conversation.participants.some(
        participant =>
          getChatParticipantUserId(
            participant
          ) ===
          currentUserId
      );


    if (
      match
    ) {

      return true;

    }

  }


  // ---------------------------------------------------
  // participantIds[]
  // ---------------------------------------------------

  if (
    Array.isArray(
      conversation?.participantIds
    )
  ) {

    const match =
      conversation.participantIds.some(
        participantId =>
          normaliseId(
            participantId
          ) ===
          currentUserId
      );


    if (
      match
    ) {

      return true;

    }

  }


  // ---------------------------------------------------
  // Creator fallback
  // ---------------------------------------------------

  const ownerIds = [

    conversation?.createdByUserId,

    conversation?.ownerId,

  ];


  return ownerIds.some(
    value =>
      normaliseId(
        value
      ) ===
      currentUserId
  );

}


// =====================================================
// FIND CHAT CONVERSATION
// =====================================================

async function findChatConversation({
  conversationId,
  tenantId,
}) {

  const id =
    normaliseId(
      conversationId
    );


  if (
    !id
  ) {

    return null;

  }


  if (
    !mongoose.Types.ObjectId.isValid(
      id
    )
  ) {

    return null;

  }


  return ChatConversation.findOne({

    _id:
      id,

    tenantId,

  });

}


// =====================================================
// JOIN CHAT ROOM
// =====================================================
//
// IMPORTANT:
//
// Socket room membership does not change the database.
//
// ChatConversation remains authoritative.
//
// =====================================================

async function handleChatJoin(
  namespace,
  socket,
  conversationId
) {

  const id =
    normaliseId(
      conversationId
    );


  if (
    !id
  ) {

    socket.emit(
      "chat:error",
      {

        code:
          "CHAT_CONVERSATION_ID_REQUIRED",

        message:
          "conversationId is required",

      }
    );


    return;

  }


  try {

    // ===============================================
    // OBJECT ID
    // ===============================================

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {

      socket.emit(
        "chat:error",
        {

          conversationId:
            id,

          code:
            "CHAT_INVALID_CONVERSATION_ID",

          message:
            "Invalid conversationId",

        }
      );


      return;

    }


    // ===============================================
    // FIND CONVERSATION
    // ===============================================

    const conversation =
      await findChatConversation({

        conversationId:
          id,

        tenantId:
          socket.user.tenantId,

      });


    if (
      !conversation
    ) {

      socket.emit(
        "chat:error",
        {

          conversationId:
            id,

          code:
            "CHAT_CONVERSATION_NOT_FOUND",

          message:
            "Chat conversation not found",

        }
      );


      return;

    }


    // ===============================================
    // VERIFY PARTICIPANT
    // ===============================================

    const participant =
      isChatParticipant(
        conversation,
        socket.user.userId
      );


    if (
      !participant
    ) {

      socket.emit(
        "chat:error",
        {

          conversationId:
            id,

          code:
            "CHAT_ACCESS_DENIED",

          message:
            "You are not a participant in this conversation",

        }
      );


      return;

    }


    // ===============================================
    // DO NOT JOIN CLOSED CONVERSATIONS
    // ===============================================

    if (
      conversation.status ===
      "closed"
    ) {

      socket.emit(
        "chat:error",
        {

          conversationId:
            id,

          code:
            "CHAT_CONVERSATION_CLOSED",

          message:
            "This conversation is closed",

        }
      );


      return;

    }


    // ===============================================
    // JOIN ROOM
    // ===============================================

    const room =
      getChatRoom(
        id
      );


    await socket.join(
      room
    );


    // ===============================================
    // TRACK SOCKET MEMBERSHIP
    // ===============================================

    if (
      !(
        socket.data
          .chatConversationIds
        instanceof Set
      )
    ) {

      socket.data.chatConversationIds =
        new Set();

    }


    socket.data.chatConversationIds.add(
      id
    );


    socket.data.userId =
      String(
        socket.user.userId
      );

    socket.data.tenantId =
      String(
        socket.user.tenantId
      );


    console.log(
      "[GroupCallSocket] joined chat room",
      {

        socketId:
          socket.id,

        conversationId:
          id,

        userId:
          socket.user.userId,

        room,

      }
    );


    socket.emit(
      "chat:joined",
      {

        conversationId:
          id,

      }
    );


    // -------------------------------------------------
    // Notify existing room members that the participant
    // is now connected.
    //
    // The joining socket already receives chat:joined.
    // Others receive participant-connected.
    // -------------------------------------------------

    socket.to(
      room
    ).emit(
      "chat:participant-joined",
      {

        conversationId:
          id,

        userId:
          normaliseId(
            socket.user.userId
          ),

      }
    );

  }
  catch (error) {

    console.error(
      "[GroupCallSocket] chat:join failed",
      {

        conversationId:
          id,

        userId:
          socket.user.userId,

        error,

      }
    );


    socket.emit(
      "chat:error",
      {

        conversationId:
          id,

        code:
          "CHAT_JOIN_FAILED",

        message:
          "Failed to join chat conversation",

      }
    );

  }

}


// =====================================================
// LEAVE CHAT ROOM
// =====================================================

async function handleChatLeaveRoom(
  socket,
  conversationId = null
) {

  const id =
    normaliseId(
      conversationId
    );


  if (
    !id
  ) {

    return;

  }


  const room =
    getChatRoom(
      id
    );


  try {

    await socket.leave(
      room
    );

  }
  catch (error) {

    console.warn(
      "[GroupCallSocket] chat leave room failed",
      {

        conversationId:
          id,

        socketId:
          socket.id,

        error,

      }
    );

  }


  if (
    socket.data
      ?.chatConversationIds instanceof Set
  ) {

    socket.data.chatConversationIds.delete(
      id
    );

  }


  console.log(
    "[GroupCallSocket] left chat room",
    {

      socketId:
        socket.id,

      conversationId:
        id,

      userId:
        socket.data?.userId,

    }
  );


  socket.to(
    room
  ).emit(
    "chat:participant-left",
    {

      conversationId:
        id,

      userId:
        normaliseId(
          socket.data?.userId
        ),

      leftAt:
        new Date(),

    }
  );


  socket.emit(
    "chat:left",
    {

      conversationId:
        id,

    }
  );

}


// =====================================================
// LEAVE ALL CHAT ROOMS
// =====================================================

async function leaveAllChatRooms(
  socket
) {

  const conversationIds =
    socket.data
      ?.chatConversationIds instanceof Set

      ? Array.from(
          socket.data.chatConversationIds
        )

      : [];


  for (
    const conversationId of
      conversationIds
  ) {

    const room =
      getChatRoom(
        conversationId
      );


    try {

      // ---------------------------------------------
      // Notify remaining connected participants.
      // ---------------------------------------------

      socket.to(
        room
      ).emit(
        "chat:participant-left",
        {

          conversationId,

          userId:
            normaliseId(
              socket.data?.userId
            ),

          leftAt:
            new Date(),

        }
      );


      await socket.leave(
        room
      );

    }
    catch (error) {

      console.warn(
        "[GroupCallSocket] failed leaving chat room on disconnect",
        {

          conversationId,

          socketId:
            socket.id,

          error,

        }
      );

    }

  }


  if (
    socket.data
  ) {

    socket.data.chatConversationIds =
      new Set();

  }

}


// =====================================================
// VERIFY CHAT ROOM MEMBERSHIP
// =====================================================

function isSocketInChatRoom(
  socket,
  conversationId
) {

  const id =
    normaliseId(
      conversationId
    );


  if (
    !id
  ) {

    return false;

  }


  return (
    socket.data
      ?.chatConversationIds instanceof Set &&
    socket.data.chatConversationIds.has(
      id
    )
  );

}


// =====================================================
// CHAT TYPING
// =====================================================
//
// Realtime only.
//
// No MongoDB write.
// =====================================================

function handleChatTyping(
  namespace,
  socket,
  payload = {}
) {

  const conversationId =
    normaliseId(
      payload?.conversationId
    );


  if (
    !conversationId
  ) {

    return;

  }


  if (
    !isSocketInChatRoom(
      socket,
      conversationId
    )
  ) {

    console.warn(
      "[GroupCallSocket] chat typing ignored - socket is not in conversation",
      {

        conversationId,

        userId:
          socket.user.userId,

      }
    );


    return;

  }


  const room =
    getChatRoom(
      conversationId
    );


  socket.to(
    room
  ).emit(
    "chat:typing",
    {

      conversationId,

      userId:
        normaliseId(
          socket.user.userId
        ),

      isTyping:
        payload?.isTyping !== false,

    }
  );

}


// =====================================================
// CHAT STOP TYPING
// =====================================================

function handleChatStopTyping(
  namespace,
  socket,
  payload = {}
) {

  handleChatTyping(
    namespace,
    socket,
    {

      ...(payload || {}),

      isTyping:
        false,

    }
  );

}


// =====================================================
// CHAT READ
// =====================================================
//
// Realtime signalling only.
//
// A future HTTP/chat service can persist read state.
//
// =====================================================

function handleChatRead(
  namespace,
  socket,
  payload = {}
) {

  const conversationId =
    normaliseId(
      payload?.conversationId
    );


  if (
    !conversationId
  ) {

    return;

  }


  if (
    !isSocketInChatRoom(
      socket,
      conversationId
    )
  ) {

    console.warn(
      "[GroupCallSocket] chat read ignored - socket is not in conversation",
      {

        conversationId,

        userId:
          socket.user.userId,

      }
    );


    return;

  }


  const room =
    getChatRoom(
      conversationId
    );


  namespace
    .to(
      room
    )
    .emit(
      "chat:read",
      {

        conversationId,

        userId:
          normaliseId(
            socket.user.userId
          ),

        lastMessageId:
          normaliseId(
            payload?.lastMessageId
          ),

        readAt:
          new Date(),

      }
    );

}


// =====================================================
// JOIN TRAINING SESSION ROOM
// =====================================================

async function handleTrainingJoin(
  namespace,
  socket,
  sessionId
) {

  const id =
    normaliseId(
      sessionId
    );


  if (
    !id
  ) {

    console.warn(
      "[GroupCallSocket] training-session:join missing sessionId",
      {

        socketId:
          socket.id,

      }
    );


    return;

  }


  try {

    // ===============================================
    // FIND SESSION
    // ===============================================

    const session =
      await TrainingSession.findOne({

        _id:
          id,

        tenantId:
          socket.user.tenantId,

      });


    if (
      !session
    ) {

      console.warn(
        "[GroupCallSocket] training session not found",
        {

          sessionId:
            id,

          userId:
            socket.user.userId,

        }
      );


      return;

    }


    // ===============================================
    // FIND PARTICIPANT
    // ===============================================

    const participant =
      await findTrainingParticipant({

        sessionId:
          session._id,

        tenantId:
          socket.user.tenantId,

        userId:
          socket.user.userId,

      });


    if (
      !participant
    ) {

      console.warn(
        "[GroupCallSocket] training user is not a participant",
        {

          sessionId:
            id,

          userId:
            socket.user.userId,

        }
      );


      return;

    }


    // ===============================================
    // ELIGIBLE PARTICIPANT
    // ===============================================

    if (
      ![
        "invited",
        "joined",
      ].includes(
        participant.status
      )
    ) {

      console.warn(
        "[GroupCallSocket] training participant not eligible for room",
        {

          sessionId:
            id,

          userId:
            socket.user.userId,

          status:
            participant.status,

        }
      );


      return;

    }


    // ===============================================
    // SESSION MUST STILL EXIST
    // ===============================================

    if (
      session.status ===
      "ended"
    ) {

      console.warn(
        "[GroupCallSocket] training session already ended",
        {

          sessionId:
            id,

        }
      );


      return;

    }


    // ===============================================
    // JOIN SOCKET ROOM
    // ===============================================

    const room =
      getTrainingRoom(
        id
      );


    await socket.join(
      room
    );


    // ===============================================
    // STORE SOCKET STATE
    // ===============================================

    socket.data.trainingSessionId =
      id;

    socket.data.trainingUserId =
      String(
        socket.user.userId
      );

    socket.data.trainingTenantId =
      String(
        socket.user.tenantId
      );


    console.log(
      "[GroupCallSocket] joined training session room",
      {

        socketId:
          socket.id,

        sessionId:
          id,

        userId:
          socket.data.trainingUserId,

        room,

        participantStatus:
          participant.status,

      }
    );


    socket.emit(
      "training-session:joined",
      {

        sessionId:
          id,

      }
    );

  }
  catch (error) {

    console.error(
      "[GroupCallSocket] training-session:join failed",
      {

        sessionId:
          id,

        userId:
          socket.user.userId,

        error,

      }
    );

  }

}


// =====================================================
// LEAVE TRAINING SOCKET ROOM
// =====================================================

async function handleTrainingLeaveRoom(
  socket,
  sessionId = null
) {

  const id =
    normaliseId(
      sessionId ||
      socket.data?.trainingSessionId
    );


  if (
    !id
  ) {

    return;

  }


  const room =
    getTrainingRoom(
      id
    );


  try {

    await socket.leave(
      room
    );

  }
  catch (error) {

    console.warn(
      "[GroupCallSocket] training leave room failed",
      {

        sessionId:
          id,

        socketId:
          socket.id,

        error,

      }
    );

  }


  if (
    socket.data?.trainingSessionId ===
    id
  ) {

    socket.data.trainingSessionId =
      null;

  }


  console.log(
    "[GroupCallSocket] left training session room",
    {

      socketId:
        socket.id,

      sessionId:
        id,

      userId:
        socket.data?.trainingUserId,

    }
  );

}


// =====================================================
// REGISTER
// =====================================================

export function registerGroupCallSockets(
  io
) {

  const namespace =
    io.of(
      "/group-calls"
    );


  // ===================================================
  // AUTH MIDDLEWARE
  // ===================================================

  namespace.use(
    (
      socket,
      next
    ) => {

      try {

        socket.user =
          authenticateSocket(
            socket
          );


        next();

      }
      catch (error) {

        console.error(
          "[GroupCallSocket] authentication failed",
          {

            socketId:
              socket.id,

            error:
              error?.message,

          }
        );


        next(
          new Error(
            "UNAUTHORIZED"
          )
        );

      }

    }
  );


  // ===================================================
  // CONNECTION
  // ===================================================

  namespace.on(
    "connection",
    async socket => {

      // -----------------------------------------------
      // INITIAL SOCKET STATE
      // -----------------------------------------------

      socket.data.callId =
        null;

      socket.data.userId =
        String(
          socket.user.userId
        );

      socket.data.tenantId =
        String(
          socket.user.tenantId
        );

      socket.data.trainingSessionId =
        null;

      socket.data.trainingUserId =
        String(
          socket.user.userId
        );

      socket.data.trainingTenantId =
        String(
          socket.user.tenantId
        );

      socket.data.chatConversationIds =
        new Set();


      // =================================================
      // AUTHENTICATED USER ROOM
      // =================================================

      const userRoom =
        getUserRoom(
          socket.user.userId
        );


      try {

        await socket.join(
          userRoom
        );


        console.log(
          "[GroupCallSocket] joined authenticated user room",
          {

            socketId:
              socket.id,

            userId:
              String(
                socket.user.userId
              ),

            tenantId:
              String(
                socket.user.tenantId
              ),

            room:
              userRoom,

          }
        );

      }
      catch (error) {

        console.error(
          "[GroupCallSocket] failed to join authenticated user room",
          {

            socketId:
              socket.id,

            userId:
              String(
                socket.user.userId
              ),

            room:
              userRoom,

            error,

          }
        );

      }


      console.log(
        "[GroupCallSocket] connected",
        {

          socketId:
            socket.id,

          userId:
            String(
              socket.user.userId
            ),

          tenantId:
            String(
              socket.user.tenantId
            ),

        }
      );


      // =================================================
      // GROUP CALL JOIN
      // =================================================

      socket.on(
        "group-call:join",
        async payload => {

          try {

            const callId =
              normaliseId(
                payload?.callId
              );


            if (
              !callId
            ) {

              console.warn(
                "[GroupCallSocket] group-call:join missing callId",
                {

                  socketId:
                    socket.id,

                }
              );


              return;

            }


            // =========================================
            // FIND CALL
            // =========================================

            const call =
              await Call.findOne({

                _id:
                  callId,

                tenantId:
                  socket.user.tenantId,

                type:
                  "group",

              });


            if (
              !call
            ) {

              console.warn(
                "[GroupCallSocket] group call not found",
                {

                  callId,

                  userId:
                    socket.user.userId,

                }
              );


              return;

            }


            // =========================================
            // VERIFY PARTICIPANT
            // =========================================

            const participant =
              findGroupCallParticipant(
                call,
                socket.user.userId
              );


            if (
              !participant
            ) {

              console.warn(
                "[GroupCallSocket] user is not a participant",
                {

                  callId,

                  userId:
                    socket.user.userId,

                }
              );


              return;

            }


            // =========================================
            // ACTIVE PARTICIPANT ONLY
            // =========================================

            if (
              ![
                "accepted",
                "joined",
              ].includes(
                participant.status
              )
            ) {

              console.warn(
                "[GroupCallSocket] participant not active",
                {

                  callId,

                  userId:
                    socket.user.userId,

                  status:
                    participant.status,

                }
              );


              return;

            }


            // =========================================
            // JOIN ROOM
            // =========================================

            const room =
              getGroupCallRoom(
                callId
              );


            await socket.join(
              room
            );


            // =========================================
            // STORE SOCKET STATE
            // =========================================

            socket.data.callId =
              callId;

            socket.data.userId =
              String(
                socket.user.userId
              );

            socket.data.tenantId =
              String(
                socket.user.tenantId
              );


            console.log(
              "[GroupCallSocket] joined call room",
              {

                socketId:
                  socket.id,

                callId,

                userId:
                  socket.data.userId,

                room,

              }
            );


            socket.emit(
              "group-call:joined",
              {

                callId,

              }
            );

          }
          catch (error) {

            console.error(
              "[GroupCallSocket] group-call:join failed",
              error
            );

          }

        }
      );


      // =================================================
      // TRAINING SESSION JOIN
      // =================================================

      socket.on(
        "training-session:join",
        async payload => {

          await handleTrainingJoin(
            namespace,
            socket,
            payload?.sessionId
          );

        }
      );


      // =================================================
      // CHAT JOIN
      // =================================================

      socket.on(
        "chat:join",
        async payload => {

          await handleChatJoin(
            namespace,
            socket,
            payload?.conversationId
          );

        }
      );


      // =================================================
      // CHAT LEAVE
      // =================================================
      //
      // Current client service uses:
      //
      //   chat:leave
      //
      // Earlier transport used:
      //
      //   chat:leave-room
      //
      // Support BOTH so existing templates are not broken.
      // =================================================

      const chatLeaveHandler =
        async payload => {

          await handleChatLeaveRoom(
            socket,
            payload?.conversationId
          );

        };


      socket.on(
        "chat:leave",
        chatLeaveHandler
      );


      socket.on(
        "chat:leave-room",
        chatLeaveHandler
      );


      // =================================================
      // CHAT TYPING
      // =================================================

      socket.on(
        "chat:typing",
        payload => {

          handleChatTyping(
            namespace,
            socket,
            payload
          );

        }
      );


      // =================================================
      // CHAT STOP TYPING
      // =================================================

      socket.on(
        "chat:stop-typing",
        payload => {

          handleChatStopTyping(
            namespace,
            socket,
            payload
          );

        }
      );


      // =================================================
      // CHAT READ
      // =================================================

      socket.on(
        "chat:read",
        payload => {

          handleChatRead(
            namespace,
            socket,
            payload
          );

        }
      );


      // =================================================
      // GROUP CALL LEAVE ROOM
      // =================================================

      socket.on(
        "group-call:leave-room",
        async payload => {

          const callId =
            normaliseId(
              payload?.callId ||
              socket.data?.callId
            );


          if (
            !callId
          ) {

            return;

          }


          const room =
            getGroupCallRoom(
              callId
            );


          try {

            await socket.leave(
              room
            );

          }
          catch (error) {

            console.warn(
              "[GroupCallSocket] leave room failed",
              {

                callId,

                socketId:
                  socket.id,

                error,

              }
            );

          }


          if (
            socket.data?.callId ===
            callId
          ) {

            socket.data.callId =
              null;

          }


          console.log(
            "[GroupCallSocket] left call room",
            {

              socketId:
                socket.id,

              callId,

              userId:
                socket.data?.userId,

            }
          );

        }
      );


      // =================================================
      // TRAINING LEAVE ROOM
      // =================================================

      socket.on(
        "training-session:leave-room",
        async payload => {

          await handleTrainingLeaveRoom(
            socket,
            payload?.sessionId
          );

        }
      );


      // =================================================
      // DISCONNECT
      // =================================================
      //
      // Group Call:
      //   unexpected disconnect applies lifecycle.
      //
      // Training:
      //   unexpected disconnect marks joined participant
      //   as left.
      //
      // Chat:
      //   socket room membership is cleaned up, but MongoDB
      //   conversation membership is NOT changed.
      //
      // HTTP routes remain authoritative for chat leave.
      // =================================================

      socket.on(
        "disconnect",
        async (
          reason
        ) => {

          const callId =
            socket.data?.callId;


          const trainingSessionId =
            socket.data?.trainingSessionId;


          const userId =
            socket.data?.userId;


          const chatConversationIds =
            socket.data
              ?.chatConversationIds instanceof Set

              ? Array.from(
                  socket.data.chatConversationIds
                )

              : [];


          // =============================================
          // CHAT CLEANUP
          // =============================================

          await leaveAllChatRooms(
            socket
          );


          // =============================================
          // NO CALL / TRAINING
          // =============================================

          if (
            !callId &&
            !trainingSessionId
          ) {

            console.log(
              "[GroupCallSocket] disconnected with no active call/session",
              {

                socketId:
                  socket.id,

                reason,

                chatConversationCount:
                  chatConversationIds.length,

              }
            );


            return;

          }


          // =============================================
          // GROUP CALL DISCONNECT
          // =============================================

          if (
            callId &&
            userId
          ) {

            console.log(
              "[GroupCallSocket] unexpected group call disconnect",
              {

                socketId:
                  socket.id,

                callId,

                userId,

                reason,

              }
            );


            try {

              const call =
                await Call.findOne({

                  _id:
                    callId,

                  tenantId:
                    socket.data.tenantId,

                  type:
                    "group",

                });


              if (
                !call
              ) {

                console.log(
                  "[GroupCallSocket] call no longer exists",
                  {
                    callId,
                  }
                );

              }
              else {

                const lifecycle =
                  applyGroupCallParticipantLeave(

                    call,

                    userId,

                    {

                      reason:
                        "socket-disconnected",

                    }

                  );


                if (
                  lifecycle.ok
                ) {

                  await call.save();


                  const room =
                    getGroupCallRoom(
                      callId
                    );


                  if (
                    lifecycle.callEnded
                  ) {

                    namespace
                      .to(
                        room
                      )
                      .emit(
                        "group-call:ended",
                        {

                          callId,

                          reason:
                            lifecycle.isHost
                              ? "host-disconnected"
                              : "no-participants",

                          endedBy:
                            userId,

                          endedAt:
                            lifecycle.timestamp,

                        }
                      );


                    console.log(
                      "[GroupCallSocket] GROUP_CALL_ENDED",
                      {

                        callId,

                        userId,

                        reason:
                          lifecycle.isHost
                            ? "host-disconnected"
                            : "no-participants",

                      }
                    );

                  }
                  else {

                    namespace
                      .to(
                        room
                      )
                      .emit(
                        "group-call:participant-left",
                        {

                          callId,

                          userId,

                          leftAt:
                            lifecycle.timestamp,

                        }
                      );


                    console.log(
                      "[GroupCallSocket] GROUP_CALL_PARTICIPANT_LEFT",
                      {

                        callId,

                        userId,

                      }
                    );

                  }

                }
                else {

                  console.warn(
                    "[GroupCallSocket] group lifecycle failed",
                    {

                      callId,

                      userId,

                      lifecycle,

                    }
                  );

                }

              }

            }
            catch (error) {

              console.error(
                "[GroupCallSocket] group disconnect lifecycle failed",
                {

                  callId,

                  userId,

                  error,

                }
              );

            }

          }


          // =============================================
          // TRAINING DISCONNECT
          // =============================================

          if (
            trainingSessionId &&
            userId
          ) {

            console.log(
              "[GroupCallSocket] unexpected training session disconnect",
              {

                socketId:
                  socket.id,

                sessionId:
                  trainingSessionId,

                userId,

                reason,

              }
            );


            try {

              const session =
                await TrainingSession.findOne({

                  _id:
                    trainingSessionId,

                  tenantId:
                    socket.data.trainingTenantId,

                });


              if (
                !session
              ) {

                console.log(
                  "[GroupCallSocket] training session no longer exists",
                  {

                    sessionId:
                      trainingSessionId,

                  }
                );

              }
              else if (
                session.status ===
                "ended"
              ) {

                console.log(
                  "[GroupCallSocket] training session already ended",
                  {

                    sessionId:
                      trainingSessionId,

                  }
                );

              }
              else {

                const participant =
                  await TrainingParticipant.findOne({

                    sessionId:
                      session._id,

                    tenantId:
                      socket.data.trainingTenantId,

                    userId,

                  });


                if (
                  participant &&
                  participant.status ===
                    "joined"
                ) {

                  participant.status =
                    "left";

                  participant.leftAt =
                    new Date();


                  await participant.save();


                  namespace
                    .to(
                      getTrainingRoom(
                        trainingSessionId
                      )
                    )
                    .emit(
                      "training-session:participant-left",
                      {

                        sessionId:
                          trainingSessionId,

                        userId,

                        leftAt:
                          participant.leftAt,

                      }
                    );


                  console.log(
                    "[GroupCallSocket] TRAINING_PARTICIPANT_LEFT",
                    {

                      sessionId:
                        trainingSessionId,

                      userId,

                    }
                  );

                }

              }

            }
            catch (error) {

              console.error(
                "[GroupCallSocket] training disconnect lifecycle failed",
                {

                  sessionId:
                    trainingSessionId,

                  userId,

                  error,

                }
              );

            }

          }

        }
      );

    }
  );


  // ===================================================
  // EXPOSE ROOM HELPERS
  // ===================================================
  //
  // These are convenience helpers for HTTP/domain layers
  // that already have the namespace instance:
  //
  //   const namespace = req.app.get("io").of("/group-calls");
  //
  // Existing routes can continue using literal room names,
  // so these are additive and non-breaking.
  // ===================================================

  namespace.getUserRoom =
    getUserRoom;

  namespace.getGroupCallRoom =
    getGroupCallRoom;

  namespace.getTrainingRoom =
    getTrainingRoom;

  namespace.getChatRoom =
    getChatRoom;


  // ===================================================
  // REGISTERED
  // ===================================================

  console.log(
    "[GroupCallSocket] namespace registered",
    {

      namespace:
        "/group-calls",

      features: [

        "group-call",

        "training-session",

        "chat",

      ],

    }
  );


  return namespace;

}