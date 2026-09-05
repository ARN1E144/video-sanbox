// src/actions/training/endTrainingSession.js

import api from "../../services/api";


// =====================================================
// NORMALISE ID
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


  const result =
    String(
      value
    ).trim();


  return result ||
    null;

}


// =====================================================
// END TRAINING SESSION
// =====================================================
//
// Responsibilities:
//
//   1. Resolve the current training session.
//   2. Tell the backend to end the session.
//   3. Consume cancellationResult returned by the backend.
//   4. Leave Agora.
//   5. Clear the training runtime.
//   6. Clear the temporary call bridge.
//
// Backend is authoritative for:
//
//   TrainingSession.status
//   TrainingParticipant.status
//   cancelled invitations
//
// AgoraEngine / call.leaveCall owns media cleanup.
//
// IMPORTANT:
//
// An ended training session must NOT remain in:
//
//   training.sessionId
//   training.channel
//
// Otherwise a subsequent training can inherit stale
// session identity.
//
// =====================================================

export default async function endTrainingSession(
  ctx,
  params = {}
) {

  console.log(
    "================================================="
  );

  console.log(
    "[endTrainingSession] START"
  );

  console.log(
    "================================================="
  );


  try {

    // =================================================
    // CURRENT TRAINING
    // =================================================

    const currentTraining =
      ctx.get?.(
        "training"
      ) || {};


    console.log(
      "[endTrainingSession] CURRENT TRAINING",
      currentTraining
    );


    // =================================================
    // RESOLVE SESSION
    // =================================================

    const sessionId =
      normaliseId(
        params?.sessionId ||
        currentTraining?.sessionId ||
        ctx.get?.(
          "training.sessionId"
        )
      );


    console.log(
      "[endTrainingSession] RESOLVED SESSION",
      {
        sessionId,
      }
    );


    // =================================================
    // REQUIRE SESSION
    // =================================================

    if (
      !sessionId
    ) {

      console.warn(
        "[endTrainingSession] No training session to end"
      );


      ctx.notify?.(
        "No training session is currently active."
      );


      return {

        ok:
          false,

        error:
          "NO_TRAINING_SESSION",

      };

    }


    // =================================================
    // END BACKEND SESSION
    // =================================================
    //
    // The backend is responsible for:
    //
    //   TrainingSession -> ended
    //   outstanding invited participants ->
    //       cancelled
    //
    // and returns:
    //
    //   {
    //     session,
    //     cancellationResult
    //   }
    //
    // =================================================

    console.log(
      "[endTrainingSession] Ending backend training session",
      {
        sessionId,
      }
    );


    const {
      data,
    } =
      await api.post(
        `/training/sessions/${sessionId}/end`
      );


    console.log(
      "[endTrainingSession] BACKEND RESPONSE",
      data
    );


    // =================================================
    // RESPONSE VALIDATION
    // =================================================

    const session =
      data?.session ||
      null;


    const cancellationResult =
      data?.cancellationResult ||
      null;


    if (
      !session?.id
    ) {

      console.error(
        "[endTrainingSession] INVALID END RESPONSE",
        {
          data,
        }
      );


      return {

        ok:
          false,

        error:
          "INVALID_TRAINING_END_RESPONSE",

        result:
          data ||
          null,

      };

    }


    const endedSessionId =
      normaliseId(
        session.id
      );


    // =================================================
    // CANCELLATION RESULT
    // =================================================
    //
    // This tells the runtime exactly what happened to
    // outstanding participant invitations.
    //
    // Example:
    //
    // {
    //   cancelledCount: 1,
    //   participantIds: ["..."]
    // }
    //
    // We do not infer this locally.
    //
    // =================================================

    console.log(
      "[endTrainingSession] CANCELLATION RESULT",
      {

        sessionId:
          endedSessionId,

        cancellationResult,

      }
    );


    const cancelledCount =
      Number(
        cancellationResult?.cancelledCount
      ) || 0;


    const cancelledParticipantIds =
      Array.isArray(
        cancellationResult?.participantIds
      )
        ? cancellationResult.participantIds
            .map(
              normaliseId
            )
            .filter(Boolean)
        : [];


    // =================================================
    // LEAVE AGORA
    // =================================================
    //
    // call.leaveCall remains the existing media bridge.
    //
    // The backend has already ended the application
    // session; now we tear down local media.
    //
    // =================================================

    console.log(
      "[endTrainingSession] Leaving Agora"
    );


    let leaveResult =
      null;


    try {

      leaveResult =
        await ctx.runAction?.(
          "call.leaveCall"
        );


      console.log(
        "[endTrainingSession] Agora leave result",
        leaveResult
      );

    }
    catch (leaveError) {

      console.warn(
        "[endTrainingSession] Agora leave warning",
        leaveError
      );


      leaveResult = {

        ok:
          false,

        error:
          leaveError?.message ||
          "AGORA_LEAVE_FAILED",

      };

    }


    // =================================================
    // CLEAR TRAINING RUNTIME
    // =================================================
    //
    // IMPORTANT:
    //
    // sessionId and channel are cleared.
    //
    // The session is over and must not remain the
    // current runtime session.
    //
    // =================================================

    ctx.patch?.(
    "training",
    {
        sessionId: null,

        channel: null,

        status: "ended",

        hostUserId:
        session.hostUserId,

        joined: false,

        startedAt: null,

        endedAt:
        session.endedAt ||
        Date.now(),

        participant: null,

        participants: [],

        participantIds: [],

    }
    );


    // =================================================
    // CLEAR TEMPORARY CALL BRIDGE
    // =================================================

    ctx.patch?.(
      "call",
      {

        id:
          null,

        channel:
          null,

        type:
          null,

        state:
          "ended",

        joined:
          false,

        remoteUsers:
          {},

        participants:
          [],

        selectedParticipantIds:
          [],

      }
    );


    // =================================================
    // NOTIFY
    // =================================================

    if (
      cancelledCount >
      0
    ) {

      console.log(
        "[endTrainingSession] Pending training invitations cancelled",
        {

          sessionId:
            endedSessionId,

          cancelledCount,

          participantIds:
            cancelledParticipantIds,

        }
      );

    }
    else {

      console.log(
        "[endTrainingSession] No outstanding training invitations required cancellation",
        {

          sessionId:
            endedSessionId,

        }
      );

    }


    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      "================================================="
    );

    console.log(
      "[endTrainingSession] SUCCESS"
    );

    console.log(
      "================================================="
    );


    return {

      ok:
        true,

      result: {

        sessionId:
          endedSessionId,

        channel:
          session.channelName ||
          null,

        status:
          "ended",

        joined:
          false,

        startedAt:
          session.startedAt ||
          null,

        endedAt:
          session.endedAt ||
          null,

        leaveResult,

        cancellationResult: {

          cancelledCount,

          participantIds:
            cancelledParticipantIds,

        },

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[endTrainingSession] FAILED",
      error
    );


    console.error(
      "[endTrainingSession] Backend error",
      error?.response?.data
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.message ||
        "END_TRAINING_SESSION_FAILED",

      result:
        error?.response?.data ||
        null,

    };

  }

}