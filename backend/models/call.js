// backend/models/call.js

import mongoose from "mongoose";


// =====================================================
// GROUP CALL PARTICIPANT
// =====================================================
//
// One participant record per application user in a
// group-call session.
//
// Application lifecycle:
//
//   invited
//   accepted
//   declined
//   joined
//   left
//
// Agora media lifecycle is separate and remains owned by
// AgoraEngine on the client.
//
// agoraUid is intentionally stored on the participant
// record because the mapping is:
//
//   application user
//        ↓
//   group-call participant
//        ↓
//   Agora UID for THIS session
//
// The UID is therefore NOT a permanent user identity.
// A participant may receive a new Agora UID when they
// join a later call.
//
// =====================================================

const groupCallParticipantSchema =
  new mongoose.Schema(
    {

      // =================================================
      // APPLICATION USER
      // =================================================

      userId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        required:
          true,

      },


      // =================================================
      // AGORA UID
      // =====================================================
      //
      // The Agora UID used by this participant for the
      // current group-call session.
      //
      // Stored as a string so the application consistently
      // treats values such as:
      //
      //   23176
      //
      // and:
      //
      //   "23176"
      //
      // as the same identifier.
      //
      // null means the participant is not currently
      // associated with an active Agora join lifecycle.
      //
      // =================================================

      agoraUid: {

        type:
          String,

        default:
          null,

        index:
          true,

      },


      // =================================================
      // APPLICATION PARTICIPANT STATE
      // =================================================

      status: {

        type:
          String,

        enum: [

          "invited",

          "accepted",

          "declined",

          "joined",

          "left",

        ],

        default:
          "invited",

      },


      // =================================================
      // INVITATION TIMING
      // =================================================

      invitedAt: {

        type:
          Date,

        default:
          null,

      },


      acceptedAt: {

        type:
          Date,

        default:
          null,

      },


      declinedAt: {

        type:
          Date,

        default:
          null,

      },


      // =================================================
      // PARTICIPATION TIMING
      // =================================================

      joinedAt: {

        type:
          Date,

        default:
          null,

      },


      leftAt: {

        type:
          Date,

        default:
          null,

      },

    },

    {

      // Participant records are embedded inside Call and
      // do not need their own MongoDB _id.
      _id:
        false,

    }

  );


// =====================================================
// CALL
// =====================================================

