// src/runtime/GroupCallSocketRuntime.js

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useRuntimeState,
} from "../context/RuntimeStateContext";

import {
  useActionContext,
} from "../context/ActionContext";

import agoraEngine
  from "../services/agoraEngine";

import groupCallSocket
  from "../services/groupCallSocket";


// =====================================================
// HELPERS
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
// NORMALISE ARRAY
// =====================================================

function normaliseArray(
  value
) {

  return Array.isArray(
    value
  )
    ? value
    : [];

}


// =====================================================
// CURRENT USER ID
// =====================================================

function resolveCurrentUserId(
  runtime,
  session
) {

  const candidates = [

    runtime.get?.(
      "auth.userId"
    ),

    runtime.get?.(
      "auth.id"
    ),

    runtime.get?.(
      "user.id"
    ),

    runtime.get?.(
      "user.userId"
    ),

    session?.userId,

    session?.user?.userId,

    session?.user?.id,

    session?.user?._id,

    session?.user?._id?.toString?.(),

  ];


  for (
    const candidate of
      candidates
  ) {

    const id =
      normaliseId(
        candidate
      );


    if (
      id
    ) {

      return id;

    }

  }


  return null;

}


// =====================================================
// CHAT MESSAGE ID
// =====================================================

function resolveChatMessageId(
  message
) {

  return (
    normaliseId(
      message?.messageId
    ) ||

    normaliseId(
      message?.id
    ) ||

    normaliseId(
      message?._id
    )
  );

}


// =====================================================
// NORMALISE CHAT MESSAGE
// =====================================================

function normaliseChatMessage(
  message,
  fallbackConversationId = null
) {

  if (
    !message ||
    typeof message !==
      "object"
  ) {

    return null;

  }


  const conversationId =
    normaliseId(
      message?.conversationId ||
      fallbackConversationId
    );


  const messageId =
    resolveChatMessageId(
      message
    );


  return {

    ...message,

    conversationId,

    messageId,

    senderUserId:
      normaliseId(
        message?.senderUserId ||
        message?.userId
      ),

  };

}


// =====================================================
// MERGE CHAT MESSAGE
// =====================================================
//
// Socket events can race with:
//
//   HTTP send response
//   runtime state updates
//   reconnects
//
// Therefore we deduplicate primarily by messageId.
//
// =====================================================

function mergeChatMessage(
  messages,
  incomingMessage
) {

  const current =
    normaliseArray(
      messages
    );


  const message =
    normaliseChatMessage(
      incomingMessage
    );


  if (
    !message
  ) {

    return current;

  }


  const incomingMessageId =
    message.messageId;


  if (
    incomingMessageId
  ) {

    const existingIndex =
      current.findIndex(
        item =>
          resolveChatMessageId(
            item
          ) ===
          incomingMessageId
      );


    if (
      existingIndex >= 0
    ) {

      const next =
        [...current];


      next[
        existingIndex
      ] = {

        ...next[
          existingIndex
        ],

        ...message,

      };


      return next;

    }

  }


  return [

    ...current,

    message,

  ];

}


// =====================================================
// REMOVE CHAT MESSAGE
// =====================================================

function removeChatMessage(
  messages,
  messageId
) {

  const resolvedId =
    normaliseId(
      messageId
    );


  if (
    !resolvedId
  ) {

    return normaliseArray(
      messages
    );

  }


  return normaliseArray(
    messages
  ).filter(
    message =>
      resolveChatMessageId(
        message
      ) !==
      resolvedId
  );

}


// =====================================================
// UPDATE CHAT MESSAGE
// =====================================================

function updateChatMessage(
  messages,
  incomingMessage
) {

  const current =
    normaliseArray(
      messages
    );


  const message =
    normaliseChatMessage(
      incomingMessage
    );


  if (
    !message
  ) {

    return current;

  }


  const messageId =
    message.messageId;


  if (
    !messageId
  ) {

    return current;

  }


  return current.map(
    item => {

      const itemId =
        resolveChatMessageId(
          item
        );


      if (
        itemId !==
        messageId
      ) {

        return item;

      }


      return {

        ...item,

        ...message,

      };

    }
  );

}


// =====================================================
// TYPING USER MAP
// =====================================================

function updateTypingUser(
  typingUsers,
  userId,
  isTyping
) {

  const id =
    normaliseId(
      userId
    );


  if (
    !id
  ) {

    return {
      ...(
        typingUsers &&
        typeof typingUsers ===
          "object"
          ? typingUsers
          : {}
      ),
    };

  }


  const current = {

    ...(
      typingUsers &&
      typeof typingUsers ===
        "object"
        ? typingUsers
        : {}
    ),

  };


  if (
    isTyping
  ) {

    current[id] =
      true;

  }
  else {

    delete current[id];

  }


  return current;

}


