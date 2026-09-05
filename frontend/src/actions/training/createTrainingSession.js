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
// IMPORTANT:
//
// For Remote Training the selector state is:
//
//   training.selectedParticipantIds
//
// We deliberately DO NOT use:
//
//   training.participantIds
//
// as a selection fallback.
//
// training.participantIds represents the participants
// belonging to the current/past session, not the picker.
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
//   POST /training/sessions
//          ↓
//   training.status = inviting
//
// IMPORTANT:
//
// `training.selectedParticipantIds` is temporary
// picker state.
//
// `training.participantIds` is persisted session data.
//
// They MUST NOT be used interchangeably.
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
    // EXPLICIT PARTICIPANT SOURCES
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


    // =================================================
    // RUNTIME PICKER SELECTION
    // =================================================
    //
    // IMPORTANT:
    //
    // We intentionally exclude:
    //
    //   training.participantIds
    //
    // because that is persisted session state.
    //
    // =================================================

    const runtimeSelection =
      readFirstArray(
        ctx,
        [

          "training.selectedParticipantIds",

          "selectedParticipantIds",

          "call.recipientIds",

          "training.participantSelection",

          "call.selectedParticipantIds",

        ]
      );


    const runtimeSelectedIds =
      normaliseIds(
        runtimeSelection.value
      );


    console.log(
      "[createTrainingSession] PARTICIPANT RESOLUTION SOURCES",
      {

        explicitParticipantIds,

        explicitUserIds,

        explicitSelectedIds,

        runtimeSelectionPath:
          runtimeSelection.path,

        runtimeSelectedIds,

        trainingSelectedParticipantIds:
          ctx.get?.(
            "training.selectedParticipantIds"
          ),

        persistedTrainingParticipantIds:
          ctx.get?.(
            "training.participantIds"
          ),

      }
    );


    // =================================================
    // RESOLVE FINAL PARTICIPANT IDS
    // =================================================

    let participantIds =
      [];

    let participantSource =
      "none";


    // -------------------------------------------------
    // Explicit participantIds
    // -------------------------------------------------

    if (
      explicitParticipantIds.length >
      0
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
      explicitUserIds.length >
      0
    ) {

      participantIds =
        explicitUserIds;

      participantSource =
        "params.userIds";

    }

    // -------------------------------------------------
    // Explicit selectedParticipantIds
    // -------------------------------------------------

    else if (
      explicitSelectedIds.length >
      0
    ) {

      participantIds =
        explicitSelectedIds;

      participantSource =
        "params.selectedParticipantIds";

    }

    // -------------------------------------------------
    // Runtime picker selection
    // -------------------------------------------------

    else if (
      runtimeSelectedIds.length >
      0
    ) {

      participantIds =
        runtimeSelectedIds;

      participantSource =
        runtimeSelection.path;

    }


    participantIds =
      normaliseIds(
        participantIds
      );


    // =================================================
    // REQUIRE A FRESH SELECTION
    // =================================================

    if (
      participantIds.length ===
      0
    ) {

      console.warn(
        "[createTrainingSession] BLOCKED - no participant selected",
        {

          participantSource,

          participantIds,

        }
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


    // =================================================
    // REMOVE HOST
    // =================================================

    const hostFilteredParticipantIds =
      currentUserId

        ? participantIds.filter(
            participantId =>
              participantId !==
              currentUserId
          )

        : participantIds;


    if (
      hostFilteredParticipantIds.length ===
      0
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
    // CREATE BACKEND SESSION
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


    const sessionId =
      normaliseId(
        session?.id
      );


    const channel =
      session?.channelName ||
      null;


    // =================================================
    // VALIDATE SESSION
    // =================================================

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
    // PARTICIPANT COUNT CHECK
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
    // RESOLVE CREATED PARTICIPANTS
    // =================================================

    const resolvedParticipantIds =
      normaliseIds(

        participants.length >
        0

          ? participants.map(
              participant =>
                participant?.userId
            )

          : participantIds

      );


    // =================================================
    // STORE CURRENT TRAINING SESSION
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
          currentUserId ||
          null,

        participantIds:
          resolvedParticipantIds.length >
          0

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
    // RESET TEMPORARY PICKER STATE
    // =================================================
    //
    // This is important.
    //
    // The next training session must require a fresh
    // participant selection.
    //
    // =================================================

    const clearedSelection =
      [];


    ctx.set?.(
      "training.selectedParticipantIds",
      clearedSelection
    );


    ctx.set?.(
      "training.participantSelection",
      clearedSelection
    );


    ctx.set?.(
      "selectedParticipantIds",
      clearedSelection
    );


    console.log(
      "[createTrainingSession] TEMPORARY PARTICIPANT SELECTION CLEARED",
      {

        trainingSelectedParticipantIds:
          ctx.get?.(
            "training.selectedParticipantIds"
          ),

      }
    );


    // =================================================
    // RESULT
    // =================================================

    const result = {

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
        resolvedParticipantIds.length >
        0

          ? resolvedParticipantIds

          : participantIds,

      participants,

      joined:
        false,

      participantSource,

    };


    console.log(
      "[createTrainingSession] SUCCESS",
      result
    );


    return {

      ok:
        true,

      result,

    };

  }
  catch (error) {

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


    if (
      status ===
      400
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
      status ===
      403
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
      status ===
      404
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
      status ===
      409
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