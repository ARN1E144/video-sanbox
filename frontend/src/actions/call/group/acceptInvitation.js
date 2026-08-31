import api from "../../../services/api";

export default async function acceptInvitation(
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
        `/group-calls/${callId}/accept`
      );

    const call =
      data?.call;

    if (!call) {

      return {

        ok: false,

        error:
          "GROUP_CALL_ACCEPT_FAILED",

      };

    }

    ctx.patch?.("call", {

      id:
        String(call._id),

      channel:
        call.channelName || null,

      type:
        "group",

      state:
        call.status || "active",

      // Important:
      // accepting is not the same as joining Agora.
      joined:
        false,

      participants:
        call.participants?.length || 0,

    });

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
          String(call._id),

        channelName:
          call.channelName || null,

      },

    };

  } catch (err) {

    console.error(
      "[acceptInvitation]",
      err
    );

    return {

      ok: false,

      error:
        err.response?.data?.error ||
        err.message ||
        "GROUP_CALL_ACCEPT_FAILED",

    };

  }

}