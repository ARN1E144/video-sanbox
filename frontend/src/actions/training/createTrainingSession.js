// src/actions/training/createTrainingSession.js

import api from "../../services/api";


// =====================================================
// NORMALISE SINGLE ID
// =====================================================

function normaliseId(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  // ---------------------------------------------------
  // Support:
  //
  // "695..."
  // { id: "695..." }
  // { userId: "695..." }
  // { _id: "695..." }
  // ---------------------------------------------------

  if (
    typeof value === "object"
  ) {

    value =
      value?.userId ||
      value?.id ||
      value?._id ||
      null;

  }


  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  const id =
    String(
      value
    ).trim();


  return id ||
    null;

}


// =====================================================
// NORMALISE IDS
// =====================================================

function normaliseIds(
  values
) {

  if (
    !Array.isArray(
      values
    )
  ) {

    return [];

  }


  return [
    ...new Set(

      values

        .map(
          normaliseId
        )

        .filter(Boolean)

    ),
  ];

}


// =====================================================
// READ FIRST NON-EMPTY ARRAY
// =====================================================
//
// The current ParticipantSelector should normally use:
//
//   training.selectedParticipantIds
//
// Older configurations may still use:
//
//   training.participantIds
//
// We support both.
//
// =====================================================

function readFirstArray(
  ctx,
  paths
) {

  for (
    const path of
      paths
  ) {

    const value =
      ctx.get?.(
        path
      );


    if (
      Array.isArray(
        value
      ) &&
      value.length > 0
    ) {

      return {

        path,

        value,

      };

    }

  }


  return {

    path:
      null,

    value:
      [],

  };

}


// =====================================================
// CREATE TRAINING SESSION
// =====================================================
//
// Lifecycle:
//
//   ParticipantSelector
//          ↓
//   training.selectedParticipantIds
//          ↓
//   training.createSession
//          ↓
//   backend creates:
//      TrainingSession
//      TrainingParticipant[]
//          ↓
//   training.status = inviting
//
// IMPORTANT:
//
// This action does NOT:
//   - start Agora
//   - join Agora
//   - start the training session
//
// Those belong to:
//
//   training.startSession
//   training.joinSession
//
// =====================================================

