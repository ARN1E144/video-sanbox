// src/actions/chat/acceptConversationInvitation.js

import api from "../../services/api";

export default async function acceptConversationInvitation(
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
        )}/accept`,
        {

          projectId,

        }
      );


    const conversation =
      response?.data?.conversation;


    ctx?.set?.(
      "chat.conversationId",
      conversationId
    );


    ctx?.set?.(
      "chat.conversation",
      conversation
    );


    ctx?.set?.(
      "chat.conversationStatus",
      conversation?.status ||
      "active"
    );


    ctx?.set?.(
      "chat.participants",
      conversation?.participants || []
    );


    ctx?.set?.(
      "chat.joined",
      true
    );


    ctx?.emit?.(
      "chat.invitationAccepted",
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
          true,

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[chat.acceptConversationInvitation] FAILED",
      error
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to accept conversation invitation",

    };

  }

}