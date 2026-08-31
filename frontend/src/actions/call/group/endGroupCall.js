import api from "../../../services/api";
import agoraEngine from "../../../services/agoraEngine";

export default async function endGroupCall(
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

  let agoraLeft =
    false;

  try {

    // =================================================
    // AGORA CLEANUP
    // =================================================

    try {

      agoraLeft =
        await agoraEngine.leaveCall();

    } catch (agoraError) {

      console.warn(
        "[endGroupCall] Agora leave warning",
        agoraError
      );

    }

    // =================================================
    // END APPLICATION CALL
    // =================================================

    const { data } =
      await api.post(
        `/group-calls/${callId}/end`
      );

    const call =
      data?.call || null;

    ctx.patch?.("call", {

      joined:
        false,

      state:
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
      "[endGroupCall]",
      err
    );

    return {

      ok: false,

      error:
        err.response?.data?.error ||
        err.message ||
        "GROUP_CALL_END_FAILED",

    };

  }

}