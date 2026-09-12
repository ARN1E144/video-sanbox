// src/actions/chat/createConversation.js

import api from "../../services/api";


// ============================================================
// HELPERS
// ============================================================

function normaliseId(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value === "object"
  ) {
    return normaliseId(
      value.id ??
      value._id ??
      value.userId ??
      value.value
    );
  }

  const result =
    String(value).trim();

  return result || null;
}


// ============================================================
// NORMALISE ID ARRAYS
// ============================================================

function normaliseIds(value) {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return [
    ...new Set(
      value
        .map(
          item =>
            normaliseId(item)
        )
        .filter(Boolean)
    ),
  ];
}


// ============================================================
// READ FIRST ARRAY FROM RUNTIME
// ============================================================
//
// Returns both the value and the path that supplied it.
//
// This deliberately mirrors the participant-resolution
// approach already used by Remote Training.
//
// ============================================================

function readFirstArray(
  ctx,
  paths = []
) {
  for (
    const path of paths
  ) {
    const value =
      ctx.get?.(path);

    if (
      Array.isArray(value) &&
      value.length > 0
    ) {
      return {
        path,
        value,
      };
    }
  }

  return {
    path: null,
    value: [],
  };
}


// ============================================================
// NORMALISE CONVERSATION TYPE
// ============================================================

function normaliseConversationType(
  value
) {
  const type =
    String(
      value ||
      "group"
    )
      .trim()
      .toLowerCase();

  if (
    type === "direct"
  ) {
    return "direct";
  }

  return "group";
}


// ============================================================
// NORMALISE CONVERSATION TITLE
// ============================================================

function normaliseTitle(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}


// ============================================================
// ACTION
// ============================================================

