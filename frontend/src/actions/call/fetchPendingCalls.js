import api from "../../services/api";

export default async function fetchPendingCalls(
  ctx
) {

  console.log(
    "=============================================="
  );

  console.log(
    "[fetchPendingCalls] START"
  );

  console.log(
    "=============================================="
  );

  try {

    const response =
      await api.get(
        "/calls/pending"
      );


    const calls =
      Array.isArray(
        response?.data?.calls
      )
        ? response.data.calls
        : [];


    const pendingCall =
      calls[0] ||
      null;


    ctx.patch?.(
      "call",
      {

        pendingInvitations:
          calls,

        pendingInvitation:
          pendingCall,

        hasPendingInvitation:
          !!pendingCall,

      }
    );


    console.log(
      "[fetchPendingCalls] RESULT",
      {

        count:
          calls.length,

        pendingInvitation:
          pendingCall,

      }
    );


    return {

      ok:
        true,

      result: {

        calls,

        pendingCall,

        count:
          calls.length,

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[fetchPendingCalls] FAILED",
      error
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.message ||
        "FETCH_PENDING_CALLS_FAILED",

    };

  }

}