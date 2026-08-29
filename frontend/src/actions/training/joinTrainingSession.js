// src/actions/training/joinTrainingSession.js

import api from "../../services/api";


export default async function joinTrainingSession(
  ctx,
  params = {}
) {

  console.log(
    "=============================================="
  );

  console.log(
    "[joinTrainingSession] START"
  );

  console.log(
    "=============================================="
  );


  try {

    // =================================================
    // RESOLVE SESSION
    // =================================================
    //
    // Priority:
    //
    // 1. Explicit params.sessionId
    // 2. training.pendingSession.id
    // 3. training.pendingSession._id
    // 4. training.sessionId
    //
    // =================================================

    const pendingSession =
      ctx.get?.(
        "training.pendingSession"
      ) || null;


    const sessionId =
      params?.sessionId ||
      pendingSession?.id ||
      pendingSession?._id ||
      ctx.get?.(
        "training.sessionId"
      ) ||
      null;


    console.log(
      "[joinTrainingSession] RESOLVED SESSION",
      {

        sessionId,

        pendingSession,

      }
    );


    // =================================================
    // REQUIRE SESSION
    // =================================================

    if (
      !sessionId
    ) {

      console.warn(
        "[joinTrainingSession] BLOCKED - no training session available"
      );


      ctx.notify?.(
        "No training invitation is available."
      );


      return {

        ok:
          false,

        error:
          "NO_PENDING_TRAINING_SESSION",

      };

    }


    // =================================================
    // JOIN BACKEND SESSION
    // =================================================
    //
    // Backend will:
    //
    // invited → joined
    //
    // and return:
    //
    // session
    // participant
    //
    // =================================================

    const {
      data,
    } =
      await api.post(
        `/training/sessions/${sessionId}/join`
      );


    console.log(
      "[joinTrainingSession] BACKEND RESPONSE",
      data
    );


    const session =
      data?.session;


    const participant =
      data?.participant;


    // =================================================
    // VALIDATE SESSION
    // =================================================

    if (
      !session?.id ||
      !session?.channelName
    ) {

      console.error(
        "[joinTrainingSession] INVALID SESSION RESPONSE",
        data
      );


      return {

        ok:
          false,

        error:
          "INVALID_TRAINING_JOIN_RESPONSE",

      };

    }


    // =================================================
    // STORE TRAINING SESSION
    // =================================================

    ctx.patch?.(
      "training",
      {

        sessionId:
          session.id,

        channel:
          session.channelName,

        status:
          session.status ||
          "active",

        hostUserId:
          session.hostUserId,

        participant:
          participant ||
          null,

        pendingSession:
          null,

        pendingSessions:
          [],

        hasPendingSession:
          false,

        startedAt:
          session.startedAt ||
          null,

        endedAt:
          session.endedAt ||
          null,

        joined:
          false,

      }
    );


    // =================================================
    // TEMPORARY CALL BRIDGE
    // =================================================
    //
    // AgoraFeed and call.joinCall currently use:
    //
    //   call.channel
    //
    // Keep this bridge until the Agora layer is fully
    // migrated to training.*.
    //
    // =================================================

    ctx.patch?.(
      "call",
      {

        id:
          session.id,

        channel:
          session.channelName,

        state:
          "active",

        joined:
          false,

      }
    );


    // =================================================
    // JOIN AGORA
    // =================================================

    console.log(
      "[joinTrainingSession] JOINING AGORA",
      {

        sessionId:
          session.id,

        channel:
          session.channelName,

      }
    );


    const joinResult =
      await ctx.runAction?.(
        "call.joinCall",
        {

          channel:
            session.channelName,

        }
      );


    console.log(
      "[joinTrainingSession] AGORA JOIN RESULT",
      joinResult
    );


    // =================================================
    // AGORA JOIN FAILED
    // =================================================

    if (
      !joinResult?.ok
    ) {

      console.error(
        "[joinTrainingSession] Backend participant marked joined but Agora join failed",
        joinResult
      );


      // -----------------------------------------------
      // Keep the runtime honest.
      // The backend participant record has already
      // become "joined", but the media connection did
      // not succeed.
      // -----------------------------------------------

      ctx.patch?.(
        "training",
        {

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
          "TRAINING_PARTICIPANT_JOINED_BUT_AGORA_FAILED",

        result: {

          sessionId:
            session.id,

          channel:
            session.channelName,

          participant,

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

        channel:
          session.channelName,

        status:
          "active",

        hostUserId:
          session.hostUserId,

        participant: {

          ...(participant || {}),

          status:
            "joined",

          joinedAt:
            participant?.joinedAt ||
            Date.now(),

        },

        joined:
          true,

        startedAt:
          session.startedAt ||
          null,

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
      "[joinTrainingSession] SUCCESS"
    );

    console.log(
      "=============================================="
    );


    console.log(
      "[joinTrainingSession] SESSION IDENTITY",
      {

        sessionId:
          session.id,

        channel:
          session.channelName,

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

        channel:
          session.channelName,

        status:
          "active",

        joined:
          true,

        hostUserId:
          session.hostUserId,

        participant:
          participant ||
          null,

        uid:
          joinResult?.result?.uid,

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[joinTrainingSession] FAILED",
      error
    );


    console.error(
      "[joinTrainingSession] Backend error",
      error?.response?.data
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.message ||
        "JOIN_TRAINING_SESSION_FAILED",

    };

  }

}

