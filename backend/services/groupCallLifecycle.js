// backend/services/groupCallLifecycle.js

// =====================================================
// GROUP CALL LIFECYCLE
// =====================================================
//
// Shared application-level lifecycle logic.
//
// Used by:
//
//   HTTP /group-calls/:callId/leave
//   HTTP /group-calls/:callId/end
//   HTTP invitation expiry/reconciliation
//   WebSocket disconnect handling
//   Future server-side lifecycle operations
//
// This module owns:
//
//   - participant leave state
//   - Agora UID clearing
//   - host leave behaviour
//   - automatic call ending
//   - invitation expiry
//   - closing stale invitations
//
// It does NOT own:
//
//   - Agora media
//   - Socket.IO broadcasting
//   - HTTP responses
//
// =====================================================


// =====================================================
// CURRENT TIME
// =====================================================

function now() {

  return new Date();

}


// =====================================================
// ACTIVE PARTICIPANT
// =====================================================
//
// "accepted" is considered active at the application
// level even before Agora join has completed.
//
// "joined" is actively connected.
//
// =====================================================

function isActiveParticipant(
  participant
) {

  return [

    "accepted",

    "joined",

  ].includes(
    participant?.status
  );

}


// =====================================================
// OPEN PARTICIPANT
// =====================================================
//
// These participants are still part of the live call
// lifecycle.
//
// =====================================================

function isOpenParticipant(
  participant
) {

  return [

    "invited",

    "accepted",

    "joined",

  ].includes(
    participant?.status
  );

}


// =====================================================
// FIND PARTICIPANT
// =====================================================

export function findGroupCallParticipant(
  call,
  userId
) {

  if (
    !call ||
    userId === null ||
    userId === undefined
  ) {

    return null;

  }


  return (

    call.participants?.find(
      participant =>
        String(
          participant.userId
        ) ===
        String(
          userId
        )
    ) ||

    null

  );

}


// =====================================================
// CLOSE OUTSTANDING INVITATIONS
// =====================================================
//
// Used when a whole group call is closed.
//
// IMPORTANT:
//
// This does not remove participant records.
//
// It preserves lifecycle history while making the
// participants non-actionable.
//
// =====================================================

function closeOutstandingInvitations(
  call,
  timestamp
) {

  let closedCount =
    0;


  for (
    const participant of
      call.participants || []
  ) {

    if (
      participant.status ===
      "invited"
    ) {

      participant.status =
        "left";

      participant.leftAt =
        timestamp;

      participant.agoraUid =
        null;


      closedCount +=
        1;

    }

  }


  return closedCount;

}


// =====================================================
// CLOSE ALL OPEN PARTICIPANTS
// =====================================================
//
// Used when the entire call itself ends or expires.
//
// Both accepted and joined participants are closed.
//
// =====================================================

function closeAllOpenParticipants(
  call,
  timestamp
) {

  let closedCount =
    0;


  for (
    const participant of
      call.participants || []
  ) {

    if (
      !isOpenParticipant(
        participant
      )
    ) {

      // Existing declined / left participants are
      // already closed.
      participant.agoraUid =
        null;

      continue;

    }


    participant.status =
      "left";

    participant.leftAt =
      participant.leftAt ||
      timestamp;

    participant.agoraUid =
      null;


    closedCount +=
      1;

  }


  return closedCount;

}


// =====================================================
// MARK GROUP CALL ENDED
// =====================================================
//
// Internal single source of truth.
//
// Any route/service that ends an entire group call
// should use this function.
//
// =====================================================

function markGroupCallEnded(
  call,
  timestamp
) {

  call.status =
    "ended";

  call.endedAt =
    timestamp;

  call.invitationExpiresAt =
    null;

  call.expiresAt =
    null;

  closeOutstandingInvitations(
    call,
    timestamp
  );

}


// =====================================================
// CLOSE STALE GROUP CALL INVITATIONS
// =====================================================
//
// Public reconciliation helper.
//
// Rules:
//
//   call ended
//       -> all open participants closed
//
//   call expired
//       -> all open participants closed
//
//   invitation expiry reached
//       -> outstanding invited participants closed
//
// Existing declined/left participants are preserved.
//
// =====================================================

export function closeStaleGroupCallInvitations(
  call,
  timestamp = new Date()
) {

  if (
    !call ||
    !Array.isArray(
      call.participants
    )
  ) {

    return {

      ok:
        false,

      changed:
        false,

      closedCount:
        0,

      invitationExpired:
        false,

    };

  }


  const callClosed =
    [
      "ended",
      "expired",
      "canceled",
    ].includes(
      call.status
    );


  const invitationExpired =
    Boolean(

      call.invitationExpiresAt &&

      new Date(
        call.invitationExpiresAt
      ).getTime() <=
        timestamp.getTime()

    );


  let changed =
    false;

  let closedCount =
    0;


  // =================================================
  // CLOSED CALL
  // =================================================

  if (
    callClosed
  ) {

    const cleanup =
      closeAllOpenParticipants(
        call,
        timestamp
      );


    call.invitationExpiresAt =
      null;

    call.expiresAt =
      null;


    return {

      ok:
        true,

      changed:
        cleanup > 0,

      closedCount:
        cleanup,

      invitationExpired:
        false,

    };

  }


  // =================================================
  // INVITATION EXPIRY ONLY
  // =================================================

  if (
    invitationExpired
  ) {

    for (
      const participant of
        call.participants
    ) {

      if (
        participant.status !==
        "invited"
      ) {

        continue;

      }


      participant.status =
        "left";

      participant.leftAt =
        timestamp;

      participant.agoraUid =
        null;


      changed =
        true;

      closedCount +=
        1;

    }


    call.invitationExpiresAt =
      null;


    return {

      ok:
        true,

      changed,

      closedCount,

      invitationExpired:
        true,

    };

  }


  return {

    ok:
      true,

    changed:
      false,

    closedCount:
      0,

    invitationExpired:
      false,

  };

}


