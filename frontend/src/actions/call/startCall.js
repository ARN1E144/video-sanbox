// src/actions/call/startCall.js

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

    console.log(
      "[startCall] params",
      params
    );


    // Resolve recipient from either:
    // 1. Explicit action params
    // 2. Runtime state
    //
    // Runtime state is what ParticipantSelector sets.

    const recipientId =
      params?.recipientId ||
      ctx.get?.(
        "call.recipientId"
      ) ||
      null;


    // =====================================================
    // REQUIRE RECIPIENT
    // =====================================================
    //
    // Remote Training currently requires a targeted
    // participant.
    //
    // Do not create a queue call when no participant
    // has been selected.

    if (!recipientId) {

      console.warn(
        "[startCall] BLOCKED - no recipient selected"
      );

      ctx.notify?.(
        "Select a participant before starting training."
      );

      return {

        ok:
          false,

        error:
          "MISSING_RECIPIENT",

      };

    }


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

        ok: true,

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


      if (!joinResult?.ok) {

        console.error(
          "[startCall] Existing call join failed",
          joinResult
        );


        return {

          ok: false,

          error:
            "CALL_EXISTS_BUT_JOIN_FAILED",

        };

      }


      return {

        ok: true,

        result: {

          id:
            currentCall.id,

          channel:
            currentCall.channel,

          state:
            "joined",

          joined:
            true,

        },

      };

    }


    // =====================================================
    // CREATE NEW QUEUE CALL
    // =====================================================

    console.log(
      "[startCall] Creating new queue call",
      {
        recipientId,
      }
    );


    const {
      data
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

        ok: false,

        error:
          "INVALID_CALL_RESPONSE",

      };

    }


    // =====================================================
    // STORE EXACT BACKEND CALL
    // =====================================================

    ctx.patch?.(
      "call",
      {

        id:
          call._id,

        channel:
          call.channelName,

        state:
          "ringing",

        joined:
          false,

        remoteUsers:
          {},

        participants:
          0,

        createdAt:
          Date.now(),

      }
    );


    console.log(
      "[startCall] Runtime call created",
      {
        id:
          call._id,

        channel:
          call.channelName,
      }
    );


    // =====================================================
    // JOIN EXACT CHANNEL
    // =====================================================

    console.log(
      "[startCall] Joining created channel",
      {
        callId:
          call._id,

        channel:
          call.channelName,
      }
    );


    const joinResult =
      await ctx.runAction?.(
        "call.joinCall",
        {
          channel:
            call.channelName,
        }
      );


    console.log(
      "[startCall] join result",
      joinResult
    );


    if (!joinResult?.ok) {

      console.error(
        "[startCall] Call created but join failed"
      );


      return {

        ok: false,

        error:
          "CALL_CREATED_BUT_JOIN_FAILED",

        result: {

          id:
            call._id,

          channel:
            call.channelName,

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
          call._id,

        channel:
          call.channelName,

        uid:
          joinResult?.result?.uid,

      }
    );


    return {

      ok: true,

      result: {

        id:
          call._id,

        channel:
          call.channelName,

        state:
          "joined",

        joined:
          true,

        uid:
          joinResult?.result?.uid,

      },

    };


  } catch (err) {

    console.error(
      "[startCall] FAILED",
      err
    );


    console.error(
      "[startCall] Backend error",
      err?.response?.data
    );


    return {

      ok: false,

      error:
        err?.response?.data?.error ||
        err?.message ||
        "START_CALL_FAILED",

    };

  }

}