// src/actions/chat/deleteMessage.js

import api from "../../services/api";

export default async function deleteMessage(
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


    const messageId =
      params?.messageId ||
      ctx?.get?.("chat.messageId");


    if (
      !projectId ||
      !conversationId ||
      !messageId
    ) {

      return {

        ok:
          false,

        error:
          !projectId
            ? "projectId is required"
            : !conversationId
              ? "conversationId is required"
              : "messageId is required",

      };

    }


    const response =
      await api.delete(
        `/chat/conversations/${encodeURIComponent(
          conversationId
        )}/messages/${encodeURIComponent(
          messageId
        )}`,
        {

          data: {

            projectId,

          },

        }
      );


    const currentMessages =
      ctx?.get?.(
        "chat.messages"
      );


    const messages =
      Array.isArray(
        currentMessages
      )
        ? currentMessages.map(
            message =>
              String(
                message?.id ||
                message?._id ||
                ""
              ) ===
              String(
                messageId
              )
                ? {

                    ...message,

                    deletedAt:
                      response?.data?.deletedAt ||
                      new Date().toISOString(),

                  }
                : message
          )
        : [];


    ctx?.set?.(
      "chat.messages",
      messages
    );


    ctx?.emit?.(
      "chat.messageDeleted",
      {

        projectId,

        conversationId,

        messageId,

      }
    );


    return {

      ok:
        true,

      result: {

        projectId,

        conversationId,

        messageId,

        messages,

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[chat.deleteMessage] FAILED",
      error
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete message",

    };

  }

}
