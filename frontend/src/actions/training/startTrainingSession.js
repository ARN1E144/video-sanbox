// src/actions/training/startTrainingSession.js

import api from "../../services/api";


export default async function startTrainingSession(
  ctx,
  params = {}
) {

  console.log(
    "=============================================="
  );

  console.log(
    "[startTrainingSession] START"
  );

  console.log(
    "=============================================="
  );


  try {

    // =================================================
    // RESOLVE EXISTING SESSION
    // =================================================
    //
    // The session must already have been created by:
    //
    //   training.createSession
    //
    // This action does NOT create a new session.
    //
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
      "[startTrainingSession] CURRENT TRAINING STATE",
      currentTraining
    );


    console.log(
      "[startTrainingSession] RESOLVED SESSION",
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
        "[startTrainingSession] BLOCKED - no training session exists"
      );


      ctx.notify?.(
        "Create and invite participants before starting training."
      );


      return {

        ok:
          false,

        error:
          "NO_TRAINING_SESSION",

      };

    }


    // =================================================
    // RESOLVE CHANNEL
    // =================================================
    //
    // Prefer explicit params, then runtime state.
    //
    // =================================================

    const existingChannel =
      params?.channel ||
      ctx.get?.(
        "training.channel"
      ) ||
      null;


    // =================================================
    // START SESSION ON BACKEND
    // =================================================

    console.log(
      "[startTrainingSession] Starting training session",
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
      data?.session;


    // =================================================
    // VALIDATE RESPONSE
    // =================================================

    if (
      !session?.id ||
      !session?.channelName
    ) {

      console.error(
        "[startTrainingSession] INVALID START RESPONSE",
        data
      );


      return {

        ok:
          false,

        error:
          "INVALID_TRAINING_START_RESPONSE",

      };

    }


    const channel =
      session.channelName ||
      existingChannel ||
      null;


    if (
      !channel
    ) {

      console.error(
        "[startTrainingSession] Missing training channel"
      );


      return {

        ok:
          false,

        error:
          "MISSING_TRAINING_CHANNEL",

      };

    }


    // =================================================
    // STORE ACTIVE SESSION
    // =================================================

    ctx.patch?.(
      "training",
      {

        sessionId:
          session.id,

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
          session.endedAt ||
          null,

      }
    );


    // =================================================
    // TEMPORARY CALL BRIDGE
    // =================================================
    //
    // AgoraFeed currently reads call.channel and
    // call.joined.
    //
    // Keep this compatibility bridge while the Agora
    // layer is migrated fully to training.*.
    //
    // =================================================

    ctx.patch?.(
      "call",
      {

        id:
          session.id,

        channel,

        state:
          "active",

        joined:
          false,

      }
    );


    console.log(
      "[startTrainingSession] Training session is active",
      {

        sessionId:
          session.id,

        channel,

        status:
          session.status,

      }
    );


    // =================================================
    // HOST JOINS AGORA
    // =================================================

    console.log(
      "[startTrainingSession] Joining training Agora channel",
      {

        sessionId:
          session.id,

        channel,

      }
    );


    const joinResult =
      await ctx.runAction?.(
        "call.joinCall",
        {

          channel,

        }
      );


    console.log(
      "[startTrainingSession] HOST AGORA JOIN RESULT",
      joinResult
    );


    if (
      !joinResult?.ok
    ) {

      console.error(
        "[startTrainingSession] Training started but host failed to join Agora",
        joinResult
      );


      // -----------------------------------------------
      // The backend session is active, but the host
      // did not successfully join the media channel.
      //
      // Do not pretend the runtime is connected.
      // -----------------------------------------------

      ctx.patch?.(
        "training",
        {

          status:
            "active",

          joined:
            false,

        }
      );


      ctx.patch?.(
        "call",
        {

          state:
            "active",

          joined:
            false,

        }
      );


      return {

        ok:
          false,

        error:
          "TRAINING_STARTED_BUT_JOIN_FAILED",

        result: {

          sessionId:
            session.id,

          channel,

          status:
            "active",

          joined:
            false,

          joinResult,

        },

      };

    }


    // =================================================
    // MARK CONNECTED
    // =================================================

    ctx.patch?.(
      "training",
      {

        sessionId:
          session.id,

        channel,

        status:
          "active",

        joined:
          true,

        hostUserId:
          session.hostUserId,

        startedAt:
          session.startedAt ||
          Date.now(),

        endedAt:
          null,

      }
    );


    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      "=============================================="
    );

    console.log(
      "[startTrainingSession] SUCCESS"
    );

    console.log(
      "=============================================="
    );


    console.log(
      "[startTrainingSession] Training session identity",
      {

        sessionId:
          session.id,

        channel,

        status:
          "active",

        joined:
          true,

        uid:
          joinResult?.result?.uid,

      }
    );


    return {

      ok:
        true,

      result: {

        sessionId:
          session.id,

        channel,

        status:
          "active",

        joined:
          true,

        hostUserId:
          session.hostUserId,

        startedAt:
          session.startedAt,

        uid:
          joinResult?.result?.uid,

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


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.message ||
        "START_TRAINING_SESSION_FAILED",

    };

  }

}
