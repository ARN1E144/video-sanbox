// src/actions/chat/loadMessages.js

import api from "../../services/api";

export default async function loadMessages(
  ctx,
  params = {}
) {

  try {

    const conversationId =
      params?.conversationId ||
      ctx?.get?.("chat.conversationId");


    const projectId =
      params?.projectId ||
      ctx?.projectId ||
      ctx?.get?.("project.id");


    console.log(
      "[chat.loadMessages] START",
      {
        projectId,
        conversationId,
      }
    );


    if (
      !projectId
    ) {

      return {

        ok:
          false,

        error:
          "projectId is required",

      };

    }


    if (
      !conversationId
    ) {

      return {

        ok:
          false,

        error:
          "conversationId is required",

      };

    }


    const response =
      await api.get(
        `/chat/conversations/${encodeURIComponent(
          conversationId
        )}/messages?projectId=${encodeURIComponent(
          projectId
        )}`
      );


    const messages =
      Array.isArray(
        response?.data?.messages
      )
        ? response.data.messages
        : [];


    ctx?.set?.(
      "chat.conversationId",
      conversationId
    );


    ctx?.set?.(
      "chat.messages",
      messages
    );


    console.log(
      "[chat.loadMessages] Runtime state updated",
      {

        projectId,

        conversationId,

        messageCount:
          messages.length,

      }
    );


    ctx?.emit?.(
      "chat.messagesLoaded",
      {

        projectId,

        conversationId,

        messages,

      }
    );


    return {

      ok:
        true,

      result: {

        projectId,

        conversationId,

        messages,

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[chat.loadMessages] FAILED",
      error
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load messages",

    };

  }

}