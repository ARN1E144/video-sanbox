// src/actions/call/startCall.js

import api from "../../services/api";

export default async function startCall(
  ctx,
  params = {}
) {

  try {

    // =====================================================
    // EXISTING CALL CHECK
    // =====================================================

    const currentCall =
      ctx.get?.("call") || {};


    /*
    -----------------------------------------------------
    If a call already exists and we are already joined,
    do NOT create another call.

    This makes call.startCall idempotent.
    -----------------------------------------------------
    */

    if (
      currentCall.id &&
      currentCall.joined
    ) {

      console.log(
        "[startCall] Call already active",
        currentCall
      );


      return {

        ok: true,

        result: {

          id: currentCall.id,

          channel:
            currentCall.channel,

          state:
            currentCall.state || "joined"

        }

      };

    }


    /*
    -----------------------------------------------------
    If a call exists but we aren't joined, attempt to
    join the existing call instead of creating another.
    -----------------------------------------------------
    */

    if (
      currentCall.id &&
      currentCall.channel
    ) {

      console.log(
        "[startCall] Existing call found, attempting join",
        currentCall
      );


      const joinResult =
        await ctx.runAction?.(
          "call.joinCall",
          {
            channel:
              currentCall.channel
          }
        );


      if (!joinResult?.ok) {

        return {

          ok: false,

          error:
            "CALL_EXISTS_BUT_JOIN_FAILED"

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
            "joined"

        }

      };

    }


    // =====================================================
    // CREATE NEW CALL
    // =====================================================

    console.log(
      "[startCall] Creating new call"
    );


    const { data } =
      await api.post(
        "/calls",
        {
          recipientId:
            params.recipientId
        }
      );


    const call =
      data.call;


    if (!call?._id || !call?.channelName) {

      return {

        ok: false,

        error:
          "INVALID_CALL_RESPONSE"

      };

    }


    // =====================================================
    // STORE CALL IN RUNTIME STATE
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
          [],

        participants:
          [],

        createdAt:
          Date.now()

      }
    );


    console.log(
      "[startCall] Call created",
      {
        id:
          call._id,

        channel:
          call.channelName
      }
    );


    // =====================================================
    // JOIN
    // =====================================================

    const joinResult =
      await ctx.runAction?.(
        "call.joinCall",
        {
          channel:
            call.channelName
        }
      );


    if (!joinResult?.ok) {

      console.error(
        "[startCall] Call created but join failed",
        joinResult
      );


      return {

        ok: false,

        error:
          "CALL_CREATED_BUT_JOIN_FAILED"

      };

    }


    // =====================================================
    // SUCCESS
    // =====================================================

    return {

      ok: true,

      result: {

        id:
          call._id,

        channel:
          call.channelName,

        state:
          "joined"

      }

    };


  }
  catch (err) {

    console.error(
      "[startCall]",
      err
    );


    return {

      ok: false,

      error:
        err.message

    };

  }

}