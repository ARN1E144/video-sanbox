import mongoose from "mongoose";


// =====================================================
// CHAT MESSAGE
// =====================================================

const chatMessageSchema =
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

      conversationId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "ChatConversation",

        required:
          true,

        index:
          true,

      },


      // =================================================
      // SENDER
      // =================================================

      senderUserId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        required:
          true,

        index:
          true,

      },


      /*
       * Snapshot sender identity.
       *
       * Keeps historical messages readable without
       * requiring a live User lookup.
       */

      senderName: {

        type:
          String,

        default:
          "",

      },


      senderEmail: {

        type:
          String,

        default:
          "",

      },


      // =================================================
      // MESSAGE
      // =================================================

      text: {

        type:
          String,

        required:
          true,

        trim:
          true,

        maxlength:
          10000,

      },


      // =================================================
      // EDIT / DELETE
      // =================================================

      editedAt: {

        type:
          Date,

        default:
          null,

      },


      deletedAt: {

        type:
          Date,

        default:
          null,

      },


      deletedByUserId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

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
// INDEXES
// =====================================================

chatMessageSchema.index({

  tenantId:
    1,

  projectId:
    1,

  conversationId:
    1,

  createdAt:
    1,

});


chatMessageSchema.index({

  tenantId:
    1,

  projectId:
    1,

  senderUserId:
    1,

  createdAt:
    -1,

});


// =====================================================
// MODEL
// =====================================================

export default mongoose.model(
  "ChatMessage",
  chatMessageSchema
);