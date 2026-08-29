// src/actions/training/createTrainingSession.js

import api from "../../services/api";


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
    // RESOLVE PARTICIPANTS
    // =================================================
    //
    // Prefer explicit action params.
    //
    // Otherwise use the runtime session selection:
    //
    // training.participantIds
    //
    // =================================================

    const rawParticipantIds =
      Array.isArray(
        params?.participantIds
      )
        ? params.participantIds
        : (
            ctx.get?.(
              "training.participantIds"
            ) || []
          );


    const participantIds = [
      ...new Set(

        rawParticipantIds

          .map(
            id =>
              String(id).trim()
          )

          .filter(Boolean)

      ),
    ];


    console.log(
      "[createTrainingSession] RESOLVED PARTICIPANTS",
      {

        participantIds,

        count:
          participantIds.length,

      }
    );


    // =================================================
    // REQUIRE PARTICIPANTS
    // =================================================

    if (
      participantIds.length ===
      0
    ) {

      console.warn(
        "[createTrainingSession] BLOCKED - no participants selected"
      );


      ctx.notify?.(
        "Select at least one participant before sending invitations."
      );


      return {

        ok:
          false,

        error:
          "NO_TRAINING_PARTICIPANTS",

      };

    }


    // =================================================
    // CHECK FOR EXISTING TRAINING SESSION
    // =================================================
    //
    // Do not silently create another session if the
    // runtime already contains an active/inviting
    // session.
    //
    // =================================================

    const currentSession =
      ctx.get?.(
        "training"
      ) || {};


    console.log(
      "[createTrainingSession] CURRENT TRAINING STATE",
      currentSession
    );


    if (
      currentSession.sessionId &&
      (
        currentSession.status ===
          "inviting" ||
        currentSession.status ===
          "active"
      )
    ) {

      console.warn(
        "[createTrainingSession] TRAINING SESSION ALREADY EXISTS",
        {

          sessionId:
            currentSession.sessionId,

          status:
            currentSession.status,

        }
      );


      return {

        ok:
          false,

        error:
          "TRAINING_SESSION_ALREADY_EXISTS",

        result: {

          sessionId:
            currentSession.sessionId,

          status:
            currentSession.status,

        },

      };

    }


    // =================================================
    // CREATE SESSION + INVITATIONS
    // =================================================
    //
    // Backend creates:
    //
    // TrainingSession
    // TrainingParticipant[]
    //
    // The session remains:
    //
    // inviting
    //
    // =================================================

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


    const session =
      data?.session;


    const participants =
      Array.isArray(
        data?.participants
      )
        ? data.participants
        : [];


    // =================================================
    // VALIDATE RESPONSE
    // =================================================

    if (
      !session?.id ||
      !session?.channelName
    ) {

      console.error(
        "[createTrainingSession] INVALID SESSION RESPONSE",
        data
      );


      return {

        ok:
          false,

        error:
          "INVALID_TRAINING_SESSION_RESPONSE",

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

        }
      );

    }


    // =================================================
    // STORE TRAINING SESSION IN RUNTIME
    // =================================================
    //
    // IMPORTANT:
    //
    // We deliberately DO NOT join Agora here.
    //
    // The session remains "inviting" until the host
    // explicitly runs:
    //
    // training.startSession
    //
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
          "inviting",

        hostUserId:
          session.hostUserId,

        participantIds,

        participants,

        joined:
          false,

        startedAt:
          null,

        endedAt:
          null,

      }
    );


    // =================================================
    // CLEAR TEMPORARY CALL STATE
    // =================================================
    //
    // We are now moving Remote Training onto the
    // training namespace.
    //
    // Keep the old call bridge untouched unless a
    // current running call needs it.
    //
    // =================================================

    console.log(
      "[createTrainingSession] TRAINING SESSION STORED",
      {

        sessionId:
          session.id,

        channel:
          session.channelName,

        status:
          session.status,

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

        sessionId:
          session.id,

        channel:
          session.channelName,

        status:
          session.status ||
          "inviting",

        hostUserId:
          session.hostUserId,

        participantIds,

        participants,

        joined:
          false,

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[createTrainingSession] FAILED",
      error
    );


    console.error(
      "[createTrainingSession] Backend error",
      error?.response?.data
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.message ||
        "CREATE_TRAINING_SESSION_FAILED",

    };

  }

}