import api from "../../services/api";


// =====================================================
// FETCH PENDING TRAINING SESSIONS
// =====================================================
//
// Authoritative invitation synchronisation.
//
// IMPORTANT:
//
//   training.pendingSessions
//   training.pendingSession
//   training.hasPendingSession
//
// represent ONLY actionable invitations.
//
// training.sessionId is NOT modified here.
//
// That value represents the current session the user
// is actually participating in.
//
// =====================================================

export default async function fetchPendingSessions(
  ctx
) {

  console.log(
    "[fetchPendingSessions] START"
  );


  try {

    // =================================================
    // FETCH FROM BACKEND
    // =================================================

    const {
      data,
    } =
      await api.get(
        "/training/sessions/pending"
      );


    // =================================================
    // NORMALISE RESPONSE
    // =================================================

    const sessions =
      Array.isArray(
        data?.sessions
      )
        ? data.sessions.filter(
            session =>
              session &&
              session.id
          )
        : [];


    // =================================================
    // FIRST ACTIONABLE INVITATION
    // =================================================
    //
    // V1 invitation UI uses the first actionable
    // invitation.
    //
    // The complete collection remains available in
    // training.pendingSessions.
    //
    // =================================================

    const pendingSession =
      sessions[0] ||
      null;


    // =================================================
    // STORE AUTHORITATIVE INVITATION STATE
    // =================================================

    ctx.patch?.(
      "training",
      {

        pendingSessions:
          sessions,

        pendingSession,

        hasPendingSession:
          sessions.length > 0,

      }
    );


    // =================================================
    // EXPLICITLY CLEAR STALE INVITATION STATE
    // =================================================
    //
    // Do NOT clear:
    //
    //   training.sessionId
    //
    // because the user may currently be in another
    // active training session.
    //
    // =================================================

    if (
      sessions.length ===
      0
    ) {

      console.log(
        "[fetchPendingSessions] No actionable training invitations",
        {

          pendingSessions:
            [],

        }
      );

    }
    else {

      console.log(
        "[fetchPendingSessions] Actionable invitations found",
        {

          count:
            sessions.length,

          pendingSessionId:
            pendingSession?.id,

          pendingStatus:
            pendingSession?.status,

        }
      );

    }


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

      result:
        error?.response?.data ||
        null,

    };

  }

}
