// src/actions/training/startTrainingSession.js

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


  if (
    typeof value === "object"
  ) {

    value =
      value?.id ||
      value?._id ||
      value?.sessionId ||
      null;

  }


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
// RESOLVE TRAINING SESSION ID
// =====================================================
//
// We deliberately support several equivalent locations.
//
// Primary:
//
//   training.sessionId
//
// Also inspect:
//
//   training.id
//   params.sessionId
//   params.trainingSessionId
//   params.session?.id
//
// The runtime state remains authoritative.
// These additional locations simply make the action more
// resilient to builder/runtime parameter variations.
//
// =====================================================

function resolveTrainingSessionId(
  ctx,
  params,
  currentTraining
) {

  const candidates = [

    params?.sessionId,

    params?.trainingSessionId,

    params?.session?.id,

    params?.session?._id,

    currentTraining?.sessionId,

    currentTraining?.id,

    ctx.get?.(
      "training.sessionId"
    ),

    ctx.get?.(
      "training.id"
    ),

  ];


  for (
    const candidate of
      candidates
  ) {

    const id =
      normaliseId(
        candidate
      );


    if (
      id
    ) {

      return id;

    }

  }


  return null;

}


// =====================================================
// START TRAINING SESSION
// =====================================================
//
// Lifecycle:
//
//   training.createSession
//          ↓
//   training.sessionId
//          ↓
//   training.startSession
//          ↓
//   POST /training/sessions/:id/start
//          ↓
//   training becomes active
//          ↓
//   Agora joins training.channel
//
// IMPORTANT:
//
// This action:
//
//   - starts the backend training session
//   - resolves the authoritative training channel
//   - joins Agora
//   - updates training runtime state
//   - maintains the existing call.* compatibility bridge
//
// This action does NOT:
//
//   - call call.joinCall
//   - create a group call
//   - alter ParticipantSelector state
//
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
    // READ COMPLETE TRAINING STATE FIRST
    // =================================================
    //
    // Do this before resolving the ID so we can see
    // exactly what the runtime contains at the moment
    // Start Training is pressed.
    //
    // =================================================

    const currentTraining =
      ctx.get?.(
        "training"
      ) || {};


    const directSessionId =
      ctx.get?.(
        "training.sessionId"
      );


    console.log(
    "[startTrainingSession] RUNTIME BEFORE START",
    JSON.stringify(
        currentTraining,
        null,
        2
    )
    );


    // =================================================
    // RESOLVE SESSION ID
    // =================================================

    const sessionId =
      resolveTrainingSessionId(
        ctx,
        params,
        currentTraining
      );


    console.log(
      "[startTrainingSession] RESOLVED SESSION",
      {

        sessionId,

        sourceCandidates: {

          paramSessionId:
            params?.sessionId,

          paramTrainingSessionId:
            params?.trainingSessionId,

          paramSessionIdObject:
            params?.session?.id ||
            params?.session?._id ||
            null,

          runtimeTrainingSessionId:
            currentTraining?.sessionId,

          runtimeTrainingId:
            currentTraining?.id,

          directRuntimeSessionId:
            directSessionId,

        },

      }
    );


    // =================================================
    // REQUIRE SESSION
    // =================================================

    if (
      !sessionId
    ) {

      console.warn(
        "[startTrainingSession] NO TRAINING SESSION AVAILABLE",
        {

          currentTraining,

          directSessionId,

          params,

        }
      );


      ctx.notify?.(
        "Create a training session before starting it."
      );


      return {

        ok:
          false,

        error:
          "NO_TRAINING_SESSION",

        result: {

          currentTraining,

          directSessionId,

          params,

        },

      };

    }


    // =================================================
    // CURRENT TRAINING STATUS
    // =================================================

    const currentStatus =
      currentTraining?.status ||
      null;


    console.log(
      "[startTrainingSession] CURRENT TRAINING",
      {

        sessionId,

        status:
          currentStatus,

        channel:
          currentTraining?.channel ||
          null,

        joined:
          currentTraining?.joined === true,

      }
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
    // BACKEND START
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


    // =================================================
    // EXTRACT SESSION
    // =================================================

    const session =
      data?.session ||
      null;


    if (
      !session
    ) {

      console.error(
        "[startTrainingSession] Backend returned no session",
        {

          data,

          sessionId,

        }
      );


      return {

        ok:
          false,

        error:
          "INVALID_TRAINING_START_RESPONSE",

        result:
          data ||
          null,

      };

    }


    // =================================================
    // SESSION ID
    // =================================================

    const actualSessionId =
      normaliseId(
        session?.id
      ) ||
      normaliseId(
        session?._id
      ) ||
      sessionId;


    if (
      !actualSessionId
    ) {

      console.error(
        "[startTrainingSession] Missing session ID in backend response",
        {

          session,

        }
      );


      return {

        ok:
          false,

        error:
          "INVALID_TRAINING_START_RESPONSE",

        result:
          data ||
          null,

      };

    }


    // =================================================
    // CHANNEL
    // =================================================

    const channel =
      session?.channelName
        ? String(
            session.channelName
          ).trim()
        : null;


    if (
      !channel
    ) {

      console.error(
        "[startTrainingSession] Missing training channel",
        {

          actualSessionId,

          session,

        }
      );


      return {

        ok:
          false,

        error:
          "MISSING_TRAINING_CHANNEL",

        result: {

          sessionId:
            actualSessionId,

          session,

        },

      };

    }


    // =================================================
    // BACKEND AUTHORITATIVE TRAINING STATE
    // =================================================
    //
    // Important:
    //
    // The backend has now transitioned the session to
    // active.
    //
    // We therefore update the runtime before Agora join.
    //
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
          normaliseId(
            session.hostUserId
          ) ||
          currentTraining?.hostUserId ||
          null,

        participantIds:
          Array.isArray(
            currentTraining?.participantIds
          )
            ? currentTraining.participantIds
            : [],

        participants:
          Array.isArray(
            session.participants
          )
            ? session.participants
            : (
                Array.isArray(
                  currentTraining?.participants
                )
                  ? currentTraining.participants
                  : []
              ),

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
    // DEBUG RUNTIME AFTER PATCH
    // =================================================

    console.log(
      "[startTrainingSession] TRAINING STATE AFTER BACKEND PATCH",
      {

        training:
          ctx.get?.(
            "training"
          ),

        sessionId:
          actualSessionId,

        channel,

      }
    );


    // =================================================
    // JOIN AGORA
    // =================================================
    //
    // Existing Agora lifecycle remains unchanged.
    //
    // The training action owns the application-level
    // training lifecycle.
    //
    // AgoraEngine owns the media lifecycle.
    //
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
    // AGORA JOIN FAILURE
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

          sessionId:
            actualSessionId,

          channel,

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
    // TRAINING CONNECTED
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
          normaliseId(
            session.hostUserId
          ) ||
          currentTraining?.hostUserId ||
          null,

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
    // Existing AgoraFeed/runtime components can still
    // consume call.* without making call.* the source
    // of truth for training.
    //
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

        remoteUsers:
          ctx.get?.(
            "call.remoteUsers"
          ) || {},

      }
    );


    // =================================================
    // VERIFY FINAL STATE
    // =================================================

    const finalTraining =
      ctx.get?.(
        "training"
      ) || {};


    const finalCall =
      ctx.get?.(
        "call"
      ) || {};


    console.log(
      "[startTrainingSession] FINAL TRAINING STATE",
      {

        training:
          finalTraining,

        call:
          finalCall,

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
          normaliseId(
            session.hostUserId
          ) ||
          currentTraining?.hostUserId ||
          null,

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