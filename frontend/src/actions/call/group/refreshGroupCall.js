// src/actions/call/group/refreshGroupCall.js

import api from "../../../services/api";
import agoraEngine from "../../../services/agoraEngine";


// =====================================================
// HELPERS
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


  const result =
    String(
      value
    ).trim();


  return result ||
    null;

}


function normaliseAgoraUid(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  const result =
    String(
      value
    ).trim();


  return result ||
    null;

}


function buildDisplayName(
  participant
) {

  const user =
    participant?.user ||
    {};


  const explicit =
    user?.displayName ||
    participant?.displayName ||
    participant?.username ||
    null;


  if (
    explicit
  ) {

    return String(
      explicit
    ).trim();

  }


  const fullName =
    [
      user?.firstName,
      user?.lastName,
      participant?.firstName,
      participant?.lastName,
    ]
      .filter(Boolean)
      .map(
        value =>
          String(
            value
          ).trim()
      )
      .filter(Boolean)
      .join(" ")
      .trim();


  if (
    fullName
  ) {

    return fullName;

  }


  const email =
    user?.email ||
    participant?.email ||
    null;


  if (
    email
  ) {

    return String(
      email
    ).trim();

  }


  return "Participant";

}


// =====================================================
// NORMALISE PARTICIPANTS
// =====================================================

function normaliseParticipants(
  participants
) {

  if (
    !Array.isArray(
      participants
    )
  ) {

    return [];

  }


  return participants

    .map(
      participant => {

        if (
          !participant ||
          typeof participant !==
            "object"
        ) {

          return null;

        }


        const userId =
          normaliseId(
            participant.userId
          );


        const agoraUid =
          normaliseAgoraUid(
            participant.agoraUid
          );


        const user =
          participant.user &&
          typeof participant.user ===
            "object"

            ? participant.user

            : null;


        return {

          // -------------------------------------------
          // Application identity
          // -------------------------------------------

          userId,

          // -------------------------------------------
          // Agora identity
          // -------------------------------------------

          agoraUid,

          // -------------------------------------------
          // Participant lifecycle
          // -------------------------------------------

          status:
            participant.status ||
            "invited",

          invitedAt:
            participant.invitedAt ||
            null,

          acceptedAt:
            participant.acceptedAt ||
            null,

          declinedAt:
            participant.declinedAt ||
            null,

          joinedAt:
            participant.joinedAt ||
            null,

          leftAt:
            participant.leftAt ||
            null,

          // -------------------------------------------
          // Display identity
          // -------------------------------------------

          firstName:
            user?.firstName ||
            participant.firstName ||
            "",

          lastName:
            user?.lastName ||
            participant.lastName ||
            "",

          email:
            user?.email ||
            participant.email ||
            "",

          displayName:
            buildDisplayName(
              participant
            ),

          // -------------------------------------------
          // Preserve source user object
          // -------------------------------------------

          user,

        };

      }
    )

    .filter(
      Boolean
    );

}


// =====================================================
// NORMALISE SELECTION
// =====================================================
//
// Selection is temporary client-side UI state.
//
// It must survive:
//
//   - refreshGroupCall
//   - participant status updates
//   - Agora identity reconciliation
//   - websocket events
//
// =====================================================

function normaliseSelection(
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
          value =>
            normaliseId(
              value
            )
        )

        .filter(Boolean)

    ),
  ];

}


// =====================================================
// ACTION
// =====================================================

