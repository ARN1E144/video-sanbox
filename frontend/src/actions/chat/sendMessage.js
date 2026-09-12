// src/actions/chat/sendMessage.js

import api from "../../services/api";

export default async function sendMessage(
  ctx,
  params = {}
) {

  try {

    const {
      text,
      value,
      message,
    } =
      params;


    const payloadText =
      String(
        text ??
        value ??
        message ??
        ""
      ).trim();


    const projectId =
      params?.projectId ||
      ctx?.projectId ||
      ctx?.get?.("project.id");


    const conversationId =
      params?.conversationId ||
      ctx?.get?.("chat.conversationId");


    console.log(
      "[chat.sendMessage] START",
      {
        projectId,
        conversationId,
        text:
          payloadText,
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


    if (
      !payloadText
    ) {

      return {

        ok:
          false,

        error:
          "Message text is required",

      };

    }


    const response =
      await api.post(
        `/chat/conversations/${encodeURIComponent(
          conversationId
        )}/messages`,
        {

          projectId,

          text:
            payloadText,

        }
      );


    const serverMessage =
      response?.data?.message;


    if (
      !serverMessage
    ) {

      return {

        ok:
          false,

        error:
          "Server did not return a message",

      };

    }


    const currentMessages =
      ctx?.get?.(
        "chat.messages"
      );


    const safeMessages =
      Array.isArray(
        currentMessages
      )
        ? currentMessages
        : [];


    const updatedMessages =
      [
        ...safeMessages,
        serverMessage,
      ];


    ctx?.set?.(
      "chat.messages",
      updatedMessages
    );


    ctx?.set?.(
      "chat.lastMessage",
      serverMessage
    );


    console.log(
      "[chat.sendMessage] Runtime state updated",
      {

        projectId,

        conversationId,

        message:
          serverMessage,

        messageCount:
          updatedMessages.length,

      }
    );


    ctx?.emit?.(
      "chat.messageSent",
      {

        projectId,

        conversationId,

        message:
          serverMessage,

      }
    );


    return {

      ok:
        true,

      result: {

        projectId,

        conversationId,

        message:
          serverMessage,

        messages:
          updatedMessages,

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[chat.sendMessage] FAILED",
      error
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send message",

    };

  }

}