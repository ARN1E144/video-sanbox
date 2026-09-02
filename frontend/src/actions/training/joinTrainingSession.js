// src/actions/training/joinTrainingSession.js

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
// JOIN TRAINING SESSION
// =====================================================
//
// Responsibilities:
//
//   1. Resolve training session
//   2. Join backend training session
//   3. Store authoritative training state
//   4. Join Agora directly
//   5. Mark training connected
//
// This action does NOT rely on call.joinCall.
//
// Training owns the training lifecycle.
// AgoraEngine owns the media lifecycle.
// =====================================================

export default async function joinTrainingSession(
  ctx,
  params = {}
) {

  console.log(
    "================================================="
  );

  console.log(
    "[joinTrainingSession] START"
  );

  console.log(
    "================================================="
  );


  try {

    // =================================================
    // RESOLVE SESSION
    // =================================================

    const pendingSession =
      ctx.get?.(
        "training.pendingSession"
      ) ||
      null;


    const sessionId =
      normaliseId(
        params?.sessionId ||
        pendingSession?.id ||
        pendingSession?._id ||
        ctx.get?.(
          "training.sessionId"
        )
      );


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
        "[joinTrainingSession] No training session"
      );


      ctx.notify?.(
        "No training session is available."
      );


      return {

        ok:
          false,

        error:
          "NO_TRAINING_SESSION",

      };

    }


    // =================================================
    // RESOLVE AGORA ENGINE
    // =================================================

    const agora =
      ctx?.agora ||
      null;


    if (
      !agora
    ) {

      console.error(
        "[joinTrainingSession] Agora engine unavailable"
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
        "[joinTrainingSession] Agora joinCall unavailable"
      );


      return {

        ok:
          false,

        error:
          "AGORA_JOIN_UNAVAILABLE",

      };

    }


    // =================================================
    // JOIN BACKEND TRAINING SESSION
    // =================================================

    console.log(
      "[joinTrainingSession] Joining backend session",
      {

        sessionId,

      }
    );


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
      data?.session ||
      null;


    const participant =
      data?.participant ||
      null;


    // =================================================
    // VALIDATE BACKEND RESPONSE
    // =================================================

    if (
      !session?.id ||
      !session?.channelName
    ) {

      console.error(
        "[joinTrainingSession] Invalid backend response",
        {

          data,

        }
      );


      return {

        ok:
          false,

        error:
          "INVALID_TRAINING_JOIN_RESPONSE",

      };

    }


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
    // STORE TRAINING STATE BEFORE AGORA JOIN
    // =================================================

    ctx.patch?.(
      "training",
      {

        sessionId:
          String(
            session.id
          ),

        channel,

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
    // AGORA JOIN
    // =================================================

    console.log(
      "[joinTrainingSession] JOINING AGORA DIRECTLY",
      {

        sessionId:
          String(
            session.id
          ),

        channel,

        agoraAvailable:
          !!agora,

      }
    );


    const agoraResult =
      await agora.joinCall({

        appId:
          ctx.get?.(
            "agora.appId"
          ),

        channel,

        token:
          params?.token ||
          null,

        uid:
          params?.uid ||
          ctx.get?.(
            "user.id"
          ) ||
          null,

      });


    console.log(
      "[joinTrainingSession] AGORA JOIN RESULT",
      agoraResult
    );


    // =================================================
    // AGORA FAILED
    // =================================================

    if (
      agoraResult === null ||
      agoraResult === undefined
    ) {

      console.error(
        "[joinTrainingSession] Agora returned no result"
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
          "TRAINING_AGORA_JOIN_FAILED",

        result: {

          sessionId:
            String(
              session.id
            ),

          channel,

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
          String(
            session.id
          ),

        channel,

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
    // COMPATIBILITY BRIDGE
    // =================================================
    //
    // Keep this temporarily because AgoraFeed currently
    // understands call.* runtime state.
    //
    // IMPORTANT:
    // This is now only UI compatibility state.
    // It is no longer used to perform the Agora join.
    //
    // =================================================

    ctx.patch?.(
      "call",
      {

        id:
          String(
            session.id
          ),

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

    const uid =
      agora?.uid ||
      agoraResult?.uid ||
      null;


    console.log(
      "================================================="
    );

    console.log(
      "[joinTrainingSession] SUCCESS"
    );

    console.log(
      "================================================="
    );


    console.log(
      "[joinTrainingSession] SESSION IDENTITY",
      {

        sessionId:
          String(
            session.id
          ),

        channel,

        status:
          "active",

        joined:
          true,

        uid,

      }
    );


    return {

      ok:
        true,

      result: {

        sessionId:
          String(
            session.id
          ),

        channel,

        status:
          "active",

        joined:
          true,

        hostUserId:
          session.hostUserId,

        participant:
          participant ||
          null,

        uid,

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
        "JOIN_TRAINING_SESSION_FAILED",

      result:
        error?.response?.data ||
        null,

    };

  }

}