export default async function refreshGroupCall(
  ctx,
  params = {}
) {

  // ===================================================
  // CALL ID
  // ===================================================

  const callId =
    normaliseId(
      params.callId ||
      ctx.get?.(
        "call.id"
      )
    );


  if (
    !callId
  ) {

    console.warn(
      "[refreshGroupCall] Missing call ID"
    );


    return {

      ok:
        false,

      error:
        "GROUP_CALL_ID_REQUIRED",

    };

  }


  try {

    console.log(
      "[refreshGroupCall] Refreshing group call",
      {
        callId,
      }
    );


    // =================================================
    // PRESERVE LOCAL UI SELECTION
    // =================================================
    //
    // IMPORTANT:
    //
    // This state is owned by ParticipantSelector.
    //
    // Never allow a server refresh to destroy it.
    //
    // =================================================

    const selectedParticipantIds =
      normaliseSelection(
        ctx.get?.(
          "call.selectedParticipantIds"
        )
      );


    console.log(
      "[refreshGroupCall] PRESERVED SELECTION",
      {

        callId,

        selectedParticipantIds,

      }
    );


    // =================================================
    // FETCH AUTHORITATIVE SERVER STATE
    // =================================================

    const {
      data,
    } =
      await api.get(
        `/group-calls/${callId}`
      );


    const serverCall =
      data?.call;


    if (
      !serverCall
    ) {

      console.error(
        "[refreshGroupCall] Backend returned no call",
        {
          data,
        }
      );


      return {

        ok:
          false,

        error:
          "GROUP_CALL_STATE_MISSING",

      };

    }


    // =================================================
    // NORMALISE PARTICIPANTS
    // =================================================

    const participants =
      normaliseParticipants(
        serverCall.participants
      );


    // =================================================
    // CURRENT RUNTIME REMOTE USERS
    // =================================================
    //
    // AgoraEngine owns live Agora user objects.
    //
    // Never replace them with backend participant data.
    //
    // =================================================

    const existingRemoteUsers =
      ctx.get?.(
        "call.remoteUsers"
      ) || {};


    // =================================================
    // CURRENT RUNTIME CALL STATE
    // =================================================

    const currentJoined =
      ctx.get?.(
        "call.joined"
      ) === true;


    const currentChannel =
      ctx.get?.(
        "call.channel"
      ) ||
      null;


    const currentCallState =
      ctx.get?.(
        "call.state"
      ) ||
      null;


    // =================================================
    // RUNTIME CALL STATE
    // =================================================

    const runtimeCallPatch = {

      id:
        normaliseId(
          serverCall._id ||
          serverCall.id ||
          callId
        ),

      channel:
        serverCall.channelName ||
        currentChannel,

      type:
        serverCall.type ||
        "group",

      state:
        serverCall.status ||
        currentCallState ||
        "unknown",

      joined:
        currentJoined,

      participants,

      remoteUsers:
        existingRemoteUsers,

      // -------------------------------------------------
      // Preserve temporary UI selection.
      // -------------------------------------------------

      selectedParticipantIds,

      // -------------------------------------------------
      // Server lifecycle metadata.
      //
      // Group calls do not use expiresAt as a hard
      // call lifetime, but preserve whatever the server
      // actually returns.
      // -------------------------------------------------

      endedAt:
        serverCall.endedAt ||
        null,

      expiresAt:
        serverCall.expiresAt ||
        null,

      invitationExpiresAt:
        serverCall.invitationExpiresAt ||
        null,

    };


    // =================================================
    // WRITE RUNTIME STATE
    // =================================================

    ctx.patch?.(
      "call",
      runtimeCallPatch
    );


    // =================================================
    // EXPLICIT SELECTION RESTORE
    // =================================================
    //
    // This is deliberately repeated after the call
    // patch.
    //
    // It protects us even if RuntimeStateContext
    // normalisation changes how nested patches are
    // applied later.
    //
    // =================================================

    ctx.set?.(
      "call.selectedParticipantIds",
      selectedParticipantIds
    );


    // =====================================================
    // SYNCHRONISE AGORA IDENTITY MAP
    // =====================================================

    participants.forEach(
      participant => {

        const agoraUid =
          normaliseAgoraUid(
            participant?.agoraUid
          );


        const userId =
          normaliseId(
            participant?.userId
          );


        const user =
          participant?.user ||
          {};


        const firstName =
          String(
            user?.firstName ||
            participant?.firstName ||
            ""
          ).trim();


        const lastName =
          String(
            user?.lastName ||
            participant?.lastName ||
            ""
          ).trim();


        const email =
          String(
            user?.email ||
            participant?.email ||
            ""
          ).trim();


        const displayName =
          String(
            user?.displayName ||
            participant?.displayName ||
            [
              firstName,
              lastName,
            ]
              .filter(Boolean)
              .join(" ")
              .trim() ||
            email ||
            "Participant"
          ).trim();


        console.log(
          "[refreshGroupCall] IDENTITY MAPPING",
          {

            userId,

            agoraUid,

            firstName,

            lastName,

            email,

            displayName,

          }
        );


        // -----------------------------------------------
        // No Agora UID = no identity mapping yet.
        // -----------------------------------------------

        if (
          !agoraUid
        ) {

          console.log(
            "[refreshGroupCall] Participant has no Agora UID yet",
            {

              userId,

              displayName,

            }
          );


          return;

        }


        agoraEngine.setRemoteUserIdentity(
          agoraUid,
          {

            userId,

            firstName,

            lastName,

            email,

            displayName,

          }
        );

      }
    );


    // =================================================
    // REMOVE STALE AGORA IDENTITIES
    // =================================================

    const validAgoraUids =
      new Set(

        participants

          .map(
            participant =>
              normaliseAgoraUid(
                participant.agoraUid
              )
          )

          .filter(Boolean)

      );


    const liveRemoteUsers =
      agoraEngine.getRemoteUsers();


    console.log(
      "[refreshGroupCall] UID COMPARISON",
      {

        serverParticipantUids:
          participants

            .map(
              participant =>
                normaliseAgoraUid(
                  participant?.agoraUid
                )
            )

            .filter(Boolean),

        engineRemoteUids:
          Array.from(
            liveRemoteUsers.keys()
          ),

        engineRemoteUsers:
          Array.from(
            liveRemoteUsers.entries()
          )

            .map(
              ([uid, user]) => ({

                uid:
                  String(uid),

                agoraUserUid:
                  user?.uid,

                hasVideoTrack:
                  !!user?.videoTrack,

                hasAudioTrack:
                  !!user?.audioTrack,

              })
            ),

      }
    );


    liveRemoteUsers.forEach(
      (
        user,
        uid
      ) => {

        const normalisedUid =
          normaliseAgoraUid(
            uid
          );


        if (
          !normalisedUid
        ) {

          return;

        }


        if (
          !validAgoraUids.has(
            normalisedUid
          )
        ) {

          agoraEngine.clearRemoteUserIdentity(
            normalisedUid
          );

        }

      }
    );


    // =================================================
    // DEBUG
    // =================================================

    console.log(
      "[refreshGroupCall] Group call synchronised",
      {

        callId,

        status:
          serverCall.status,

        participants:
          participants.map(
            participant => ({

              userId:
                participant.userId,

              agoraUid:
                participant.agoraUid,

              displayName:
                participant.displayName,

              status:
                participant.status,

            })
          ),

        joined:
          runtimeCallPatch.joined,

        selectedParticipantIds:
          selectedParticipantIds,

      }
    );


    // =================================================
    // RESULT
    // =================================================

    return {

      ok:
        true,

      result: {

        call:
          serverCall,

        callId,

        channelName:
          serverCall.channelName ||
          null,

        status:
          serverCall.status ||
          null,

        participants,

        selectedParticipantIds,

        ended:
          serverCall.status ===
          "ended",

        expired:
          serverCall.status ===
          "expired",

      },

    };

  }
  catch (error) {

    const status =
      error?.response?.status;


    const serverError =
      error?.response?.data?.error;


    console.error(
      "[refreshGroupCall] Failed",
      {

        callId,

        status,

        error:
          serverError ||
          error?.message ||
          error,

      }
    );


    // =================================================
    // EXPLICIT LIFECYCLE RESPONSES
    // =================================================

    if (
      status ===
      404
    ) {

      return {

        ok:
          false,

        error:
          "GROUP_CALL_NOT_FOUND",

      };

    }


    if (
      status ===
      403
    ) {

      return {

        ok:
          false,

        error:
          "GROUP_CALL_ACCESS_DENIED",

      };

    }


    if (
      status ===
      409
    ) {

      return {

        ok:
          false,

        error:
          serverError ||
          "GROUP_CALL_NOT_AVAILABLE",

      };

    }


    return {

      ok:
        false,

      error:
        serverError ||
        error?.message ||
        "GROUP_CALL_REFRESH_FAILED",

    };

  }

}