// =====================================================
// PARTICIPANT LEAVE
// =====================================================
//
// Single source of truth for normal departure and
// unexpected browser/socket departure.
//
// Rules:
//
//   host leaves
//       -> whole call ends
//
//   last active participant leaves
//       -> whole call ends
//
//   normal participant leaves while others remain
//       -> call continues
//
// =====================================================

export function applyGroupCallParticipantLeave(
  call,
  userId,
  {
    timestamp =
      now(),

    reason =
      "participant-left",

  } = {}
) {

  if (
    !call
  ) {

    return {

      ok:
        false,

      error:
        "GROUP_CALL_REQUIRED",

    };

  }


  const participant =
    findGroupCallParticipant(
      call,
      userId
    );


  if (
    !participant
  ) {

    return {

      ok:
        false,

      error:
        "GROUP_CALL_PARTICIPANT_NOT_FOUND",

    };

  }


  // =================================================
  // ALREADY CLOSED
  // =================================================

  if (
    participant.status ===
    "left"
  ) {

    const remainingActiveParticipants =
      (call.participants || [])
        .filter(
          isActiveParticipant
        );


    return {

      ok:
        true,

      alreadyLeft:
        true,

      participant,

      isHost:
        String(
          call.clientUserId
        ) ===
        String(
          userId
        ),

      callEnded:
        call.status ===
        "ended" ||
        call.status ===
        "expired",

      reason,

      remainingActiveParticipants,

      remainingActiveCount:
        remainingActiveParticipants.length,

      timestamp,

    };

  }


  // =================================================
  // DETERMINE HOST
  // =================================================

  const isHost =
    String(
      call.clientUserId
    ) ===
    String(
      userId
    );


  // =================================================
  // MARK PARTICIPANT LEFT
  // =================================================

  participant.status =
    "left";

  participant.leftAt =
    timestamp;

  participant.agoraUid =
    null;


  // =================================================
  // REMAINING ACTIVE PARTICIPANTS
  // =================================================

  const remainingActiveParticipants =
    (call.participants || [])
      .filter(
        isActiveParticipant
      );


  // =================================================
  // DETERMINE CALL END
  // =================================================

  const callEnded =
    isHost ||
    remainingActiveParticipants.length ===
      0;


  // =================================================
  // END ENTIRE CALL
  // =================================================

  let endResult =
    null;


  if (
    callEnded
  ) {

    endResult =
      markGroupCallEnded(
        call,
        timestamp
      );

  }


  // =================================================
  // RESULT
  // =================================================

  return {

    ok:
      true,

    alreadyLeft:
      false,

    participant,

    isHost,

    callEnded,

    reason,

    remainingActiveParticipants,

    remainingActiveCount:
      remainingActiveParticipants.length,

    timestamp,

    closedParticipantCount:
      endResult?.closedCount ||
      0,

  };

}


// =====================================================
// EXPLICIT END GROUP CALL
// =====================================================
//
// Shared helper for:
//
//   call.endGroupCall
//   server lifecycle operations
//   future admin termination
//
// =====================================================

export function applyGroupCallEnd(
  call,
  {
    timestamp =
      now(),

    reason =
      "call-ended",

    endedBy =
      null,

  } = {}
) {

  if (
    !call
  ) {

    return {

      ok:
        false,

      error:
        "GROUP_CALL_REQUIRED",

    };

  }


  // =================================================
  // ALREADY ENDED
  // =================================================

  if (
    call.status ===
    "ended"
  ) {

    // Make absolutely sure stale participant identities
    // cannot survive an already-ended call.

    const cleanup =
      closeAllOpenParticipants(
        call,
        timestamp
      );


    call.invitationExpiresAt =
      null;

    call.expiresAt =
      null;


    return {

      ok:
        true,

      alreadyEnded:
        true,

      callEnded:
        true,

      reason,

      endedBy,

      timestamp,

      closedParticipantCount:
        cleanup,

    };

  }


  // =================================================
  // END CALL
  // =================================================

  const result =
    markGroupCallEnded(
      call,
      timestamp
    );


  return {

    ok:
      true,

    alreadyEnded:
      false,

    callEnded:
      true,

    reason,

    endedBy,

    timestamp,

    closedParticipantCount:
      result.closedCount,

  };

}
