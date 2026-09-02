import api from "../../services/api";
import agoraEngine from "../../services/agoraEngine";


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
// ACTION
// =====================================================

export default async function leaveTrainingSession(
  ctx,
  params = {}
) {

  console.log(
    "=============================================="
  );

  console.log(
    "[leaveTrainingSession] START"
  );

  console.log(
    "=============================================="
  );


  try {

    // =================================================
    // RESOLVE SESSION ID
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
        "[leaveTrainingSession] BLOCKED - no session ID"
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


    const currentCall =
      ctx.get?.(
        "call"
      ) || {};


    console.log(
      "[leaveTrainingSession] CURRENT STATE",
      {

        sessionId,

        training:
          currentTraining,

        call:
          currentCall,

      }
    );


    // =================================================
    // VERIFY HOST
    // =================================================
    //
    // Hosts must use training.endSession.
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
          "auth.user.id"
        )
      ) ||
      normaliseId(
        ctx.get?.(
          "user.id"
        )
      );


    const hostUserId =
      normaliseId(
        currentTraining?.hostUserId
      );


    if (
      currentUserId &&
      hostUserId &&
      currentUserId ===
        hostUserId
    ) {

      console.warn(
        "[leaveTrainingSession] HOST CANNOT LEAVE",
        {

          sessionId,

          currentUserId,

          hostUserId,

        }
      );


      return {

        ok:
          false,

        error:
          "TRAINING_HOST_MUST_END_SESSION",

      };

    }


    // =================================================
    // BACKEND LEAVE
    // =================================================

    console.log(
      "[leaveTrainingSession] Updating backend participant state",
      {

        sessionId,

      }
    );


    const {
      data,
    } =
      await api.post(
        `/training/sessions/${sessionId}/leave`
      );


    console.log(
      "[leaveTrainingSession] BACKEND RESPONSE",
      data
    );


    if (
      data?.ok !== true
    ) {

      return {

        ok:
          false,

        error:
          data?.error ||
          "TRAINING_LEAVE_FAILED",

        result:
          data ||
          null,

      };

    }


    // =================================================
    // LEAVE AGORA
    // =================================================
    //
    // The database state is now authoritative:
    //
    // participant = left
    //
    // Now terminate the local media connection.
    //
    // =================================================

    let agoraLeft =
      true;


    try {

      if (
        agoraEngine?.isReady ||
        agoraEngine?.client?.connectionState !==
          "DISCONNECTED"
      ) {

        console.log(
          "[leaveTrainingSession] Leaving Agora",
          {

            sessionId,

            channel:
              currentTraining?.channel ||
              currentCall?.channel ||
              null,

            uid:
              agoraEngine?.uid ||
              null,

          }
        );


        agoraLeft =
          await agoraEngine.leaveCall();

      }

    }
    catch (
      agoraError
    ) {

      agoraLeft =
        false;


      console.error(
        "[leaveTrainingSession] Agora leave failed",
        agoraError
      );

    }


    // =================================================
    // CLEAR TRAINING RUNTIME
    // =================================================

    ctx.patch?.(
      "training",
      {

        sessionId:
          null,

        channel:
          null,

        status:
          "left",

        hostUserId:
          hostUserId,

        participant:
          null,

        pendingSession:
          null,

        pendingSessions:
          [],

        hasPendingSession:
          false,

        participantIds:
          [],

        participants:
          [],

        joined:
          false,

        startedAt:
          currentTraining?.startedAt ||
          null,

        endedAt:
          currentTraining?.endedAt ||
          null,

      }
    );


    // =================================================
    // CLEAR CALL COMPATIBILITY BRIDGE
    // =================================================
    //
    // This is important because the current AgoraFeed
    // and some older components still use call.*.
    //
    // =================================================

    ctx.patch?.(
      "call",
      {

        id:
          null,

        channel:
          null,

        state:
          "left",

        joined:
          false,

        participants:
          [],

        remoteUsers:
          {},

      }
    );


    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      "=============================================="
    );

    console.log(
      "[leaveTrainingSession] SUCCESS"
    );

    console.log(
      "=============================================="
    );


    console.log(
      "[leaveTrainingSession] RESULT",
      {

        sessionId,

        backendStatus:
          data?.participant?.status ||
          "left",

        agoraLeft,

      }
    );


    return {

      ok:
        true,

      result: {

        sessionId,

        status:
          data?.participant?.status ||
          "left",

        left:
          true,

        alreadyLeft:
          data?.alreadyLeft === true,

        agoraLeft,

        channel:
          data?.session?.channelName ||
          currentTraining?.channel ||
          null,

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[leaveTrainingSession] FAILED",
      error
    );


    console.error(
      "[leaveTrainingSession] Backend error",
      error?.response?.data
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.message ||
        "LEAVE_TRAINING_SESSION_FAILED",

      result:
        error?.response?.data ||
        null,

    };

  }

}