// src/components/chat/ChatPanel.jsx

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRuntimeState,
} from "../../context/RuntimeStateContext";

import {
  useActionContext,
} from "../../context/ActionContext";


// =====================================================
// HELPERS
// =====================================================

function normaliseMessage(
  message,
  index
) {

  if (
    typeof message ===
    "string"
  ) {

    return {

      id:
        `message-${index}`,

      text:
        message,

      senderName:
        null,

      createdAt:
        null,

      senderId:
        null,

    };

  }


  return {

    id:
      message?.id ||
      message?.messageId ||
      message?._id ||
      `message-${index}`,

    text:
      message?.text ??
      message?.message ??
      message?.content ??
      "",

    senderName:
      message?.senderName ||
      message?.userName ||
      message?.sender?.name ||
      message?.user?.name ||
      null,

    senderId:
      message?.senderId ||
      message?.userId ||
      message?.sender?.id ||
      message?.sender?._id ||
      message?.user?.id ||
      message?.user?._id ||
      null,

    createdAt:
      message?.createdAt ||
      message?.created_at ||
      null,

  };

}


function formatMessageTime(
  value
) {

  if (
    !value
  ) {

    return "";

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  return date.toLocaleTimeString(
    [],
    {
      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  );

}


// =====================================================
// COMPONENT
// =====================================================

export default function ChatPanel({

  style,

  bindKey =
    "chat.messages",

  title =
    "Chat",

}) {

  // ===================================================
  // RUNTIME
  // ===================================================

  const runtimeState =
    useRuntimeState();

  const {
    runAction,
  } =
    useActionContext();


  // ===================================================
  // LOCAL UI STATE
  // ===================================================

  const [
    messages,
    setMessages,
  ] =
    useState(
      []
    );


  const [
    draft,
    setDraft,
  ] =
    useState(
      ""
    );


  const [
    sending,
    setSending,
  ] =
    useState(
      false
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );


  const [
    error,
    setError,
  ] =
    useState(
      null
    );


  const [
    conversationId,
    setConversationId,
  ] =
    useState(
      ""
    );


  const [
    conversation,
    setConversation,
  ] =
    useState(
      null
    );


  // ===================================================
  // RUNTIME MESSAGE STATE
  // ===================================================
  //
  // chat.messages remains authoritative.
  //
  // ChatPanel only maintains a local rendering copy so
  // React can respond immediately to runtime updates.
  //
  // ===================================================

  useEffect(
    () => {

      if (
        !runtimeState
      ) {

        return undefined;

      }


      const initial =
        runtimeState.get(
          bindKey
        );


      setMessages(
        Array.isArray(
          initial
        )
          ? initial
          : []
      );


      const unsubscribe =
        runtimeState.subscribe(
          bindKey,
          value => {

            setMessages(
              Array.isArray(
                value
              )
                ? value
                : []
            );

          }
        );


      return (
        typeof unsubscribe ===
        "function"
          ? unsubscribe
          : undefined
      );

    },
    [
      bindKey,
      runtimeState,
    ]
  );


  // ===================================================
  // ACTIVE CONVERSATION
  // ===================================================
  //
  // Chat is conversation-scoped.
  //
  // The active conversation is owned by:
  //
  //     chat.conversationId
  //
  // The component does not invent or maintain its own
  // authoritative conversation selection.
  //
  // ===================================================

  useEffect(
    () => {

      if (
        !runtimeState
      ) {

        return undefined;

      }


      const updateConversation =
        () => {

          const id =
            runtimeState.get?.(
              "chat.conversationId"
            );


          const activeConversation =
            runtimeState.get?.(
              "chat.conversation"
            );


          setConversationId(
            id
              ? String(
                  id
                )
              : ""
          );


          setConversation(
            activeConversation ||
            null
          );

        };


      updateConversation();


      const unsubscribers =
        [];


      const conversationIdUnsubscribe =
        runtimeState.subscribe?.(
          "chat.conversationId",
          updateConversation
        );


      if (
        typeof conversationIdUnsubscribe ===
        "function"
      ) {

        unsubscribers.push(
          conversationIdUnsubscribe
        );

      }


      const conversationUnsubscribe =
        runtimeState.subscribe?.(
          "chat.conversation",
          updateConversation
        );


      if (
        typeof conversationUnsubscribe ===
        "function"
      ) {

        unsubscribers.push(
          conversationUnsubscribe
        );

      }


      return () => {

        unsubscribers.forEach(
          unsubscribe => {

            try {

              unsubscribe();

            }
            catch (
              unsubscribeError
            ) {

              console.warn(
                "[ChatPanel] Failed to unsubscribe from conversation state",
                unsubscribeError
              );

            }

          }
        );

      };

    },
    [
      runtimeState,
    ]
  );


  // ===================================================
  // LOAD MESSAGES
  // ===================================================
  //
  // IMPORTANT:
  //
  // ChatPanel does NOT call the API directly.
  //
  // The runtime action owns:
  //
  //     chat.loadMessages
  //
  // which owns API access and runtime state updates.
  //
  // Therefore:
  //
  //     ChatPanel
  //        ↓
  //     runAction
  //        ↓
  //     chat.loadMessages
  //        ↓
  //     API
  //        ↓
  //     chat.messages
  //        ↓
  //     ChatPanel
  //
  // ===================================================

  useEffect(
    () => {

      if (
        !conversationId
      ) {

        return;

      }


      let cancelled =
        false;


      async function loadMessages() {

        if (
          cancelled
        ) {

          return;

        }


        setLoading(
          true
        );

        setError(
          null
        );


        try {

          console.log(
            "[ChatPanel] Loading runtime messages",
            {
              conversationId,
            }
          );


          const result =
            await runAction(
              "chat.loadMessages",
              {},
              "chat.messagesLoaded"
            );


          if (
            cancelled
          ) {

            return;

          }


          if (
            result?.ok ===
            false
          ) {

            throw new Error(
              result?.error ||
              "Failed to load chat messages."
            );

          }


          console.log(
            "[ChatPanel] Runtime messages loaded",
            {
              conversationId,
            }
          );

        }
        catch (
          loadError
        ) {

          if (
            cancelled
          ) {

            return;

          }


          console.error(
            "[ChatPanel] Failed to load messages",
            loadError
          );


          setError(
            loadError?.message ||
            "Failed to load messages."
          );

        }
        finally {

          if (
            !cancelled
          ) {

            setLoading(
              false
            );

          }

        }

      }


      loadMessages();


      return () => {

        cancelled =
          true;

      };

    },
    [
      conversationId,
      runAction,
    ]
  );


  // ===================================================
  // NORMALISE DISPLAY MESSAGES
  // ===================================================

  const displayMessages =
    useMemo(
      () => {

        if (
          !Array.isArray(
            messages
          )
        ) {

          return [];

        }


        return messages.map(
          normaliseMessage
        );

      },
      [
        messages,
      ]
    );


  // ===================================================
  // CONVERSATION TITLE
  // ===================================================

  const displayTitle =
    conversation?.title ||
    conversation?.name ||
    title;


  // ===================================================
  // SEND MESSAGE
  // ===================================================
  //
  // The component does not call the API.
  //
  // It invokes:
  //
  //     chat.sendMessage
  //
  // and the action owns persistence + runtime updates.
  //
  // ===================================================

  const handleSend =
    async () => {

      const text =
        draft.trim();


      if (
        !text ||
        sending
      ) {

        return;

      }


      if (
        !conversationId
      ) {

        setError(
          "Select or join a conversation before sending a message."
        );

        return;

      }


      setSending(
        true
      );

      setError(
        null
      );


      try {

        console.log(
          "[ChatPanel] Sending runtime message",
          {
            conversationId,
            text,
          }
        );


        const result =
          await runAction(
            "chat.sendMessage",
            {
              text,
            },
            "chat.messageSent"
          );


        if (
          result?.ok ===
          false
        ) {

          throw new Error(
            result?.error ||
            "Failed to send message."
          );

        }


        setDraft(
          ""
        );


        console.log(
          "[ChatPanel] Runtime message sent",
          {
            conversationId,
          }
        );

      }
      catch (
        sendError
      ) {

        console.error(
          "[ChatPanel] Failed to send message",
          sendError
        );


        setError(
          sendError?.message ||
          "Failed to send message."
        );

      }
      finally {

        setSending(
          false
        );

      }

    };


  // ===================================================
  // KEYBOARD HANDLER
  // ===================================================

  const handleComposerKeyDown =
    event => {

      if (
        event.key !==
        "Enter"
      ) {

        return;

      }


      if (
        event.shiftKey
      ) {

        return;

      }


      event.preventDefault();


      handleSend();

    };


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      style={{

        width:
          "100%",

        height:
          "100%",

        display:
          "flex",

        flexDirection:
          "column",

        boxSizing:
          "border-box",

        background:
          style?.backgroundColor ||
          "#222",

        color:
          style?.color ||
          "#fff",

        borderRadius:
          style?.borderRadius ||
          8,

        overflow:
          "hidden",

      }}
    >

      {/* =============================================
          HEADER
      ============================================= */}

      <div
        style={{

          flexShrink:
            0,

          padding:
            "10px 12px",

          borderBottom:
            "1px solid rgba(255,255,255,.08)",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          gap:
            8,

        }}
      >

        <div>

          <div
            style={{

              fontSize:
                12,

              fontWeight:
                700,

            }}
          >

            {displayTitle}

          </div>


          {
            conversationId && (

              <div
                style={{

                  marginTop:
                    2,

                  opacity:
                    .45,

                  fontSize:
                    8,

                }}
              >

                Conversation active

              </div>

            )
          }

        </div>


        <div
          style={{

            fontSize:
              9,

            opacity:
              .55,

          }}
        >

          {
            displayMessages.length
          }

          {" "}

          {
            displayMessages.length ===
            1
              ? "message"
              : "messages"
          }

        </div>

      </div>


      {/* =============================================
          MESSAGES
      ============================================= */}

      <div
        style={{

          flex:
            1,

          minHeight:
            0,

          overflowY:
            "auto",

          padding:
            12,

          display:
            "flex",

          flexDirection:
            "column",

          gap:
            8,

        }}
      >

        {
          loading && (

            <div
              style={{

                padding:
                  "8px 10px",

                fontSize:
                  10,

                opacity:
                  .55,

                textAlign:
                  "center",

              }}
            >

              Loading messages...

            </div>

          )
        }


        {
          !loading &&
          displayMessages.length ===
          0 && (

            <div
              style={{

                opacity:
                  .65,

                fontSize:
                  12,

                textAlign:
                  "center",

                padding:
                  "20px 10px",

              }}
            >

              No messages yet.

            </div>

          )
        }


        {
          displayMessages.map(
            message => (

              <div
                key={
                  message.id
                }

                style={{

                  padding:
                    "8px 10px",

                  borderRadius:
                    8,

                  background:
                    "rgba(255,255,255,.05)",

                  border:
                    "1px solid rgba(255,255,255,.06)",

                }}
              >

                {
                  message.senderName && (

                    <div
                      style={{

                        marginBottom:
                          3,

                        color:
                          "#888",

                        fontSize:
                          9,

                        fontWeight:
                          700,

                      }}
                    >

                      {
                        message.senderName
                      }

                    </div>

                  )
                }


                <div
                  style={{

                    fontSize:
                      12,

                    lineHeight:
                      1.5,

                    whiteSpace:
                      "pre-wrap",

                    wordBreak:
                      "break-word",

                  }}
                >

                  {
                    message.text
                  }

                </div>


                {
                  message.createdAt && (

                    <div
                      style={{

                        marginTop:
                          4,

                        fontSize:
                          8,

                        opacity:
                          .4,

                        textAlign:
                          "right",

                      }}
                    >

                      {
                        formatMessageTime(
                          message.createdAt
                        )
                      }

                    </div>

                  )
                }

              </div>

            )
          )
        }

      </div>


      {/* =============================================
          ERROR
      ============================================= */}

      {
        error && (

          <div
            style={{

              flexShrink:
                0,

              padding:
                "6px 10px",

              borderTop:
                "1px solid rgba(255,80,80,.15)",

              background:
                "rgba(255,80,80,.08)",

              color:
                "#ffb0b0",

              fontSize:
                10,

            }}
          >

            {
              error
            }

          </div>

        )
      }


      {/* =============================================
          COMPOSER
      ============================================= */}

      <div
        style={{

          flexShrink:
            0,

          padding:
            10,

          borderTop:
            "1px solid rgba(255,255,255,.08)",

          display:
            "flex",

          gap:
            8,

          alignItems:
            "flex-end",

        }}
      >

        <textarea

          value={
            draft
          }

          onChange={
            event =>
              setDraft(
                event.target.value
              )
          }

          onKeyDown={
            handleComposerKeyDown
          }

          placeholder={
            conversationId
              ? "Type a message..."
              : "Select a conversation..."
          }

          disabled={
            !conversationId ||
            sending
          }

          rows={
            2
          }

          style={{

            flex:
              1,

            minWidth:
              0,

            resize:
              "none",

            boxSizing:
              "border-box",

            border:
              "1px solid rgba(255,255,255,.12)",

            borderRadius:
              6,

            background:
              "rgba(255,255,255,.05)",

            color:
              "inherit",

            padding:
              "8px",

            fontSize:
              11,

            fontFamily:
              "inherit",

            outline:
              "none",

          }}

        />


        <button

          type="button"

          onClick={
            handleSend
          }

          disabled={
            !conversationId ||
            !draft.trim() ||
            sending
          }

          style={{

            flexShrink:
              0,

            border:
              "none",

            borderRadius:
              6,

            padding:
              "8px 12px",

            background:
              sending
                ? "rgba(255,255,255,.08)"
                : "#3b82f6",

            color:
              "#fff",

            cursor:
              (
                !conversationId ||
                !draft.trim() ||
                sending
              )
                ? "default"
                : "pointer",

            opacity:
              (
                !conversationId ||
                !draft.trim() ||
                sending
              )
                ? .45
                : 1,

            fontSize:
              11,

            fontWeight:
              700,

          }}

        >

          {
            sending
              ? "Sending..."
              : "Send"
          }

        </button>

      </div>

    </div>

  );

}