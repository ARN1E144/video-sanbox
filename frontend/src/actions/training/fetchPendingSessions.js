// src/actions/training/fetchPendingSessions.js

import api from "../../services/api";


export default async function fetchPendingSessions(
  ctx
) {

  console.log(
    "=============================================="
  );

  console.log(
    "[fetchPendingSessions] START"
  );

  console.log(
    "=============================================="
  );


  try {

    // =================================================
    // FETCH PENDING TRAINING SESSIONS
    // =================================================

    const {
      data,
    } =
      await api.get(
        "/training/sessions/pending"
      );


    const sessions =
      Array.isArray(
        data?.sessions
      )
        ? data.sessions
        : [];


    // =================================================
    // FIND FIRST PENDING SESSION
    // =================================================
    //
    // For V1 the invitation component displays the
    // first available session.
    //
    // The complete list is still stored in runtime.
    //
    // =================================================

    const pendingSession =
      sessions[0] ||
      null;


    // =================================================
    // STORE IN RUNTIME
    // =================================================

    ctx.patch?.(
      "training",
      {

        pendingSessions:
          sessions,

        pendingSession,

        hasPendingSession:
          !!pendingSession,

      }
    );


    console.log(
      "[fetchPendingSessions] RESULT",
      {

        count:
          sessions.length,

        pendingSession,

      }
    );


    // =================================================
    // SUCCESS
    // =================================================

    return {

      ok:
        true,

      result: {

        sessions,

        pendingSession,

        count:
          sessions.length,

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[fetchPendingSessions] FAILED",
      error
    );


    console.error(
      "[fetchPendingSessions] Backend error",
      error?.response?.data
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.message ||
        "FETCH_PENDING_TRAINING_SESSIONS_FAILED",

    };

  }

};
