// src/actions/chat/closeConversation.js

import api from "../../services/api";

export default async function closeConversation(
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
        )}/close`,
        {

          projectId,

        }
      );


    const conversation =
      response?.data?.conversation;


    ctx?.set?.(
      "chat.conversation",
      conversation
    );


    ctx?.set?.(
      "chat.conversationStatus",
      "closed"
    );


    ctx?.set?.(
      "chat.joined",
      false
    );


    ctx?.emit?.(
      "chat.conversationClosed",
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

        status:
          "closed",

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[chat.closeConversation] FAILED",
      error
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to close conversation",

    };

  }

}