// src/actions/call/group/inviteGroupParticipants.js

import api from "../../../services/api";


// =====================================================
// NORMALISE SINGLE ID
// =====================================================

function normaliseId(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  // ---------------------------------------------------
  // Allow selection objects as well as raw IDs.
  //
  // Examples:
  //
  // "6952..."
  // { userId: "6952..." }
  // { id: "6952..." }
  // ---------------------------------------------------

  if (
    typeof value ===
    "object"
  ) {

    value =
      value?.userId ||
      value?.id ||
      value?._id ||
      null;

  }


  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  const id =
    String(
      value
    ).trim();


  return id ||
    null;

}


// =====================================================
// NORMALISE IDS
// =====================================================

function normaliseIds(
  values
) {

  if (
    !Array.isArray(
      values
    )
  ) {

    return [];

  }


  return [
    ...new Set(

      values

        .map(
          normaliseId
        )

        .filter(Boolean)

    ),
  ];

}


// =====================================================
// READ FIRST AVAILABLE RUNTIME ARRAY
// =====================================================

function readFirstArray(
  ctx,
  paths
) {

  for (
    const path of
      paths
  ) {

    const value =
      ctx.get?.(
        path
      );


    if (
      Array.isArray(
        value
      ) &&
      value.length > 0
    ) {

      return {

        path,

        value,

      };

    }

  }


  return {

    path:
      null,

    value:
      [],

  };

}


// =====================================================
// INVITE GROUP PARTICIPANTS
// =====================================================
//
// Adds new participants or re-invites participants to
// an EXISTING group call.
//
// Resolution order:
//
//   1. params.userIds
//   2. params.participantIds
//   3. params.selectedParticipantIds
//   4. call.selectedParticipantIds
//   5. call.participantSelection
//
// Backend remains authoritative for:
//
//   - tenant membership
//   - existing participant state
//   - invited / reinvited eligibility
//   - persistence
//
// =====================================================