export default async function createConversation(
  ctx,
  params = {}
) {

  console.log(
    "================================================"
  );

  console.log(
    "[createConversation] START"
  );

  console.log(
    "================================================"
  );


  // ==========================================================
  // CURRENT CHAT STATE
  // ==========================================================

  const currentChat =
    ctx.get?.("chat") ||
    {};


  // ==========================================================
  // PROJECT
  // ==========================================================
  //
  // Confo already exposes the active project through runtime
  // state.
  //
  // Components/actions should consume:
  //
  //     project.id
  //
  // rather than requiring every template to manually pass
  // projectId.
  //
  // Explicit params.projectId is retained as an override for
  // programmatic/action-chain use.
  //
  // ==========================================================

  const projectId =
    normaliseId(
      params?.projectId
    ) ||
    normaliseId(
      ctx.get?.("project.id")
    );


  console.log(
    "[createConversation] PROJECT",
    {
      projectId,
      runtimeProject:
        ctx.get?.("project"),
      explicitProjectId:
        params?.projectId,
    }
  );


  // ==========================================================
  // REQUIRE PROJECT
  // ==========================================================

  if (
    !projectId
  ) {

    console.warn(
      "[createConversation] BLOCKED - no projectId",
      {
        project:
          ctx.get?.("project"),
        projectId,
      }
    );

    ctx.notify?.(
      "No active project is available."
    );

    return {
      ok: false,

      error:
        "NO_PROJECT_ID",

      result: {
        projectId: null,
      },
    };
  }


  // ==========================================================
  // TITLE
  // ==========================================================

  const title =
    normaliseTitle(
      params?.title
    ) ||
    normaliseTitle(
      ctx.get?.(
        "chat.create.title"
      )
    ) ||
    normaliseTitle(
      ctx.get?.(
        "chat.title"
      )
    );


  // ==========================================================
  // TYPE
  // ==========================================================

  const type =
    normaliseConversationType(
      params?.type
    ) ||
    normaliseConversationType(
      ctx.get?.(
        "chat.create.type"
      )
    );


  // ==========================================================
  // EXPLICIT PARTICIPANT SOURCES
  // ==========================================================

  const explicitParticipantIds =
    normaliseIds(
      params?.participantIds
    );

  const explicitUserIds =
    normaliseIds(
      params?.userIds
    );

  const explicitSelectedIds =
    normaliseIds(
      params?.selectedParticipantIds
    );


  // ==========================================================
  // RUNTIME PARTICIPANT SELECTION
  // ==========================================================
  //
  // ParticipantSelector may store its selection under
  // different runtime paths depending on the template/context.
  //
  // Keep the compatibility paths deliberately broad.
  //
  // ==========================================================

  const runtimeSelection =
    readFirstArray(
      ctx,
      [

        // ----------------------------------------------------
        // Primary Chat selector state
        // ----------------------------------------------------

        "chat.selectedParticipantIds",

        "chat.create.selectedParticipantIds",

        "chat.create.participantIds",

        "chat.participantSelection",


        // ----------------------------------------------------
        // Generic selector state
        // ----------------------------------------------------

        "selectedParticipantIds",


        // ----------------------------------------------------
        // Existing call selector compatibility
        // ----------------------------------------------------

        "call.recipientIds",

        "call.selectedParticipantIds",

      ]
    );


  const runtimeSelectedIds =
    normaliseIds(
      runtimeSelection.value
    );


  // ==========================================================
  // DEBUG PARTICIPANT SOURCES
  // ==========================================================

  console.log(
    "[createConversation] PARTICIPANT RESOLUTION SOURCES",
    {
      explicitParticipantIds,
      explicitUserIds,
      explicitSelectedIds,

      runtimeSelectionPath:
        runtimeSelection.path,

      runtimeSelectedIds,

      chatSelectedParticipantIds:
        ctx.get?.(
          "chat.selectedParticipantIds"
        ),

      chatCreateSelectedParticipantIds:
        ctx.get?.(
          "chat.create.selectedParticipantIds"
        ),

      chatCreateParticipantIds:
        ctx.get?.(
          "chat.create.participantIds"
        ),

      chatParticipantSelection:
        ctx.get?.(
          "chat.participantSelection"
        ),

      genericSelectedParticipantIds:
        ctx.get?.(
          "selectedParticipantIds"
        ),

      callRecipientIds:
        ctx.get?.(
          "call.recipientIds"
        ),

      callSelectedParticipantIds:
        ctx.get?.(
          "call.selectedParticipantIds"
        ),
    }
  );


  // ==========================================================
  // RESOLVE PARTICIPANTS
  // ==========================================================

  let participantIds =
    [];

  let participantSource =
    "none";


  // ----------------------------------------------------------
  // Explicit participantIds
  // ----------------------------------------------------------

  if (
    explicitParticipantIds.length >
    0
  ) {

    participantIds =
      explicitParticipantIds;

    participantSource =
      "params.participantIds";
  }


  // ----------------------------------------------------------
  // Explicit userIds
  // ----------------------------------------------------------

  else if (
    explicitUserIds.length >
    0
  ) {

    participantIds =
      explicitUserIds;

    participantSource =
      "params.userIds";
  }


  // ----------------------------------------------------------
  // Explicit selectedParticipantIds
  // ----------------------------------------------------------

  else if (
    explicitSelectedIds.length >
    0
  ) {

    participantIds =
      explicitSelectedIds;

    participantSource =
      "params.selectedParticipantIds";
  }


  // ----------------------------------------------------------
  // Runtime participant selection
  // ----------------------------------------------------------

  else if (
    runtimeSelectedIds.length >
    0
  ) {

    participantIds =
      runtimeSelectedIds;

    participantSource =
      runtimeSelection.path;
  }


  // ----------------------------------------------------------
  // Final normalisation
  // ----------------------------------------------------------

  participantIds =
    normaliseIds(
      participantIds
    );


  // ==========================================================
  // DEBUG FINAL PARTICIPANT RESOLUTION
  // ==========================================================

  console.log(
    "[createConversation] PARTICIPANT RESOLUTION",
    {
      participantSource,

      participantIds,

      participantCount:
        participantIds.length,

      explicitParticipantIds,

      explicitUserIds,

      explicitSelectedIds,

      runtimeSelectionPath:
        runtimeSelection.path,

      runtimeSelectedIds,
    }
  );


  // ==========================================================
  // REQUIRE PARTICIPANTS
  // ==========================================================

  if (
    participantIds.length ===
    0
  ) {

    console.warn(
      "[createConversation] BLOCKED - no participants selected",
      {
        participantSource,
        participantIds,
      }
    );

    ctx.notify?.(
      "Select at least one participant before creating the conversation."
    );

    return {
      ok: false,

      error:
        "NO_CHAT_PARTICIPANTS",

      result: {
        participantSource,

        participantIds: [],

        projectId,

        title,

        type,
      },
    };
  }


  // ==========================================================
  // CURRENT USER
  // ==========================================================

  const currentUserId =
    normaliseId(
      ctx.get?.(
        "auth.userId"
      )
    ) ||
    normaliseId(
      ctx.get?.(
        "auth.user.id"
      )
    ) ||
    normaliseId(
      ctx.get?.(
        "user.id"
      )
    ) ||
    normaliseId(
      ctx.get?.(
        "auth.id"
      )
    ) ||
    null;


  console.log(
    "[createConversation] CURRENT USER",
    {
      currentUserId,
    }
  );


  // ==========================================================
  // REMOVE CURRENT USER
  // ==========================================================
  //
  // The creator is already the creator of the conversation.
  //
  // Do not send the current user as an invited participant.
  //
  // ==========================================================

  const filteredParticipantIds =
    currentUserId
      ? participantIds.filter(
          participantId =>
            participantId !==
            currentUserId
        )
      : participantIds;


  console.log(
    "[createConversation] PARTICIPANTS AFTER CREATOR FILTER",
    {
      requestedParticipantIds:
        participantIds,

      filteredParticipantIds,

      currentUserId,
    }
  );


  // ==========================================================
  // REQUIRE OTHER PARTICIPANTS
  // ==========================================================

  if (
    filteredParticipantIds.length ===
    0
  ) {

    console.warn(
      "[createConversation] BLOCKED - creator only selection",
      {
        participantIds,
        filteredParticipantIds,
        currentUserId,
      }
    );

    ctx.notify?.(
      "Select at least one other participant."
    );

    return {
      ok: false,

      error:
        "CHAT_CREATOR_CANNOT_BE_ONLY_PARTICIPANT",

      result: {
        requestedParticipantIds:
          participantIds,

        currentUserId,

        projectId,

        title,

        type,
      },
    };
  }


  // ==========================================================
  // DIRECT CONVERSATION VALIDATION
  // ==========================================================
  //
  // A direct conversation must contain exactly one other
  // participant.
  //
  // ==========================================================

  if (
    type === "direct" &&
    filteredParticipantIds.length !== 1
  ) {

    console.warn(
      "[createConversation] BLOCKED - invalid direct participant count",
      {
        filteredParticipantIds,
        participantCount:
          filteredParticipantIds.length,
      }
    );

    ctx.notify?.(
      "A direct conversation must have exactly one other participant."
    );

    return {
      ok: false,

      error:
        "INVALID_DIRECT_CONVERSATION_PARTICIPANTS",

      result: {
        projectId,

        type,

        participantIds:
          filteredParticipantIds,
      },
    };
  }


  // ==========================================================
  // EXISTING CONVERSATION CHECK
  // ==========================================================
  //
  // Do not accidentally recreate the same conversation when
  // runtime state already contains a conversation that is
  // currently active.
  //
  // ==========================================================

  const existingConversationId =
    normaliseId(
      currentChat?.conversationId
    ) ||
    normaliseId(
      currentChat?.id
    );

  const existingStatus =
    currentChat?.status ||
    null;


  if (
    existingConversationId &&
    [
      "active",
      "open",
      "joined",
      "inviting",
    ].includes(
      existingStatus
    )
  ) {

    console.warn(
      "[createConversation] CONVERSATION ALREADY EXISTS",
      {
        conversationId:
          existingConversationId,

        status:
          existingStatus,
      }
    );

    return {
      ok: false,

      error:
        "CHAT_CONVERSATION_ALREADY_EXISTS",

      result: {
        conversationId:
          existingConversationId,

        status:
          existingStatus,

        projectId,
      },
    };
  }


  // ==========================================================
  // CREATE BACKEND CONVERSATION
  // ==========================================================

  console.log(
    "[createConversation] Creating conversation",
    {
      projectId,

      title,

      type,

      participantIds:
        filteredParticipantIds,

      participantSource,

      participantCount:
        filteredParticipantIds.length,
    }
  );


  try {

    const {
      data,
    } =
      await api.post(
        "/chat/conversations",
        {

          // --------------------------------------------------
          // IMPORTANT:
          // Project is consumed from the Confo runtime.
          // --------------------------------------------------

          projectId,

          title,

          type,

          participantIds:
            filteredParticipantIds,

        }
      );


    // ========================================================
    // BACKEND RESPONSE
    // ========================================================

    console.log(
      "[createConversation] BACKEND RESPONSE",
      data
    );


    // ========================================================
    // EXTRACT CONVERSATION
    // ========================================================

    const conversation =
      data?.conversation ||
      data?.data?.conversation ||
      data?.result?.conversation ||
      null;


    const participants =
      Array.isArray(
        data?.participants
      )
        ? data.participants
        : Array.isArray(
            conversation?.participants
          )
        ? conversation.participants
        : [];


    // ========================================================
    // CONVERSATION ID
    // ========================================================

    const conversationId =
      normaliseId(
        conversation?._id
      ) ||
      normaliseId(
        conversation?.id
      ) ||
      normaliseId(
        data?.conversationId
      ) ||
      normaliseId(
        data?.id
      );


    // ========================================================
    // VALIDATE CONVERSATION
    // ========================================================

    if (
      !conversationId
    ) {

      console.error(
        "[createConversation] INVALID CONVERSATION RESPONSE",
        {
          data,
          conversation,
        }
      );

      return {
        ok: false,

        error:
          "INVALID_CHAT_CONVERSATION_RESPONSE",

        result:
          data ||
          null,
      };
    }


    // ========================================================
    // BACKEND STATUS
    // ========================================================

    const status =
      conversation?.status ||
      data?.status ||
      "active";


    // ========================================================
    // RESOLVE BACKEND PARTICIPANT IDS
    // ========================================================
    //
    // Prefer the authoritative backend participant objects,
    // but retain our requested IDs if the backend does not
    // return enriched participants.
    //
    // ========================================================

    const resolvedParticipantIds =
      normaliseIds(
        participants.length >
        0

          ? participants.map(
              participant =>
                participant?.userId ??
                participant?.user?._id ??
                participant?.user?.id ??
                participant?.id ??
                participant?._id
            )

          : filteredParticipantIds
      );


    // ========================================================
    // RUNTIME CHAT STATE
    // ========================================================
    //
    // Backend is authoritative.
    //
    // The runtime now knows:
    //
    // chat.projectId
    // chat.conversationId
    // chat.status
    // chat.conversation
    // chat.participantIds
    // chat.participants
    // chat.joined
    //
    // ========================================================

    ctx.patch?.(
      "chat",
      {

        projectId,

        conversationId,

        id:
          conversationId,

        status,

        type,

        title:
          conversation?.title ||
          title,

        conversation,

        participantIds:
          resolvedParticipantIds.length >
          0

            ? resolvedParticipantIds

            : filteredParticipantIds,

        participants,

        joined:
          false,

      }
    );


    // ========================================================
    // ALSO KEEP DIRECT RUNTIME PROJECT REFERENCE
    // ========================================================
    //
    // Do not overwrite the global project object.
    //
    // The project remains authoritative at:
    //
    //     project.id
    //
    // chat.projectId is simply a convenient domain-local
    // reference for subsequent chat actions.
    //
    // ========================================================

    console.log(
      "[createConversation] RUNTIME CHAT STATE STORED",
      {
        projectId,

        conversationId,

        status,

        type,

        participantIds:
          resolvedParticipantIds.length >
          0

            ? resolvedParticipantIds

            : filteredParticipantIds,

        participantCount:
          participants.length,

        participantSource,
      }
    );


    // ========================================================
    // CLEAR TEMPORARY CHAT SELECTION
    // ========================================================
    //
    // These are picker/input values, not persisted
    // conversation state.
    //
    // Do NOT clear chat.participantIds.
    //
    // ========================================================

    ctx.set?.(
      "chat.selectedParticipantIds",
      []
    );

    ctx.set?.(
      "chat.create.selectedParticipantIds",
      []
    );

    ctx.set?.(
      "chat.create.participantIds",
      []
    );

    ctx.set?.(
      "chat.participantSelection",
      []
    );

    ctx.set?.(
      "selectedParticipantIds",
      []
    );


    // ========================================================
    // CLEAR CREATE FORM TITLE
    // ========================================================

    ctx.set?.(
      "chat.create.title",
      ""
    );


    // ========================================================
    // CLEAR CREATE FORM TYPE
    // ========================================================
    //
    // Reset to the safe default rather than leaving a previous
    // direct/group selection behind.
    //
    // ========================================================

    ctx.set?.(
      "chat.create.type",
      "group"
    );


    // ========================================================
    // DEBUG CLEANUP
    // ========================================================

    console.log(
      "[createConversation] TEMPORARY CHAT SELECTION CLEARED",
      {
        chatSelectedParticipantIds:
          ctx.get?.(
            "chat.selectedParticipantIds"
          ),

        chatCreateSelectedParticipantIds:
          ctx.get?.(
            "chat.create.selectedParticipantIds"
          ),

        chatCreateParticipantIds:
          ctx.get?.(
            "chat.create.participantIds"
          ),

        genericSelectedParticipantIds:
          ctx.get?.(
            "selectedParticipantIds"
          ),
      }
    );


    // ========================================================
    // SUCCESS RESULT
    // ========================================================

    const result = {

      projectId,

      conversationId,

      id:
        conversationId,

      title:
        conversation?.title ||
        title,

      type,

      status,

      participantIds:
        resolvedParticipantIds.length >
        0

          ? resolvedParticipantIds

          : filteredParticipantIds,

      participants,

      joined:
        false,

      participantSource,

    };


    console.log(
      "================================================"
    );

    console.log(
      "[createConversation] SUCCESS",
      result
    );

    console.log(
      "================================================"
    );


    return {
      ok: true,

      result,
    };

  }


  // ==========================================================
  // BACKEND ERROR
  // ==========================================================

  catch (error) {

    console.error(
      "[createConversation] API FAILURE",
      error
    );

    console.error(
      "[createConversation] BACKEND ERROR",
      error?.response?.data
    );


    const statusCode =
      error?.response?.status;

    const serverError =
      error?.response?.data?.error;


    // ========================================================
    // 400
    // ========================================================

    if (
      statusCode === 400
    ) {

      ctx.notify?.(
        serverError ||
        "Invalid conversation request."
      );

      return {
        ok: false,

        error:
          serverError ||
          "INVALID_CHAT_CONVERSATION_REQUEST",

        result:
          error?.response?.data ||
          null,
      };
    }


    // ========================================================
    // 401
    // ========================================================

    if (
      statusCode === 401
    ) {

      ctx.notify?.(
        "You are not authorised to create this conversation."
      );

      return {
        ok: false,

        error:
          serverError ||
          "CHAT_UNAUTHORISED",

        result:
          error?.response?.data ||
          null,
      };
    }


    // ========================================================
    // 403
    // ========================================================

    if (
      statusCode === 403
    ) {

      ctx.notify?.(
        "You do not have permission to create this conversation."
      );

      return {
        ok: false,

        error:
          serverError ||
          "CHAT_ACCESS_DENIED",

        result:
          error?.response?.data ||
          null,
      };
    }


    // ========================================================
    // 404
    // ========================================================

    if (
      statusCode === 404
    ) {

      ctx.notify?.(
        "The chat conversation endpoint could not be found."
      );

      return {
        ok: false,

        error:
          serverError ||
          "CHAT_CONVERSATION_ENDPOINT_NOT_FOUND",

        result:
          error?.response?.data ||
          null,
      };
    }


    // ========================================================
    // 409
    // ========================================================

    if (
      statusCode === 409
    ) {

      ctx.notify?.(
        serverError ||
        "This conversation already exists."
      );

      return {
        ok: false,

        error:
          serverError ||
          "CHAT_CONVERSATION_CONFLICT",

        result:
          error?.response?.data ||
          null,
      };
    }


    // ========================================================
    // GENERIC FAILURE
    // ========================================================

    ctx.notify?.(
      serverError ||
      error?.message ||
      "Failed to create conversation."
    );


    return {
      ok: false,

      error:
        serverError ||
        error?.message ||
        "CREATE_CHAT_CONVERSATION_FAILED",

      result:
        error?.response?.data ||
        null,
    };
  }
}