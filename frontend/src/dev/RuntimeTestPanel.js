// src/dev/RuntimeTestPanel.js

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRuntimeState,
} from "../context/RuntimeStateContext";

import {
  useActionContext,
} from "../context/ActionContext";

import {
  useProjectContext,
} from "../context/ProjectContext";

import RuntimeStatusPanel
  from "./panels/RuntimeStatusPanel";

import CallControlsPanel
  from "./panels/CallControlsPanel";

import InterviewControlsPanel
  from "./panels/InterviewControlsPanel";

import { useRuntimeTriggers } 
  from "../context/RuntimeTriggersContext";


// =====================================================
// FIND PROJECT ELEMENT BY SOURCE ID
// =====================================================

function findElementBySourceId(
  node,
  sourceId
) {
  if (
    !node ||
    typeof node !== "object"
  ) {
    return null;
  }

  if (
    node?.meta?.sourceId === sourceId
  ) {
    return node;
  }

  if (
    node?.props?.meta?.sourceId === sourceId
  ) {
    return node;
  }

  if (
    Array.isArray(node.children)
  ) {
    for (
      const child of node.children
    ) {
      const match =
        findElementBySourceId(
          child,
          sourceId
        );

      if (match) {
        return match;
      }
    }
  }

  return null;
}


// =====================================================
// URL HELPERS
// =====================================================

function looksLikeYouTube(
  value
) {
  return (
    typeof value === "string" &&
    (
      value.includes("youtube.com") ||
      value.includes("youtu.be")
    )
  );
}


function detectMediaType(
  value
) {
  if (
    !value ||
    typeof value !== "string"
  ) {
    return "unknown";
  }

  if (
    looksLikeYouTube(value)
  ) {
    return "youtube";
  }

  const clean =
    value
      .split("?")[0]
      .toLowerCase();

  if (
    clean.endsWith(".m3u8")
  ) {
    return "hls";
  }

  if (
    clean.endsWith(".mp4") ||
    clean.endsWith(".webm") ||
    clean.endsWith(".ogg") ||
    clean.endsWith(".mov")
  ) {
    return "video";
  }

  if (
    clean.match(
      /\.(jpg|jpeg|png|gif|webp|svg)$/
    )
  ) {
    return "image";
  }

  if (
    clean.endsWith(".pdf")
  ) {
    return "pdf";
  }

  return "url";
}


// =====================================================
// DEFAULT TEST SOURCES
// =====================================================

const DEFAULT_VIDEO_SOURCE =
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4";


const DEFAULT_YOUTUBE_SOURCE =
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ";


const DEFAULT_PDF_SOURCE =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";


// =====================================================
// COMPONENT
// =====================================================

export default function RuntimeTestPanel() {

  // ===================================================
  // CONTEXT
  // ===================================================

  const runtime =
    useRuntimeState();


  const {
    runAction,
  } =
  useActionContext();


  const {
    projectSchema,
    activeProject,
  } =
  useProjectContext();

  const { 
    registerTrigger 
  } = useRuntimeTriggers();


  // ===================================================
  // PROJECT RUNTIME
  // ===================================================

  const runtimeProject =
    runtime.get?.(
      "project"
    );


  const runtimeProjectId =
    runtime.get?.(
      "project.id"
    );


  // ===================================================
  // RESPONSIVE STATE
  // ===================================================

  const [
    isMobile,
    setIsMobile,
  ] =
  useState(
    window.innerWidth <= 600
  );


  const [
    isOpen,
    setIsOpen,
  ] =
  useState(true);


  // ===================================================
  // POSITION
  // ===================================================

  const [
    position,
    setPosition,
  ] =
  useState({
    x:
      window.innerWidth > 600
        ? Math.max(
            20,
            window.innerWidth - 440
          )
        : 12,

    y:
      80,
  });


  // ===================================================
  // TRAINING PARTICIPANTS
  // ===================================================

  const [
    trainingParticipantIds,
    setTrainingParticipantIds,
  ] =
  useState(
    () =>
      runtime.get?.(
        "training.participantIds"
      ) || []
  );

    // =====================================================
  // CHAT RUNTIME TEST STATE
  // =====================================================
 console.log(
  "%c[CHAT PROJECT RUNTIME CHECK]%c",
  "color: #059669; font-weight: bold;", // Emerald tag
  "",
  {
    project: runtime.get?.("project"),
    projectId: runtime.get?.("project.id"),
    projectObjectId: runtime.get?.("project")?.id,
    projectObjectName: runtime.get?.("project")?.name,
  }
);


  const [
    chatActionRunning,
    setChatActionRunning,
  ] = useState(false);
  

  const [
    chatLifecycleRunning,
    setChatLifecycleRunning,
  ] = useState(false);

  const [
    chatCreateTitle,
    setChatCreateTitle,
  ] = useState(
    "Runtime Chat Test"
  );

  const [
    chatCreateParticipantInput,
    setChatCreateParticipantInput,
  ] = useState("");

  const [
    chatCreateType,
    setChatCreateType,
  ] = useState("group");

  const [
    chatSelectedConversationId,
    setChatSelectedConversationId,
  ] = useState("");

  const [
    chatMessageInput,
    setChatMessageInput,
  ] = useState(
    "Hello from the Confo runtime test panel"
  );

  const [
    chatEditMessageInput,
    setChatEditMessageInput,
  ] = useState(
    "Edited message from the Confo runtime test panel"
  );

  const [
    chatLifecycleLog,
    setChatLifecycleLog,
  ] = useState([]);

  const [
    chatRuntimeRevision,
    setChatRuntimeRevision,
  ] = useState(0);


  // =====================================================
  // CHAT RUNTIME SNAPSHOT
  // =====================================================

  const getChatRuntimeSnapshot = () => ({

    conversations:
      runtime.get?.(
        "chat.conversations"
      ) ||
      [],
      
    projectId:
      runtime.get?.(
        "chat.projectId"
      ) ||
      runtimeProjectId ||
      null,

    conversationId:
      runtime.get?.(
        "chat.conversationId"
      ) ||
      null,

    conversation:
      runtime.get?.(
        "chat.conversation"
      ) ||
      null,

    conversationStatus:
      runtime.get?.(
        "chat.conversationStatus"
      ) ||
      null,

    participants:
      runtime.get?.(
        "chat.participants"
      ) ||
      [],

    joined:
      Boolean(
        runtime.get?.(
          "chat.joined"
        )
      ),

    messages:
      runtime.get?.(
        "chat.messages"
      ) ||
      [],

    lastMessage:
      runtime.get?.(
        "chat.lastMessage"
      ) ||
      null,

    messageId:
      runtime.get?.(
        "chat.messageId"
      ) ||
      null,

    lastReadMessageId:
      runtime.get?.(
        "chat.lastReadMessageId"
      ) ||
      null,

    lastReadAt:
      runtime.get?.(
        "chat.lastReadAt"
      ) ||
      null,

    realtimeConnected:
      runtime.get?.(
        "chat.realtimeConnected"
      ),
  });


  const chatRuntime =
    getChatRuntimeSnapshot();


  const chatConversations =
    Array.isArray(
      chatRuntime.conversations
    )
      ? chatRuntime.conversations
      : [];


  const activeChatConversationId =
    chatSelectedConversationId ||
    chatRuntime.conversationId ||
    "";


  const getChatMessageId = () => {

    const runtimeMessageId =
      runtime.get?.(
        "chat.messageId"
      );

    const lastMessage =
      runtime.get?.(
        "chat.lastMessage"
      ) ||
      null;

    return (
      runtimeMessageId ||
      lastMessage?.id ||
      lastMessage?._id ||
      null
    );
  };


  // =====================================================
  // CHAT STATE SUBSCRIPTIONS
  // =====================================================

  useEffect(() => {

    const paths = [
      "chat.projectId",
      "chat.conversations",
      "chat.conversationId",
      "chat.conversation",
      "chat.conversationStatus",
      "chat.participants",
      "chat.joined",
      "chat.messages",
      "chat.lastMessage",
      "chat.messageId",
      "chat.lastReadMessageId",
      "chat.lastReadAt",
      "chat.realtimeConnected",
    ];


    const unsubscribers =
      paths.map(
        path =>
          runtime.subscribe?.(
            path,
            () => {
              setChatRuntimeRevision(
                value =>
                  value + 1
              );
            }
          )
      );


    return () => {

      unsubscribers.forEach(
        unsubscribe => {
          unsubscribe?.();
        }
      );

    };

  }, [runtime]);


  // Keep the selector aligned with a newly
  // created or joined conversation.

  useEffect(() => {

    const runtimeConversationId =
      runtime.get?.(
        "chat.conversationId"
      );


    if (
      runtimeConversationId &&
      !chatSelectedConversationId
    ) {

      setChatSelectedConversationId(
        String(
          runtimeConversationId
        )
      );

    }

  }, [
    runtime,
    chatRuntimeRevision,
    chatSelectedConversationId,
  ]);


  // =====================================================
// CHAT RUNTIME HELPERS
// =====================================================

function getChatParticipantIds() {
  return Array.from(
    new Set(
      String(chatCreateParticipantInput || "")
        .split(/[\n,]+/)
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}


// -----------------------------------------------------
// CHAT ID NORMALISATION
// -----------------------------------------------------

function getChatConversationId(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const id = String(value).trim();

    return id || null;
  }

  if (
    typeof value === "object"
  ) {
    return (
      getChatConversationId(value.id) ||
      getChatConversationId(value._id) ||
      getChatConversationId(value.conversationId) ||
      getChatConversationId(value.conversation_id) ||
      getChatConversationId(value.conversation)
    );
  }

  return null;
}


function getChatMessageIdFromValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const id = String(value).trim();

    return id || null;
  }

  if (
    typeof value === "object"
  ) {
    return (
      getChatMessageIdFromValue(value.id) ||
      getChatMessageIdFromValue(value._id) ||
      getChatMessageIdFromValue(value.messageId) ||
      getChatMessageIdFromValue(value.message_id) ||
      getChatMessageIdFromValue(value.message)
    );
  }

  return null;
}


// -----------------------------------------------------
// CONVERSATION RESOLUTION
// -----------------------------------------------------

function resolveChatConversationId(
  result = null
) {
  const runtimeConversationId =
    getChatConversationId(
      runtime.get?.("chat.conversationId")
    );

  if (runtimeConversationId) {
    return runtimeConversationId;
  }

  const resultConversationId =
    getChatConversationId(
      result?.result?.conversationId
    );

  if (resultConversationId) {
    return resultConversationId;
  }

  const nestedConversationId =
    getChatConversationId(
      result?.result?.conversation
    );

  if (nestedConversationId) {
    return nestedConversationId;
  }

  const directConversationId =
    getChatConversationId(
      result?.conversationId
    );

  if (directConversationId) {
    return directConversationId;
  }

  const directConversation =
    getChatConversationId(
      result?.conversation
    );

  if (directConversation) {
    return directConversation;
  }

  return null;
}


function resolveChatMessageId(
  result = null
) {
  const runtimeMessageId =
    getChatMessageIdFromValue(
      runtime.get?.("chat.messageId")
    );

  if (runtimeMessageId) {
    return runtimeMessageId;
  }

  const runtimeLastMessage =
    runtime.get?.("chat.lastMessage");

  const lastMessageId =
    getChatMessageIdFromValue(
      runtimeLastMessage
    );

  if (lastMessageId) {
    return lastMessageId;
  }

  const resultMessageId =
    getChatMessageIdFromValue(
      result?.result?.messageId
    );

  if (resultMessageId) {
    return resultMessageId;
  }

  const resultMessage =
    getChatMessageIdFromValue(
      result?.result?.message
    );

  if (resultMessage) {
    return resultMessage;
  }

  return null;
}


// -----------------------------------------------------
// CONVERSATION SELECTION
// -----------------------------------------------------

function selectChatConversation(
  conversationId,
  options = {}
) {
  const id = getChatConversationId(
    conversationId
  );

  if (!id) {
    console.warn(
      "[Chat Runtime] Cannot select conversation without an ID."
    );

    return false;
  }

  setChatSelectedConversationId(id);

  runtime.set?.(
    "chat.conversationId",
    id
  );

  if (!options.silent) {
    recordChatLifecycle(
      "chat.conversationSelected",
      {
        ok: true,
        conversationId: id
      }
    );
  }

  return true;
}


// -----------------------------------------------------
// LIFECYCLE LOGGING
// -----------------------------------------------------

function recordChatLifecycle(
  step,
  result,
  meta = {}
) {
  const snapshot =
    getChatRuntimeSnapshot();

  const entry = {
    id:
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    step,

    timestamp:
      new Date().toISOString(),

    ok:
      result?.ok !== false,

    result,

    meta,

    snapshot
  };

  setChatLifecycleLog(
    (previous) => [
      entry,
      ...previous
    ].slice(0, 50)
  );

  console.log(
    `[Chat Runtime] ${step}`,
    entry
  );

  return entry;
}


// -----------------------------------------------------
// ACTION EXECUTION
// -----------------------------------------------------

async function runChatAction(
  action,
  params = {},
  lifecycleStep = action
) {
  if (chatActionRunning) {
    console.warn(
      "[Chat Runtime] Another Chat action is already running."
    );

    return {
      ok: false,
      error: "Another Chat action is already running."
    };
  }

  setChatActionRunning(true);

  try {
    const result =
      await runAction(
        action,
        params
      );

    recordChatLifecycle(
      lifecycleStep,
      result,
      {
        action,
        params
      }
    );

    return result;

  } catch (error) {

    const result = {
      ok: false,
      error:
        error?.message ||
        String(error)
    };

    recordChatLifecycle(
      lifecycleStep,
      result,
      {
        action,
        params
      }
    );

    console.error(
      `[Chat Runtime] ${action} failed`,
      error
    );

    return result;

  } finally {
    setChatActionRunning(false);
  }
}


// -----------------------------------------------------
// REQUIRED IDs
// -----------------------------------------------------

function requireChatConversationId(
  operation
) {
  const id =
    getChatConversationId(
      chatSelectedConversationId
    ) ||
    getChatConversationId(
      runtime.get?.("chat.conversationId")
    );

  if (!id) {
    console.warn(
      `[Chat Runtime] ${operation} requires a conversation ID.`
    );

    return null;
  }

  return id;
}