export default async function inviteGroupParticipants(
  ctx,
  params = {}
) {

  // ===================================================
  // CALL ID
  // ===================================================

  const rawCallId =
    params.callId ||
    ctx.get?.(
      "call.id"
    );


  const callId =
    normaliseId(
      rawCallId
    );


  if (
    !callId
  ) {

    console.warn(
      "[inviteGroupParticipants] Missing call ID"
    );


    return {

      ok:
        false,

      error:
        "GROUP_CALL_ID_REQUIRED",

    };

  }


  // ===================================================
  // CALL TYPE
  // ===================================================

  const callType =
    ctx.get?.(
      "call.type"
    );


  if (
    callType &&
    callType !==
      "group"
  ) {

    console.warn(
      "[inviteGroupParticipants] Invalid call type",
      {

        callId,

        callType,

      }
    );


    return {

      ok:
        false,

      error:
        "GROUP_CALL_REQUIRED",

    };

  }


  // ===================================================
  // EXPLICIT PARAMETER SOURCES
  // ===================================================

  const explicitUserIds =
    normaliseIds(
      params.userIds
    );


  const explicitParticipantIds =
    normaliseIds(
      params.participantIds
    );


  const explicitSelectedIds =
    normaliseIds(
      params.selectedParticipantIds
    );


  // ===================================================
  // RUNTIME SELECTION SOURCES
  // ===================================================
  //
  // ParticipantSelector should normally write to:
  //
  //   call.selectedParticipantIds
  //
  // We also support a couple of useful aliases so the
  // action remains resilient while the Confo system
  // evolves.
  //
  // ===================================================

  const runtimeSelection =
    readFirstArray(
      ctx,
      [

        "call.selectedParticipantIds",

        "call.participantSelection",

        "selectedParticipantIds",

      ]
    );


  const runtimeSelectedIds =
    normaliseIds(
      runtimeSelection.value
    );


  // ===================================================
  // RESOLVE SOURCE
  // ===================================================

  let sourceUserIds =
    [];


  let source =
    "none";


  if (
    explicitUserIds.length > 0
  ) {

    sourceUserIds =
      explicitUserIds;

    source =
      "params.userIds";

  }
  else if (
    explicitParticipantIds.length > 0
  ) {

    sourceUserIds =
      explicitParticipantIds;

    source =
      "params.participantIds";

  }
  else if (
    explicitSelectedIds.length > 0
  ) {

    sourceUserIds =
      explicitSelectedIds;

    source =
      "params.selectedParticipantIds";

  }
  else if (
    runtimeSelectedIds.length > 0
  ) {

    sourceUserIds =
      runtimeSelectedIds;

    source =
      runtimeSelection.path;

  }


  // ===================================================
  // FINAL NORMALISATION
  // ===================================================

  const userIds =
    normaliseIds(
      sourceUserIds
    );


  // ===================================================
  // DEBUG SELECTION
  // ===================================================

  console.log(
    "[inviteGroupParticipants] SELECTION RESOLUTION",
    {

      callId,

      source,

      explicitUserIds,

      explicitParticipantIds,

      explicitSelectedIds,

      runtimeSelectionPath:
        runtimeSelection.path,

      runtimeSelectedIds,

      resolvedUserIds:
        userIds,

    }
  );


  // ===================================================
  // VALIDATE PARTICIPANTS
  // ===================================================

  if (
    userIds.length ===
    0
  ) {

    console.warn(
      "[inviteGroupParticipants] No participants selected",
      {

        callId,

        source,

        runtimeSelectionPath:
          runtimeSelection.path,

      }
    );


    return {

      ok:
        false,

      error:
        "GROUP_CALL_PARTICIPANTS_REQUIRED",

      result: {

        callId,

        source,

        selectedUserIds:
          [],

      },

    };

  }


  // ===================================================
  // CURRENT USER
  // ===================================================

  const currentUserId =
    normaliseId(
      ctx.get?.(
        "auth.userId"
      )
    ) ||
    normaliseId(
      ctx.get?.(
        "user.id"
      )
    ) ||
    normaliseId(
      ctx.get?.(
        "auth.id"
      )
    ) ||
    null;


  // ===================================================
  // REMOVE CURRENT USER
  // ===================================================

  const filteredUserIds =
    currentUserId

      ? userIds.filter(
          userId =>
            String(
              userId
            ) !==
            String(
              currentUserId
            )
        )

      : userIds;


  if (
    filteredUserIds.length ===
    0
  ) {

    console.warn(
      "[inviteGroupParticipants] No invitees remain after current-user filtering",
      {

        callId,

        currentUserId,

        userIds,

      }
    );


    return {

      ok:
        false,

      error:
        "GROUP_CALL_NO_INVITEES",

      result: {

        callId,

        requestedUserIds:
          userIds,

        currentUserId,

      },

    };

  }


  // ===================================================
  // CURRENT CALL PARTICIPANTS
  // ===================================================
  //
  // Used for diagnostics only.
  //
  // The backend remains authoritative.
  //
  // ===================================================

  const existingParticipants =
    Array.isArray(
      ctx.get?.(
        "call.participants"
      )
    )
      ? ctx.get?.(
          "call.participants"
        )
      : [];


  const existingParticipantIds =
    new Set(

      existingParticipants

        .map(
          participant =>
            normaliseId(
              participant?.userId
            )
        )

        .filter(Boolean)

    );


  // ===================================================
  // CLASSIFY REQUEST
  // ===================================================

  const newInvitees =
    filteredUserIds.filter(
      userId =>
        !existingParticipantIds.has(
          String(
            userId
          )
        )
    );


  const existingInvitees =
    filteredUserIds.filter(
      userId =>
        existingParticipantIds.has(
          String(
            userId
          )
        )
    );


  // ===================================================
  // DEBUG
  // ===================================================

  console.log(
    "[inviteGroupParticipants] INVITE REQUEST",
    {

      callId,

      source,

      requestedUserIds:
        filteredUserIds,

      newInvitees,

      existingInvitees,

      existingParticipantCount:
        existingParticipants.length,

    }
  );


  try {

    // =================================================
    // API
    // =================================================

    const {
      data,
    } =
      await api.post(

        `/group-calls/${callId}/invite`,

        {

          userIds:
            filteredUserIds,

        }

      );


    // =================================================
    // RESPONSE VALIDATION
    // =================================================

    if (
      !data
    ) {

      console.error(
        "[inviteGroupParticipants] Empty backend response",
        {

          callId,

        }
      );


      return {

        ok:
          false,

        error:
          "GROUP_CALL_INVITE_FAILED",

      };

    }


    // =================================================
    // BACKEND RESULT
    // =================================================

    const returnedCall =
      data?.call ||
      null;


    const added =
      normaliseIds(
        data?.added
      );


    const reinvited =
      normaliseIds(
        data?.reinvited
      );


    const skipped =
      Array.isArray(
        data?.skipped
      )
        ? data.skipped
        : [];


    const count =
      Number.isFinite(
        Number(
          data?.count
        )
      )

        ? Number(
            data.count
          )

        : (
            added.length +
            reinvited.length
          );


    // =================================================
    // UPDATE RUNTIME
    // =================================================
    //
    // Backend response is authoritative.
    //
    // =================================================

    if (
      returnedCall
    ) {

      ctx.patch?.(
        "call",
        {

          id:
            returnedCall?._id
              ? String(
                  returnedCall._id
                )
              : callId,

          channel:
            returnedCall?.channelName ||
            ctx.get?.(
              "call.channel"
            ) ||
            null,

          type:
            returnedCall?.type ||
            "group",

          state:
            returnedCall?.status ||
            ctx.get?.(
              "call.state"
            ) ||
            "active",

          joined:
            ctx.get?.(
              "call.joined"
            ) === true,

          participants:
            Array.isArray(
              returnedCall?.participants
            )
              ? returnedCall.participants
              : existingParticipants,

        }
      );

    }


    // =================================================
    // CLEAR TEMPORARY SELECTION
    // =================================================
    //
    // Only clear the picker once the backend accepted
    // the request successfully.
    //
    // =================================================

    ctx.set?.(
      "call.selectedParticipantIds",
      []
    );


    // =================================================
    // RESULT DEBUG
    // =================================================

    console.log(
      "[inviteGroupParticipants] COMPLETE",
      {

        callId,

        requested:
          filteredUserIds,

        added,

        reinvited,

        skipped,

        count,

      }
    );


    // =================================================
    // RETURN
    // =================================================

    return {

      ok:
        true,

      result: {

        call:
          returnedCall,

        callId,

        requestedUserIds:
          filteredUserIds,

        added,

        reinvited,

        skipped,

        count,

        source,

      },

    };

  }
  catch (error) {

    // =================================================
    // API ERROR
    // =================================================

    console.error(
      "[inviteGroupParticipants] FAILED",
      {

        callId,

        source,

        userIds:
          filteredUserIds,

        status:
          error?.response?.status,

        backendError:
          error?.response?.data,

        error,

      }
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.message ||
        "GROUP_CALL_INVITE_FAILED",

      result:
        error?.response?.data ||
        null,

    };

  }

}