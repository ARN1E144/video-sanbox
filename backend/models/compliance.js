import mongoose from "mongoose";


// =====================================================
// COMPLIANCE CONTROL
// =====================================================

const complianceControlSchema =
  new mongoose.Schema(
    {

      controlId: {
        type:
          String,
        required:
          true,
        trim:
          true,
      },


      name: {
        type:
          String,
        default:
          "",
        trim:
          true,
      },


      description: {
        type:
          String,
        default:
          "",
      },


      category: {
        type:
          String,
        default:
          "",
        trim:
          true,
      },


      status: {

        type:
          String,

        enum: [

          "not_started",

          "not_assessed",

          "evidence_requested",

          "review_required",

          "compliant",

          "remediation",

          "not_applicable",

        ],

        default:
          "not_started",

      },


      evidenceStatus: {

        type:
          String,

        enum: [

          "none",

          "requested",

          "processing",

          "review_required",

          "verified",

          "rejected",

        ],

        default:
          "none",

      },


      evidenceIds: {

        type:
          [
            String
          ],

        default:
          [],

      },


      evidenceVerified: {

        type:
          Boolean,

        default:
          false,

      },


      evidenceVerifiedAt: {

        type:
          Date,

        default:
          null,

      },


      lastEvidenceId: {

        type:
          String,

        default:
          null,

      },


      lastReviewedAt: {

        type:
          Date,

        default:
          null,

      },


      lastReviewedByUserId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

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
// COMPLIANCE EVIDENCE
// =====================================================

const complianceEvidenceSchema =
  new mongoose.Schema(
    {

      evidenceId: {

        type:
          String,

        required:
          true,

        trim:
          true,

      },


      controlId: {

        type:
          String,

        required:
          true,

        trim:
          true,

      },


      name: {

        type:
          String,

        default:
          "",

      },


      description: {

        type:
          String,

        default:
          "",

      },


      type: {

        type:
          String,

        enum: [

          "document",

          "image",

          "spreadsheet",

          "video",

          "other",

        ],

        default:
          "document",

      },


      source: {

        type:
          String,

        enum: [

          "request",

          "upload",

        ],

        default:
          "request",

      },


      status: {

        type:
          String,

        enum: [

          "requested",

          "processing",

          "review_required",

          "accepted",

          "rejected",

        ],

        default:
          "requested",

      },


      fileName: {

        type:
          String,

        default:
          null,

      },


      fileUrl: {

        type:
          String,

        default:
          null,

      },


      requestedFor: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        default:
          null,

      },


      dueDate: {

        type:
          Date,

        default:
          null,

      },


      // =================================================
      // AI ASSESSMENT
      // =================================================

      aiAssessment: {

        decision: {

          type:
            String,

          default:
            null,

        },

        confidence: {

          type:
            Number,

          default:
            null,

        },

        summary: {

          type:
            String,

          default:
            "",

        },

        findings: {

          type:
            [
              String
            ],

          default:
            [],

        },

        controlId: {

          type:
            String,

          default:
            null,

        },

        analysedAt: {

          type:
            Date,

          default:
            null,

        },

        model: {

          type:
            String,

          default:
            null,

        },

      },


      // =================================================
      // HUMAN REVIEW
      // =================================================

      reviewDecision: {

        type:
          String,

        enum: [

          "accepted",

          "rejected",

        ],

        default:
          null,

      },


      reviewedByUserId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        default:
          null,

      },


      /*
       * Snapshot of reviewer identity.
       *
       * This is intentionally denormalised so Data Hub can
       * display audit information without resolving the
       * current User record.
       */

      reviewedByName: {

        type:
          String,

        default:
          null,

      },


      reviewedByEmail: {

        type:
          String,

        default:
          null,

      },


      reviewedAt: {

        type:
          Date,

        default:
          null,

      },


      // =================================================
      // CREATED BY
      // =================================================

      createdByUserId: {

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
          Date.now,

      },

    },

    {
      _id:
        false,
    }

  );


// =====================================================
// REVIEW HISTORY
// =====================================================

const complianceReviewHistorySchema =
  new mongoose.Schema(
    {

      event: {

        type:
          String,

        required:
          true,

        trim:
          true,

      },


      controlId: {

        type:
          String,

        default:
          null,

      },


      evidenceId: {

        type:
          String,

        default:
          null,

      },


      userId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        default:
          null,

      },


      data: {

        type:
          mongoose.Schema.Types.Mixed,

        default:
          {},

      },


      createdAt: {

        type:
          Date,

        default:
          Date.now,

      },

    },

    {
      _id:
        false,
    }

  );


// =====================================================
// COMPLIANCE
// =====================================================

const complianceSchema =
  new mongoose.Schema(
    {

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


      organisation: {

        id: {

          type:
            String,

          default:
            null,

        },

        name: {

          type:
            String,

          default:
            "",

        },

        industry: {

          type:
            String,

          default:
            "",

        },

        ownerId: {

          type:
            mongoose.Schema.Types.ObjectId,

          ref:
            "User",

          default:
            null,

        },

      },


      framework: {

        id: {

          type:
            String,

          required:
            true,

        },

        name: {

          type:
            String,

          required:
            true,

        },

        version: {

          type:
            String,

          default:
            "",

        },

        status: {

          type:
            String,

          enum: [

            "active",

            "inactive",

          ],

          default:
            "active",

        },

        controlCount: {

          type:
            Number,

          default:
            0,

        },

      },


      controls: {

        type:
          [
            complianceControlSchema
          ],

        default:
          [],

      },


      evidence: {

        type:
          [
            complianceEvidenceSchema
          ],

        default:
          [],

      },


      reviewHistory: {

        type:
          [
            complianceReviewHistorySchema
          ],

        default:
          [],

      },


      risks: {

        type:
          [
            mongoose.Schema.Types.Mixed
          ],

        default:
          [],

      },


      actions: {

        type:
          [
            mongoose.Schema.Types.Mixed
          ],

        default:
          [],

      },


      policies: {

        type:
          [
            mongoose.Schema.Types.Mixed
          ],

        default:
          [],

      },


      suppliers: {

        type:
          [
            mongoose.Schema.Types.Mixed
          ],

        default:
          [],

      },


      training: {

        type:
          [
            mongoose.Schema.Types.Mixed
          ],

        default:
          [],

      },


      audits: {

        type:
          [
            mongoose.Schema.Types.Mixed
          ],

        default:
          [],

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

complianceSchema.index(
  {
    tenantId:
      1,

    projectId:
      1,
  },
  {
    unique:
      true,
  }
);


complianceSchema.index({
  tenantId:
    1,

  projectId:
    1,
});


complianceSchema.index({
  tenantId:
    1,

  projectId:
    1,

  "controls.controlId":
    1,
});


complianceSchema.index({
  tenantId:
    1,

  projectId:
    1,

  "evidence.evidenceId":
    1,
});


export default mongoose.model(
  "Compliance",
  complianceSchema
);