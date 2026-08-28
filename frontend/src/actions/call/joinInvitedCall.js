import api from "../../services/api";

export default async function joinInvitedCall(
  ctx,
  params = {}
) {

  console.log(
    "=============================================="
  );

  console.log(
    "[joinInvitedCall] START"
  );

  console.log(
    "=============================================="
  );


  try {

    const pendingInvitation =
      ctx.get?.(
        "call.pendingInvitation"
      ) || null;


    const explicitCallId =
      params?.callId ||
      null;


    const callId =
      explicitCallId ||
      pendingInvitation?._id ||
      pendingInvitation?.id ||
      null;


    console.log(
      "[joinInvitedCall] RESOLVED INVITATION",
      {

        explicitCallId,

        pendingInvitation,

        callId,

      }
    );


    if (
      !callId
    ) {

      return {

        ok:
          false,

        error:
          "NO_PENDING_INVITATION",

      };

    }


    const response =
      await api.post(
        `/calls/${callId}/join`
      );


    const joinedCall =
      response?.data?.call;


    if (
      !joinedCall
    ) {

      return {

        ok:
          false,

        error:
          "CALL_NOT_RETURNED",

      };

    }


    const channel =
      joinedCall.channelName ||
      joinedCall.channel ||
      null;


    if (
      !channel
    ) {

      return {

        ok:
          false,

        error:
          "MISSING_CHANNEL",

      };

    }


    // -----------------------------------------------
    // Store exact call identity
    // -----------------------------------------------

    ctx.patch?.(
      "call",
      {

        id:
          joinedCall._id ||
          joinedCall.id ||
          callId,

        channel,

        state:
          "active",

        joined:
          false,

        pendingInvitations:
          [],

        pendingInvitation:
          null,

        hasPendingInvitation:
          false,

      }
    );


    console.log(
      "[joinInvitedCall] CALL JOIN ACCEPTED",
      {

        callId,

        channel,

      }
    );


    // -----------------------------------------------
    // Join Agora
    // -----------------------------------------------

    const joinResult =
      await ctx.runAction?.(
        "call.joinCall"
      );


    console.log(
      "[joinInvitedCall] AGORA JOIN RESULT",
      joinResult
    );


    if (
      !joinResult?.ok
    ) {

      return {

        ok:
          false,

        error:
          "INVITATION_AGORA_JOIN_FAILED",

        result: {

          callId,

          channel,

          joinResult,

        },

      };

    }


    return {

      ok:
        true,

      result: {

        callId,

        channel,

        joined:
          true,

        uid:
          joinResult?.result?.uid,

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[joinInvitedCall] FAILED",
      error
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.message ||
        "JOIN_INVITED_CALL_FAILED",

    };

  }

}