const callSchema =
  new mongoose.Schema(
    {

      // =================================================
      // TENANT
      // =================================================

      tenantId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "Tenant",

        required:
          true,

        index:
          true,

      },


      // =================================================
      // CALL CREATOR
      // =====================================================
      //
      // Queue:
      //   original caller/client
      //
      // Targeted:
      //   caller/initiator
      //
      // Group:
      //   group-call host/creator
      //
      // =================================================

      clientUserId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        required:
          true,

        index:
          true,

      },


      // =================================================
      // CALL TYPE
      // =================================================
      //
      // queue
      //   One available responder claims it.
      //
      // targeted
      //   One specific recipient is invited.
      //
      // group
      //   Multiple tenant users can participate.
      //
      // =================================================

      type: {

        type:
          String,

        enum: [

          "queue",

          "targeted",

          "group",

        ],

        default:
          "queue",

        index:
          true,

      },


      // =================================================
      // TARGETED RECIPIENT
      // =====================================================
      //
      // Used by targeted calls.
      //
      // Null for queue/group calls unless a future
      // workflow deliberately needs it.
      //
      // =================================================

      recipientUserId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        default:
          null,

        index:
          true,

      },


      // =================================================
      // CLAIMED BY
      // =====================================================
      //
      // Primarily used by queue calls.
      //
      // Group participation is represented by
      // participants[].
      //
      // =================================================

      claimedByUserId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        default:
          null,

        index:
          true,

      },


      // =================================================
      // CALL STATUS
      // =================================================

      status: {

        type:
          String,

        enum: [

          "waiting",

          "ringing",

          "claimed",

          "active",

          "ended",

          "canceled",

          "expired",

        ],

        default:
          "waiting",

        index:
          true,

      },


      // =================================================
      // AGORA CHANNEL
      // =================================================

      channelName: {

        type:
          String,

        required:
          true,

        index:
          true,

      },


      // =================================================
      // GROUP PARTICIPANTS
      // =====================================================
      //
      // Used when:
      //
      //   type = "group"
      //
      // Example:
      //
      // [
      //   {
      //     userId: Bob,
      //     agoraUid: "9803",
      //     status: "joined"
      //   },
      //   {
      //     userId: Anish,
      //     agoraUid: "62111",
      //     status: "joined"
      //   },
      //   {
      //     userId: Arn144,
      //     agoraUid: "85373",
      //     status: "joined"
      //   }
      // ]
      //
      // =================================================

      participants: {

        type:
          [
            groupCallParticipantSchema
          ],

        default:
          [],

      },


      // =================================================
      // CLAIM TIMING
      // =================================================

      claimedAt: {

        type:
          Date,

        default:
          null,

      },


      // =================================================
      // TARGETED INVITATION EXPIRY
      // =====================================================
      //
      // Existing targeted-call behaviour.
      //
      // Primarily relevant when:
      //
      //   type   = targeted
      //   status = ringing
      //
      // =================================================

      invitationExpiresAt: {

        type:
          Date,

        default:
          null,

        index:
          true,

      },


      // =================================================
      // GENERAL CALL EXPIRY
      // =====================================================
      //
      // Used by group calls and future call lifecycle
      // logic.
      //
      // When expiresAt is reached the call becomes
      // expired and outstanding invitations are no longer
      // actionable.
      //
      // =================================================

      expiresAt: {

        type:
          Date,

        default:
          null,

        index:
          true,

      },


      // =================================================
      // CALL END
      // =================================================

      endedAt: {

        type:
          Date,

        default:
          null,

      },


      // =================================================
      // CALL CANCELLATION
      // =================================================

      canceledAt: {

        type:
          Date,

        default:
          null,

      },


      // =================================================
      // CALL EXPIRY
      // =================================================

      expiredAt: {

        type:
          Date,

        default:
          null,

      },

    },

    {

      timestamps:
        true,

    }

  );


// =====================================================
// GENERAL CALL INDEX
// =====================================================
//
// Common tenant-level call lookups.
//
// =====================================================

callSchema.index({

  tenantId:
    1,

  status:
    1,

  createdAt:
    -1,

});


// =====================================================
// CALL TYPE INDEX
// =====================================================
//
// Helps separate queue / targeted / group calls while
// preserving efficient recent-call lookups.
//
// =====================================================

callSchema.index({

  tenantId:
    1,

  type:
    1,

  status:
    1,

  createdAt:
    -1,

});


// =====================================================
// TARGETED INVITATION INDEX
// =====================================================
//
// Supports:
//
// GET /api/calls/pending
//
// =====================================================

callSchema.index({

  tenantId:
    1,

  recipientUserId:
    1,

  status:
    1,

  createdAt:
    -1,

});


// =====================================================
// INVITATION EXPIRY INDEX
// =====================================================
//
// Supports targeted invitation expiry operations.
//
// =====================================================

callSchema.index({

  tenantId:
    1,

  status:
    1,

  invitationExpiresAt:
    1,

});


// =====================================================
// GROUP INVITATION INDEX
// =====================================================
//
// Supports:
//
// GET /api/group-calls/invitations
//
// which searches within participants[].
//
// =====================================================

callSchema.index({

  tenantId:
    1,

  type:
    1,

  "participants.userId":
    1,

  "participants.status":
    1,

  createdAt:
    -1,

});


// =====================================================
// GROUP EXPIRY INDEX
// =====================================================
//
// Supports group-call expiry cleanup.
//
// =====================================================

callSchema.index({

  tenantId:
    1,

  type:
    1,

  status:
    1,

  expiresAt:
    1,

});


// =====================================================
// EXPORT
// =====================================================

export default mongoose.model(
  "Call",
  callSchema
);
