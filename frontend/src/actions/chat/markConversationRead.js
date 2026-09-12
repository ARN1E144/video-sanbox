// src/actions/chat/markConversationRead.js

export default async function markConversationRead(
  ctx,
  params = {}
) {

  try {

    const conversationId =
      params?.conversationId ||
      ctx?.get?.("chat.conversationId");


    const messageId =
      params?.messageId ||
      ctx?.get?.("chat.messageId") ||
      null;


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


    ctx?.set?.(
      "chat.lastReadMessageId",
      messageId
    );


    ctx?.set?.(
      "chat.lastReadAt",
      new Date().toISOString()
    );


    ctx?.emit?.(
      "chat.conversationRead",
      {

        conversationId,

        messageId,

      }
    );


    return {

      ok:
        true,

      result: {

        conversationId,

        messageId,

        readAt:
          new Date().toISOString(),

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[chat.markConversationRead] FAILED",
      error
    );


    return {

      ok:
        false,

      error:
        error?.message ||
        "Failed to mark conversation as read",

    };

  }

}