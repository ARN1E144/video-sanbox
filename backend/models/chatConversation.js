import mongoose from "mongoose";


// =====================================================
// CHAT PARTICIPANT
// =====================================================

const chatParticipantSchema =
  new mongoose.Schema(
    {

      userId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        required:
          true,

      },


      /*
       * Snapshot of the participant identity.
       *
       * This allows Chat UI to remain useful even if the
       * current User document changes later.
       */

      name: {

        type:
          String,

        default:
          "",

      },


      email: {

        type:
          String,

        default:
          "",

      },


      // =================================================
      // PARTICIPANT STATUS
      // =================================================

      status: {

        type:
          String,

        enum: [

          "invited",

          "active",

          "left",

          "declined",

        ],

        default:
          "invited",

      },


      invitedByUserId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        default:
          null,

      },


      invitedAt: {

        type:
          Date,

        default:
          Date.now,

      },


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

      _id:
        false,

    }

  );


// =====================================================
// CHAT CONVERSATION
// =====================================================

const chatConversationSchema =
  new mongoose.Schema(
    {

      // =================================================
      // SECURITY / TENANT
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
      // PROJECT
      // =================================================
      //
      // Chat is project-scoped, matching the rest of
      // Confo's runtime/data architecture.
      //
      // =================================================

      projectId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "Project",

        required:
          true,

        index:
          true,

      },


      // =================================================
      // CONVERSATION
      // =================================================

      title: {

        type:
          String,

        default:
          "",

        trim:
          true,

      },


      type: {

        type:
          String,

        enum: [

          "direct",

          "group",

        ],

        default:
          "direct",

      },


      status: {

        type:
          String,

        enum: [

          "active",

          "closed",

        ],

        default:
          "active",

        index:
          true,

      },


      // =================================================
      // CREATOR
      // =================================================

      createdByUserId: {

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
      // PARTICIPANTS
      // =================================================

      participants: {

        type:
          [
            chatParticipantSchema
          ],

        default:
          [],

      },


      // =================================================
      // LAST MESSAGE
      // =================================================
      //
      // Small denormalised snapshot for conversation-list
      // rendering without loading the whole message set.
      //
      // =================================================

      lastMessage: {

        messageId: {

          type:
            mongoose.Schema.Types.ObjectId,

          ref:
            "ChatMessage",

          default:
            null,

        },


        text: {

          type:
            String,

          default:
            "",

        },


        senderUserId: {

          type:
            mongoose.Schema.Types.ObjectId,

          ref:
            "User",

          default:
            null,

        },


        createdAt: {

          type:
            Date,

          default:
            null,

        },

      },

    },

    {

      timestamps:
        true,

    }

  );


// =====================================================
// INDEXES
// =====================================================

chatConversationSchema.index({

  tenantId:
    1,

  projectId:
    1,

  updatedAt:
    -1,

});


chatConversationSchema.index({

  tenantId:
    1,

  projectId:
    1,

  "participants.userId":
    1,

});


chatConversationSchema.index({

  tenantId:
    1,

  projectId:
    1,

  createdByUserId:
    1,

  createdAt:
    -1,

});


// =====================================================
// MODEL
// =====================================================

export default mongoose.models.ChatConversation ||
  mongoose.model(
    "ChatConversation",
    chatConversationSchema
  );
