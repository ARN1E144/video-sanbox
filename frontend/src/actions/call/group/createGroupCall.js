// src/actions/call/group/createGroupCall.js

import api from "../../../services/api";


export default async function createGroupCall(
  ctx,
  params = {}
) {

  // =====================================================
  // PARTICIPANT IDs
  // =====================================================
  //
  // Priority:
  //
  // 1. Explicit action params
  // 2. Runtime selector state
  //
  // This allows both:
  //
  //   call.createGroupCall
  //
  // and:
  //
  //   call.createGroupCall({
  //     participantIds: [...]
  //   })
  //
  // =====================================================

  const parameterParticipantIds =
    Array.isArray(
      params.participantIds
    )
      ? params.participantIds
      : [];


  const runtimeParticipantIds =
    Array.isArray(
      ctx.get?.(
        "call.selectedParticipantIds"
      )
    )
      ? ctx.get(
          "call.selectedParticipantIds"
        )
      : [];


  const sourceParticipantIds =
    parameterParticipantIds.length > 0
      ? parameterParticipantIds
      : runtimeParticipantIds;


  // =====================================================
  // NORMALISE
  // =====================================================

  const participantIds =
    [
      ...new Set(

        sourceParticipantIds

          .map(
            id =>
              String(
                id
              ).trim()
          )

          .filter(Boolean)

      ),
    ];


  // =====================================================
  // VALIDATE
  // =====================================================

  if (
    participantIds.length === 0
  ) {

    console.warn(
      "[createGroupCall] No participants selected",
      {
        params,
        runtimeSelection:
          runtimeParticipantIds,
      }
    );


    return {

      ok:
        false,

      error:
        "GROUP_CALL_PARTICIPANTS_REQUIRED",

    };

  }


  // =====================================================
  // CREATE
  // =====================================================

  try {

    console.log(
      "[createGroupCall] Creating group call",
      {
        participantIds,
      }
    );


    const {
      data,
    } =
      await api.post(
        "/group-calls",
        {
          participantIds,
        }
      );


    const call =
      data?.call;


    if (
      !call
    ) {

      console.error(
        "[createGroupCall] Backend returned no call",
        {
          data,
        }
      );


      return {

        ok:
          false,

        error:
          "GROUP_CALL_CREATE_FAILED",

      };

    }


    // ===================================================
    // NORMALISE BACKEND ID
    // ===================================================

    const callId =
      call?._id
        ? String(
            call._id
          )
        : call?.id
          ? String(
              call.id
            )
          : null;


    if (
      !callId
    ) {

      console.error(
        "[createGroupCall] Missing call ID",
        {
          call,
        }
      );


      return {

        ok:
          false,

        error:
          "GROUP_CALL_ID_MISSING",

      };

    }


    // ===================================================
    // CHANNEL
    // =====================================================

    const channelName =
      call.channelName ||
      null;


    if (
      !channelName
    ) {

      console.error(
        "[createGroupCall] Missing channel name",
        {
          call,
        }
      );


      return {

        ok:
          false,

        error:
          "GROUP_CALL_CHANNEL_MISSING",

      };

    }


    // =====================================================
    // PARTICIPANT COUNT
    // =====================================================

    const participantCount =
      Array.isArray(
        call.participants
      )
        ? call.participants.length
        : participantIds.length;


    // =====================================================
    // RUNTIME STATE
    // =====================================================
    //
    // Important:
    //
    // This is the state consumed by:
    //
    // call.joinGroupCall
    //
    // and by:
    //
    // AgoraFeed
    // RemoteVideoGrid
    // GroupCallControls
    //
    // =====================================================

    ctx.patch?.(
      "call",
      {

        id:
          callId,

        channel:
          channelName,

        type:
          "group",

        state:
          call.status ||
          "ringing",

        joined:
          false,

        participants:
          participantCount,

        remoteUsers:
          {},

      }
    );


    // =====================================================
    // OPTIONAL: PRESERVE SELECTION
    // =====================================================
    //
    // Keep the selected IDs available for the current
    // runtime session.
    //
    // This is useful for diagnostics and UI state.
    //
    // =====================================================

    ctx.patch?.(
      "call",
      {

        selectedParticipantIds:
          participantIds,

      }
    );


    console.log(
      "[createGroupCall] Group call created",
      {

        callId,

        channelName,

        state:
          call.status ||
          "ringing",

        participantCount,

        participantIds,

      }
    );


    // =====================================================
    // RESULT
    // =====================================================

    return {

      ok:
        true,

      result: {

        call,

        callId,

        channelName,

        participantIds,

        participants:
          call.participants ||
          [],

      },

    };

  }
  catch (
    err
  ) {

    console.error(
      "[createGroupCall] failed",
      err
    );


    return {

      ok:
        false,

      error:
        err?.response?.data?.error ||
        err?.message ||
        "GROUP_CALL_CREATE_FAILED",

    };

  }

}