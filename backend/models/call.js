// backend/models/call.js

import mongoose from "mongoose";


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
      // =================================================
      //
      // For Remote Training this is the Host.
      //
      // For queue calls this is the client/caller.
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
      // TARGETED RECIPIENT
      // =================================================
      //
      // null
      //   = queue call
      //
      // user id
      //   = targeted call
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
      // EMPLOYEE / PARTICIPANT WHO CLAIMED THE CALL
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
      // =================================================
      //
      // Used when status = "ringing".
      //
      // Example:
      //
      // createdAt:
      //   10:00
      //
      // invitationExpiresAt:
      //   10:05
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
      // GENERAL EXPIRY
      // =================================================
      //
      // Used when a waiting/ringing call is explicitly
      // transitioned to expired.
      //
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

callSchema.index({

  tenantId:
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
// Makes:
//
// recipientUserId + status
//
// lookups efficient for:
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
// Helps expiry queries:
//
// status = ringing
// invitationExpiresAt < now
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


export default
  mongoose.model(
    "Call",
    callSchema
  );