// =====================================================
// COMPONENT
// =====================================================
//
// Runtime bridge for:
//
//   Group Calls
//   Remote Training
//   Chat
//
// Responsibilities:
//
//   - connect authenticated socket
//   - join appropriate realtime rooms
//   - reconcile realtime events with runtime state
//   - clean up Agora when server ends a session
//   - maintain realtime Chat state
//
// NOT responsible for:
//
//   - database lifecycle
//   - socket implementation
//   - REST route implementation
//   - Agora implementation
//   - Chat message persistence
//
// IMPORTANT:
//
// The socket service remains the transport layer.
//
// REST/domain routes remain authoritative for persistence.
//
// =====================================================

export default function GroupCallSocketRuntime() {

  // ===================================================
  // AUTH
  // ===================================================

  const {
    session,
    loading:
      authLoading,
  } =
  useAuth();


  // ===================================================
  // RUNTIME
  // ===================================================

  const runtime =
    useRuntimeState();


  const {
    runAction,
  } =
  useActionContext();


  // ===================================================
  // AUTH TOKEN
  // ===================================================

  const accessToken =
    session?.tokens?.accessToken ||
    null;


  // ===================================================
  // USER
  // ===================================================

  const currentUserId =
    resolveCurrentUserId(
      runtime,
      session
    );


  // ===================================================
  // GROUP CALL STATE
  // ===================================================

  const [
    callId,
    setCallId,
  ] =
  useState(
    () =>
      normaliseId(
        runtime.get?.(
          "call.id"
        )
      )
  );


  const [
    callType,
    setCallType,
  ] =
  useState(
    () =>
      runtime.get?.(
        "call.type"
      ) || null
  );


  const [
    callJoined,
    setCallJoined,
  ] =
  useState(
    () =>
      runtime.get?.(
        "call.joined"
      ) === true
  );


  // ===================================================
  // TRAINING STATE
  // ===================================================

  const [
    trainingSessionId,
    setTrainingSessionId,
  ] =
  useState(
    () =>
      normaliseId(
        runtime.get?.(
          "training.sessionId"
        )
      )
  );


  const [
    trainingJoined,
    setTrainingJoined,
  ] =
  useState(
    () =>
      runtime.get?.(
        "training.joined"
      ) === true
  );


  // ===================================================
  // CHAT STATE
  // ===================================================

  const [
    chatConversationId,
    setChatConversationId,
  ] =
  useState(
    () =>
      normaliseId(
        runtime.get?.(
          "chat.conversationId"
        ) ||
        runtime.get?.(
          "chat.id"
        )
      )
  );


  const [
    chatJoined,
    setChatJoined,
  ] =
  useState(
    () =>
      runtime.get?.(
        "chat.joined"
      ) === true
  );


  // ===================================================
  // CHAT MESSAGE STATE
  // ===================================================

  const [
    chatMessages,
    setChatMessages,
  ] =
  useState(
    () =>
      normaliseArray(
        runtime.get?.(
          "chat.messages"
        )
      )
  );


  // ===================================================
  // REFS
  // ===================================================

  const mountedRef =
    useRef(false);


  // ---------------------------------------------------
  // Group Call
  // ---------------------------------------------------

  const callIdRef =
    useRef(callId);

  const callTypeRef =
    useRef(callType);

  const callJoinedRef =
    useRef(callJoined);


  // ---------------------------------------------------
  // Training
  // ---------------------------------------------------

  const trainingSessionIdRef =
    useRef(trainingSessionId);

  const trainingJoinedRef =
    useRef(trainingJoined);


  // ---------------------------------------------------
  // Chat
  // ---------------------------------------------------

  const chatConversationIdRef =
    useRef(
      chatConversationId
    );

  const chatJoinedRef =
    useRef(
      chatJoined
    );


  // ---------------------------------------------------
  // Connection
  // ---------------------------------------------------

  const connectedRef =
    useRef(false);


  // ---------------------------------------------------
  // Cleanup locks
  // ---------------------------------------------------

  const groupCallCleanupRunningRef =
    useRef(false);

  const trainingCleanupRunningRef =
    useRef(false);

  const chatCleanupRunningRef =
    useRef(false);


  // ---------------------------------------------------
  // Invitation refresh locks
  // ---------------------------------------------------

  const groupInvitationRefreshRef =
    useRef(false);

  const trainingInvitationRefreshRef =
    useRef(false);


  // ---------------------------------------------------
  // Refs for current chat state
  // ---------------------------------------------------

  const chatMessagesRef =
    useRef(
      chatMessages
    );


  // ===================================================
  // REF SYNCHRONISATION
  // ===================================================

  callIdRef.current =
    callId;


  callTypeRef.current =
    callType;


  callJoinedRef.current =
    callJoined;


  trainingSessionIdRef.current =
    trainingSessionId;


  trainingJoinedRef.current =
    trainingJoined;


  chatConversationIdRef.current =
    chatConversationId;


  chatJoinedRef.current =
    chatJoined;


  chatMessagesRef.current =
    chatMessages;


  // ===================================================
  // RUNTIME SUBSCRIPTIONS
  // ===================================================

  useEffect(() => {

    mountedRef.current =
      true;


    // =================================================
    // INITIAL GROUP CALL STATE
    // =================================================

    setCallId(
      normaliseId(
        runtime.get?.(
          "call.id"
        )
      )
    );


    setCallType(
      runtime.get?.(
        "call.type"
      ) || null
    );


    setCallJoined(
      runtime.get?.(
        "call.joined"
      ) === true
    );


    // =================================================
    // INITIAL TRAINING STATE
    // =================================================

    setTrainingSessionId(
      normaliseId(
        runtime.get?.(
          "training.sessionId"
        )
      )
    );


    setTrainingJoined(
      runtime.get?.(
        "training.joined"
      ) === true
    );


    // =================================================
    // INITIAL CHAT STATE
    // =================================================

    setChatConversationId(
      normaliseId(
        runtime.get?.(
          "chat.conversationId"
        ) ||
        runtime.get?.(
          "chat.id"
        )
      )
    );


    setChatJoined(
      runtime.get?.(
        "chat.joined"
      ) === true
    );


    setChatMessages(
      normaliseArray(
        runtime.get?.(
          "chat.messages"
        )
      )
    );


    // =================================================
    // GROUP CALL ID
    // =================================================

    const unsubscribeCallId =
      runtime.subscribe?.(
        "call.id",
        value => {

          const next =
            normaliseId(
              value
            );


          callIdRef.current =
            next;


          setCallId(
            next
          );

        }
      );


    // =================================================
    // CALL TYPE
    // =================================================

    const unsubscribeCallType =
      runtime.subscribe?.(
        "call.type",
        value => {

          const next =
            value
              ? String(
                  value
                ).trim()
              : null;


          callTypeRef.current =
            next;


          setCallType(
            next
          );

        }
      );


    // =================================================
    // CALL JOINED
    // =================================================

    const unsubscribeCallJoined =
      runtime.subscribe?.(
        "call.joined",
        value => {

          const next =
            value === true;


          callJoinedRef.current =
            next;


          setCallJoined(
            next
          );

        }
      );


    // =================================================
    // TRAINING SESSION
    // =================================================

    const unsubscribeTrainingSessionId =
      runtime.subscribe?.(
        "training.sessionId",
        value => {

          const next =
            normaliseId(
              value
            );


          trainingSessionIdRef.current =
            next;


          setTrainingSessionId(
            next
          );

        }
      );


    // =================================================
    // TRAINING JOINED
    // =================================================

    const unsubscribeTrainingJoined =
      runtime.subscribe?.(
        "training.joined",
        value => {

          const next =
            value === true;


          trainingJoinedRef.current =
            next;


          setTrainingJoined(
            next
          );

        }
      );


    // =================================================
    // CHAT CONVERSATION ID
    // =================================================

    const unsubscribeChatConversationId =
      runtime.subscribe?.(
        "chat.conversationId",
        value => {

          const next =
            normaliseId(
              value
            );


          chatConversationIdRef.current =
            next;


          setChatConversationId(
            next
          );

        }
      );


    // =================================================
    // CHAT LEGACY ID FALLBACK
    // =================================================

    const unsubscribeChatId =
      runtime.subscribe?.(
        "chat.id",
        value => {

          const next =
            normaliseId(
              value
            );


          if (
            chatConversationIdRef.current
          ) {

            return;

          }


          chatConversationIdRef.current =
            next;


          setChatConversationId(
            next
          );

        }
      );


    // =================================================
    // CHAT JOINED
    // =================================================

    const unsubscribeChatJoined =
      runtime.subscribe?.(
        "chat.joined",
        value => {

          const next =
            value === true;


          chatJoinedRef.current =
            next;


          setChatJoined(
            next
          );

        }
      );


    // =================================================
    // CHAT MESSAGES
    // =================================================

    const unsubscribeChatMessages =
      runtime.subscribe?.(
        "chat.messages",
        value => {

          const next =
            normaliseArray(
              value
            );


          chatMessagesRef.current =
            next;


          setChatMessages(
            next
          );

        }
      );


    return () => {

      mountedRef.current =
        false;


      unsubscribeCallId?.();

      unsubscribeCallType?.();

      unsubscribeCallJoined?.();

      unsubscribeTrainingSessionId?.();

      unsubscribeTrainingJoined?.();

      unsubscribeChatConversationId?.();

      unsubscribeChatId?.();

      unsubscribeChatJoined?.();

      unsubscribeChatMessages?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // SOCKET CONNECTION
  // ===================================================

  useEffect(() => {

    if (
      authLoading ||
      !accessToken
    ) {

      return undefined;

    }


    console.log(
      "[GroupCallSocketRuntime] connecting socket"
    );


    const socket =
      groupCallSocket.connect(
        accessToken
      );


    if (
      !socket
    ) {

      console.warn(
        "[GroupCallSocketRuntime] socket connection unavailable"
      );

    }


    return undefined;

  }, [
    authLoading,
    accessToken,
  ]);


  // ===================================================
  // SOCKET CONNECTED
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "CONNECTED",
        payload => {

          connectedRef.current =
            true;


          console.log(
            "[GroupCallSocketRuntime] SOCKET CONNECTED",
            payload
          );


          // ---------------------------------------------
          // GROUP CALL
          // ---------------------------------------------

          const activeCallId =
            callIdRef.current;


          const activeCallType =
            callTypeRef.current;


          const activeCallJoined =
            callJoinedRef.current;


          if (
            activeCallType ===
              "group" &&
            activeCallJoined &&
            activeCallId
          ) {

            groupCallSocket.joinCall(
              activeCallId
            );

          }


          // ---------------------------------------------
          // TRAINING
          // ---------------------------------------------

          const activeTrainingSessionId =
            trainingSessionIdRef.current;


          const activeTrainingJoined =
            trainingJoinedRef.current;


          if (
            activeTrainingSessionId &&
            activeTrainingJoined
          ) {

            groupCallSocket.joinTrainingSession(
              activeTrainingSessionId
            );

          }


          // ---------------------------------------------
          // CHAT
          // ---------------------------------------------

          const activeChatConversationId =
            chatConversationIdRef.current;


          const activeChatJoined =
            chatJoinedRef.current;


          if (
            activeChatConversationId &&
            activeChatJoined
          ) {

            groupCallSocket.joinChat(
              activeChatConversationId
            );

          }

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, []);


  // ===================================================
  // SOCKET DISCONNECTED
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "DISCONNECTED",
        payload => {

          connectedRef.current =
            false;


          console.log(
            "[GroupCallSocketRuntime] SOCKET DISCONNECTED",
            payload
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, []);


  // ===================================================
  // SOCKET ERROR
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "CONNECT_ERROR",
        payload => {

          connectedRef.current =
            false;


          console.error(
            "[GroupCallSocketRuntime] SOCKET ERROR",
            payload
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, []);


  // ===================================================
  // GROUP CALL INVITATION
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "GROUP_CALL_INVITED",
        async payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const invitationUserId =
            normaliseId(
              payload?.userId
            );


          const invitationCallId =
            normaliseId(
              payload?.callId
            );


          if (
            !currentUserId
          ) {

            console.warn(
              "[GroupCallSocketRuntime] group invitation received without current user",
              {
                payload,
              }
            );


            return;

          }


          if (
            invitationUserId !==
            currentUserId
          ) {

            return;

          }


          if (
            groupInvitationRefreshRef.current
          ) {

            return;

          }


          groupInvitationRefreshRef.current =
            true;


          try {

            console.log(
              "[GroupCallSocketRuntime] GROUP_CALL_INVITED received",
              {

                callId:
                  invitationCallId,

                userId:
                  invitationUserId,

                invitedBy:
                  payload?.invitedBy,

              }
            );


            await runAction(
              "call.fetchPendingInvitations"
            );

          }
          catch (error) {

            console.error(
              "[GroupCallSocketRuntime] group invitation refresh failed",
              error
            );

          }
          finally {

            groupInvitationRefreshRef.current =
              false;

          }

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    currentUserId,
    runAction,
  ]);


  // ===================================================
  // TRAINING INVITATION
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "TRAINING_SESSION_INVITED",
        async payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const invitationUserId =
            normaliseId(
              payload?.userId
            );


          const invitationSessionId =
            normaliseId(
              payload?.sessionId
            );


          console.log(
            "[GroupCallSocketRuntime] TRAINING EVENT RECEIVED",
            {

              event:
                "TRAINING_SESSION_INVITED",

              sessionId:
                invitationSessionId,

              userId:
                invitationUserId,

              currentUserId,

            }
          );


          if (
            !currentUserId
          ) {

            console.warn(
              "[GroupCallSocketRuntime] training invitation received without current user"
            );


            return;

          }


          if (
            invitationUserId &&
            invitationUserId !==
              currentUserId
          ) {

            return;

          }


          if (
            trainingInvitationRefreshRef.current
          ) {

            return;

          }


          trainingInvitationRefreshRef.current =
            true;


          try {

            console.log(
              "[GroupCallSocketRuntime] refreshing training invitations"
            );


            const result =
              await runAction(
                "training.fetchPendingSessions"
              );


            console.log(
              "[GroupCallSocketRuntime] training invitations refreshed",
              {

                sessionId:
                  invitationSessionId,

                result,

              }
            );

          }
          catch (error) {

            console.error(
              "[GroupCallSocketRuntime] training invitation refresh failed",
              error
            );

          }
          finally {

            trainingInvitationRefreshRef.current =
              false;

          }

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    currentUserId,
    runAction,
  ]);


  // ===================================================
  // GROUP CALL ROOM SYNC
  // ===================================================

  useEffect(() => {

    if (
      callType !==
        "group"
    ) {

      return;

    }


    if (
      !callJoined ||
      !callId
    ) {

      return;

    }


    if (
      !groupCallSocket.isConnected()
    ) {

      return;

    }


    groupCallSocket.joinCall(
      callId
    );

  }, [
    callType,
    callJoined,
    callId,
  ]);


  // ===================================================
  // TRAINING ROOM SYNC
  // ===================================================

  useEffect(() => {

    if (
      !trainingSessionId ||
      !trainingJoined
    ) {

      return;

    }


    if (
      !groupCallSocket.isConnected()
    ) {

      return;

    }


    console.log(
      "[GroupCallSocketRuntime] joining training session",
      {

        sessionId:
          trainingSessionId,

      }
    );


    groupCallSocket.joinTrainingSession(
      trainingSessionId
    );

  }, [
    trainingSessionId,
    trainingJoined,
  ]);


  // ===================================================
  // CHAT ROOM SYNC
  // ===================================================
  //
  // Chat is independent of Agora/call lifecycle.
  //
  // A user may have a chat open without being in:
  //
  //   a Group Call
  //   a Training Session
  //
  // ===================================================

  useEffect(() => {

    if (
      !chatConversationId ||
      !chatJoined
    ) {

      return;

    }


    if (
      !groupCallSocket.isConnected()
    ) {

      return;

    }


    console.log(
      "[GroupCallSocketRuntime] joining chat conversation",
      {

        conversationId:
          chatConversationId,

      }
    );


    groupCallSocket.joinChat(
      chatConversationId
    );

  }, [
    chatConversationId,
    chatJoined,
  ]);


  // ===================================================
  // CHAT JOINED
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "CHAT_JOINED",
        payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const joinedConversationId =
            normaliseId(
              payload?.conversationId
            );


          const activeConversationId =
            chatConversationIdRef.current;


          if (
            joinedConversationId &&
            activeConversationId &&
            joinedConversationId !==
              activeConversationId
          ) {

            return;

          }


          console.log(
            "[GroupCallSocketRuntime] CHAT_JOINED",
            {

              conversationId:
                joinedConversationId,

            }
          );


          chatJoinedRef.current =
            true;


          setChatJoined(
            true
          );


          runtime.patch?.(
            "chat",
            {

              conversationId:
                joinedConversationId ||
                activeConversationId,

              joined:
                true,

              connected:
                true,

            }
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // CHAT INVITATION
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "CHAT_INVITED",
        payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const invitationUserId =
            normaliseId(
              payload?.userId
            );


          const invitationConversationId =
            normaliseId(
              payload?.conversationId
            );


          if (
            !currentUserId
          ) {

            console.warn(
              "[GroupCallSocketRuntime] chat invitation received without current user",
              {
                payload,
              }
            );


            return;

          }


          if (
            invitationUserId &&
            invitationUserId !==
              currentUserId
          ) {

            return;

          }


          console.log(
            "[GroupCallSocketRuntime] CHAT_INVITED",
            {

              conversationId:
                invitationConversationId,

              userId:
                invitationUserId,

              invitedBy:
                payload?.invitedBy,

            }
          );


          const currentInvitations =
            normaliseArray(
              runtime.get?.(
                "chat.invitations"
              )
            );


          const invitationExists =
            currentInvitations.some(
              invitation =>
                normaliseId(
                  invitation?.conversationId
                ) ===
                invitationConversationId
            );


          if (
            invitationExists
          ) {

            return;

          }


          runtime.set?.(
            "chat.invitations",
            [

              ...currentInvitations,

              {

                ...payload,

                conversationId:
                  invitationConversationId,

                projectId:
                  normaliseId(
                    payload?.projectId
                  ),

                invitedBy:
                  normaliseId(
                    payload?.invitedBy
                  ),

                receivedAt:
                  new Date().toISOString(),

                status:
                  "invited",

              },

            ]
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    currentUserId,
    runtime,
  ]);


  // ===================================================
  // CHAT MESSAGE
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "CHAT_MESSAGE",
        payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const eventConversationId =
            normaliseId(
              payload?.conversationId ||
              payload?.message?.conversationId
            );


          const activeConversationId =
            chatConversationIdRef.current;


          if (
            !activeConversationId ||
            (
              eventConversationId &&
              eventConversationId !==
                activeConversationId
            )
          ) {

            return;

          }


          const incomingMessage =
            normaliseChatMessage(
              payload?.message ||
              payload,
              activeConversationId
            );


          if (
            !incomingMessage
          ) {

            return;

          }


          const mergedMessages =
            mergeChatMessage(
              chatMessagesRef.current,
              incomingMessage
            );


          chatMessagesRef.current =
            mergedMessages;


          setChatMessages(
            mergedMessages
          );


          runtime.set?.(
            "chat.messages",
            mergedMessages
          );


          console.log(
            "[GroupCallSocketRuntime] CHAT_MESSAGE",
            {

              conversationId:
                activeConversationId,

              messageId:
                incomingMessage.messageId,

              senderUserId:
                incomingMessage.senderUserId,

            }
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // CHAT MESSAGE UPDATED
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "CHAT_MESSAGE_UPDATED",
        payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const eventConversationId =
            normaliseId(
              payload?.conversationId ||
              payload?.message?.conversationId
            );


          const activeConversationId =
            chatConversationIdRef.current;


          if (
            !activeConversationId ||
            (
              eventConversationId &&
              eventConversationId !==
                activeConversationId
            )
          ) {

            return;

          }


          const updatedMessage =
            normaliseChatMessage(
              payload?.message ||
              payload,
              activeConversationId
            );


          if (
            !updatedMessage
          ) {

            return;

          }


          const updatedMessages =
            updateChatMessage(
              chatMessagesRef.current,
              updatedMessage
            );


          chatMessagesRef.current =
            updatedMessages;


          setChatMessages(
            updatedMessages
          );


          runtime.set?.(
            "chat.messages",
            updatedMessages
          );


          console.log(
            "[GroupCallSocketRuntime] CHAT_MESSAGE_UPDATED",
            {

              conversationId:
                activeConversationId,

              messageId:
                updatedMessage.messageId,

            }
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // CHAT MESSAGE DELETED
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "CHAT_MESSAGE_DELETED",
        payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const eventConversationId =
            normaliseId(
              payload?.conversationId
            );


          const activeConversationId =
            chatConversationIdRef.current;


          if (
            !activeConversationId ||
            (
              eventConversationId &&
              eventConversationId !==
                activeConversationId
            )
          ) {

            return;

          }


          const messageId =
            normaliseId(
              payload?.messageId
            );


          if (
            !messageId
          ) {

            return;

          }


          const updatedMessages =
            chatMessagesRef.current.map(
              message => {

                const itemId =
                  resolveChatMessageId(
                    message
                  );


                if (
                  itemId !==
                  messageId
                ) {

                  return message;

                }


                return {

                  ...message,

                  deletedAt:
                    payload?.deletedAt ||
                    new Date().toISOString(),

                  deleted:
                    true,

                  text:
                    "",

                };

              }
            );


          chatMessagesRef.current =
            updatedMessages;


          setChatMessages(
            updatedMessages
          );


          runtime.set?.(
            "chat.messages",
            updatedMessages
          );


          console.log(
            "[GroupCallSocketRuntime] CHAT_MESSAGE_DELETED",
            {

              conversationId:
                activeConversationId,

              messageId,

            }
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // CHAT READ
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "CHAT_READ",
        payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const eventConversationId =
            normaliseId(
              payload?.conversationId
            );


          const activeConversationId =
            chatConversationIdRef.current;


          if (
            !activeConversationId ||
            (
              eventConversationId &&
              eventConversationId !==
                activeConversationId
            )
          ) {

            return;

          }


          const userId =
            normaliseId(
              payload?.userId
            );


          if (
            !userId
          ) {

            return;

          }


          const currentReadState =
            runtime.get?.(
              "chat.readBy"
            );


          const nextReadState = {

            ...(
              currentReadState &&
              typeof currentReadState ===
                "object"
                ? currentReadState
                : {}
            ),

            [userId]: {

              lastMessageId:
                normaliseId(
                  payload?.lastMessageId
                ),

              readAt:
                payload?.readAt ||
                new Date().toISOString(),

            },

          };


          runtime.set?.(
            "chat.readBy",
            nextReadState
          );


          console.log(
            "[GroupCallSocketRuntime] CHAT_READ",
            {

              conversationId:
                activeConversationId,

              userId,

              lastMessageId:
                payload?.lastMessageId,

            }
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // CHAT TYPING
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "CHAT_TYPING",
        payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const eventConversationId =
            normaliseId(
              payload?.conversationId
            );


          const activeConversationId =
            chatConversationIdRef.current;


          if (
            !activeConversationId ||
            (
              eventConversationId &&
              eventConversationId !==
                activeConversationId
            )
          ) {

            return;

          }


          const typingUserId =
            normaliseId(
              payload?.userId
            );


          if (
            !typingUserId
          ) {

            return;

          }


          // ---------------------------------------------
          // Do not display our own typing event.
          // ---------------------------------------------

          if (
            currentUserId &&
            typingUserId ===
              currentUserId
          ) {

            return;

          }


          const currentTypingUsers =
            runtime.get?.(
              "chat.typingUsers"
            ) || {};


          const nextTypingUsers =
            updateTypingUser(
              currentTypingUsers,
              typingUserId,
              payload?.isTyping !== false
            );


          runtime.set?.(
            "chat.typingUsers",
            nextTypingUsers
          );


          console.log(
            "[GroupCallSocketRuntime] CHAT_TYPING",
            {

              conversationId:
                activeConversationId,

              userId:
                typingUserId,

              isTyping:
                payload?.isTyping !== false,

            }
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    currentUserId,
    runtime,
  ]);


  // ===================================================
  // CHAT CONVERSATION CLOSED
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "CHAT_CONVERSATION_CLOSED",
        payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const closedConversationId =
            normaliseId(
              payload?.conversationId
            );


          const activeConversationId =
            chatConversationIdRef.current;


          if (
            !activeConversationId ||
            (
              closedConversationId &&
              closedConversationId !==
                activeConversationId
            )
          ) {

            return;

          }


          if (
            chatCleanupRunningRef.current
          ) {

            return;

          }


          chatCleanupRunningRef.current =
            true;


          try {

            console.log(
              "[GroupCallSocketRuntime] CHAT_CONVERSATION_CLOSED",
              {

                conversationId:
                  closedConversationId ||
                  activeConversationId,

                closedBy:
                  payload?.closedBy,

              }
            );


            groupCallSocket.leaveChat(
              closedConversationId ||
              activeConversationId
            );


            runtime.patch?.(
              "chat",
              {

                conversationId:
                  null,

                id:
                  null,

                joined:
                  false,

                connected:
                  false,

                status:
                  "closed",

                messages:
                  [],

                typingUsers:
                  {},

              }
            );


            chatConversationIdRef.current =
              null;


            chatJoinedRef.current =
              false;


            chatMessagesRef.current =
              [];


            setChatConversationId(
              null
            );


            setChatJoined(
              false
            );


            setChatMessages(
              []
            );

          }
          catch (error) {

            console.error(
              "[GroupCallSocketRuntime] chat close cleanup failed",
              error
            );

          }
          finally {

            chatCleanupRunningRef.current =
              false;

          }

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // CHAT PARTICIPANT LEFT
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "CHAT_PARTICIPANT_LEFT",
        payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const eventConversationId =
            normaliseId(
              payload?.conversationId
            );


          const activeConversationId =
            chatConversationIdRef.current;


          if (
            !activeConversationId ||
            (
              eventConversationId &&
              eventConversationId !==
                activeConversationId
            )
          ) {

            return;

          }


          const userId =
            normaliseId(
              payload?.userId
            );


          if (
            !userId
          ) {

            return;

          }


          const currentParticipants =
            normaliseArray(
              runtime.get?.(
                "chat.participants"
              )
            );


          const nextParticipants =
            currentParticipants.map(
              participant => {

                const participantId =
                  normaliseId(
                    participant?.userId ||
                    participant?.id ||
                    participant?._id
                  );


                if (
                  participantId !==
                  userId
                ) {

                  return participant;

                }


                return {

                  ...participant,

                  status:
                    "left",

                  leftAt:
                    payload?.leftAt ||
                    new Date().toISOString(),

                };

              }
            );


          runtime.set?.(
            "chat.participants",
            nextParticipants
          );


          const currentTypingUsers =
            runtime.get?.(
              "chat.typingUsers"
            ) || {};


          runtime.set?.(
            "chat.typingUsers",
            updateTypingUser(
              currentTypingUsers,
              userId,
              false
            )
          );


          console.log(
            "[GroupCallSocketRuntime] CHAT_PARTICIPANT_LEFT",
            {

              conversationId:
                activeConversationId,

              userId,

            }
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // GROUP CALL ENDED
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "GROUP_CALL_ENDED",
        async payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const endedCallId =
            normaliseId(
              payload?.callId
            );


          const activeCallId =
            callIdRef.current;


          if (
            endedCallId &&
            activeCallId &&
            endedCallId !==
              activeCallId
          ) {

            return;

          }


          if (
            groupCallCleanupRunningRef.current
          ) {

            return;

          }


          groupCallCleanupRunningRef.current =
            true;


          try {

            console.log(
              "[GroupCallSocketRuntime] GROUP_CALL_ENDED received",
              payload
            );


            groupCallSocket.leaveCall(
              endedCallId ||
              activeCallId
            );


            await agoraEngine.leaveCall();


            runtime.patch?.(
              "call",
              {

                id:
                  null,

                channel:
                  null,

                type:
                  null,

                state:
                  "ended",

                joined:
                  false,

                remoteUsers:
                  {},

                participants:
                  [],

                selectedParticipantIds:
                  [],

              }
            );


            callIdRef.current =
              null;


            callJoinedRef.current =
              false;


            setCallId(
              null
            );


            setCallJoined(
              false
            );

          }
          catch (error) {

            console.error(
              "[GroupCallSocketRuntime] group call cleanup failed",
              error
            );

          }
          finally {

            groupCallCleanupRunningRef.current =
              false;

          }

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // TRAINING STARTED
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "TRAINING_SESSION_STARTED",
        async payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const startedSessionId =
            normaliseId(
              payload?.sessionId
            );


          console.log(
            "[GroupCallSocketRuntime] TRAINING_SESSION_STARTED received",
            {

              sessionId:
                startedSessionId,

            }
          );


          try {

            await runAction(
              "training.fetchPendingSessions"
            );

          }
          catch (error) {

            console.error(
              "[GroupCallSocketRuntime] training start refresh failed",
              error
            );

          }

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    runAction,
  ]);


  // ===================================================
  // TRAINING ENDED
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "TRAINING_SESSION_ENDED",
        async payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const endedSessionId =
            normaliseId(
              payload?.sessionId
            );


          const activeSessionId =
            trainingSessionIdRef.current;


          if (
            !activeSessionId ||
            (
              endedSessionId &&
              endedSessionId !==
                activeSessionId
            )
          ) {

            console.log(
              "[GroupCallSocketRuntime] ignoring unrelated training end",
              {

                endedSessionId,

                activeSessionId,

              }
            );


            return;

          }


          if (
            trainingCleanupRunningRef.current
          ) {

            return;

          }


          trainingCleanupRunningRef.current =
            true;


          try {

            console.log(
              "[GroupCallSocketRuntime] TRAINING_SESSION_ENDED received",
              {

                sessionId:
                  endedSessionId ||
                  activeSessionId,

                reason:
                  payload?.reason,

                endedBy:
                  payload?.endedBy,

              }
            );


            // =========================================
            // LEAVE TRAINING SOCKET ROOM
            // =========================================

            groupCallSocket.leaveTrainingSession(
              endedSessionId ||
              activeSessionId
            );


            // =========================================
            // LEAVE AGORA
            // =========================================

            try {

              await agoraEngine.leaveCall();

            }
            catch (error) {

              console.warn(
                "[GroupCallSocketRuntime] Agora leave warning",
                error
              );

            }


            // =========================================
            // CLEAR TRAINING STATE
            // =========================================

            runtime.patch?.(
              "training",
              {

                sessionId:
                  null,

                channel:
                  null,

                status:
                  "ended",

                joined:
                  false,

                participant:
                  null,

                participantIds:
                  [],

                participants:
                  [],

                pendingSession:
                  null,

                pendingSessions:
                  [],

                hasPendingSession:
                  false,

                endedAt:
                  payload?.endedAt ||
                  Date.now(),

              }
            );


            // =========================================
            // CLEAR LEGACY CALL STATE
            // =========================================

            runtime.patch?.(
              "call",
              {

                id:
                  null,

                channel:
                  null,

                type:
                  null,

                state:
                  "ended",

                joined:
                  false,

                remoteUsers:
                  {},

                participants:
                  [],

                selectedParticipantIds:
                  [],

              }
            );


            trainingSessionIdRef.current =
              null;


            trainingJoinedRef.current =
              false;


            setTrainingSessionId(
              null
            );


            setTrainingJoined(
              false
            );


            console.log(
              "[GroupCallSocketRuntime] training cleanup complete",
              {

                sessionId:
                  endedSessionId ||
                  activeSessionId,

              }
            );

          }
          catch (error) {

            console.error(
              "[GroupCallSocketRuntime] training cleanup failed",
              error
            );

          }
          finally {

            trainingCleanupRunningRef.current =
              false;

          }

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // TRAINING PARTICIPANT LEFT
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "TRAINING_SESSION_PARTICIPANT_LEFT",
        payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const eventSessionId =
            normaliseId(
              payload?.sessionId
            );


          const activeSessionId =
            trainingSessionIdRef.current;


          if (
            !activeSessionId ||
            (
              eventSessionId &&
              eventSessionId !==
                activeSessionId
            )
          ) {

            return;

          }


          console.log(
            "[GroupCallSocketRuntime] TRAINING participant left",
            {

              sessionId:
                activeSessionId,

              userId:
                payload?.userId,

            }
          );


          // ------------------------------------------------
          // We deliberately do not manipulate Agora here.
          //
          // AgoraEngine owns media lifecycle.
          //
          // The event is available for future participant
          // state reconciliation.
          // ------------------------------------------------

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, []);


  // ===================================================
  // COMPONENT CLEANUP
  // ===================================================

  useEffect(() => {

    return () => {

      mountedRef.current =
        false;


      console.log(
        "[GroupCallSocketRuntime] unmounted"
      );

    };

  }, []);


  // ===================================================
  // DEVELOPMENT DIAGNOSTIC
  // ===================================================

  console.log(
    "[GroupCallSocketRuntime]",
    {

      currentUserId,

      callId,

      callType,

      callJoined,

      trainingSessionId,

      trainingJoined,

      chatConversationId,

      chatJoined,

      chatMessageCount:
        chatMessages.length,

      connected:
        groupCallSocket.isConnected(),

    }
  );


  return null;

}