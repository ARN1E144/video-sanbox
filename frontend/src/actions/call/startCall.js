//src/actions/call/startCall.js

import api from "../../services/api";


export default async function startCall(
  ctx,
  params = {}
) {

  console.log(
    "=============================================="
  );

  console.log(
    "[startCall] START"
  );

  console.log(
    "=============================================="
  );


  try {

    // =====================================================
    // INPUT
    // =====================================================
    //
    // recipientId is OPTIONAL.
    //
    // Targeted call:
    //   recipientId supplied
    //
    // Queue call:
    //   recipientId omitted
    //
    // ParticipantSelector writes the selected recipient
    // into call.recipientId at runtime.
    // =====================================================

    console.log(
      "[startCall] params",
      params
    );


    const recipientId =
      params?.recipientId ||
      ctx.get?.(
        "call.recipientId"
      ) ||
      null;


    console.log(
      "[startCall] Resolved recipient",
      {
        recipientId,
      }
    );


    // =====================================================
    // EXISTING CALL CHECK
    // =====================================================

    const currentCall =
      ctx.get?.("call") || {};


    console.log(
      "[startCall] current runtime call",
      currentCall
    );


    // -----------------------------------------------------
    // Already joined
    // -----------------------------------------------------

    if (
      currentCall.id &&
      currentCall.joined
    ) {

      console.log(
        "[startCall] Call already active"
      );


      return {

        ok:
          true,

        result: {

          id:
            currentCall.id,

          channel:
            currentCall.channel,

          state:
            currentCall.state ||
            "joined",

          joined:
            true,

        },

      };

    }


    // -----------------------------------------------------
    // Existing call but not joined
    // -----------------------------------------------------

    if (
      currentCall.id &&
      currentCall.channel
    ) {

      console.log(
        "[startCall] Existing call found - attempting join",
        {

          id:
            currentCall.id,

          channel:
            currentCall.channel,

        }
      );


      const joinResult =
        await ctx.runAction?.(
          "call.joinCall",
          {

            channel:
              currentCall.channel,

          }
        );


      if (
        !joinResult?.ok
      ) {

        console.error(
          "[startCall] Existing call join failed",
          joinResult
        );


        return {

          ok:
            false,

          error:
            "CALL_EXISTS_BUT_JOIN_FAILED",

        };

      }


      return {

        ok:
          true,

        result: {

          id:
            currentCall.id,

          channel:
            currentCall.channel,

          state:
            "joined",

          joined:
            true,

          uid:
            joinResult?.result?.uid,

        },

      };

    }


    // =====================================================
    // CREATE CALL
    // =====================================================
    //
    // If recipientId exists:
    //
    //   backend creates targeted call
    //   status = ringing
    //
    // If recipientId is null:
    //
    //   backend creates queue call
    //   status = waiting
    //
    // startCall itself does not enforce either mode.
    // =====================================================

    console.log(
      "[startCall] Creating call",
      {

        recipientId,

        mode:
          recipientId
            ? "targeted"
            : "queue",

      }
    );


    const {
      data,
    } =
      await api.post(
        "/calls",
        {
          recipientId,
        }
      );


    console.log(
      "[startCall] Backend response",
      data
    );


    const call =
      data?.call;


    // =====================================================
    // VALIDATE RESPONSE
    // =====================================================

    if (
      !call?._id ||
      !call?.channelName
    ) {

      console.error(
        "[startCall] Invalid backend response",
        data
      );


      return {

        ok:
          false,

        error:
          "INVALID_CALL_RESPONSE",

      };

    }


    // =====================================================
    // RESOLVE BACKEND CALL VALUES
    // =====================================================

    const callId =
      call._id;


    const channel =
      call.channelName;


    const callState =
      call.status ||
      (
        call.recipientUserId
          ? "ringing"
          : "waiting"
      );


    const resolvedRecipientId =
      call.recipientUserId ||
      recipientId ||
      null;


    // =====================================================
    // STORE RUNTIME CALL
    // =====================================================

    ctx.patch?.(
      "call",
      {

        id:
          callId,

        channel,

        state:
          callState,

        joined:
          false,

        remoteUsers:
          {},

        participants:
          0,

        recipientId:
          resolvedRecipientId,

        createdAt:
          call.createdAt ||
          Date.now(),

      }
    );


    console.log(
      "[startCall] Runtime call created",
      {

        id:
          callId,

        channel,

        state:
          callState,

        recipientId:
          resolvedRecipientId,

      }
    );


    // =====================================================
    // JOIN EXACT CHANNEL
    // =====================================================
    //
    // The caller joins its own created session regardless
    // of whether the call is targeted or queue-based.
    //
    // Targeted:
    //   Host joins immediately
    //
    // Queue:
    //   Caller joins immediately while waiting for responder
    //
    // =====================================================

    console.log(
      "[startCall] Joining created channel",
      {

        callId,

        channel,

      }
    );


    const joinResult =
      await ctx.runAction?.(
        "call.joinCall",
        {

          channel,

        }
      );


    console.log(
      "[startCall] join result",
      joinResult
    );


    if (
      !joinResult?.ok
    ) {

      console.error(
        "[startCall] Call created but join failed"
      );


      return {

        ok:
          false,

        error:
          "CALL_CREATED_BUT_JOIN_FAILED",

        result: {

          id:
            callId,

          channel,

          recipientId:
            resolvedRecipientId,

        },

      };

    }


    // =====================================================
    // SUCCESS
    // =====================================================

    console.log(
      "=============================================="
    );

    console.log(
      "[startCall] SUCCESS"
    );

    console.log(
      "=============================================="
    );


    console.log(
      "[startCall] Call identity",
      {

        id:
          callId,

        channel,

        recipientId:
          resolvedRecipientId,

        uid:
          joinResult?.result?.uid,

      }
    );


    return {

      ok:
        true,

      result: {

        id:
          callId,

        channel,

        state:
          "joined",

        joined:
          true,

        recipientId:
          resolvedRecipientId,

        uid:
          joinResult?.result?.uid,

      },

    };

  }
  catch (
    err
  ) {

    console.error(
      "[startCall] FAILED",
      err
    );


    console.error(
      "[startCall] Backend error",
      err?.response?.data
    );


    return {

      ok:
        false,

      error:
        err?.response?.data?.error ||
        err?.message ||
        "START_CALL_FAILED",

    };

  }

}