export default async function createTrainingSession(
  ctx,
  params = {}
) {

  console.log(
    "=============================================="
  );

  console.log(
    "[createTrainingSession] START"
  );

  console.log(
    "=============================================="
  );


  try {

    // =================================================
    // CURRENT TRAINING STATE
    // =================================================

    const currentTraining =
      ctx.get?.(
        "training"
      ) || {};


    console.log(
      "[createTrainingSession] CURRENT TRAINING STATE",
      currentTraining
    );


    // =================================================
    // RESOLVE PARTICIPANTS
    // =================================================
    //
    // Priority:
    //
    // 1. params.participantIds
    // 2. params.userIds
    // 3. params.selectedParticipantIds
    // 4. training.selectedParticipantIds
    // 5. training.participantIds
    //
    // =================================================

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


    const runtimeSelection =
        readFirstArray(
            ctx,
            [

            // New Remote Training selection path
            "training.selectedParticipantIds",

            // Generic selection path
            "selectedParticipantIds",

            // Existing selector compatibility
            "call.recipientIds",

            // Optional aliases
            "training.participantSelection",

            "call.selectedParticipantIds",

            // Persisted training participant list
            "training.participantIds",

            ]
        );


    const runtimeSelectedIds =
  normaliseIds(
    runtimeSelection.value
  );


console.log(
  "[createTrainingSession] PARTICIPANT RESOLUTION",
  {

    source:
      runtimeSelection.path,

    runtimeSelectedIds,

    trainingSelectedParticipantIds:
      ctx.get?.(
        "training.selectedParticipantIds"
      ),

    callRecipientIds:
      ctx.get?.(
        "call.recipientIds"
      ),

    callSelectedParticipantIds:
      ctx.get?.(
        "call.selectedParticipantIds"
      ),

    trainingParticipantIds:
      ctx.get?.(
        "training.participantIds"
      ),

  }
);


    let participantIds =
      [];


    let participantSource =
      "none";


    // -------------------------------------------------
    // Explicit participantIds
    // -------------------------------------------------

    if (
      explicitParticipantIds.length > 0
    ) {

      participantIds =
        explicitParticipantIds;

      participantSource =
        "params.participantIds";

    }

    // -------------------------------------------------
    // Explicit userIds
    // -------------------------------------------------

    else if (
      explicitUserIds.length > 0
    ) {

      participantIds =
        explicitUserIds;

      participantSource =
        "params.userIds";

    }

    // -------------------------------------------------
    // Explicit selected IDs
    // -------------------------------------------------

    else if (
      explicitSelectedIds.length > 0
    ) {

      participantIds =
        explicitSelectedIds;

      participantSource =
        "params.selectedParticipantIds";

    }

    // -------------------------------------------------
    // Runtime selection
    // -------------------------------------------------

    else if (
      runtimeSelectedIds.length > 0
    ) {

      participantIds =
        runtimeSelectedIds;

      participantSource =
        runtimeSelection.path;

    }


    // =================================================
    // FINAL NORMALISATION
    // =================================================

    participantIds =
      normaliseIds(
        participantIds
      );


    // =================================================
    // DEBUG
    // =================================================

    console.log(
      "[createTrainingSession] PARTICIPANT RESOLUTION",
      {

        participantSource,

        participantIds,

        explicitParticipantIds,

        explicitUserIds,

        explicitSelectedIds,

        runtimeSelectionPath:
          runtimeSelection.path,

        runtimeSelectedIds,

      }
    );


    // =================================================
    // REQUIRE PARTICIPANTS
    // =================================================

    if (
      participantIds.length === 0
    ) {

      console.warn(
        "[createTrainingSession] BLOCKED - no participants selected"
      );


      ctx.notify?.(
        "Select at least one participant before sending training invitations."
      );


      return {

        ok:
          false,

        error:
          "NO_TRAINING_PARTICIPANTS",

        result: {

          participantSource,

          participantIds: [],

        },

      };

    }


    // =================================================
    // CURRENT USER
    // =================================================
    //
    // The host should not be invited as a participant.
    //
    // =================================================

    const currentUserId =
      normaliseId(
        ctx.get?.(
          "auth.userId"
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


    const hostFilteredParticipantIds =
      currentUserId

        ? participantIds.filter(
            participantId =>
              String(
                participantId
              ) !==
              String(
                currentUserId
              )
          )

        : participantIds;


    if (
      hostFilteredParticipantIds.length === 0
    ) {

      console.warn(
        "[createTrainingSession] BLOCKED - host only selection",
        {

          currentUserId,

          participantIds,

        }
      );


      ctx.notify?.(
        "Select at least one other participant for the training session."
      );


      return {

        ok:
          false,

        error:
          "TRAINING_HOST_CANNOT_BE_PARTICIPANT",

        result: {

          requestedParticipantIds:
            participantIds,

          currentUserId,

        },

      };

    }


    participantIds =
      hostFilteredParticipantIds;


    // =================================================
    // EXISTING SESSION CHECK
    // =================================================
    //
    // Do not create another training session while the
    // runtime already owns an inviting/active session.
    //
    // =================================================

    const existingSessionId =
      normaliseId(
        currentTraining.sessionId
      );


    const existingStatus =
      currentTraining.status ||
      null;


    if (
      existingSessionId &&
      [
        "inviting",
        "active",
        "started",
      ].includes(
        existingStatus
      )
    ) {

      console.warn(
        "[createTrainingSession] TRAINING SESSION ALREADY EXISTS",
        {

          sessionId:
            existingSessionId,

          status:
            existingStatus,

        }
      );


      return {

        ok:
          false,

        error:
          "TRAINING_SESSION_ALREADY_EXISTS",

        result: {

          sessionId:
            existingSessionId,

          status:
            existingStatus,

        },

      };

    }


    // =================================================
    // API REQUEST
    // =================================================

    console.log(
      "[createTrainingSession] Creating training session",
      {

        participantIds,

        participantSource,

        participantCount:
          participantIds.length,

      }
    );


    const {
      data,
    } =
      await api.post(
        "/training/sessions",
        {

          participantIds,

        }
      );


    console.log(
      "[createTrainingSession] BACKEND RESPONSE",
      data
    );


    // =================================================
    // EXTRACT RESPONSE
    // =================================================

    const session =
      data?.session ||
      null;


    const participants =
      Array.isArray(
        data?.participants
      )
        ? data.participants
        : [];


    // =================================================
    // VALIDATE RESPONSE
    // =================================================

    const sessionId =
      normaliseId(
        session?.id
      );


    const channel =
      session?.channelName ||
      null;


    if (
      !sessionId
    ) {

      console.error(
        "[createTrainingSession] INVALID SESSION ID",
        {
          data,
        }
      );


      return {

        ok:
          false,

        error:
          "INVALID_TRAINING_SESSION_RESPONSE",

        result:
          data ||
          null,

      };

    }


    if (
      !channel
    ) {

      console.error(
        "[createTrainingSession] INVALID TRAINING CHANNEL",
        {
          data,
        }
      );


      return {

        ok:
          false,

        error:
          "MISSING_TRAINING_CHANNEL",

        result: {

          sessionId,

          response:
            data,

        },

      };

    }


    // =================================================
    // VERIFY PARTICIPANT CREATION
    // =================================================

    if (
      participants.length !==
      participantIds.length
    ) {

      console.warn(
        "[createTrainingSession] PARTICIPANT COUNT MISMATCH",
        {

          requested:
            participantIds.length,

          created:
            participants.length,

          participantIds,

        }
      );

    }


    // =================================================
    // RESOLVE ACTUAL PARTICIPANT IDS
    // =================================================
    //
    // Keep the requested IDs even if the backend's
    // enriched participant objects do not expose every
    // field in the same shape.
    //
    // =================================================

    const resolvedParticipantIds =
      normaliseIds(

        participants.length > 0

          ? participants.map(
              participant =>
                participant?.userId
            )

          : participantIds

      );


    // =================================================
    // STORE TRAINING SESSION
    // =================================================
    //
    // Backend is authoritative.
    //
    // Session is now:
    //
    //   inviting
    //
    // It is NOT joined.
    //
    // =================================================

    ctx.patch?.(
      "training",
      {

        sessionId,

        channel,

        status:
          session.status ||
          "inviting",

        hostUserId:
          normaliseId(
            session.hostUserId
          ) ||
          currentTraining.hostUserId ||
          currentUserId ||
          null,

        participantIds:
          resolvedParticipantIds.length > 0
            ? resolvedParticipantIds
            : participantIds,

        participants,

        joined:
          false,

        startedAt:
          session.startedAt ||
          null,

        endedAt:
          null,

      }
    );


    // =================================================
    // CLEAR TEMPORARY SELECTION
    // =================================================
    //
    // This is picker state only.
    //
    // Do NOT clear training.participantIds because that
    // now represents persisted session participants.
    //
    // =================================================

    ctx.set?.(
      "training.selectedParticipantIds",
      []
    );


    // =================================================
    // ALSO CLEAR OPTIONAL SELECTION ALIASES
    // =================================================
    //
    // Safe cleanup for configurations that temporarily
    // used one of these paths.
    //
    // =================================================

    ctx.set?.(
      "training.participantSelection",
      []
    );


    ctx.set?.(
      "selectedParticipantIds",
      []
    );


    // =================================================
    // DEBUG
    // =================================================

    console.log(
      "[createTrainingSession] TRAINING SESSION STORED",
      {

        sessionId,

        channel,

        status:
          session.status ||
          "inviting",

        participantSource,

        requestedParticipantIds:
          participantIds,

        resolvedParticipantIds,

        participantCount:
          participants.length,

      }
    );


    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      "=============================================="
    );

    console.log(
      "[createTrainingSession] SUCCESS"
    );

    console.log(
      "=============================================="
    );


    return {

      ok:
        true,

      result: {

        sessionId,

        channel,

        status:
          session.status ||
          "inviting",

        hostUserId:
          normaliseId(
            session.hostUserId
          ) ||
          currentUserId ||
          null,

        participantIds:
          resolvedParticipantIds.length > 0
            ? resolvedParticipantIds
            : participantIds,

        participants,

        joined:
          false,

        participantSource,

      },

    };

  }
  catch (error) {

    // =================================================
    // API / RUNTIME ERROR
    // =================================================

    console.error(
      "[createTrainingSession] FAILED",
      error
    );


    console.error(
      "[createTrainingSession] BACKEND ERROR",
      error?.response?.data
    );


    const status =
      error?.response?.status;


    const serverError =
      error?.response?.data?.error;


    // =================================================
    // MAP COMMON SERVER ERRORS
    // =================================================

    if (
      status === 400
    ) {

      return {

        ok:
          false,

        error:
          serverError ||
          "INVALID_TRAINING_SESSION_REQUEST",

        result:
          error?.response?.data ||
          null,

      };

    }


    if (
      status === 403
    ) {

      return {

        ok:
          false,

        error:
          serverError ||
          "TRAINING_SESSION_ACCESS_DENIED",

        result:
          error?.response?.data ||
          null,

      };

    }


    if (
      status === 404
    ) {

      return {

        ok:
          false,

        error:
          serverError ||
          "TRAINING_PARTICIPANT_NOT_FOUND",

        result:
          error?.response?.data ||
          null,

      };

    }


    if (
      status === 409
    ) {

      return {

        ok:
          false,

        error:
          serverError ||
          "TRAINING_SESSION_CONFLICT",

        result:
          error?.response?.data ||
          null,

      };

    }


    return {

      ok:
        false,

      error:
        serverError ||
        error?.message ||
        "CREATE_TRAINING_SESSION_FAILED",

      result:
        error?.response?.data ||
        null,

    };

  }

}
