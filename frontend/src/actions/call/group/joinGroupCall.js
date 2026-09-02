// src/actions/call/group/joinGroupCall.js

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


// =====================================================
// SYNC PARTICIPANT IDENTITIES
// =====================================================
//
// Maps:
//
// application participant
//        ↓
// Agora UID
//        ↓
// display identity
//
// into AgoraEngine's internal identity map.
//
// =====================================================

function syncParticipantIdentities(
  participants
) {

  if (
    !Array.isArray(
      participants
    )
  ) {

    return;

  }


  participants.forEach(
    participant => {

      if (
        !participant ||
        typeof participant !==
          "object"
      ) {

        return;

      }


      const participantAgoraUid =
        participant?.agoraUid !== null &&
        participant?.agoraUid !== undefined
          ? String(
              participant.agoraUid
            ).trim()
          : "";


      if (
        !participantAgoraUid
      ) {

        return;

      }


      const user =
        participant?.user &&
        typeof participant.user ===
          "object"

          ? participant.user

          : {};


      const userId =
        normaliseId(
          participant?.userId
        );


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
        "[joinGroupCall] IDENTITY MAPPING",
        {

          userId,

          agoraUid:
            participantAgoraUid,

          firstName,

          lastName,

          email,

          displayName,

        }
      );


      agoraEngine.setRemoteUserIdentity(
        participantAgoraUid,
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

}


// =====================================================
// ACTION
// =====================================================

export default async function joinGroupCall(
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

    return {

      ok:
        false,

      error:
        "GROUP_CALL_ID_REQUIRED",

    };

  }


  // ===================================================
  // GENERATE AGORA UID
  // ===================================================
  //
  // This is the UID we want this participant to use
  // for this group-call session.
  //
  // ===================================================

  const agoraUid =
    String(
      agoraEngine.generateUid()
    );


  console.log(
    "[joinGroupCall] GENERATED AGORA UID",
    {

      callId,

      agoraUid,

    }
  );


  try {

    // =================================================
    // APPLICATION JOIN
    // =================================================
    //
    // The backend:
    //
    // 1. verifies the participant
    // 2. verifies invitation acceptance
    // 3. stores participant.agoraUid
    // 4. returns the current call state
    //
    // =================================================
     
    console.log(
    "[joinGroupCall] HOST/JOIN DEBUG BEFORE API",
    {
        callId,
        agoraUid,
        runtimeCallId:
        ctx.get?.("call.id"),
        runtimeChannel:
        ctx.get?.("call.channel"),
        runtimeState:
        ctx.get?.("call.state"),
        runtimeJoined:
        ctx.get?.("call.joined"),
    }
    );
    const {
      data,
    } =
      await api.post(
        `/group-calls/${callId}/join`,
        {

          agoraUid,

        }
      );
     
    console.log(
        "[joinGroupCall] HOST/JOIN DEBUG API SUCCESS",
        {
            callId,
            requestedAgoraUid:
            agoraUid,
            backendAgoraUid:
            data?.agoraUid,
            callStatus:
            data?.call?.status,
            participant:
            data?.call?.participants?.find(
                participant =>
                String(
                    participant?.userId
                ) ===
                String(
                    ctx.get?.("auth.userId") ||
                    ""
                )
            ),
        }
        );

    const call =
      data?.call;


    const channelName =
      data?.channelName ||
      call?.channelName ||
      null;


    const returnedAgoraUid =
      data?.agoraUid !== null &&
      data?.agoraUid !== undefined
        ? String(
            data.agoraUid
          )
        : agoraUid;


    if (
      !call ||
      !channelName
    ) {

      console.error(
        "[joinGroupCall] Invalid backend join response",
        {
          data,
        }
      );


      return {

        ok:
          false,

        error:
          "GROUP_CALL_JOIN_FAILED",

      };

    }


    // =================================================
    // PARTICIPANTS
    // =================================================

    const participants =
      Array.isArray(
        call.participants
      )
        ? call.participants
        : [];


    // =================================================
    // WRITE JOINING RUNTIME STATE
    // =================================================

    ctx.patch?.(
      "call",
      {

        id:
          normaliseId(
            call._id
          ) ||
          callId,

        channel:
          channelName,

        type:
          "group",

        state:
          "joining",

        joined:
          false,

        participants,

        remoteUsers:
          ctx.get?.(
            "call.remoteUsers"
          ) || {},

      }
    );


    // =================================================
    // SYNC KNOWN PARTICIPANT IDENTITIES
    // =================================================

    syncParticipantIdentities(
      participants
    );


    // =================================================
    // AGORA JOIN
    // =================================================
    //
    // IMPORTANT:
    //
    // The exact same UID sent to the backend is passed
    // into AgoraEngine.
    //
    // The engine itself is responsible for using this
    // supplied UID rather than generating another one.
    //
    // =================================================

    const agoraJoined =
      await agoraEngine.joinCall({

        channel:
          channelName,

        uid:
          agoraUid,

      });


    // =================================================
    // AGORA JOIN FAILURE
    // =================================================

    if (
      !agoraJoined
    ) {

      ctx.patch?.(
        "call",
        {

          state:
            "join_failed",

          joined:
            false,

        }
      );


      return {

        ok:
          false,

        error:
          "AGORA_GROUP_CALL_JOIN_FAILED",

        result: {

          call,

          callId,

          channelName,

          agoraUid:
            returnedAgoraUid,

        },

      };

    }


    // =================================================
    // UID DIAGNOSTIC
    // =================================================
    //
    // We deliberately do NOT hard-fail here yet.
    //
    // Your previous working build depends on this action
    // completing successfully, so first we log the result
    // and verify the engine behaviour independently.
    //
    // =================================================

    console.log(
      "[joinGroupCall] FINAL UID STATE",
      {

        requestedAgoraUid:
          agoraUid,

        backendAgoraUid:
          returnedAgoraUid,

        engineUid:
          agoraEngine.uid,

        engineRemoteUids:
          Array.from(
            agoraEngine
              .getRemoteUsers()
              .keys()
          ),

        serverParticipantUids:
          participants
            .map(
              participant =>
                participant?.agoraUid !==
                  null &&
                participant?.agoraUid !==
                  undefined
                  ? String(
                      participant.agoraUid
                    )
                  : null
            )
            .filter(Boolean),

      }
    );


    // =================================================
    // FINAL PARTICIPANT STATE
    // =================================================

    const updatedParticipants =
      Array.isArray(
        call.participants
      )
        ? call.participants
        : participants;


    // =================================================
    // FINAL RUNTIME STATE
    // =================================================

    ctx.patch?.(
      "call",
      {

        id:
          normaliseId(
            call._id
          ) ||
          callId,

        channel:
          channelName,

        type:
          "group",

        state:
          "joined",

        joined:
          true,

        participants:
          updatedParticipants,

      }
    );


    // =================================================
    // FINAL IDENTITY SYNC
    // =================================================

    syncParticipantIdentities(
      updatedParticipants
    );


    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      "[joinGroupCall] Group call joined successfully",
      {

        callId,

        channelName,

        agoraUid:
          agoraEngine.uid,

        participantCount:
          updatedParticipants.length,

        remoteUserCount:
          agoraEngine.getRemoteUserCount(),

      }
    );


    return {

      ok:
        true,

      result: {

        call,

        callId,

        channelName,

        agoraUid:
          agoraEngine.uid,

        requestedAgoraUid:
          agoraUid,

        participants:
          updatedParticipants,

        joined:
          true,

      },

    };

  }
  catch (err) {

  console.error(
    "[joinGroupCall] FAILED",
    {
      message:
        err?.message,

      status:
        err?.response?.status,

      response:
        err?.response?.data,

      callId,

      agoraUid,

      runtimeCallId:
        ctx.get?.("call.id"),

      runtimeChannel:
        ctx.get?.("call.channel"),

      runtimeState:
        ctx.get?.("call.state"),

      runtimeJoined:
        ctx.get?.("call.joined"),

    }
  );


  ctx.patch?.(
    "call",
    {

      state:
        "join_failed",

      joined:
        false,

    }
  );


  return {

    ok:
      false,

    error:
      err?.response?.data?.error ||
      err?.message ||
      "GROUP_CALL_JOIN_FAILED",

    result: {

      status:
        err?.response?.status,

      response:
        err?.response?.data,

      callId,

      agoraUid,

    },

  };

}

}