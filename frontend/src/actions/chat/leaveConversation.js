// src/actions/chat/leaveConversation.js

import api from "../../services/api";

export default async function leaveConversation(
  ctx,
  params = {}
) {

  try {

    const projectId =
      params?.projectId ||
      ctx?.projectId ||
      ctx?.get?.("project.id");


    const conversationId =
      params?.conversationId ||
      ctx?.get?.("chat.conversationId");


    if (
      !projectId ||
      !conversationId
    ) {

      return {

        ok:
          false,

        error:
          !projectId
            ? "projectId is required"
            : "conversationId is required",

      };

    }


    const response =
      await api.post(
        `/chat/conversations/${encodeURIComponent(
          conversationId
        )}/leave`,
        {

          projectId,

        }
      );


    const conversation =
      response?.data?.conversation;


    ctx?.set?.(
      "chat.joined",
      false
    );


    if (
      conversation
    ) {

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
        conversation.participants || []
      );

    }


    ctx?.emit?.(
      "chat.conversationLeft",
      {

        projectId,

        conversationId,

        conversation,

      }
    );


    return {

      ok:
        true,

      result: {

        projectId,

        conversationId,

        conversation,

        joined:
          false,

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[chat.leaveConversation] FAILED",
      error
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to leave conversation",

    };

  }

}