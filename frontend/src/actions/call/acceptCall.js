// src/actions/call/acceptCall.js

import api from "../../services/api";
import joinCall from "./joinCall";


export default async function acceptCall(
  ctx,
  params = {}
) {

  // =====================================================
  // INPUT
  // =====================================================

  const {
    callId
  } = params;


  console.log(
    "================================================="
  );

  console.log(
    "[acceptCall] START"
  );

  console.log(
    "================================================="
  );


  try {

    // =====================================================
    // 1. INPUT
    // =====================================================

    console.log(
      "[acceptCall] Input params:",
      {
        params,
        callId,
      }
    );


    if (!callId) {

      console.error(
        "[acceptCall] BLOCKED - missing callId"
      );


      return {

        ok: false,

        error:
          "MISSING_CALL_ID",

      };

    }


    console.log(
      "[acceptCall] Input params:",
      {
        params,
        callId,
      }
    );


    if (!callId) {

      console.error(
        "[acceptCall] BLOCKED - missing callId"
      );


      return {

        ok: false,

        error:
          "MISSING_CALL_ID",

      };

    }


    // =====================================================
    // 2. READ CURRENT RUNTIME CALL
    // =====================================================

    const runtimeCall =
      ctx.get?.("call") || {};


    console.log(
      "[acceptCall] Runtime call BEFORE accept:",
      {
        id:
          runtimeCall.id,

        channel:
          runtimeCall.channel,

        state:
          runtimeCall.state,

        joined:
          runtimeCall.joined,

        remoteUsers:
          runtimeCall.remoteUsers,

        participants:
          runtimeCall.participants,
      }
    );


    // =====================================================
    // 3. BACKEND ACCEPT / CLAIM
    // =====================================================

    console.log(
      "[acceptCall] Sending backend accept request:",
      {
        endpoint:
          `/calls/${callId}/accept`,

        requestedCallId:
          callId,
      }
    );


    const {
      data
    } =
      await api.post(
        `/calls/${callId}/accept`
      );


    console.log(
      "[acceptCall] Backend response:",
      data
    );


    // =====================================================
    // 4. EXTRACT EXACT BACKEND CALL
    // =====================================================

    const acceptedCall =
      data?.call;


    if (!acceptedCall) {

      console.error(
        "[acceptCall] Backend returned no call"
      );


      return {

        ok: false,

        error:
          "CALL_NOT_RETURNED",

      };

    }


    const acceptedCallId =
      acceptedCall._id ||
      acceptedCall.id ||
      callId;


    const channel =
      acceptedCall.channelName ||
      acceptedCall.channel;


    console.log(
      "[acceptCall] EXACT BACKEND CALL:",
      {
        requestedCallId:
          callId,

        acceptedCallId,

        backendId:
          acceptedCall._id,

        backendChannelName:
          acceptedCall.channelName,

        backendChannel:
          acceptedCall.channel,

        resolvedChannel:
          channel,

        status:
          acceptedCall.status,

        clientUserId:
          acceptedCall.clientUserId,

        claimedByUserId:
          acceptedCall.claimedByUserId,
      }
    );


    // =====================================================
    // 5. VALIDATE CHANNEL
    // =====================================================

    if (!channel) {

      console.error(
        "[acceptCall] BLOCKED - backend call has no channel",
        {
          acceptedCall,
        }
      );


      return {

        ok: false,

        error:
          "MISSING_CHANNEL",

      };

    }


    // =====================================================
    // 6. CRITICAL CHANNEL IDENTITY LOG
    // =====================================================

    console.log(
      "================================================="
    );

    console.log(
      "[acceptCall] CHANNEL IDENTITY"
    );

    console.log(
      "================================================="
    );

    console.log(
      "[acceptCall] Requested Call ID:",
      callId
    );

    console.log(
      "[acceptCall] Accepted Call ID:",
      acceptedCallId
    );

    console.log(
      "[acceptCall] Accepted Channel:",
      channel
    );

    console.log(
      "[acceptCall] Previous Runtime Channel:",
      runtimeCall.channel
    );

    console.log(
      "[acceptCall] Same Call?",
      String(runtimeCall.id) ===
        String(acceptedCallId)
    );

    console.log(
      "[acceptCall] Same Channel?",
      runtimeCall.channel ===
        channel
    );


    // =====================================================
    // 7. STORE EXACT BACKEND CALL
    // =====================================================

    console.log(
      "[acceptCall] Writing accepted call to RuntimeState:",
      {
        id:
          acceptedCallId,

        channel,

        state:
          "accepted",

        joined:
          false,
      }
    );


    ctx.patch?.(
      "call",
      {

        id:
          acceptedCallId,

        channel,

        state:
          "accepted",

        joined:
          false,

        remoteUsers:
          {},

        participants:
          0,

        acceptedAt:
          Date.now(),

      }
    );


    // =====================================================
    // 8. VERIFY RUNTIME STATE AFTER PATCH
    // =====================================================

    const patchedCall =
      ctx.get?.("call") || {};


    console.log(
      "[acceptCall] Runtime call AFTER accept patch:",
      {
        id:
          patchedCall.id,

        channel:
          patchedCall.channel,

        state:
          patchedCall.state,

        joined:
          patchedCall.joined,
      }
    );


    // =====================================================
    // 9. JOIN EXACT BACKEND CHANNEL
    // =====================================================

    console.log(
      "================================================="
    );

    console.log(
      "[acceptCall] JOINING EXACT BACKEND CHANNEL"
    );

    console.log(
      "================================================="
    );


    console.log(
      "[acceptCall] Calling joinCall with:",
      {
        expectedCallId:
          acceptedCallId,

        expectedChannel:
          channel,

        runtimeChannel:
          patchedCall.channel,
      }
    );


    console.log(
  "================================================="
);

console.log(
  "[acceptCall] ABOUT TO CALL joinCall"
);

console.log(
  "================================================="
);

console.log({
  callId: acceptedCallId,
  channel,
  runtimeCall: ctx.get?.("call"),
});

const joinResult =
  await joinCall(ctx);

console.log(
  "[acceptCall] joinCall RETURNED:",
  joinResult
);


    // =====================================================
    // 10. JOIN RESULT
    // =====================================================

    console.log(
      "[acceptCall] joinCall RESULT:",
      joinResult
    );


    if (!joinResult?.ok) {

  console.error(
    "[acceptCall] ACCEPTED BUT AGORA JOIN FAILED",
    {
      callId:
        acceptedCallId,

      channel,

      joinResult,
    }
  );


  // =====================================================
  // RELEASE BACKEND CLAIM
  //
  // The backend accepted the call, but Agora did not
  // establish the session.
  //
  // Return the call to the waiting queue so another
  // employee can accept it.
  // =====================================================

  try {

    console.log(
      "[acceptCall] RELEASING BACKEND CLAIM",
      {
        callId:
          acceptedCallId,
      }
    );


    const {
      data:
        releaseData
    } =
      await api.post(
        `/calls/${acceptedCallId}/release`
      );


    console.log(
      "[acceptCall] BACKEND CLAIM RELEASED",
      releaseData
    );


  } catch (releaseError) {

    console.error(
      "[acceptCall] FAILED TO RELEASE BACKEND CLAIM",
      {
        callId:
          acceptedCallId,

        response:
          releaseError?.response?.data,

        status:
          releaseError?.response?.status,

        error:
          releaseError,
      }
    );


    // -------------------------------------------------
    // Important:
    //
    // Agora failed AND the backend release failed.
    //
    // We don't pretend the lifecycle is clean.
    // -------------------------------------------------

    return {

      ok:
        false,

      error:
        "ACCEPTED_BUT_JOIN_FAILED_RELEASE_FAILED",

      result: {

        callId:
          acceptedCallId,

        channel,

        joinError:
          joinResult?.error,

        releaseError:
          releaseError?.response?.data?.error ||
          releaseError?.message,

      },

    };

  }


  // =====================================================
  // RESET LOCAL RUNTIME STATE
  // =====================================================

  ctx.patch?.(
    "call",
    {

      state:
        "accepted",

      joined:
        false,

      remoteUsers:
        {},

      participants:
        0,

    }
  );


  ctx.patch?.(
    "agora",
    {

      uid:
        null,

      connected:
        false,

    }
  );


  ctx.patch?.(
    "media",
    {

      micEnabled:
        false,

      videoEnabled:
        false,

      audioPublished:
        false,

      videoPublished:
        false,

    }
  );


  return {

    ok:
      false,

    error:
      "ACCEPTED_BUT_JOIN_FAILED",

    result: {

      callId:
        acceptedCallId,

      channel,

      joinError:
        joinResult?.error,

    },

  };

}


    // =====================================================
    // 11. FINAL RUNTIME STATE
    // =====================================================

    const finalCall =
      ctx.get?.("call") || {};

    const finalAgora =
      ctx.get?.("agora") || {};


    console.log(
      "================================================="
    );

    console.log(
      "[acceptCall] FINAL RUNTIME STATE"
    );

    console.log(
      "================================================="
    );

    console.log(
      "[acceptCall] Call:",
      {
        id:
          finalCall.id,

        channel:
          finalCall.channel,

        state:
          finalCall.state,

        joined:
          finalCall.joined,

        remoteUsers:
          finalCall.remoteUsers,

        participants:
          finalCall.participants,
      }
    );


    console.log(
      "[acceptCall] Agora:",
      {
        uid:
          finalAgora.uid,

        connected:
          finalAgora.connected,
      }
    );


    // =====================================================
    // 12. SUCCESS
    // =====================================================

    console.log(
      "================================================="
    );

    console.log(
      "[acceptCall] ACCEPT + JOIN SUCCESS"
    );

    console.log(
      "================================================="
    );


    return {

      ok: true,

      result: {

        id:
          acceptedCallId,

        channel,

        state:
          "joined",

        joined:
          true,

        uid:
          joinResult.result?.uid,

      },

    };


  } catch (err) {

  console.error(
    "================================================="
  );

  console.error(
    "[acceptCall] EXCEPTION"
  );

  console.error(
    "================================================="
  );

  console.error(
    "[acceptCall] Error:",
    err
  );

  console.error(
    "[acceptCall] Response:",
    err?.response?.data
  );

  console.error(
    "[acceptCall] Status:",
    err?.response?.status
  );


  // =====================================================
  // STALE / ENDED CALL
  // =====================================================

  if (
    err?.response?.status === 409
  ) {

    console.warn(
      "[acceptCall] BLOCKED - call is no longer available",
      {
        callId,

        response:
          err?.response?.data,
      }
    );


    return {

      ok: false,

      error:
        "CALL_NOT_AVAILABLE",

      callId,

    };

  }


  return {

    ok: false,

    error:
      err?.response?.data?.error ||
      err?.message ||
      "ACCEPT_CALL_FAILED",

  };

}

}