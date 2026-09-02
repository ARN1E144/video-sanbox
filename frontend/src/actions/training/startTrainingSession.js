// src/actions/training/startTrainingSession.js

import api from "../../services/api";


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
// START TRAINING SESSION
// =====================================================
//
// Responsibilities:
//
//   1. Start the backend training session.
//   2. Resolve the training channel.
//   3. Join Agora directly through ctx.agora.
//   4. Update training runtime state.
//
// The training backend owns the training lifecycle.
// AgoraEngine owns the media lifecycle.
//
// IMPORTANT:
//
// This action does NOT call:
//
//   call.joinCall
//
// That generic call action is no longer part of the
// Remote Training lifecycle.
// =====================================================

export default async function startTrainingSession(
  ctx,
  params = {}
) {

  console.log(
    "================================================="
  );

  console.log(
    "[startTrainingSession] START"
  );

  console.log(
    "================================================="
  );


  try {

    // =================================================
    // RESOLVE SESSION
    // =================================================

    const sessionId =
      normaliseId(
        params?.sessionId ||
        ctx.get?.(
          "training.sessionId"
        )
      );


    if (
      !sessionId
    ) {

      console.warn(
        "[startTrainingSession] No training session"
      );


      ctx.notify?.(
        "Create a training session before starting it."
      );


      return {

        ok:
          false,

        error:
          "NO_TRAINING_SESSION",

      };

    }


    const currentTraining =
      ctx.get?.(
        "training"
      ) || {};


    console.log(
      "[startTrainingSession] CURRENT TRAINING STATE",
      currentTraining
    );


    // =================================================
    // AGORA ENGINE
    // =================================================

    const agora =
      ctx?.agora ||
      null;


    if (
      !agora
    ) {

      console.error(
        "[startTrainingSession] Agora engine unavailable"
      );


      return {

        ok:
          false,

        error:
          "AGORA_ENGINE_UNAVAILABLE",

      };

    }


    if (
      typeof agora.joinCall !==
      "function"
    ) {

      console.error(
        "[startTrainingSession] Agora joinCall unavailable",
        {
          agora,
        }
      );


      return {

        ok:
          false,

        error:
          "AGORA_JOIN_UNAVAILABLE",

      };

    }


    // =================================================
    // START BACKEND SESSION
    // =================================================

    console.log(
      "[startTrainingSession] Starting backend training session",
      {
        sessionId,
      }
    );


    const {
      data,
    } =
      await api.post(
        `/training/sessions/${sessionId}/start`
      );


    console.log(
      "[startTrainingSession] BACKEND START RESPONSE",
      data
    );


    const session =
      data?.session ||
      null;


    if (
      !session?.id ||
      !session?.channelName
    ) {

      console.error(
        "[startTrainingSession] Invalid backend response",
        {
          data,
        }
      );


      return {

        ok:
          false,

        error:
          "INVALID_TRAINING_START_RESPONSE",

      };

    }


    const actualSessionId =
      normaliseId(
        session.id
      );


    const channel =
      String(
        session.channelName
      ).trim();


    if (
      !channel
    ) {

      return {

        ok:
          false,

        error:
          "MISSING_TRAINING_CHANNEL",

      };

    }


    // =================================================
    // STORE TRAINING SESSION
    // =================================================

    ctx.patch?.(
      "training",
      {

        sessionId:
          actualSessionId,

        channel,

        status:
          session.status ||
          "active",

        hostUserId:
          session.hostUserId,

        startedAt:
          session.startedAt ||
          Date.now(),

        endedAt:
          null,

        joined:
          false,

      }
    );


    // =================================================
    // JOIN AGORA DIRECTLY
    // =================================================
    //
    // AgoraEngine handles:
    //
    //   UID generation
    //   token retrieval
    //   client.join()
    //   local tracks
    //   publish()
    //
    // We only provide the training channel.
    // =================================================

    console.log(
      "[startTrainingSession] JOINING AGORA",
      {

        sessionId:
          actualSessionId,

        channel,

      }
    );


    const agoraResult =
      await agora.joinCall({
        channel,
      });


    console.log(
      "[startTrainingSession] AGORA JOIN RESULT",
      {

        agoraResult,

        engineUid:
          agora.uid,

        engineChannel:
          agora.channel,

        engineReady:
          agora.isReady,

      }
    );


    // =================================================
    // AGORA JOIN FAILED
    // =================================================

    if (
      agoraResult !== true
    ) {

      console.error(
        "[startTrainingSession] Training started but Agora join failed",
        {

          sessionId:
            actualSessionId,

          channel,

          agoraResult,

        }
      );


      ctx.patch?.(
        "training",
        {

          status:
            "active",

          joined:
            false,

        }
      );


      return {

        ok:
          false,

        error:
          "TRAINING_STARTED_BUT_AGORA_JOIN_FAILED",

        result: {

          sessionId:
            actualSessionId,

          channel,

          status:
            "active",

          joined:
            false,

          agoraResult,

        },

      };

    }


    // =================================================
    // MARK TRAINING CONNECTED
    // =================================================

    ctx.patch?.(
      "training",
      {

        sessionId:
          actualSessionId,

        channel,

        status:
          "active",

        hostUserId:
          session.hostUserId,

        startedAt:
          session.startedAt ||
          Date.now(),

        endedAt:
          null,

        joined:
          true,

        uid:
          agora.uid,

      }
    );


    // =================================================
    // TEMPORARY CALL BRIDGE
    // =================================================
    //
    // Keep this ONLY because existing AgoraFeed/
    // rendering code may still consume call.*.
    //
    // It is not used to perform the Agora join.
    // =================================================

    ctx.patch?.(
      "call",
      {

        id:
          actualSessionId,

        channel,

        type:
          "training",

        state:
          "connected",

        joined:
          true,

      }
    );


    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      "================================================="
    );

    console.log(
      "[startTrainingSession] SUCCESS"
    );

    console.log(
      "================================================="
    );


    console.log(
      "[startTrainingSession] TRAINING IDENTITY",
      {

        sessionId:
          actualSessionId,

        channel,

        uid:
          agora.uid,

        joined:
          true,

      }
    );


    return {

      ok:
        true,

      result: {

        sessionId:
          actualSessionId,

        channel,

        status:
          "active",

        joined:
          true,

        hostUserId:
          session.hostUserId,

        uid:
          agora.uid,

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[startTrainingSession] FAILED",
      error
    );


    console.error(
      "[startTrainingSession] Backend error",
      error?.response?.data
    );


    ctx.patch?.(
      "training",
      {

        joined:
          false,

      }
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.message ||
        "START_TRAINING_SESSION_FAILED",

      result:
        error?.response?.data ||
        null,

    };

  }

}