function requireChatMessageId(
  operation
) {
  const id =
    resolveChatMessageId();

  if (!id) {
    console.warn(
      `[Chat Runtime] ${operation} requires a message ID.`
    );

    return null;
  }

  return id;
}


  // =====================================================
  // CHAT: LOAD CONVERSATIONS
  // =====================================================

  async function testChatLoadConversations() {
    const result =
      await runChatAction(
        "chat.loadConversations",
        {},
        "chat.conversationsLoaded"
      );

    if (result?.ok === false) {
      return;
    }

    const conversations =
      runtime.get?.(
        "chat.conversations"
      );

    const valid =
      Array.isArray(
        conversations
      );

    recordChatLifecycle(
      "chat.conversationsVerified",
      {
        ok: valid,

        conversationCount:
          Array.isArray(conversations)
            ? conversations.length
            : 0,

        error:
          valid
            ? null
            : "chat.conversations is not an array."
      }
    );
  }


  // =====================================================
  // CHAT: CREATE CONVERSATION
  // =====================================================

  async function testChatCreateConversation() {
  const participantIds =
    getChatParticipantIds();

  if (!participantIds.length) {
    console.warn(
      "[Chat Runtime] Add at least one participant ID before creating a conversation."
    );

    recordChatLifecycle(
      "chat.createConversation.validation",
      {
        ok: false,
        error: "At least one participant ID is required."
      }
    );

    return;
  }

  const result =
    await runChatAction(
      "chat.createConversation",
      {
        title:
          chatCreateTitle.trim() ||
          "Runtime Chat Test",

        participantIds,

        type:
          chatCreateType
      },
      "chat.conversationCreated"
    );

  if (result?.ok === false) {
    return;
  }

  // ---------------------------------------------------
  // Resolve the newly-created conversation
  // ---------------------------------------------------

  const createdConversationId =
    resolveChatConversationId(
      result
    );

  if (!createdConversationId) {
    console.warn(
      "[Chat Runtime] Conversation was created but no conversation ID was returned."
    );

    recordChatLifecycle(
      "chat.createConversation.resolveId",
      {
        ok: false,
        error:
          "Conversation created but conversation ID could not be resolved."
      }
    );

    return;
  }

  // ---------------------------------------------------
  // Make the new conversation the active runtime
  // conversation immediately.
  // ---------------------------------------------------

  selectChatConversation(
    createdConversationId,
    {
      silent: true
    }
  );

  recordChatLifecycle(
    "chat.conversationSelected",
    {
      ok: true,
      conversationId:
        createdConversationId
    },
    {
      source:
        "chat.createConversation"
    }
  );

  // ---------------------------------------------------
  // IMPORTANT:
  // Refresh the conversation collection.
  //
  // Previously createConversation updated the runtime
  // conversation ID but did not refresh
  // chat.conversations, meaning the new conversation
  // could be missing from the selector.
  // ---------------------------------------------------

  const reloadResult =
    await runChatAction(
      "chat.loadConversations",
      {},
      "chat.conversationsReloadedAfterCreate"
    );

  if (reloadResult?.ok === false) {
    return;
  }

  // ---------------------------------------------------
  // Re-select the created conversation after the reload.
  // ---------------------------------------------------

  selectChatConversation(
    createdConversationId,
    {
      silent: true
    }
  );

  recordChatLifecycle(
    "chat.conversationReady",
    {
      ok: true,
      conversationId:
        createdConversationId
    },
    {
      source:
        "chat.createConversation",
      conversationsReloaded:
        true
    }
  );
}


  // =====================================================
  // CHAT: SELECT RUNTIME CONVERSATION
  // =====================================================

  async function testChatSelectRuntimeConversation() {
  const conversationId =
    getChatConversationId(
      runtime.get?.(
        "chat.conversationId"
      )
    );

  if (!conversationId) {
    console.warn(
      "[Chat Runtime] No runtime conversation ID is available."
    );

    recordChatLifecycle(
      "chat.conversationSelection.validation",
      {
        ok: false,
        error:
          "No runtime conversation ID is available."
      }
    );

    return;
  }

  selectChatConversation(
    conversationId
  );
}


  // =====================================================
  // CHAT: ACCEPT INVITATION
  // =====================================================

  const testChatAcceptInvitation =
    async () => {

      const conversationId =
        requireChatConversationId(
          "Accept Invitation"
        );


      if (
        !conversationId
      ) {
        return;
      }


      await runChatAction(
        "chat.acceptConversationInvitation",
        {
          conversationId,
        },
        "chat.conversationAccepted"
      );

    };


  // =====================================================
  // CHAT: DECLINE INVITATION
  // =====================================================

  const testChatDeclineInvitation =
    async () => {

      const conversationId =
        requireChatConversationId(
          "Decline Invitation"
        );


      if (
        !conversationId
      ) {
        return;
      }


      await runChatAction(
        "chat.declineConversationInvitation",
        {
          conversationId,
        },
        "chat.conversationDeclined"
      );

    };


  // =====================================================
  // CHAT: JOIN
  // =====================================================

  async function testChatJoinConversation() {
  const conversationId =
    requireChatConversationId(
      "chat.joinConversation"
    );

  if (!conversationId) {
    return;
  }

  const result =
    await runChatAction(
      "chat.joinConversation",
      {
        conversationId
      },
      "chat.conversationJoined"
    );

  if (result?.ok === false) {
    return;
  }

  const joined =
    Boolean(
      runtime.get?.(
        "chat.joined"
      )
    );

  recordChatLifecycle(
    "chat.joinConversationVerified",
    {
      ok: joined,

      conversationId,

      joined,

      error:
        joined
          ? null
          : "Runtime state does not report the conversation as joined."
    }
  );
}


  // =====================================================
  // CHAT: LOAD MESSAGES
  // =====================================================

  async function testChatLoadMessages() {
  const conversationId =
    requireChatConversationId(
      "chat.loadMessages"
    );

  if (!conversationId) {
    return;
  }

  const result =
    await runChatAction(
      "chat.loadMessages",
      {
        conversationId
      },
      "chat.messagesLoaded"
    );

  if (result?.ok === false) {
    return;
  }

  const messages =
    runtime.get?.(
      "chat.messages"
    );

  recordChatLifecycle(
    "chat.messagesLoadVerified",
    {
      ok:
        Array.isArray(
          messages
        ),

      conversationId,

      messageCount:
        Array.isArray(messages)
          ? messages.length
          : 0,

      error:
        Array.isArray(messages)
          ? null
          : "chat.messages is not an array."
    }
  );
}


  // =====================================================
  // CHAT: SEND MESSAGE
  // =====================================================

  async function testChatSendMessage() {
  const conversationId =
    requireChatConversationId(
      "chat.sendMessage"
    );

  if (!conversationId) {
    return;
  }

  const text =
    String(
      chatMessageInput || ""
    ).trim();

  if (!text) {
    console.warn(
      "[Chat Runtime] Enter a message before sending."
    );

    return;
  }

  const result =
    await runChatAction(
      "chat.sendMessage",
      {
        conversationId,
        text
      },
      "chat.messageSent"
    );

  if (result?.ok === false) {
    return;
  }

  const messageId =
    resolveChatMessageId(
      result
    );

  recordChatLifecycle(
    "chat.messageSendVerified",
    {
      ok:
        Boolean(messageId),

      conversationId,

      messageId,

      lastMessage:
        runtime.get?.(
          "chat.lastMessage"
        ),

      error:
        messageId
          ? null
          : "No message ID was produced after sending the message."
    }
  );

  if (
    result?.ok !== false
  ) {
    setChatMessageInput("");
  }
}


  // =====================================================
  // CHAT: EDIT MESSAGE
  // =====================================================

  const testChatEditMessage =
    async () => {

      const conversationId =
        requireChatConversationId(
          "Edit Message"
        );

      const messageId =
        requireChatMessageId(
          "Edit Message"
        );

      const text =
        chatEditMessageInput.trim();


      if (
        !conversationId ||
        !messageId
      ) {
        return;
      }


      if (
        !text
      ) {

        console.warn(
          "[RuntimeTest][CHAT] Edited message text is empty"
        );

        return;

      }


      await runChatAction(
        "chat.editMessage",
        {
          conversationId,
          messageId,
          text,
        },
        "chat.messageEdited"
      );

    };


  // =====================================================
  // CHAT: DELETE MESSAGE
  // =====================================================

  const testChatDeleteMessage =
    async () => {

      const conversationId =
        requireChatConversationId(
          "Delete Message"
        );

      const messageId =
        requireChatMessageId(
          "Delete Message"
        );


      if (
        !conversationId ||
        !messageId
      ) {
        return;
      }


      await runChatAction(
        "chat.deleteMessage",
        {
          conversationId,
          messageId,
        },
        "chat.messageDeleted"
      );

    };


  // =====================================================
  // CHAT: MARK READ
  // =====================================================

  async function testChatMarkRead() {
  const conversationId =
    requireChatConversationId(
      "chat.markConversationRead"
    );

  if (!conversationId) {
    return;
  }

  const messageId =
    requireChatMessageId(
      "chat.markConversationRead"
    );

  if (!messageId) {
    return;
  }

  const result =
    await runChatAction(
      "chat.markConversationRead",
      {
        conversationId,
        messageId
      },
      "chat.conversationMarkedRead"
    );

  if (result?.ok === false) {
    return;
  }

  const lastReadMessageId =
    getChatMessageIdFromValue(
      runtime.get?.(
        "chat.lastReadMessageId"
      )
    );

  recordChatLifecycle(
    "chat.conversationReadVerified",
    {
      ok:
        Boolean(
          lastReadMessageId
        ),

      conversationId,

      messageId,

      lastReadMessageId,

      error:
        lastReadMessageId
          ? null
          : "chat.lastReadMessageId was not populated."
    }
  );
}


  // =====================================================
  // CHAT: LEAVE
  // =====================================================

  async function testChatLeaveConversation() {
  const conversationId =
    requireChatConversationId(
      "chat.leaveConversation"
    );

  if (!conversationId) {
    return;
  }

  const result =
    await runChatAction(
      "chat.leaveConversation",
      {
        conversationId
      },
      "chat.conversationLeft"
    );

  if (result?.ok === false) {
    return;
  }

  const joined =
    Boolean(
      runtime.get?.(
        "chat.joined"
      )
    );

  recordChatLifecycle(
    "chat.leaveConversationVerified",
    {
      ok:
        !joined,

      conversationId,

      joined,

      error:
        joined
          ? "Runtime still reports the conversation as joined."
          : null
    }
  );
}


  // =====================================================
  // CHAT: CLOSE
  // =====================================================

  async function testChatCloseConversation() {
  const conversationId =
    requireChatConversationId(
      "chat.closeConversation"
    );

  if (!conversationId) {
    return;
  }

  const result =
    await runChatAction(
      "chat.closeConversation",
      {
        conversationId
      },
      "chat.conversationClosed"
    );

  if (result?.ok === false) {
    return;
  }

  const status =
    runtime.get?.(
      "chat.conversationStatus"
    );

  recordChatLifecycle(
    "chat.closeConversationVerified",
    {
      ok:
        Boolean(status),

      conversationId,

      conversationStatus:
        status,

      error:
        status
          ? null
          : "chat.conversationStatus was not populated."
    }
  );
}


  // =====================================================
  // CHAT: FULL ACTIVE-CONVERSATION LIFECYCLE
  // =====================================================

  /*
   * This tests the real runtime action pipeline.
   *
   * Invitation accept/decline remain manual because they
   * are mutually exclusive membership outcomes.
   *
   * Sequence:
   *
   *   load conversations
   *   select conversation
   *   join if necessary
   *   load messages
   *   send message
   *   mark read
   *   edit message
   *   delete message
   *   leave conversation
   *   close conversation
   */

  async function runChatActiveConversationLifecycle() {
  if (
    chatLifecycleRunning ||
    chatActionRunning
  ) {
    console.warn(
      "[Chat Runtime] Chat lifecycle is already running."
    );

    return;
  }

  setChatLifecycleRunning(true);

  setChatLifecycleLog([]);

  console.log(
    "[Chat Runtime] Starting full active conversation lifecycle."
  );

  try {

    // =================================================
    // INTERNAL LIFECYCLE STEP RUNNER
    // =================================================

    const runStep = async (
      action,
      params,
      lifecycleStep
    ) => {
      setChatActionRunning(true);

      try {

        const result =
          await runAction(
            action,
            params
          );

        recordChatLifecycle(
          lifecycleStep,
          result,
          {
            action,
            params
          }
        );

        if (
          result?.ok === false
        ) {
          throw new Error(
            result?.error ||
            `${action} failed`
          );
        }

        return result;

      } catch (error) {

        const result = {
          ok: false,
          error:
            error?.message ||
            String(error)
        };

        recordChatLifecycle(
          lifecycleStep,
          result,
          {
            action,
            params
          }
        );

        throw error;

      } finally {
        setChatActionRunning(false);
      }
    };


    const verify = (
      condition,
      step,
      details = {}
    ) => {

      const result = {
        ok:
          Boolean(condition),

        ...details
      };

      recordChatLifecycle(
        step,
        result
      );

      if (!condition) {
        throw new Error(
          details.error ||
          `${step} verification failed.`
        );
      }

      return result;
    };


    // =================================================
    // STEP 1
    // LOAD CONVERSATIONS
    // =================================================

    await runStep(
      "chat.loadConversations",
      {},
      "chat.lifecycle.loadConversations"
    );

    const conversations =
      runtime.get?.(
        "chat.conversations"
      );

    verify(
      Array.isArray(
        conversations
      ),
      "chat.lifecycle.verifyConversations",
      {
        conversationCount:
          Array.isArray(conversations)
            ? conversations.length
            : 0,

        error:
          "chat.conversations is not an array."
      }
    );


    // =================================================
    // STEP 2
    // RESOLVE ACTIVE CONVERSATION
    // =================================================

    let conversationId =
      getChatConversationId(
        chatSelectedConversationId
      ) ||
      getChatConversationId(
        runtime.get?.(
          "chat.conversationId"
        )
      );


    // -------------------------------------------------
    // If no active conversation exists, use the first
    // conversation returned by loadConversations.
    // -------------------------------------------------

    if (!conversationId) {

      const firstConversation =
        Array.isArray(
          conversations
        )
          ? conversations[0]
          : null;

      conversationId =
        getChatConversationId(
          firstConversation
        );
    }


    if (!conversationId) {

      verify(
        false,
        "chat.lifecycle.verifyActiveConversation",
        {
          error:
            "No active conversation exists and no conversation was returned by chat.loadConversations."
        }
      );
    }


    // -------------------------------------------------
    // Set the active runtime conversation.
    // -------------------------------------------------

    selectChatConversation(
      conversationId,
      {
        silent: true
      }
    );

    verify(
      getChatConversationId(
        runtime.get?.(
          "chat.conversationId"
        )
      ) === conversationId,

      "chat.lifecycle.verifyConversationSelection",

      {
        conversationId,

        runtimeConversationId:
          runtime.get?.(
            "chat.conversationId"
          ),

        error:
          "Runtime conversation ID does not match the selected conversation."
      }
    );


    // =================================================
    // STEP 3
    // JOIN IF NECESSARY
    // =================================================

    const joinedBefore =
      Boolean(
        runtime.get?.(
          "chat.joined"
        )
      );

    if (!joinedBefore) {

      await runStep(
        "chat.joinConversation",
        {
          conversationId
        },
        "chat.lifecycle.joinConversation"
      );
    } else {

      recordChatLifecycle(
        "chat.lifecycle.joinConversationSkipped",
        {
          ok: true,
          reason:
            "Conversation is already joined."
        }
      );
    }


    // -------------------------------------------------
    // Verify membership
    // -------------------------------------------------

    const joinedAfter =
      Boolean(
        runtime.get?.(
          "chat.joined"
        )
      );

    verify(
      joinedAfter,
      "chat.lifecycle.verifyJoined",
      {
        conversationId,

        joined:
          joinedAfter,

        error:
          "Conversation is not joined after chat.joinConversation."
      }
    );


    // =================================================
    // STEP 4
    // LOAD MESSAGES
    // =================================================

    await runStep(
      "chat.loadMessages",
      {
        conversationId
      },
      "chat.lifecycle.loadMessages"
    );

    const messages =
      runtime.get?.(
        "chat.messages"
      );

    verify(
      Array.isArray(
        messages
      ),
      "chat.lifecycle.verifyMessages",
      {
        messageCount:
          Array.isArray(messages)
            ? messages.length
            : 0,

        error:
          "chat.messages is not an array."
      }
    );


    // =================================================
    // STEP 5
    // SEND MESSAGE
    // =================================================

    const messageText =
      String(
        chatMessageInput || ""
      ).trim();

    if (!messageText) {

      verify(
        false,
        "chat.lifecycle.verifyMessageInput",
        {
          error:
            "Chat message input is empty."
        }
      );
    }


    const sendResult =
      await runStep(
        "chat.sendMessage",
        {
          conversationId,
          text: messageText
        },
        "chat.lifecycle.sendMessage"
      );


    // -------------------------------------------------
    // Resolve message ID from runtime/result.
    // -------------------------------------------------

    const messageId =
      resolveChatMessageId(
        sendResult
      );


    verify(
      Boolean(
        messageId
      ),
      "chat.lifecycle.verifySentMessage",
      {
        messageId,

        runtimeMessageId:
          runtime.get?.(
            "chat.messageId"
          ),

        lastMessage:
          runtime.get?.(
            "chat.lastMessage"
          ),

        error:
          "chat.sendMessage completed but no message ID was available in runtime state or action result."
      }
    );


    // =================================================
    // STEP 6
    // MARK CONVERSATION READ
    // =================================================

    await runStep(
      "chat.markConversationRead",
      {
        conversationId,
        messageId
      },
      "chat.lifecycle.markConversationRead"
    );


    const lastReadMessageId =
      getChatMessageIdFromValue(
        runtime.get?.(
          "chat.lastReadMessageId"
        )
      );


    verify(
      Boolean(
        lastReadMessageId
      ),
      "chat.lifecycle.verifyConversationRead",
      {
        messageId,

        lastReadMessageId,

        error:
          "Conversation was marked read but chat.lastReadMessageId was not populated."
      }
    );


    // =================================================
    // STEP 7
    // EDIT MESSAGE
    // =================================================

    const editText =
      String(
        chatEditMessageInput || ""
      ).trim();

    if (editText) {

      await runStep(
        "chat.editMessage",
        {
          conversationId,
          messageId,
          text: editText
        },
        "chat.lifecycle.editMessage"
      );


      const messagesAfterEdit =
        runtime.get?.(
          "chat.messages"
        );

      const editedMessage =
        Array.isArray(
          messagesAfterEdit
        )
          ? messagesAfterEdit.find(
              (message) =>
                getChatMessageIdFromValue(
                  message
                ) === messageId
            )
          : null;


      recordChatLifecycle(
        "chat.lifecycle.verifyEditedMessage",
        {
          ok:
            Boolean(
              editedMessage
            ),

          messageId,

          editedMessage,

          messageCount:
            Array.isArray(
              messagesAfterEdit
            )
              ? messagesAfterEdit.length
              : 0
        }
      );

    } else {

      recordChatLifecycle(
        "chat.lifecycle.editMessageSkipped",
        {
          ok: true,

          reason:
            "Edit message input is empty."
        }
      );
    }


    // =================================================
    // STEP 8
    // DELETE MESSAGE
    // =================================================

    await runStep(
      "chat.deleteMessage",
      {
        conversationId,
        messageId
      },
      "chat.lifecycle.deleteMessage"
    );


    const messagesAfterDelete =
      runtime.get?.(
        "chat.messages"
      );


    const deletedMessageStillPresent =
      Array.isArray(
        messagesAfterDelete
      )
        ? messagesAfterDelete.some(
            (message) =>
              getChatMessageIdFromValue(
                message
              ) === messageId
          )
        : false;


    recordChatLifecycle(
      "chat.lifecycle.verifyDeletedMessage",
      {
        ok:
          !deletedMessageStillPresent,

        messageId,

        messageStillPresent:
          deletedMessageStillPresent,

        messageCount:
          Array.isArray(
            messagesAfterDelete
          )
            ? messagesAfterDelete.length
            : 0,

        error:
          deletedMessageStillPresent
            ? "Deleted message is still present in chat.messages."
            : null
      }
    );


    // =================================================
    // STEP 9
    // LEAVE CONVERSATION
    // =================================================

    await runStep(
      "chat.leaveConversation",
      {
        conversationId
      },
      "chat.lifecycle.leaveConversation"
    );


    const joinedAfterLeave =
      Boolean(
        runtime.get?.(
          "chat.joined"
        )
      );


    verify(
      !joinedAfterLeave,
      "chat.lifecycle.verifyLeftConversation",
      {
        conversationId,

        joined:
          joinedAfterLeave,

        error:
          "chat.joinConversation state still reports joined after chat.leaveConversation."
      }
    );


    // =================================================
    // STEP 10
    // CLOSE CONVERSATION
    // =================================================

    await runStep(
      "chat.closeConversation",
      {
        conversationId
      },
      "chat.lifecycle.closeConversation"
    );


    const finalStatus =
      runtime.get?.(
        "chat.conversationStatus"
      );


    recordChatLifecycle(
      "chat.lifecycle.verifyClosedConversation",
      {
        ok:
          Boolean(
            finalStatus
          ),

        conversationId,

        conversationStatus:
          finalStatus,

        error:
          finalStatus
            ? null
            : "chat.conversationStatus was not populated after close."
      }
    );


    // =================================================
    // COMPLETE
    // =================================================

    recordChatLifecycle(
      "chat.lifecycle.complete",
      {
        ok: true,

        conversationId,

        messageId,

        finalStatus,

        summary:
          "Full Chat runtime lifecycle completed."
      }
    );

    console.log(
      "[Chat Runtime] Full lifecycle completed successfully."
    );

  } catch (error) {

    recordChatLifecycle(
      "chat.lifecycle.failed",
      {
        ok: false,

        error:
          error?.message ||
          String(error)
      }
    );

    console.error(
      "[Chat Runtime] Full lifecycle failed.",
      error
    );

  } finally {

    setChatActionRunning(false);

    setChatLifecycleRunning(false);
  }
}


  // =====================================================
  // CHAT: CLEAR TEST LOG
  // =====================================================

  const clearChatLifecycleLog =
    () => {

      setChatLifecycleLog(
        []
      );

    };


  // =====================================================
  // CHAT: DUMP RUNTIME
  // =====================================================

  const dumpChatRuntime =
    () => {

      console.group(
        "CHAT RUNTIME SNAPSHOT"
      );


      console.log(
        getChatRuntimeSnapshot()
      );


      console.log(
        "Selected conversation:",
        activeChatConversationId
      );


      console.log(
        "Lifecycle log:",
        chatLifecycleLog
      );


      console.groupEnd();

    };
  // ===================================================
  // GROUP CALL TEST INPUT
  // ===================================================

  const [
    groupParticipantInput,
    setGroupParticipantInput,
  ] =
  useState("");


  const [
    groupCallIdInput,
    setGroupCallIdInput,
  ] =
  useState("");


  const [
    selectedGroupInvitationIndex,
    setSelectedGroupInvitationIndex,
  ] =
  useState(0);


  const [
    groupActionRunning,
    setGroupActionRunning,
  ] =
  useState(false);


  // ===================================================
  // GROUP CALL RUNTIME STATE
  // ===================================================

  const [
    pendingGroupInvitations,
    setPendingGroupInvitations,
  ] =
  useState(
    () => {

      const value =
        runtime.get?.(
          "calls.pendingInvitations"
        );

      return Array.isArray(value)
        ? value
        : [];

    }
  );


  const [
    runtimeGroupCallId,
    setRuntimeGroupCallId,
  ] =
  useState(
    () =>
      runtime.get?.(
        "call.id"
      ) || ""
  );


  const [
    groupCallChannel,
    setGroupCallChannel,
  ] =
  useState(
    () =>
      runtime.get?.(
        "call.channel"
      ) || ""
  );


  const [
    groupCallState,
    setGroupCallState,
  ] =
  useState(
    () =>
      runtime.get?.(
        "call.state"
      ) || "idle"
  );


  const [
    groupCallJoined,
    setGroupCallJoined,
  ] =
  useState(
    () =>
      Boolean(
        runtime.get?.(
          "call.joined"
        )
      )
  );


  // ===================================================
  // GROUP CALL PARTICIPANT COUNT
  // ===================================================

  const [
    groupCallParticipantCount,
    setGroupCallParticipantCount,
  ] =
  useState(
    () => {

      const initialParticipants =
        runtime.get?.(
          "call.participants"
        );

      return Array.isArray(
        initialParticipants
      )
        ? initialParticipants.length
        : Number(
            initialParticipants || 0
          );

    }
  );


  const [
    groupRemoteUsers,
    setGroupRemoteUsers,
  ] =
  useState(
    () =>
      runtime.get?.(
        "call.remoteUsers"
      ) || {}
  );


  // ===================================================
  // MEDIA RUNTIME TEST STATE
  // ===================================================

  const [
    mediaSource,
    setMediaSource,
  ] =
  useState(
    () =>
      runtime.get?.(
        "media.testSource"
      ) ||
      DEFAULT_VIDEO_SOURCE
  );


  const [
    fileSource,
    setFileSource,
  ] =
  useState(
    () =>
      runtime.get?.(
        "media.fileSource.url"
      ) ||
      DEFAULT_PDF_SOURCE
  );


  const [
    fileType,
    setFileType,
  ] =
  useState(
    () =>
      runtime.get?.(
        "media.fileSource.type"
      ) ||
      "application/pdf"
  );


  const [
    fileName,
    setFileName,
  ] =
  useState(
    () =>
      runtime.get?.(
        "media.fileSource.name"
      ) ||
      "Test PDF"
  );


  // ===================================================
  // DRAGGING
  // ===================================================

  const dragRef =
    useRef({
      dragging: false,
      offsetX: 0,
      offsetY: 0,
    });


  // ===================================================
  // REQUEST / ACTION LOCK
  // ===================================================

  const runningActionRef =
    useRef(false);


  // ===================================================
  // RESPONSIVE EFFECT
  // ===================================================

  useEffect(() => {

    const handleResize =
      () => {

        const mobile =
          window.innerWidth <= 600;

        setIsMobile(
          mobile
        );

        if (
          !mobile &&
          !isOpen
        ) {
          setIsOpen(
            true
          );
        }

      };


    window.addEventListener(
      "resize",
      handleResize
    );


    return () => {

      window.removeEventListener(
        "resize",
        handleResize
      );

    };

  }, [
    isOpen,
  ]);


  // ===================================================
  // TRAINING RUNTIME SUBSCRIPTION
  // ===================================================

  useEffect(() => {

    const initial =
      runtime.get?.(
        "training.participantIds"
      );


    setTrainingParticipantIds(
      Array.isArray(initial)
        ? initial
        : []
    );


    const unsubscribe =
      runtime.subscribe(
        "training.participantIds",
        value => {

          const ids =
            Array.isArray(value)
              ? value
              : [];


          setTrainingParticipantIds(
            ids
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // GROUP CALL RUNTIME SUBSCRIPTIONS
  // ===================================================

  useEffect(() => {

    // -------------------------------------------------
    // INITIAL VALUES
    // -------------------------------------------------

    const initialInvitations =
      runtime.get?.(
        "calls.pendingInvitations"
      );


    setPendingGroupInvitations(
      Array.isArray(
        initialInvitations
      )
        ? initialInvitations
        : []
    );


    setRuntimeGroupCallId(
      runtime.get?.(
        "call.id"
      ) || ""
    );


    setGroupCallChannel(
      runtime.get?.(
        "call.channel"
      ) || ""
    );


    setGroupCallState(
      runtime.get?.(
        "call.state"
      ) || "idle"
    );


    setGroupCallJoined(
      Boolean(
        runtime.get?.(
          "call.joined"
        )
      )
    );


    const initialParticipants =
      runtime.get?.(
        "call.participants"
      );


    setGroupCallParticipantCount(
      Array.isArray(
        initialParticipants
      )
        ? initialParticipants.length
        : Number(
            initialParticipants || 0
          )
    );


    setGroupRemoteUsers(
      runtime.get?.(
        "call.remoteUsers"
      ) || {}
    );


    // -------------------------------------------------
    // SUBSCRIPTIONS
    // -------------------------------------------------

    const unsubscribeInvitations =
      runtime.subscribe?.(
        "calls.pendingInvitations",
        value => {

          const list =
            Array.isArray(value)
              ? value
              : [];


          console.log(
            "[RuntimeTest] pending invitations updated",
            {
              count:
                list.length,

              invitations:
                list,
            }
          );


          setPendingGroupInvitations(
            list
          );


          setSelectedGroupInvitationIndex(
            previous =>
              list.length === 0
                ? 0
                : Math.min(
                    previous,
                    list.length - 1
                  )
          );

        }
      );


    const unsubscribeCallId =
      runtime.subscribe?.(
        "call.id",
        value => {

          setRuntimeGroupCallId(
            value || ""
          );

        }
      );


    const unsubscribeChannel =
      runtime.subscribe?.(
        "call.channel",
        value => {

          setGroupCallChannel(
            value || ""
          );

        }
      );


    const unsubscribeState =
      runtime.subscribe?.(
        "call.state",
        value => {

          setGroupCallState(
            value || "idle"
          );

        }
      );


    const unsubscribeJoined =
      runtime.subscribe?.(
        "call.joined",
        value => {

          setGroupCallJoined(
            Boolean(value)
          );

        }
      );


    const unsubscribeParticipants =
      runtime.subscribe?.(
        "call.participants",
        value => {

          const count =
            Array.isArray(value)
              ? value.length
              : Number(
                  value || 0
                );


          setGroupCallParticipantCount(
            count
          );

        }
      );


    const unsubscribeRemoteUsers =
      runtime.subscribe?.(
        "call.remoteUsers",
        value => {

          setGroupRemoteUsers(
            value || {}
          );

        }
      );


    // -------------------------------------------------
    // CLEANUP
    // -------------------------------------------------

    return () => {

      unsubscribeInvitations?.();
      unsubscribeCallId?.();
      unsubscribeChannel?.();
      unsubscribeState?.();
      unsubscribeJoined?.();
      unsubscribeParticipants?.();
      unsubscribeRemoteUsers?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // DRAG HANDLERS
  // ===================================================

  const handleDragStart =
    event => {

      if (
        event.target.closest(
          "[data-debug-close]"
        )
      ) {
        return;
      }


      dragRef.current.dragging =
        true;


      dragRef.current.offsetX =
        event.clientX -
        position.x;


      dragRef.current.offsetY =
        event.clientY -
        position.y;


      document.addEventListener(
        "pointermove",
        handleDragging
      );


      document.addEventListener(
        "pointerup",
        handleDragEnd
      );

    };


  const handleDragging =
    event => {

      if (
        !dragRef.current.dragging
      ) {
        return;
      }


      const panelWidth =
        isMobile
          ? window.innerWidth - 24
          : 420;


      const panelHeight =
        window.innerHeight * 0.9;


      const nextX =
        event.clientX -
        dragRef.current.offsetX;


      const nextY =
        event.clientY -
        dragRef.current.offsetY;


      setPosition({
        x:
          Math.max(
            8,
            Math.min(
              nextX,
              window.innerWidth -
                panelWidth -
                8
            )
          ),

        y:
          Math.max(
            8,
            Math.min(
              nextY,
              window.innerHeight -
                Math.min(
                  panelHeight,
                  window.innerHeight - 16
                )
            )
          ),
      });

    };


  const handleDragEnd =
    () => {

      dragRef.current.dragging =
        false;


      document.removeEventListener(
        "pointermove",
        handleDragging
      );


      document.removeEventListener(
        "pointerup",
        handleDragEnd
      );

    };


  // =====================================================
  // DEBUG SNAPSHOT
  // =====================================================

  const dumpRuntime =
    () => {

      console.group(
        "FULL RUNTIME SNAPSHOT"
      );


      console.log(
        runtime.getAll()
      );


      console.groupEnd();

    };


  // =====================================================
  // PROJECT DEBUG
  // =====================================================

  const dumpProjectRuntime =
    () => {

      console.group(
        "PROJECT RUNTIME DEBUG"
      );


      console.log(
        "[PROJECT RUNTIME TEST]",
        {
          activeProject,

          runtimeProject,

          runtimeProjectId,

          projectSchemaName:
            projectSchema?.name ||
            null,

          projectSchemaTree:
            projectSchema?.tree ||
            null,
        }
      );


      console.groupEnd();

    };


  // =====================================================
  // VIDEO FEED RESOLUTION
  // =====================================================

  const VIDEO_FEED_SOURCE_ID =
    "interview-video";


  const videoFeedElement =
    findElementBySourceId(
      projectSchema?.tree,
      VIDEO_FEED_SOURCE_ID
    );


  const videoFeedId =
    videoFeedElement?.id ||
    null;


  // =====================================================
  // VIDEO TARGET VALIDATION
  // =====================================================

  const requireVideoFeed =
    () => {

      if (
        videoFeedId
      ) {
        return true;
      }


      console.warn(
        "[RuntimeTest] VideoFeed not found",
        {
          sourceId:
            VIDEO_FEED_SOURCE_ID,

          activeProject,

          runtimeProjectId,

          projectTree:
            projectSchema?.tree,
        }
      );


      return false;

    };


  // =====================================================
  // VIDEO MIC
  // =====================================================

  const toggleVideoFeedMic =
    async () => {

      if (
        !requireVideoFeed()
      ) {
        return;
      }


      const result =
        await runAction(
          "video.toggleMic",
          {
            id:
              videoFeedId,

            targetId:
              videoFeedId,
          }
        );


      console.log(
        "[RuntimeTest] video.toggleMic result:",
        result
      );

    };


  // =====================================================
  // VIDEO CAMERA
  // =====================================================

  const toggleVideoFeedCamera =
    async () => {

      if (
        !requireVideoFeed()
      ) {
        return;
      }


      const result =
        await runAction(
          "video.toggleVideo",
          {
            id:
              videoFeedId,

            targetId:
              videoFeedId,
          }
        );


      console.log(
        "[RuntimeTest] video.toggleVideo result:",
        result
      );

    };


  // =====================================================
  // START RECORDING
  // =====================================================

  const startVideoRecording =
    async () => {

      if (
        !requireVideoFeed()
      ) {
        return;
      }


      const result =
        await runAction(
          "video.startRecording",
          {
            id:
              videoFeedId,

            targetId:
              videoFeedId,
          }
        );


      console.log(
        "[RuntimeTest] startRecording result:",
        result
      );

    };


  // =====================================================
  // STOP RECORDING
  // =====================================================

  const stopVideoRecording =
    async () => {

      if (
        !requireVideoFeed()
      ) {
        return;
      }


      const result =
        await runAction(
          "video.stopRecording",
          {
            id:
              videoFeedId,

            targetId:
              videoFeedId,
          }
        );


      console.log(
        "[RuntimeTest] stopRecording result:",
        result
      );

    };


  // =====================================================
  // TRAINING PARTICIPANTS
  // =====================================================

  const getTrainingParticipantIds =
    () => {

      return [
        ...new Set(
          trainingParticipantIds
            .map(
              id =>
                String(id).trim()
            )
            .filter(Boolean)
        ),
      ];

    };


  const trainingParticipantCount =
    getTrainingParticipantIds().length;


  // =====================================================
  // CREATE TRAINING
  // =====================================================

  const createTrainingSession =
    async () => {

      const participantIds =
        getTrainingParticipantIds();


      if (
        participantIds.length === 0
      ) {

        console.warn(
          "[RuntimeTest] Cannot create training session - no participants selected"
        );

        return;

      }


      if (
        runningActionRef.current
      ) {
        return;
      }


      runningActionRef.current =
        true;


      try {

        const result =
          await runAction(
            "training.createSession",
            {
              participantIds,
            }
          );


        console.log(
          "[RuntimeTest] training.createSession result:",
          result
        );

      }
      finally {

        runningActionRef.current =
          false;

      }

    };


  // =====================================================
  // START TRAINING
  // =====================================================

  const startTrainingSession =
    async () => {

      const participantIds =
        getTrainingParticipantIds();


      if (
        participantIds.length === 0
      ) {

        console.warn(
          "[RuntimeTest] Cannot start training session - no participants selected"
        );

        return;

      }


      if (
        runningActionRef.current
      ) {
        return;
      }


      runningActionRef.current =
        true;


      try {

        const result =
          await runAction(
            "training.startSession",
            {
              participantIds,
            }
          );


        console.log(
          "[RuntimeTest] training.startSession result:",
          result
        );

      }
      finally {

        runningActionRef.current =
          false;

      }

    };


  // =====================================================
  // END TRAINING
  // =====================================================

  const endTrainingSession =
    async () => {

      const sessionId =
        runtime.get?.(
          "training.sessionId"
        );


      if (
        !sessionId
      ) {

        console.warn(
          "[RuntimeTest] No training session to end"
        );

        return;

      }


      if (
        runningActionRef.current
      ) {
        return;
      }


      runningActionRef.current =
        true;


      try {

        const result =
          await runAction(
            "training.endSession",
            {
              sessionId,
            }
          );


        console.log(
          "[RuntimeTest] training.endSession result:",
          result
        );

      }
      finally {

        runningActionRef.current =
          false;

      }

    };


  // =====================================================
  // GROUP CALL HELPERS
  // =====================================================

  const getGroupParticipantIds =
    () => {

      return [
        ...new Set(
          groupParticipantInput
            .split(/[\n,]+/)
            .map(
              value =>
                value.trim()
            )
            .filter(Boolean)
        ),
      ];

    };


  const groupParticipantIds =
    getGroupParticipantIds();


  const groupParticipantCount =
    groupParticipantIds.length;


  // =====================================================
  // SELECTED GROUP INVITATION
  // =====================================================

  const selectedGroupInvitation =
    Array.isArray(
      pendingGroupInvitations
    )
      ? pendingGroupInvitations[
          selectedGroupInvitationIndex
        ] || null
      : null;


  // =====================================================
  // ACTIVE GROUP CALL ID
  // =====================================================

  const activeGroupCallId =
    groupCallIdInput.trim() ||
    selectedGroupInvitation?.callId ||
    runtimeGroupCallId ||
    "";


  // =====================================================
  // GROUP ACTION RUNNER
  // =====================================================

  const runGroupAction =
    async (
      action,
      params = {}
    ) => {

      if (
        groupActionRunning
      ) {
        return null;
      }


      setGroupActionRunning(
        true
      );


      try {

        console.log(
          "[RuntimeTest] GROUP ACTION",
          {
            action,
            params,
          }
        );


        const result =
          await runAction(
            action,
            params
          );


        console.log(
          `[RuntimeTest] ${action} result:`,
          result
        );


        return result;

      }
      catch (error) {

        console.error(
          `[RuntimeTest] ${action} failed`,
          error
        );


        return {
          ok:
            false,

          error:
            error?.message ||
            "GROUP_ACTION_FAILED",
        };

      }
      finally {

        setGroupActionRunning(
          false
        );

      }

    };


  // =====================================================
  // CREATE GROUP CALL
  // =====================================================

  const testCreateGroupCall =
    async () => {

      const participantIds =
        getGroupParticipantIds();


      if (
        participantIds.length === 0
      ) {

        console.warn(
          "[RuntimeTest] Enter at least one participant ID"
        );

        return;

      }


      const result =
        await runGroupAction(
          "call.createGroupCall",
          {
            participantIds,
          }
        );


      if (
        result?.result?.callId
      ) {

        setGroupCallIdInput(
          String(
            result.result.callId
          )
        );

      }

    };


  // =====================================================
  // FETCH GROUP INVITATIONS
  // =====================================================

  const testFetchPendingInvitations =
    async () => {

      await runGroupAction(
        "call.fetchPendingInvitations"
      );

    };


  // =====================================================
  // SELECT INVITATION
  // =====================================================

  const selectGroupInvitation =
    index => {

      setSelectedGroupInvitationIndex(
        index
      );


      const invitation =
        pendingGroupInvitations[
          index
        ];


      if (
        invitation?.callId
      ) {

        setGroupCallIdInput(
          invitation.callId
        );

      }

    };


  // =====================================================
  // APPLY SELECTED INVITATION
  // =====================================================

  const applySelectedInvitation =
    () => {

      if (
        selectedGroupInvitation?.callId
      ) {

        setGroupCallIdInput(
          selectedGroupInvitation.callId
        );


        console.log(
          "[RuntimeTest] Selected group invitation",
          selectedGroupInvitation
        );

      }

    };


  // =====================================================
  // ACCEPT GROUP INVITATION
  // =====================================================

  const testAcceptInvitation =
    async () => {

      const callId =
        activeGroupCallId;


      if (
        !callId
      ) {

        console.warn(
          "[RuntimeTest] No group call ID selected"
        );

        return;

      }


      await runGroupAction(
        "call.acceptInvitation",
        {
          callId,
        }
      );

    };


  // =====================================================
  // DECLINE GROUP INVITATION
  // =====================================================

  const testDeclineInvitation =
    async () => {

      const callId =
        activeGroupCallId;


      if (
        !callId
      ) {

        console.warn(
          "[RuntimeTest] No group call ID selected"
        );

        return;

      }


      await runGroupAction(
        "call.declineInvitation",
        {
          callId,
        }
      );

    };


  // =====================================================
  // JOIN GROUP CALL
  // =====================================================

  const testJoinGroupCall =
    async () => {

      const callId =
        activeGroupCallId;


      if (
        !callId
      ) {

        console.warn(
          "[RuntimeTest] No group call ID available"
        );

        return;

      }


      await runGroupAction(
        "call.joinGroupCall",
        {
          callId,
        }
      );

    };


  // =====================================================
  // REFRESH GROUP CALL
  // =====================================================

  const testRefreshGroupCall =
    async () => {

      const callId =
        activeGroupCallId;


      if (
        !callId
      ) {

        console.warn(
          "[RuntimeTest] No group call ID available"
        );

        return;

      }


      console.log(
        "[RuntimeTest] Refreshing group call",
        {
          callId,
        }
      );


      await runGroupAction(
        "call.refreshGroupCall",
        {
          callId,
        }
      );

    };


  // =====================================================
  // LEAVE GROUP CALL
  // =====================================================

  const testLeaveGroupCall =
    async () => {

      const callId =
        activeGroupCallId;


      if (
        !callId
      ) {

        console.warn(
          "[RuntimeTest] No group call ID available"
        );

        return;

      }


      await runGroupAction(
        "call.leaveGroupCall",
        {
          callId,
        }
      );

    };


  // =====================================================
  // END GROUP CALL
  // =====================================================

  const testEndGroupCall =
    async () => {

      const callId =
        activeGroupCallId;


      if (
        !callId
      ) {

        console.warn(
          "[RuntimeTest] No group call ID available"
        );

        return;

      }


      await runGroupAction(
        "call.endGroupCall",
        {
          callId,
        }
      );

    };


  // =====================================================
  // CLEAR GROUP TEST FIELDS
  // =====================================================

  const clearGroupCallTest =
    () => {

      setGroupParticipantInput(
        ""
      );

      setGroupCallIdInput(
        ""
      );

      setSelectedGroupInvitationIndex(
        0
      );

    };


  // =====================================================
  // COMPLIANCE CONTROLS
  // =====================================================

  const testLoadCompliance =
    async () => {

      if (
        runningActionRef.current
      ) {
        return;
      }


      runningActionRef.current =
        true;


      try {

        console.log(
          "[RuntimeTest] Loading compliance..."
        );


        const result =
          await runAction(
            "compliance.load"
          );


        console.log(
          "[RuntimeTest] compliance.load result:",
          result
        );

      }
      catch (error) {

        console.error(
          "[RuntimeTest] compliance.load failed:",
          error
        );

      }
      finally {

        runningActionRef.current =
          false;

      }

    };


  // =====================================================
  // REQUEST COMPLIANCE EVIDENCE
  // =====================================================

  const testRequestEvidence =
    async () => {

      if (
        runningActionRef.current
      ) {
        return;
      }


      runningActionRef.current =
        true;


      try {

        const controls =
          runtime.get?.(
            "compliance.controls"
          ) || [];


        if (
          !controls.length
        ) {

          console.warn(
            "[RuntimeTest] No compliance controls loaded. Run compliance.load first."
          );

          return;

        }


        const control =
          controls[0];


        console.log(
          "[RuntimeTest] Requesting evidence for:",
          control
        );


        const result =
          await runAction(
            "compliance.requestEvidence",
            {
              controlId:
                control.id,

              name:
                `Evidence for ${control.reference}`,

              description:
                `Evidence requested for ${control.reference} - ${control.title}`,

              type:
                "document",
            }
          );


        console.log(
          "[RuntimeTest] compliance.requestEvidence result:",
          result
        );

      }
      catch (error) {

        console.error(
          "[RuntimeTest] compliance.requestEvidence failed:",
          error
        );

      }
      finally {

        runningActionRef.current =
          false;

      }

    };


  // =====================================================
  // UPLOAD COMPLIANCE EVIDENCE
  // =====================================================

  const testUploadEvidence =
    async () => {

      if (
        runningActionRef.current
      ) {
        return;
      }


      runningActionRef.current =
        true;


      try {

        const evidence =
          runtime.get?.(
            "compliance.evidence"
          ) || [];


        if (
          !evidence.length
        ) {

          console.warn(
            "[RuntimeTest] No evidence found. Run requestEvidence first."
          );

          return;

        }


        const item =
          evidence[0];


        console.log(
          "[RuntimeTest] Uploading evidence:",
          item
        );


        const result =
          await runAction(
            "compliance.uploadEvidence",
            {
              evidenceId:
                item.id,

              fileName:
                "information-security-policy.pdf",

              fileUrl:
                "/temporary/information-security-policy.pdf",
            }
          );


        console.log(
          "[RuntimeTest] compliance.uploadEvidence result:",
          result
        );

      }
      catch (error) {

        console.error(
          "[RuntimeTest] compliance.uploadEvidence failed:",
          error
        );

      }
      finally {

        runningActionRef.current =
          false;

      }

    };

  // =====================================================
  // ANALYSE EVIDENCE
  // =====================================================

    const testAnalyseEvidence = async () => {
  if (runningActionRef.current) {
    return;
  }

  runningActionRef.current = true;

  try {
    const evidence =
      runtime.get?.(
        "compliance.evidence"
      ) || [];

    if (!evidence.length) {
      console.warn(
        "[RuntimeTest] No evidence found. Run requestEvidence and uploadEvidence first."
      );
      return;
    }

    const item = evidence[0];

    console.log(
      "[RuntimeTest] Analysing evidence:",
      item
    );

    const result =
      await runAction(
        "compliance.analyseEvidence",
        {
          evidenceId: item.id,
        }
      );

    console.log(
      "[RuntimeTest] compliance.analyseEvidence result:",
      result
    );
  } catch (error) {
    console.error(
      "[RuntimeTest] compliance.analyseEvidence failed:",
      error
    );
  } finally {
    runningActionRef.current = false;
  }
};

const testAcceptEvidence = async () => {
  const evidence =
    (runtime.get?.("compliance.evidence") || [])
      .find((item) => item.status === "review_required");

  if (!evidence) {
    console.warn(
      "[RuntimeTestPanel] No evidence requiring review"
    );
    return;
  }

  await runAction(
    "compliance.acceptEvidence",
    {
      evidenceId: evidence.id,
    }
  );
};


const testRejectEvidence = async () => {
  const evidence =
    (runtime.get?.("compliance.evidence") || [])
      .find((item) => item.status === "review_required");

  if (!evidence) {
    console.warn(
      "[RuntimeTestPanel] No evidence requiring review"
    );
    return;
  }

  await runAction(
    "compliance.rejectEvidence",
    {
      evidenceId: evidence.id,
    }
  );
};

// =====================================================
// UPDATE COMPLIANCE CONTROL STATUS
// =====================================================

const testUpdateControlStatus =
  async () => {

    if (
      runningActionRef.current
    ) {
      return;
    }

    runningActionRef.current =
      true;

    try {

      const controls =
        runtime.get?.(
          "compliance.controls"
        ) || [];

      if (
        !Array.isArray(controls) ||
        controls.length === 0
      ) {

        console.warn(
          "[RuntimeTest] No compliance controls loaded. Run compliance.load first."
        );

        return;
      }

      // -----------------------------------------------
      // For the first test, use the first ISO control
      // -----------------------------------------------

      const control =
        controls[0];

      if (
        !control?.id
      ) {

        console.warn(
          "[RuntimeTest] Selected control has no ID",
          control
        );

        return;
      }

      console.log(
        "[RuntimeTest] Updating control status",
        {
          controlId:
            control.id,

          reference:
            control.reference,

          previousStatus:
            control.status,

          newStatus:
            "satisfied",
        }
      );

      const result =
        await runAction(
          "compliance.updateControlStatus",
          {
            controlId:
              control.id,

            status:
              "satisfied",
          }
        );

      console.log(
        "[RuntimeTest] compliance.updateControlStatus result:",
        result
      );

    }
    catch (error) {

      console.error(
        "[RuntimeTest] compliance.updateControlStatus failed:",
        error
      );

    }
    finally {

      runningActionRef.current =
        false;

    }

  };

  // =====================================================
  // SET MEDIA TEST SOURCE
  // =====================================================

  const setMediaTestSource =
    () => {

      const value =
        mediaSource.trim();


      if (
        !value
      ) {

        console.warn(
          "[RuntimeTest] Media source is empty"
        );

        return;

      }


      const detectedType =
        detectMediaType(
          value
        );


      runtime.set(
        "media.testSource",
        value
      );


      runtime.set(
        "media.testSourceType",
        detectedType
      );


      console.log(
        "[RuntimeTest] MEDIA SOURCE SET",
        {
          key:
            "media.testSource",

          value,

          detectedType,
        }
      );

    };


  // =====================================================
  // SET DEFAULT MP4
  // =====================================================

  const setBigBuckBunny =
    () => {

      const value =
        DEFAULT_VIDEO_SOURCE;


      setMediaSource(
        value
      );


      runtime.set(
        "media.testSource",
        value
      );


      runtime.set(
        "media.testSourceType",
        "video"
      );


      console.log(
        "[RuntimeTest] Big Buck Bunny source set"
      );

    };


  // =====================================================
  // SET YOUTUBE
  // =====================================================

  const setYouTubeSource =
    () => {

      const value =
        DEFAULT_YOUTUBE_SOURCE;


      setMediaSource(
        value
      );


      runtime.set(
        "media.testSource",
        value
      );


      runtime.set(
        "media.testSourceType",
        "youtube"
      );


      console.log(
        "[RuntimeTest] YouTube source set"
      );

    };


  // =====================================================
  // SET FILE SOURCE
  // =====================================================

  const setFileTestSource =
    () => {

      const url =
        fileSource.trim();


      if (
        !url
      ) {

        console.warn(
          "[RuntimeTest] File source is empty"
        );

        return;

      }


      const source = {

        url,

        type:
          fileType,

        name:
          fileName.trim() ||
          "Test file",

      };


      runtime.set(
        "media.fileSource",
        source
      );


      console.log(
        "[RuntimeTest] FILE SOURCE SET",
        source
      );

    };


  // =====================================================
  // SET DEFAULT PDF
  // =====================================================

  const setDefaultPdf =
    () => {

      const source = {

        url:
          DEFAULT_PDF_SOURCE,

        type:
          "application/pdf",

        name:
          "Test PDF",

      };


      setFileSource(
        source.url
      );


      setFileType(
        source.type
      );


      setFileName(
        source.name
      );


      runtime.set(
        "media.fileSource",
        source
      );


      console.log(
        "[RuntimeTest] Default PDF source set"
      );

    };


  // =====================================================
  // MEDIA RUNTIME SNAPSHOT
  // =====================================================

  const mediaRuntime =
    runtime.get?.(
      "media"
    ) || {};


  // =====================================================
  // COLLAPSED STATE
  // =====================================================

  if (
    !isOpen
  ) {

    return (

      <button

        onClick={() => {
          setIsOpen(
            true
          );
        }}

        style={{
          position:
            "fixed",

          right:
            12,

          bottom:
            12,

          width:
            44,

          height:
            44,

          borderRadius:
            "50%",

          border:
            "1px solid rgba(255,255,255,.2)",

          background:
            "rgba(20,20,20,.92)",

          color:
            "#fff",

          fontSize:
            20,

          cursor:
            "pointer",

          zIndex:
            999999,

          boxShadow:
            "0 4px 16px rgba(0,0,0,.4)",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",
        }}

        aria-label="Open Runtime Test Panel"

        title="Open Runtime Test Panel"

      >

        🔧

      </button>

    );

  }


  // =====================================================
  // PANEL
  // =====================================================

  return (

    <div

      style={{
        position:
          "fixed",

        left:
          isMobile
            ? 12
            : position.x,

        top:
          isMobile
            ? 12
            : position.y,

        width:
          isMobile
            ? "calc(100vw - 24px)"
            : window.innerWidth <= 900
              ? 340
              : 420,

        maxWidth:
          "calc(100vw - 24px)",

        maxHeight:
          isMobile
            ? "calc(100vh - 24px)"
            : "90vh",

        background:
          "#1d1d1d",

        color:
          "#fff",

        borderRadius:
          12,

        padding:
          16,

        zIndex:
          999999,

        fontFamily:
          "monospace",

        boxShadow:
          "0 10px 30px rgba(0,0,0,.45)",

        display:
          "flex",

        flexDirection:
          "column",

        boxSizing:
          "border-box",
      }}

    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div

        onPointerDown={
          isMobile
            ? undefined
            : handleDragStart
        }

        style={{
          cursor:
            isMobile
              ? "default"
              : "move",

          userSelect:
            "none",

          fontWeight:
            "bold",

          marginBottom:
            12,

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

        <span>
          Runtime Test Panel
        </span>


        <button

          data-debug-close

          onPointerDown={
            event =>
              event.stopPropagation()
          }

          onClick={() => {

            setIsOpen(
              false
            );

          }}

          style={{
            border:
              "none",

            background:
              "rgba(255,255,255,.08)",

            color:
              "#fff",

            borderRadius:
              6,

            width:
              30,

            height:
              30,

            cursor:
              "pointer",

            fontSize:
              16,

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            flexShrink:
              0,
          }}

          aria-label="Minimise Runtime Test Panel"

          title="Minimise Runtime Test Panel"

        >

          −

        </button>

      </div>


      {/* =================================================
          SCROLL CONTENT
      ================================================= */}

      <div

        style={{
          overflowY:
            "auto",

          overflowX:
            "hidden",

          paddingRight:
            8,

          minHeight:
            0,

          WebkitOverflowScrolling:
            "touch",
        }}

      >

        <RuntimeStatusPanel />

        <hr />


        {/* =================================================
            PROJECT
        ================================================= */}

        <div>

          <div
            style={{
              fontWeight:
                "bold",

              marginBottom:
                8,
            }}
          >
            Project Runtime
          </div>


          <div
            style={{
              fontSize:
                11,

              lineHeight:
                1.5,

              color:
                "#aaa",

              marginBottom:
                8,
            }}
          >

            Active Project:
            {" "}
            {activeProject || "null"}

            <br />

            Runtime Project ID:
            {" "}
            {runtimeProjectId || "null"}

            <br />

            Runtime Project Name:
            {" "}
            {runtimeProject?.name || "null"}

          </div>


          <button

            onClick={
              dumpProjectRuntime
            }

            style={{
              width:
                "100%",

              minHeight:
                34,

              marginBottom:
                8,

              cursor:
                "pointer",
            }}

          >

            Debug Project Runtime

          </button>

        </div>


        <hr />


        {/* =================================================
            EXISTING CALL CONTROLS
        ================================================= */}

        <CallControlsPanel />

        <hr />


        {/* =================================================
            CHAT RUNTIME LIFECYCLE TESTS
        ================================================= */}

        <div>

          <div
            style={{
              fontWeight:
                "bold",

              marginBottom:
                8,

              fontSize:
                13,
            }}
          >
            Chat Runtime Lifecycle
          </div>


          <div
            style={{
              fontSize:
                10,

              color:
                "#888",

              lineHeight:
                1.5,

              marginBottom:
                10,
            }}
          >
            Developer-only runtime tests. These controls exercise
            the Chat action contract directly before the rendered
            Chat components are built on top of it.
          </div>


          {/* ---------------------------------------------
              RUNTIME STATUS
          --------------------------------------------- */}

          <div
            style={{
              padding:
                10,

              border:
                "1px solid #292929",

              borderRadius:
                8,

              background:
                "#111",

              marginBottom:
                10,

              fontSize:
                10,

              lineHeight:
                1.6,
            }}
          >

            <div>
              Project ID:{" "}
              <strong>
                {
                  chatRuntime.projectId ||
                  "none"
                }
              </strong>
            </div>


            <div>
              Conversation ID:{" "}
              <strong>
                {
                  chatRuntime.conversationId ||
                  "none"
                }
              </strong>
            </div>


            <div>
              Status:{" "}
              <strong>
                {
                  chatRuntime.conversationStatus ||
                  "none"
                }
              </strong>
            </div>


            <div>
              Joined:{" "}
              <strong>
                {
                  chatRuntime.joined
                    ? "true"
                    : "false"
                }
              </strong>
            </div>


            <div>
              Participants:{" "}
              <strong>
                {
                  Array.isArray(
                    chatRuntime.participants
                  )
                    ? chatRuntime.participants.length
                    : 0
                }
              </strong>
            </div>


            <div>
              Messages:{" "}
              <strong>
                {
                  Array.isArray(
                    chatRuntime.messages
                  )
                    ? chatRuntime.messages.length
                    : 0
                }
              </strong>
            </div>


            <div>
              Last Message:{" "}
              <strong>
                {
                  chatRuntime.lastMessage?.id ||
                  chatRuntime.lastMessage?._id ||
                  "none"
                }
              </strong>
            </div>


            <div>
              Message ID:{" "}
              <strong>
                {
                  chatRuntime.messageId ||
                  "none"
                }
              </strong>
            </div>


            <div>
              Last Read Message:{" "}
              <strong>
                {
                  chatRuntime.lastReadMessageId ||
                  "none"
                }
              </strong>
            </div>


            <div>
              Realtime:{" "}
              <strong>
                {
                  chatRuntime.realtimeConnected === undefined
                    ? "not exposed by runtime"
                    : chatRuntime.realtimeConnected
                      ? "connected"
                      : "disconnected"
                }
              </strong>
            </div>


            <div>
              Runtime Revision:{" "}
              <strong>
                {chatRuntimeRevision}
              </strong>
            </div>

          </div>


          {/* ---------------------------------------------
              CONVERSATION SETUP
          --------------------------------------------- */}

          <div
            style={{
              padding:
                10,

              border:
                "1px solid #292929",

              borderRadius:
                8,

              background:
                "#151515",

              marginBottom:
                10,
            }}
          >

            <div
              style={{
                fontWeight:
                  "bold",

                fontSize:
                  11,

                marginBottom:
                  8,
              }}
            >
              1. Conversation Setup
            </div>


            <label
              style={{
                display:
                  "block",

                color:
                  "#aaa",

                marginBottom:
                  5,

                fontSize:
                  10,
              }}
            >
              Conversation title
            </label>


            <input
              value={
                chatCreateTitle
              }

              onChange={
                event =>
                  setChatCreateTitle(
                    event.target.value
                  )
              }

              placeholder="Conversation title"

              style={{
                width:
                  "100%",

                boxSizing:
                  "border-box",

                padding:
                  8,

                marginBottom:
                  8,

                background:
                  "#111",

                color:
                  "#fff",

                border:
                  "1px solid #333",

                borderRadius:
                  7,

                fontFamily:
                  "monospace",

                fontSize:
                  10,
              }}
            />


            <label
              style={{
                display:
                  "block",

                color:
                  "#aaa",

                marginBottom:
                  5,

                fontSize:
                  10,
              }}
            >
              Participant User IDs
            </label>


            <textarea
              value={
                chatCreateParticipantInput
              }

              onChange={
                event =>
                  setChatCreateParticipantInput(
                    event.target.value
                  )
              }

              placeholder="Paste participant IDs separated by commas or new lines"

              rows={
                3
              }

              style={{
                width:
                  "100%",

                boxSizing:
                  "border-box",

                resize:
                  "vertical",

                padding:
                  8,

                marginBottom:
                  8,

                background:
                  "#111",

                color:
                  "#fff",

                border:
                  "1px solid #333",

                borderRadius:
                  7,

                fontFamily:
                  "monospace",

                fontSize:
                  10,
              }}
            />


            <div
              style={{
                fontSize:
                  10,

                color:
                  "#777",

                marginBottom:
                  8,
              }}
            >
              Parsed participants:{" "}
              {
                getChatParticipantIds().length
              }
            </div>


            <select
              value={
                chatCreateType
              }

              onChange={
                event =>
                  setChatCreateType(
                    event.target.value
                  )
              }

              style={{
                width:
                  "100%",

                minHeight:
                  34,

                marginBottom:
                  8,

                background:
                  "#111",

                color:
                  "#fff",

                border:
                  "1px solid #333",

                borderRadius:
                  7,

                fontFamily:
                  "monospace",

                fontSize:
                  10,
              }}
            >

              <option value="group">
                group
              </option>

              <option value="direct">
                direct
              </option>

            </select>


            <button
              onClick={
                testChatCreateConversation
              }

              disabled={
                getChatParticipantIds().length === 0 ||
                chatActionRunning
              }

              style={{
                width:
                  "100%",

                minHeight:
                  36,

                marginBottom:
                  8,

                cursor:
                  getChatParticipantIds().length > 0 &&
                  !chatActionRunning
                    ? "pointer"
                    : "not-allowed",

                opacity:
                  getChatParticipantIds().length > 0 &&
                  !chatActionRunning
                    ? 1
                    : 0.55,
              }}
            >
              {
                chatActionRunning
                  ? "Running..."
                  : "Create Conversation"
              }
            </button>


            <button
              onClick={
                testChatLoadConversations
              }

              disabled={
                chatActionRunning
              }

              style={{
                width:
                  "100%",

                minHeight:
                  34,

                cursor:
                  chatActionRunning
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Load Conversations
            </button>


            <div
              style={{
                marginTop:
                  8,

                marginBottom:
                  8,
              }}
            >

              <label
                style={{
                  display:
                    "block",

                  color:
                    "#aaa",

                  marginBottom:
                    5,

                  fontSize:
                    10,
                }}
              >
                Selected Conversation
              </label>


              <select
                value={
                  activeChatConversationId
                }

                onChange={
                  event =>
                    selectChatConversation(
                      event.target.value
                    )
                }

                disabled={
                  chatActionRunning ||
                  chatLifecycleRunning
                }

                style={{
                  width:
                    "100%",

                  minHeight:
                    34,

                  background:
                    "#111",

                  color:
                    "#fff",

                  border:
                    "1px solid #333",

                  borderRadius:
                    7,

                  fontFamily:
                    "monospace",

                  fontSize:
                    10,
                }}
              >

                <option value="">
                  Select a conversation
                </option>


                {chatConversations.map((conversation) => {
                  const conversationId =
                    getChatConversationId(
                      conversation
                    );

                  if (!conversationId) {
                    return null;
                  }

                  const title =
                    conversation.title ||
                    conversation.name ||
                    conversation.subject ||
                    `Conversation ${conversationId}`;

                  const status =
                    conversation.status ||
                    conversation.conversationStatus ||
                    "";

                  return (
                    <option
                      key={conversationId}
                      value={conversationId}
                    >
                      {title}
                      {status ? ` — ${status}` : ""}
                    </option>
                  );
                })}

              </select>


              <div
                style={{
                  marginTop:
                    5,

                  fontSize:
                    9,

                  color:
                    "#666",

                  wordBreak:
                    "break-all",
                }}
              >
                ID:{" "}
                {
                  activeChatConversationId ||
                  "none"
                }
              </div>

            </div>


            <button
              onClick={
                testChatSelectRuntimeConversation
              }

              disabled={
                !chatRuntime.conversationId ||
                chatActionRunning ||
                chatLifecycleRunning
              }

              style={{
                width:
                  "100%",

                minHeight:
                  32,

                marginBottom:
                  8,

                cursor:
                  chatRuntime.conversationId &&
                  !chatActionRunning &&
                  !chatLifecycleRunning
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              Use Runtime Conversation
            </button>


            <button
              onClick={
                runChatActiveConversationLifecycle
              }

              disabled={
                chatActionRunning ||
                chatLifecycleRunning ||
                !activeChatConversationId
              }

              style={{
                width:
                  "100%",

                minHeight:
                  40,

                marginBottom:
                  8,

                cursor:
                  !chatActionRunning &&
                  !chatLifecycleRunning &&
                  activeChatConversationId
                    ? "pointer"
                    : "not-allowed",

                fontWeight:
                  "bold",
              }}
            >
              {
                chatLifecycleRunning
                  ? "Running Chat Lifecycle..."
                  : "Run Full Active Conversation Lifecycle"
              }
            </button>

          </div>


          {/* ---------------------------------------------
              INVITATION / MEMBERSHIP
          --------------------------------------------- */}

          <div
            style={{
              padding:
                10,

              border:
                "1px solid #292929",

              borderRadius:
                8,

              background:
                "#151515",

              marginBottom:
                10,
            }}
          >

            <div
              style={{
                fontWeight:
                  "bold",

                fontSize:
                  11,

                marginBottom:
                  8,
              }}
            >
              2. Invitation & Membership
            </div>


            <div
              style={{
                fontSize:
                  10,

                color:
                  "#777",

                lineHeight:
                  1.5,

                marginBottom:
                  8,
              }}
            >
              Invitees must be active before Join Conversation
              can mark the runtime as joined. The creator is
              already active when the conversation is created.
            </div>


            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "1fr 1fr",

                gap:
                  8,

                marginBottom:
                  8,
              }}
            >

              <button
                onClick={
                  testChatAcceptInvitation
                }

                disabled={
                  !chatRuntime.conversationId ||
                  chatActionRunning ||
                  chatLifecycleRunning
                }

                style={{
                  minHeight:
                    34,

                  cursor:
                    chatRuntime.conversationId &&
                    !chatActionRunning &&
                    !chatLifecycleRunning
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                Accept Invitation
              </button>


              <button
                onClick={
                  testChatDeclineInvitation
                }

                disabled={
                  !chatRuntime.conversationId ||
                  chatActionRunning ||
                  chatLifecycleRunning
                }

                style={{
                  minHeight:
                    34,

                  cursor:
                    chatRuntime.conversationId &&
                    !chatActionRunning &&
                    !chatLifecycleRunning
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                Decline Invitation
              </button>

            </div>


            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "1fr 1fr",

                gap:
                  8,
              }}
            >

              <button
                onClick={
                  testChatJoinConversation
                }

                disabled={
                  !chatRuntime.conversationId ||
                  chatActionRunning ||
                  chatLifecycleRunning
                }

                style={{
                  minHeight:
                    34,

                  cursor:
                    chatRuntime.conversationId &&
                    !chatActionRunning &&
                    !chatLifecycleRunning
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                Join Conversation
              </button>


              <button
                onClick={
                  testChatLeaveConversation
                }

                disabled={
                  !chatRuntime.conversationId ||
                  chatActionRunning ||
                  chatLifecycleRunning
                }

                style={{
                  minHeight:
                    34,

                  cursor:
                    chatRuntime.conversationId &&
                    !chatActionRunning &&
                    !chatLifecycleRunning
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                Leave Conversation
              </button>

            </div>

          </div>


          {/* ---------------------------------------------
              MESSAGING
          --------------------------------------------- */}

          <div
            style={{
              padding:
                10,

              border:
                "1px solid #292929",

              borderRadius:
                8,

              background:
                "#151515",

              marginBottom:
                10,
            }}
          >

            <div
              style={{
                fontWeight:
                  "bold",

                fontSize:
                  11,

                marginBottom:
                  8,
              }}
            >
              3. Messaging
            </div>


            <button
              onClick={
                testChatLoadMessages
              }

              disabled={
                !chatRuntime.conversationId ||
                chatActionRunning ||
                chatLifecycleRunning
              }

              style={{
                width:
                  "100%",

                minHeight:
                  34,

                marginBottom:
                  8,

                cursor:
                  chatRuntime.conversationId &&
                  !chatActionRunning &&
                  !chatLifecycleRunning
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              Load Messages
            </button>


            <textarea
              value={
                chatMessageInput
              }

              onChange={
                event =>
                  setChatMessageInput(
                    event.target.value
                  )
              }

              placeholder="Test message"

              rows={
                3
              }

              style={{
                width:
                  "100%",

                boxSizing:
                  "border-box",

                resize:
                  "vertical",

                padding:
                  8,

                marginBottom:
                  8,

                background:
                  "#111",

                color:
                  "#fff",

                border:
                  "1px solid #333",

                borderRadius:
                  7,

                fontFamily:
                  "monospace",

                fontSize:
                  10,
              }}
            />


            <button
              onClick={
                testChatSendMessage
              }

              disabled={
                !chatRuntime.conversationId ||
                !chatMessageInput.trim() ||
                chatActionRunning ||
                chatLifecycleRunning
              }

              style={{
                width:
                  "100%",

                minHeight:
                  34,

                marginBottom:
                  8,

                cursor:
                  chatRuntime.conversationId &&
                  chatMessageInput.trim() &&
                  !chatActionRunning &&
                  !chatLifecycleRunning
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              Send Message
            </button>


            <textarea
              value={
                chatEditMessageInput
              }

              onChange={
                event =>
                  setChatEditMessageInput(
                    event.target.value
                  )
              }

              placeholder="Edited message"

              rows={
                2
              }

              style={{
                width:
                  "100%",

                boxSizing:
                  "border-box",

                resize:
                  "vertical",

                padding:
                  8,

                marginBottom:
                  8,

                background:
                  "#111",

                color:
                  "#fff",

                border:
                  "1px solid #333",

                borderRadius:
                  7,

                fontFamily:
                  "monospace",

                fontSize:
                  10,
              }}
            />


            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "1fr 1fr",

                gap:
                  8,

                marginBottom:
                  8,
              }}
            >

              <button
                onClick={
                  testChatEditMessage
                }

                disabled={
                  !chatRuntime.conversationId ||
                  !getChatMessageId() ||
                  chatActionRunning ||
                  chatLifecycleRunning
                }

                style={{
                  minHeight:
                    34,

                  cursor:
                    !chatActionRunning &&
                    !chatLifecycleRunning
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                Edit Last Message
              </button>


              <button
                onClick={
                  testChatDeleteMessage
                }

                disabled={
                  !chatRuntime.conversationId ||
                  !getChatMessageId() ||
                  chatActionRunning ||
                  chatLifecycleRunning
                }

                style={{
                  minHeight:
                    34,

                  cursor:
                    !chatActionRunning &&
                    !chatLifecycleRunning
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                Delete Last Message
              </button>

            </div>


            <button
              onClick={
                testChatMarkRead
              }

              disabled={
                !chatRuntime.conversationId ||
                !getChatMessageId() ||
                chatActionRunning ||
                chatLifecycleRunning
              }

              style={{
                width:
                  "100%",

                minHeight:
                  34,

                cursor:
                  !chatActionRunning &&
                  !chatLifecycleRunning
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              Mark Conversation Read
            </button>

          </div>


          {/* ---------------------------------------------
              CLOSE / LIFECYCLE LOG
          --------------------------------------------- */}

          <div
            style={{
              padding:
                10,

              border:
                "1px solid #292929",

              borderRadius:
                8,

              background:
                "#151515",

              marginBottom:
                10,
            }}
          >

            <div
              style={{
                fontWeight:
                  "bold",

                fontSize:
                  11,

                marginBottom:
                  8,
              }}
            >
              4. Close & Lifecycle Verification
            </div>


            <button
              onClick={
                testChatCloseConversation
              }

              disabled={
                !chatRuntime.conversationId ||
                chatActionRunning ||
                chatLifecycleRunning
              }

              style={{
                width:
                  "100%",

                minHeight:
                  34,

                marginBottom:
                  8,

                cursor:
                  chatRuntime.conversationId &&
                  !chatActionRunning &&
                  !chatLifecycleRunning
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              Close Conversation
            </button>


            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "1fr 1fr",

                gap:
                  8,

                marginBottom:
                  8,
              }}
            >

              <button
                onClick={
                  dumpChatRuntime
                }

                style={{
                  minHeight:
                    34,

                  cursor:
                    "pointer",
                }}
              >
                Dump Chat Runtime
              </button>


              <button
                onClick={
                  clearChatLifecycleLog
                }

                style={{
                  minHeight:
                    34,

                  cursor:
                    "pointer",
                }}
              >
                Clear Chat Log
              </button>

            </div>


            <details>

              <summary
                style={{
                  cursor:
                    "pointer",

                  color:
                    "#aaa",

                  fontSize:
                    10,
                }}
              >
                Chat Runtime Snapshot
              </summary>


              <pre
                style={{
                  background:
                    "#101010",

                  padding:
                    10,

                  borderRadius:
                    6,

                  overflow:
                    "auto",

                  fontSize:
                    9,

                  color:
                    "#ccc",

                  maxHeight:
                    260,
                }}
              >
                {
                  JSON.stringify(
                    chatRuntime,
                    null,
                    2
                  )
                }
              </pre>

            </details>


            <details
              style={{
                marginTop:
                  8,
              }}
            >

              <summary
                style={{
                  cursor:
                    "pointer",

                  color:
                    "#aaa",

                  fontSize:
                    10,
                }}
              >
                Chat Lifecycle Log ({
                  chatLifecycleLog.length
                })
              </summary>


              <pre
                style={{
                  background:
                    "#101010",

                  padding:
                    10,

                  borderRadius:
                    6,

                  overflow:
                    "auto",

                  fontSize:
                    9,

                  color:
                    "#ccc",

                  maxHeight:
                    300,
                }}
              >
                {
                  JSON.stringify(
                    chatLifecycleLog,
                    null,
                    2
                  )
                }
              </pre>

            </details>

          </div>

        </div>


        {/* =================================================
            GROUP CALL CONTROLS
        ================================================= */}

        <div>

          <div
            style={{
              fontWeight:
                "bold",

              marginBottom:
                8,

              fontSize:
                13,
            }}
          >

            Group Call Controls

          </div>


          <div
            style={{
              fontSize:
                10,

              color:
                "#888",

              lineHeight:
                1.5,

              marginBottom:
                10,
            }}
          >

            Dedicated development controls for the
            group-call runtime lifecycle.

          </div>


          {/* ---------------------------------------------
              RUNTIME STATE
          --------------------------------------------- */}

          <div
            style={{
              padding:
                10,

              border:
                "1px solid #292929",

              borderRadius:
                8,

              background:
                "#111",

              marginBottom:
                10,

              fontSize:
                10,

              lineHeight:
                1.6,
            }}
          >

            <div>

              Call ID:
              {" "}
              <strong>
                {runtimeGroupCallId || "none"}
              </strong>

            </div>


            <div>

              Channel:
              {" "}
              <strong>
                {groupCallChannel || "none"}
              </strong>

            </div>


            <div>

              State:
              {" "}
              <strong>
                {groupCallState}
              </strong>

            </div>


            <div>

              Joined:
              {" "}
              <strong>
                {groupCallJoined
                  ? "true"
                  : "false"}
              </strong>

            </div>


            <div>

              Participants:
              {" "}
              <strong>
                {groupCallParticipantCount}
              </strong>

            </div>


            <div>

              Remote Users:
              {" "}
              <strong>
                {
                  groupRemoteUsers &&
                  typeof groupRemoteUsers === "object"
                    ? Object.keys(
                        groupRemoteUsers
                      ).length
                    : 0
                }
              </strong>

            </div>


            <div>

              Pending Invitations:
              {" "}
              <strong>
                {pendingGroupInvitations.length}
              </strong>

            </div>

          </div>


          {/* ---------------------------------------------
              PARTICIPANT IDS
          --------------------------------------------- */}

          <label
            style={{
              display:
                "block",

              color:
                "#aaa",

              marginBottom:
                5,

              fontSize:
                11,
            }}
          >

            Participant User IDs

          </label>


          <textarea

            value={
              groupParticipantInput
            }

            onChange={
              event =>
                setGroupParticipantInput(
                  event.target.value
                )
            }

            placeholder={
              "Paste participant IDs separated by commas or new lines"
            }

            rows={4}

            style={{
              width:
                "100%",

              boxSizing:
                "border-box",

              resize:
                "vertical",

              padding:
                9,

              marginBottom:
                8,

              background:
                "#111",

              color:
                "#fff",

              border:
                "1px solid #333",

              borderRadius:
                7,

              fontFamily:
                "monospace",

              fontSize:
                10,
            }}

          />


          <div
            style={{
              fontSize:
                10,

              color:
                "#777",

              marginBottom:
                8,
            }}
          >

            Parsed participant IDs:
            {" "}
            {groupParticipantCount}

          </div>


          <button

            onClick={
              testCreateGroupCall
            }

            disabled={
              groupParticipantCount === 0 ||
              groupActionRunning
            }

            style={{
              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                groupParticipantCount > 0 &&
                !groupActionRunning
                  ? "pointer"
                  : "not-allowed",

              opacity:
                groupParticipantCount > 0 &&
                !groupActionRunning
                  ? 1
                  : 0.55,
            }}

          >

            {groupActionRunning
              ? "Running..."
              : "Test Create Group Call"}

          </button>


          {/* ---------------------------------------------
              PENDING INVITATIONS
          --------------------------------------------- */}

          <button

            onClick={
              testFetchPendingInvitations
            }

            disabled={
              groupActionRunning
            }

            style={{
              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                groupActionRunning
                  ? "not-allowed"
                  : "pointer",
            }}

          >

            Test Fetch Pending Invitations

          </button>


          {/* ---------------------------------------------
              INVITATION LIST
          --------------------------------------------- */}

          {pendingGroupInvitations.length > 0 && (

            <div
              style={{
                marginBottom:
                  10,

                padding:
                  10,

                border:
                  "1px solid #292929",

                borderRadius:
                  8,

                background:
                  "#101010",
              }}
            >

              <div
                style={{
                  color:
                    "#aaa",

                  fontSize:
                    10,

                  marginBottom:
                    8,
                }}
              >

                Pending invitations

              </div>


              {pendingGroupInvitations.map(
                (
                  invitation,
                  index
                ) => {

                  const selected =
                    index ===
                    selectedGroupInvitationIndex;


                  const creatorName =
                    [
                      invitation?.creator?.firstName,
                      invitation?.creator?.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ");


                  return (

                    <button

                      key={
                        invitation?.callId ||
                        index
                      }

                      onClick={() =>
                        selectGroupInvitation(
                          index
                        )
                      }

                      style={{
                        width:
                          "100%",

                        textAlign:
                          "left",

                        padding:
                          9,

                        marginBottom:
                          6,

                        border:
                          selected
                            ? "1px solid #777"
                            : "1px solid #282828",

                        borderRadius:
                          7,

                        background:
                          selected
                            ? "#202020"
                            : "#151515",

                        color:
                          "#fff",

                        cursor:
                          "pointer",
                      }}

                    >

                      <div
                        style={{
                          fontWeight:
                            "bold",

                          fontSize:
                            10,

                          marginBottom:
                            4,
                        }}
                      >

                        {
                          creatorName ||
                          invitation?.creator?.email ||
                          "Unknown caller"
                        }

                      </div>


                      <div
                        style={{
                          color:
                            "#777",

                          fontSize:
                            9,

                          wordBreak:
                            "break-all",
                        }}
                      >

                        {invitation?.callId}

                      </div>


                      <div
                        style={{
                          color:
                            "#777",

                          fontSize:
                            9,

                          marginTop:
                            3,
                        }}
                      >

                        {
                          invitation?.participant?.status ||
                          invitation?.status ||
                          "invited"
                        }

                      </div>

                    </button>

                  );

                }
              )}


              <button

                onClick={
                  applySelectedInvitation
                }

                disabled={
                  !selectedGroupInvitation
                }

                style={{
                  width:
                    "100%",

                  minHeight:
                    34,

                  marginTop:
                    4,

                  cursor:
                    selectedGroupInvitation
                      ? "pointer"
                      : "not-allowed",

                  opacity:
                    selectedGroupInvitation
                      ? 1
                      : 0.55,
                }}

              >

                Use Selected Invitation

              </button>

            </div>

          )}


          {/* ---------------------------------------------
              GROUP CALL ID
          --------------------------------------------- */}

          <label
            style={{
              display:
                "block",

              color:
                "#aaa",

              marginBottom:
                5,

              fontSize:
                11,
            }}
          >

            Group Call ID

          </label>


          <input

            value={
              groupCallIdInput
            }

            onChange={
              event =>
                setGroupCallIdInput(
                  event.target.value
                )
            }

            placeholder="Group call ObjectId"

            style={{
              width:
                "100%",

              boxSizing:
                "border-box",

              padding:
                "9px 10px",

              marginBottom:
                8,

              background:
                "#111",

              color:
                "#fff",

              border:
                "1px solid #333",

              borderRadius:
                7,

              fontFamily:
                "monospace",

              fontSize:
                10,
            }}

          />


          <div
            style={{
              padding:
                8,

              marginBottom:
                8,

              border:
                "1px solid #242424",

              borderRadius:
                7,

              background:
                "#101010",

              color:
                "#777",

              fontSize:
                9,

              wordBreak:
                "break-all",
            }}
          >

            Active test call:

            <br />

            {
              activeGroupCallId ||
              "none"
            }

          </div>


          {/* ---------------------------------------------
              ACCEPT / DECLINE
          --------------------------------------------- */}

          <div
            style={{
              display:
                "flex",

              gap:
                8,

              marginBottom:
                8,
            }}
          >

            <button

              onClick={
                testAcceptInvitation
              }

              disabled={
                !activeGroupCallId ||
                groupActionRunning
              }

              style={{
                flex:
                  1,

                minHeight:
                  36,

                cursor:
                  activeGroupCallId &&
                  !groupActionRunning
                    ? "pointer"
                    : "not-allowed",

                opacity:
                  activeGroupCallId &&
                  !groupActionRunning
                    ? 1
                    : 0.55,
              }}

            >

              Accept Invitation

            </button>


            <button

              onClick={
                testDeclineInvitation
              }

              disabled={
                !activeGroupCallId ||
                groupActionRunning
              }

              style={{
                flex:
                  1,

                minHeight:
                  36,

                cursor:
                  activeGroupCallId &&
                  !groupActionRunning
                    ? "pointer"
                    : "not-allowed",

                opacity:
                  activeGroupCallId &&
                  !groupActionRunning
                    ? 1
                    : 0.55,
              }}

            >

              Decline Invitation

            </button>

          </div>


          {/* ---------------------------------------------
              JOIN
          --------------------------------------------- */}

          <button

            onClick={
              testJoinGroupCall
            }

            disabled={
              !activeGroupCallId ||
              groupActionRunning
            }

            style={{
              width:
                "100%",

              minHeight:
                38,

              marginBottom:
                8,

              cursor:
                activeGroupCallId &&
                !groupActionRunning
                  ? "pointer"
                  : "not-allowed",

              opacity:
                activeGroupCallId &&
                !groupActionRunning
                  ? 1
                  : 0.55,
            }}

          >

            Test Join Group Call

          </button>


          {/* ---------------------------------------------
              REFRESH
          --------------------------------------------- */}

          <button

            onClick={
              testRefreshGroupCall
            }

            disabled={
              !activeGroupCallId ||
              groupActionRunning
            }

            style={{
              width:
                "100%",

              minHeight:
                38,

              marginBottom:
                8,

              cursor:
                activeGroupCallId &&
                !groupActionRunning
                  ? "pointer"
                  : "not-allowed",

              opacity:
                activeGroupCallId &&
                !groupActionRunning
                  ? 1
                  : 0.55,
            }}

          >

            Test Refresh Group Call

          </button>


          {/* ---------------------------------------------
              LEAVE
          --------------------------------------------- */}

          <button

            onClick={
              testLeaveGroupCall
            }

            disabled={
              !activeGroupCallId ||
              groupActionRunning
            }

            style={{
              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                activeGroupCallId &&
                !groupActionRunning
                  ? "pointer"
                  : "not-allowed",

              opacity:
                activeGroupCallId &&
                !groupActionRunning
                  ? 1
                  : 0.55,
            }}

          >

            Test Leave Group Call

          </button>


          {/* ---------------------------------------------
              END
          --------------------------------------------- */}

          <button

            onClick={
              testEndGroupCall
            }

            disabled={
              !activeGroupCallId ||
              groupActionRunning
            }

            style={{
              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                activeGroupCallId &&
                !groupActionRunning
                  ? "pointer"
                  : "not-allowed",

              opacity:
                activeGroupCallId &&
                !groupActionRunning
                  ? 1
                  : 0.55,
            }}

          >

            Test End Group Call

          </button>


          {/* ---------------------------------------------
              RESET
          --------------------------------------------- */}

          <button

            onClick={
              clearGroupCallTest
            }

            disabled={
              groupActionRunning
            }

            style={{
              width:
                "100%",

              minHeight:
                32,

              cursor:
                groupActionRunning
                  ? "not-allowed"
                  : "pointer",
            }}

          >

            Clear Group Test Fields

          </button>


          {/* ---------------------------------------------
              SELECTED INVITATION DEBUG
          --------------------------------------------- */}

          {selectedGroupInvitation && (

            <details
              style={{
                marginTop:
                  10,
              }}
            >

              <summary
                style={{
                  cursor:
                    "pointer",

                  color:
                    "#888",

                  fontSize:
                    10,
                }}
              >

                Selected Invitation Debug

              </summary>


              <pre
                style={{
                  marginTop:
                    8,

                  padding:
                    10,

                  background:
                    "#0d0d0d",

                  border:
                    "1px solid #242424",

                  borderRadius:
                    7,

                  overflow:
                    "auto",

                  fontSize:
                    9,

                  color:
                    "#bbb",

                  whiteSpace:
                    "pre-wrap",

                  wordBreak:
                    "break-word",
                }}
              >

                {
                  JSON.stringify(
                    selectedGroupInvitation,
                    null,
                    2
                  )
                }

              </pre>

            </details>

          )}

        </div>


        <hr />


        {/* =================================================
            TRAINING CONTROLS
        ================================================= */}

        <div>

          <div
            style={{
              fontWeight:
                "bold",

              marginBottom:
                8,
            }}
          >

            Training Controls

          </div>


          <div
            style={{
              fontSize:
                11,

              color:
                "#aaa",

              marginBottom:
                10,

              lineHeight:
                1.5,
            }}
          >

            Selected participants:
            {" "}
            {trainingParticipantCount}

            <br />

            Session ID:
            {" "}
            {
              runtime.get?.(
                "training.sessionId"
              ) || "none"
            }

            <br />

            Status:
            {" "}
            {
              runtime.get?.(
                "training.status"
              ) || "none"
            }

          </div>


          <button

            onClick={
              createTrainingSession
            }

            disabled={
              trainingParticipantCount === 0
            }

            style={{
              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                trainingParticipantCount > 0
                  ? "pointer"
                  : "not-allowed",

              opacity:
                trainingParticipantCount > 0
                  ? 1
                  : 0.55,
            }}

          >

            Test Create Training Session
            {" "}
            (
            {trainingParticipantCount}
            )

          </button>


          <button

            onClick={
              startTrainingSession
            }

            disabled={
              trainingParticipantCount === 0
            }

            style={{
              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                trainingParticipantCount > 0
                  ? "pointer"
                  : "not-allowed",

              opacity:
                trainingParticipantCount > 0
                  ? 1
                  : 0.55,
            }}

          >

            Test Start Training Session
            {" "}
            (
            {trainingParticipantCount}
            )

          </button>


          <button

            onClick={
              endTrainingSession
            }

            disabled={
              !runtime.get?.(
                "training.sessionId"
              )
            }

            style={{
              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                runtime.get?.(
                  "training.sessionId"
                )
                  ? "pointer"
                  : "not-allowed",

              opacity:
                runtime.get?.(
                  "training.sessionId"
                )
                  ? 1
                  : 0.55,
            }}

          >

            Test End Training Session

          </button>

        </div>


        <hr />


        {/* =================================================
            COMPLIANCE CONTROLS
        ================================================= */}

        <div>

          <div
            style={{
              fontWeight:
                "bold",

              marginBottom:
                8,
            }}
          >

            Compliance Controls

          </div>


          <div
            style={{
              fontSize:
                11,

              color:
                "#aaa",

              lineHeight:
                1.5,

              marginBottom:
                10,
            }}
          >

            Test the Compliance domain runtime
            independently of the UI.

            <br />

            Runtime domain:
            {" "}
            <strong>
              compliance
            </strong>

          </div>


          {/* ---------------------------------------------
              LOAD
          --------------------------------------------- */}

          <button

            onClick={
              testLoadCompliance
            }

            disabled={
              runningActionRef.current
            }

            style={{
              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                "pointer",
            }}

          >

            Test Load Compliance

          </button>

          {/* ---------------------------------------------
              UPDATE CONTROL STATUS
          --------------------------------------------- */}

          <button

            onClick={
              testUpdateControlStatus
            }

            disabled={
              runningActionRef.current
            }

            style={{
              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                "pointer",
            }}

          >

            Test Update Control Status

          </button>


          {/* ---------------------------------------------
              REQUEST EVIDENCE
          --------------------------------------------- */}

          <button

            onClick={
              testRequestEvidence
            }

            disabled={
              runningActionRef.current
            }

            style={{
              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                "pointer",
            }}

          >

            Test Request Evidence

          </button>


          {/* ---------------------------------------------
              UPLOAD EVIDENCE
          --------------------------------------------- */}

          <button

            onClick={
              testUploadEvidence
            }

            disabled={
              runningActionRef.current
            }

            style={{
              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                "pointer",
            }}

          >

            Test Upload Evidence

          </button>

           {/* ---------------------------------------------
              ANALYSE EVIDENCE
          --------------------------------------------- */}
          <button
            onClick={testAnalyseEvidence}
            disabled={runningActionRef.current}
            style={{
              width: "100%",
              minHeight: 36,
              marginBottom: 8,
              cursor: "pointer",
            }}
          >
            Test Analyse Evidence
          </button>

          <button onClick={testAcceptEvidence}>
            Accept Evidence
          </button>

          <button onClick={testRejectEvidence}>
            Reject Evidence
          </button>


          {/* ---------------------------------------------
              COMPLIANCE RUNTIME SNAPSHOT
          --------------------------------------------- */}

          <details>

            <summary
              style={{
                cursor:
                  "pointer",

                color:
                  "#aaa",

                marginBottom:
                  10,
              }}
            >

              Compliance Runtime Snapshot

            </summary>


            <pre
              style={{
                background:
                  "#101010",

                padding:
                  10,

                borderRadius:
                  6,

                overflow:
                  "auto",

                fontSize:
                  10,

                color:
                  "#ccc",

                whiteSpace:
                  "pre-wrap",

                wordBreak:
                  "break-word",
              }}
            >

              {
                JSON.stringify(
                  runtime.get?.(
                    "compliance"
                  ) || {},
                  null,
                  2
                )
              }

            </pre>

          </details>

        </div>


        <hr />


        {/* =================================================
            MEDIA RUNTIME TESTS
        ================================================= */}

        <div>

          <div
            style={{
              fontWeight:
                "bold",

              marginBottom:
                8,
            }}
          >

            Media Runtime Tests

          </div>


          <div
            style={{
              fontSize:
                11,

              color:
                "#aaa",

              lineHeight:
                1.5,

              marginBottom:
                10,
            }}
          >

            Runtime source:
            {" "}
            <strong>
              media.testSource
            </strong>

            <br />

            Current type:
            {" "}
            {
              mediaRuntime?.testSourceType ||
              detectMediaType(
                mediaRuntime?.testSource
              )
            }

          </div>


          <input

            type="text"

            value={
              mediaSource
            }

            onChange={
              event =>
                setMediaSource(
                  event.target.value
                )
            }

            placeholder="Enter video / media URL"

            style={{
              width:
                "100%",

              boxSizing:
                "border-box",

              padding:
                "9px 10px",

              marginBottom:
                8,

              border:
                "1px solid #333",

              borderRadius:
                7,

              background:
                "#111",

              color:
                "#fff",

              fontSize:
                11,

              outline:
                "none",
            }}

          />


          <button

            onClick={
              setMediaTestSource
            }

            style={{
              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                "pointer",
            }}

          >

            Set Media Runtime Source

          </button>


          <div
            style={{
              display:
                "flex",

              gap:
                8,

              marginBottom:
                10,
            }}
          >

            <button

              onClick={
                setBigBuckBunny
              }

              style={{
                flex:
                  1,

                minHeight:
                  34,

                cursor:
                  "pointer",
              }}

            >

              Big Buck Bunny

            </button>


            <button

              onClick={
                setYouTubeSource
              }

              style={{
                flex:
                  1,

                minHeight:
                  34,

                cursor:
                  "pointer",
              }}

            >

              YouTube

            </button>

          </div>


          <div
            style={{
              fontSize:
                10,

              color:
                "#777",

              lineHeight:
                1.5,
            }}
          >

            Runtime binding:

            <br />

            {"{{media.testSource}}"}

          </div>

        </div>


        <hr />


        {/* =================================================
            FILE PREVIEW RUNTIME TESTS
        ================================================= */}

        <div>

          <div
            style={{
              fontWeight:
                "bold",

              marginBottom:
                8,
            }}
          >

            File Preview Runtime Tests

          </div>


          <div
            style={{
              fontSize:
                11,

              color:
                "#aaa",

              marginBottom:
                10,

              lineHeight:
                1.5,
            }}
          >

            Runtime source:
            {" "}
            <strong>
              media.fileSource
            </strong>

          </div>


          <input

            type="text"

            value={
              fileSource
            }

            onChange={
              event =>
                setFileSource(
                  event.target.value
                )
            }

            placeholder="File URL"

            style={{
              width:
                "100%",

              boxSizing:
                "border-box",

              padding:
                "9px 10px",

              marginBottom:
                8,

              border:
                "1px solid #333",

              borderRadius:
                7,

              background:
                "#111",

              color:
                "#fff",

              fontSize:
                11,

              outline:
                "none",
            }}

          />


          <select

            value={
              fileType
            }

            onChange={
              event =>
                setFileType(
                  event.target.value
                )
            }

            style={{
              width:
                "100%",

              boxSizing:
                "border-box",

              padding:
                "8px 10px",

              marginBottom:
                8,

              background:
                "#111",

              color:
                "#fff",

              border:
                "1px solid #333",

              borderRadius:
                7,

              fontSize:
                11,
            }}

          >

            <option value="application/pdf">
              PDF
            </option>

            <option value="image/png">
              PNG Image
            </option>

            <option value="image/jpeg">
              JPEG Image
            </option>

            <option value="video/mp4">
              MP4 Video
            </option>

          </select>


          <input

            type="text"

            value={
              fileName
            }

            onChange={
              event =>
                setFileName(
                  event.target.value
                )
            }

            placeholder="File name"

            style={{
              width:
                "100%",

              boxSizing:
                "border-box",

              padding:
                "9px 10px",

              marginBottom:
                8,

              border:
                "1px solid #333",

              borderRadius:
                7,

              background:
                "#111",

              color:
                "#fff",

              fontSize:
                11,

              outline:
                "none",
            }}

          />


          <button

            onClick={
              setFileTestSource
            }

            style={{
              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                "pointer",
            }}

          >

            Set File Runtime Source

          </button>


          <button

            onClick={
              setDefaultPdf
            }

            style={{
              width:
                "100%",

              minHeight:
                34,

              marginBottom:
                10,

              cursor:
                "pointer",
            }}

          >

            Use Default Test PDF

          </button>


          <div
            style={{
              fontSize:
                10,

              color:
                "#777",

              lineHeight:
                1.5,
            }}
          >

            Runtime binding:

            <br />

            {"{{media.fileSource}}"}

          </div>

        </div>


        <hr />


        {/* =================================================
            REMOTE VIDEO GRID
        ================================================= */}

        <div>

          <div
            style={{
              fontWeight:
                "bold",

              marginBottom:
                8,
            }}
          >

            Remote Video Grid

          </div>


          <div
            style={{
              fontSize:
                11,

              color:
                "#aaa",

              lineHeight:
                1.5,

              marginBottom:
                10,
            }}
          >

            Runtime source:
            {" "}
            <strong>
              call.remoteUsers
            </strong>

            <br />

            Remote participants:
            {" "}
            {
              groupRemoteUsers &&
              typeof groupRemoteUsers === "object"
                ? Object.keys(
                    groupRemoteUsers
                  ).length
                : 0
            }

          </div>


          <div
            style={{
              padding:
                10,

              border:
                "1px solid #292929",

              borderRadius:
                7,

              background:
                "#111",

              marginBottom:
                8,

              fontSize:
                10,

              color:
                groupRemoteUsers &&
                typeof groupRemoteUsers === "object" &&
                Object.keys(
                  groupRemoteUsers
                ).length > 0
                  ? "#86efac"
                  : "#777",
            }}
          >

            {
              groupRemoteUsers &&
              typeof groupRemoteUsers === "object" &&
              Object.keys(
                groupRemoteUsers
              ).length > 0
                ? `✓ ${Object.keys(groupRemoteUsers).length} remote participant${Object.keys(groupRemoteUsers).length === 1 ? "" : "s"} available`
                : "No remote participants currently connected"
            }

          </div>


          <div
            style={{
              fontSize:
                10,

              color:
                "#777",

              lineHeight:
                1.5,
            }}
          >

            Test with a real Agora call and install:

            <br />

            Remote Video Grid Test

            <br /><br />

            The component should consume:

            <br />

            call.remoteUsers

          </div>

        </div>


        <hr />


        {/* =================================================
            VIDEOFEED MEDIA TESTS
        ================================================= */}

        <div>

          <div
            style={{
              fontWeight:
                "bold",

              marginBottom:
                8,
            }}
          >

            VideoFeed Media Tests

          </div>


          <div
            style={{
              fontSize:
                11,

              color:
                "#aaa",

              marginBottom:
                10,

              lineHeight:
                1.4,
            }}
          >

            Stable source ID:
            {" "}
            {VIDEO_FEED_SOURCE_ID}

            <br />

            Resolved Canvas ID:
            {" "}
            {videoFeedId || "Not found"}

          </div>


          <button

            onClick={
              toggleVideoFeedMic
            }

            disabled={
              !videoFeedId
            }

            style={{
              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                videoFeedId
                  ? "pointer"
                  : "not-allowed",
            }}

          >

            Test VideoFeed Mic Toggle

          </button>


          <button

            onClick={
              toggleVideoFeedCamera
            }

            disabled={
              !videoFeedId
            }

            style={{
              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                videoFeedId
                  ? "pointer"
                  : "not-allowed",
            }}

          >

            Test VideoFeed Camera Toggle

          </button>


          <button

            onClick={
              startVideoRecording
            }

            disabled={
              !videoFeedId
            }

            style={{
              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                videoFeedId
                  ? "pointer"
                  : "not-allowed",
            }}

          >

            Test Start Recording

          </button>


          <button

            onClick={
              stopVideoRecording
            }

            disabled={
              !videoFeedId
            }

            style={{
              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                videoFeedId
                  ? "pointer"
                  : "not-allowed",
            }}

          >

            Test Stop Recording

          </button>

        </div>


        <hr />


        {/* =================================================
            INTERVIEW
        ================================================= */}

        <InterviewControlsPanel />

        <hr />


        {/* =================================================
            MEDIA RUNTIME SNAPSHOT
        ================================================= */}

        <details>

          <summary
            style={{
              cursor:
                "pointer",

              color:
                "#aaa",

              marginBottom:
                10,
            }}
          >

            Media Runtime Snapshot

          </summary>


          <pre
            style={{
              background:
                "#101010",

              padding:
                10,

              borderRadius:
                6,

              overflow:
                "auto",

              fontSize:
                10,

              color:
                "#ccc",
            }}
          >

            {
              JSON.stringify(
                mediaRuntime,
                null,
                2
              )
            }

          </pre>

        </details>


        <hr />


        {/* =================================================
            FULL RUNTIME SNAPSHOT
        ================================================= */}

        <button

          onClick={
            dumpRuntime
          }

          style={{
            width:
              "100%",

            marginTop:
              12,

            minHeight:
              36,

            cursor:
              "pointer",
          }}

        >

          Dump Runtime

        </button>

      </div>

    </div>

  );

}