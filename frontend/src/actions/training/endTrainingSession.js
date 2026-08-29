// src/actions/training/endTrainingSession.js

import api from "../../services/api";


export default async function endTrainingSession(
  ctx,
  params = {}
) {

  console.log(
    "=============================================="
  );

  console.log(
    "[endTrainingSession] START"
  );

  console.log(
    "=============================================="
  );


  try {

    // =================================================
    // RESOLVE SESSION
    // =================================================

    const sessionId =
      params?.sessionId ||
      ctx.get?.(
        "training.sessionId"
      ) ||
      null;


    const currentTraining =
      ctx.get?.(
        "training"
      ) || {};


    console.log(
      "[endTrainingSession] CURRENT TRAINING",
      currentTraining
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


    const session =
      data?.session;


    if (
      !session?.id
    ) {

      console.error(
        "[endTrainingSession] INVALID END RESPONSE",
        data
      );


      return {

        ok:
          false,

        error:
          "INVALID_TRAINING_END_RESPONSE",

      };

    }


    // =================================================
    // UPDATE TRAINING RUNTIME
    // =================================================

    ctx.patch?.(
      "training",
      {

        sessionId:
          session.id,

        channel:
          session.channelName,

        status:
          "ended",

        hostUserId:
          session.hostUserId,

        joined:
          false,

        startedAt:
          session.startedAt ||
          null,

        endedAt:
          session.endedAt ||
          Date.now(),

      }
    );


    // =================================================
    // LEAVE AGORA
    // =================================================
    //
    // Keep using the existing Agora lifecycle action
    // as the media bridge.
    //
    // =================================================

    console.log(
      "[endTrainingSession] Leaving Agora"
    );


    const leaveResult =
      await ctx.runAction?.(
        "call.leaveCall"
      );


    console.log(
      "[endTrainingSession] Agora leave result",
      leaveResult
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

        state:
          "ended",

        joined:
          false,

        remoteUsers:
          {},

        participants:
          0,

      }
    );


    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      "=============================================="
    );

    console.log(
      "[endTrainingSession] SUCCESS"
    );

    console.log(
      "=============================================="
    );


    return {

      ok:
        true,

      result: {

        sessionId:
          session.id,

        channel:
          session.channelName,

        status:
          "ended",

        joined:
          false,

        endedAt:
          session.endedAt,

        leaveResult,

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

    };

  }

}