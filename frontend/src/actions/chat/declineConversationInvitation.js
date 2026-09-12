// src/actions/chat/declineConversationInvitation.js

import api from "../../services/api";

export default async function declineConversationInvitation(
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


    await api.post(
      `/chat/conversations/${encodeURIComponent(
        conversationId
      )}/decline`,
      {

        projectId,

      }
    );


    ctx?.emit?.(
      "chat.invitationDeclined",
      {

        projectId,

        conversationId,

      }
    );


    return {

      ok:
        true,

      result: {

        projectId,

        conversationId,

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[chat.declineConversationInvitation] FAILED",
      error
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to decline conversation invitation",

    };

  }

}