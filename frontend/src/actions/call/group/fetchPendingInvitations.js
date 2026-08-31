import api from "../../../services/api";

export default async function fetchPendingInvitations(
  ctx
) {

  try {

    const { data } =
      await api.get(
        "/group-calls/invitations"
      );

    const invitations =
      data?.invitations || [];

    ctx.patch?.("calls", {

      pendingInvitations:
        invitations,

      pendingInvitationsLoading:
        false,

      pendingInvitationsLastUpdated:
        Date.now(),

    });

    return {

      ok: true,

      result: {

        invitations,

        count:
          invitations.length,

      },

    };

  } catch (err) {

    console.error(
      "[fetchPendingInvitations]",
      err
    );

    ctx.patch?.("calls", {

      pendingInvitations: [],

      pendingInvitationsLoading:
        false,

    });

    return {

      ok: false,

      error:
        err.response?.data?.error ||
        err.message ||
        "GROUP_CALL_INVITATIONS_FETCH_FAILED",

    };

  }

}