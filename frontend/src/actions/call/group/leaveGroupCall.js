import api from "../../../services/api";
import agoraEngine from "../../../services/agoraEngine";

export default async function leaveGroupCall(
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

    const agoraLeft =
      await agoraEngine.leaveCall();

    const { data } =
      await api.post(
        `/group-calls/${callId}/leave`
      );

    const call =
      data?.call || null;

    ctx.patch?.("call", {

      joined:
        false,

      state:
        call?.status ||
        "ended",

      remoteUsers:
        {},

      participants:
        call?.participants?.length || 0,

    });

    return {

      ok:
        data?.ok !== false,

      result: {

        call,

        callId:
          String(callId),

        agoraLeft,

      },

    };

  } catch (err) {

    console.error(
      "[leaveGroupCall]",
      err
    );

    // Even if the backend request fails,
    // Agora should no longer be represented
    // as joined if we successfully left it.

    ctx.patch?.("call", {

      joined:
        false,

      remoteUsers:
        {},

    });

    return {

      ok: false,

      error:
        err.response?.data?.error ||
        err.message ||
        "GROUP_CALL_LEAVE_FAILED",

    };

  }

}