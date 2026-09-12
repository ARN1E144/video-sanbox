// src/actions/chat/editMessage.js

import api from "../../services/api";

export default async function editMessage(
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


    const text =
      String(
        params?.text ??
        params?.value ??
        ""
      ).trim();


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


    if (
      !text
    ) {

      return {

        ok:
          false,

        error:
          "Message text is required",

      };

    }


    const response =
      await api.patch(
        `/chat/conversations/${encodeURIComponent(
          conversationId
        )}/messages/${encodeURIComponent(
          messageId
        )}`,
        {

          projectId,

          text,

        }
      );


    const updatedMessage =
      response?.data?.message;


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
                ? updatedMessage
                : message
          )
        : [];


    ctx?.set?.(
      "chat.messages",
      messages
    );


    ctx?.emit?.(
      "chat.messageEdited",
      {

        projectId,

        conversationId,

        message:
          updatedMessage,

      }
    );


    return {

      ok:
        true,

      result: {

        projectId,

        conversationId,

        message:
          updatedMessage,

        messages,

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[chat.editMessage] FAILED",
      error
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to edit message",

    };

  }

}