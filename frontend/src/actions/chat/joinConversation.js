// src/actions/chat/joinConversation.js

import api from "../../services/api";


// =====================================================
// HELPERS
// =====================================================

function normaliseId(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value === "object"
  ) {
    return (
      normaliseId(
        value.id ??
        value.userId ??
        value._id
      )
    );
  }

  const result =
    String(value).trim();

  return result || null;
}


// =====================================================
// JOIN CONVERSATION
// =====================================================
//
// IMPORTANT:
//
// This action does NOT create a new server-side
// membership.
//
// Server-side membership is established by:
//
//   POST /chat/conversations/:conversationId/accept
//
// Once the participant is active, this action:
//
//   1. Loads the conversation.
//   2. Verifies the current participant is active.
//   3. Stores the conversation in runtime state.
//   4. Marks the runtime chat as joined.
//   5. Emits chat.conversationJoined.
//
// Realtime socket subscription is handled separately.
// =====================================================

export default async function joinConversation(
  ctx,
  params = {}
) {

  try {

    // =================================================
    // PROJECT
    // =================================================

    const projectId =
      normaliseId(
        params?.projectId
      ) ||
      normaliseId(
        ctx?.get?.("project.id")
      );


    if (
      !projectId
    ) {

      console.error(
        "[chat.joinConversation] NO_PROJECT_ID"
      );

      return {

        ok:
          false,

        error:
          "projectId is required",

      };

    }


    // =================================================
    // CONVERSATION
    // =================================================

    const conversationId =
      normaliseId(
        params?.conversationId
      ) ||
      normaliseId(
        ctx?.get?.("chat.conversationId")
      );


    if (
      !conversationId
    ) {

      console.error(
        "[chat.joinConversation] NO_CONVERSATION_ID"
      );

      return {

        ok:
          false,

        error:
          "conversationId is required",

      };

    }


    console.log(
      "[chat.joinConversation] START",
      {
        projectId,
        conversationId,
      }
    );


    // =================================================
    // LOAD CONVERSATION
    // =================================================

    const response =
      await api.get(
        `/chat/conversations/${encodeURIComponent(
          conversationId
        )}?projectId=${encodeURIComponent(
          projectId
        )}`
      );


    const conversation =
      response?.data?.conversation;


    if (
      !conversation
    ) {

      console.error(
        "[chat.joinConversation] CONVERSATION_NOT_RETURNED",
        {
          projectId,
          conversationId,
          response: response?.data,
        }
      );

      return {

        ok:
          false,

        error:
          "Conversation not returned",

      };

    }


    // =================================================
    // DETERMINE CURRENT PARTICIPANT
    // =================================================
    //
    // The backend is authoritative.
    //
    // We do NOT infer joined=true simply because the
    // conversation exists.
    //
    // The participant must already be active.
    // =================================================

    const runtimeUserId =
      normaliseId(
        ctx?.get?.("user.id")
      ) ||
      normaliseId(
        ctx?.get?.("user.userId")
      ) ||
      normaliseId(
        ctx?.get?.("auth.userId")
      );


    let currentParticipant =
      null;


    if (
      runtimeUserId &&
      Array.isArray(
        conversation.participants
      )
    ) {

      currentParticipant =
        conversation.participants.find(
          participant =>
            normaliseId(
              participant?.userId
            ) ===
            runtimeUserId
        ) ||
        null;

    }


    // =================================================
    // ACTIVE PARTICIPANT CHECK
    // =================================================
    //
    // If the runtime does not expose the user ID we
    // don't fail purely because of that.
    //
    // The backend has already authenticated the request
    // and confirmed that the user is a participant.
    //
    // But if we CAN identify the participant, enforce
    // the active membership state.
    // =================================================

    if (
      currentParticipant &&
      currentParticipant.status !==
        "active"
    ) {

      console.warn(
        "[chat.joinConversation] PARTICIPANT_NOT_ACTIVE",
        {
          projectId,
          conversationId,
          userId:
            runtimeUserId,
          status:
            currentParticipant.status,
        }
      );

      return {

        ok:
          false,

        error:
          "You must accept the conversation invitation before joining",

        result: {

          projectId,
          conversationId,

          participantStatus:
            currentParticipant.status,

          joined:
            false,

        },

      };

    }


    // =================================================
    // CONVERSATION STATUS
    // =================================================

    if (
      conversation.status ===
      "closed"
    ) {

      console.warn(
        "[chat.joinConversation] CONVERSATION_CLOSED",
        {
          projectId,
          conversationId,
        }
      );

      return {

        ok:
          false,

        error:
          "Conversation is closed",

        result: {

          projectId,
          conversationId,

          joined:
            false,

        },

      };

    }


    // =================================================
    // RUNTIME STATE
    // =================================================

    ctx?.set?.(
      "chat.projectId",
      projectId
    );


    ctx?.set?.(
      "chat.conversationId",
      conversationId
    );


    ctx?.set?.(
      "chat.id",
      conversationId
    );


    ctx?.set?.(
      "chat.conversation",
      conversation
    );


    ctx?.set?.(
      "chat.conversationStatus",
      conversation.status
    );


    ctx?.set?.(
      "chat.participants",
      conversation.participants ||
      []
    );


    ctx?.set?.(
      "chat.lastMessage",
      conversation.lastMessage ||
      null
    );


    ctx?.set?.(
      "chat.joined",
      true
    );


    // =================================================
    // RUNTIME EVENT
    // =================================================

    ctx?.emit?.(
      "chat.conversationJoined",
      {

        projectId,

        conversationId,

        conversation,

        joined:
          true,

      }
    );


    // =================================================
    // RESULT
    // =================================================

    const result = {

      projectId,

      conversationId,

      conversation,

      participants:
        conversation.participants ||
        [],

      status:
        conversation.status,

      joined:
        true,

    };


    console.log(
      "[chat.joinConversation] SUCCESS",
      {
        projectId,
        conversationId,
        status:
          conversation.status,
        participantCount:
          Array.isArray(
            conversation.participants
          )
            ? conversation.participants.length
            : 0,
      }
    );


    return {

      ok:
        true,

      result,

    };

  }
  catch (error) {

    console.error(
      "[chat.joinConversation] FAILED",
      error
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to join conversation",

    };

  }

}