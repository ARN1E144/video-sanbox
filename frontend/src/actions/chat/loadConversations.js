// src/actions/chat/loadConversations.js

import api from "../../services/api";

export default async function loadConversations(
  ctx,
  params = {}
) {

  try {

    const projectId =
      params?.projectId ||
      ctx?.projectId ||
      ctx?.get?.("project.id");


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


    console.log(
      "[chat.loadConversations] START",
      {
        projectId,
      }
    );


    const response =
      await api.get(
        `/chat/conversations?projectId=${encodeURIComponent(
          projectId
        )}`
      );


    const conversations =
      Array.isArray(
        response?.data?.conversations
      )
        ? response.data.conversations
        : [];


    ctx?.set?.(
      "chat.conversations",
      conversations
    );


    ctx?.emit?.(
      "chat.conversationsLoaded",
      {

        projectId,

        conversations,

      }
    );


    return {

      ok:
        true,

      result: {

        projectId,

        conversations,

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[chat.loadConversations] FAILED",
      error
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load conversations",

    };

  }

}