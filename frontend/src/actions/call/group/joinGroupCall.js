import api from "../../../services/api";
import agoraEngine from "../../../services/agoraEngine";

export default async function joinGroupCall(
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

    // =================================================
    // APPLICATION JOIN
    // =================================================

    const { data } =
      await api.post(
        `/group-calls/${callId}/join`
      );

    const call =
      data?.call;

    const channelName =
      data?.channelName ||
      call?.channelName ||
      null;

    if (
      !call ||
      !channelName
    ) {

      return {

        ok: false,

        error:
          "GROUP_CALL_JOIN_FAILED",

      };

    }

    ctx.patch?.("call", {

      id:
        String(call._id),

      channel:
        channelName,

      type:
        "group",

      state:
        "joining",

      joined:
        false,

      participants:
        call.participants?.length || 0,

    });

    // =================================================
    // AGORA JOIN
    // =================================================

    const agoraJoined =
      await agoraEngine.joinCall({

        channel:
          channelName,

      });

    if (!agoraJoined) {

      ctx.patch?.("call", {

        state:
          "join_failed",

        joined:
          false,

      });

      return {

        ok: false,

        error:
          "AGORA_GROUP_CALL_JOIN_FAILED",

        result: {

          call,

          callId:
            String(call._id),

          channelName,

        },

      };

    }

    // =================================================
    // FINAL RUNTIME STATE
    // =================================================

    ctx.patch?.("call", {

      id:
        String(call._id),

      channel:
        channelName,

      type:
        "group",

      state:
        "joined",

      joined:
        true,

      participants:
        call.participants?.length || 0,

    });

    return {

      ok: true,

      result: {

        call,

        callId:
          String(call._id),

        channelName,

        joined:
          true,

      },

    };

  } catch (err) {

    console.error(
      "[joinGroupCall]",
      err
    );

    ctx.patch?.("call", {

      state:
        "join_failed",

      joined:
        false,

    });

    return {

      ok: false,

      error:
        err.response?.data?.error ||
        err.message ||
        "GROUP_CALL_JOIN_FAILED",

    };

  }

}