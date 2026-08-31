import api from "../../../services/api";

export default async function declineInvitation(
  ctx,
  params = {}
) {

  const callId =
    params.callId ||
    ctx.get?.("call.id");

  if (!callId) {

    return {

      ok: false,

      error:
        "GROUP_CALL_ID_REQUIRED",

    };

  }

  try {

    const { data } =
      await api.post(
        `/group-calls/${callId}/decline`
      );

    const call =
      data?.call;

    const invitations =
      ctx.get?.(
        "calls.pendingInvitations"
      );

    if (
      Array.isArray(invitations)
    ) {

      ctx.patch?.("calls", {

        pendingInvitations:
          invitations.filter(
            invitation =>
              String(
                invitation.callId
              ) !==
              String(callId)
          ),

      });

    }

    return {

      ok: true,

      result: {

        call,

        callId:
          String(callId),

      },

    };

  } catch (err) {

    console.error(
      "[declineInvitation]",
      err
    );

    return {

      ok: false,

      error:
        err.response?.data?.error ||
        err.message ||
        "GROUP_CALL_DECLINE_FAILED",

    };

  }

}