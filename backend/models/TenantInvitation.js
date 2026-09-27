// backend/models/TenantInvitation.js

import mongoose from "mongoose";


// =====================================================
// TENANT INVITATION SCHEMA
// =====================================================
//
// TenantInvitation is the first concrete implementation
// of the Confo invitation contract.
//
// Platform concepts:
//
//   Invitation = business object
//   Token      = transport credential
//   URL        = delivery mechanism
//   Acceptance = authorization transition
//
// This model is currently tenant-specific, but the
// invitation metadata deliberately establishes reusable
// fields that future invitation types can consume.
//
// =====================================================


const tenantInvitationSchema =
  new mongoose.Schema(
    {

      // =================================================
      // INVITATION CONTRACT
      // =================================================

      type: {
        type: String,

        enum: [
          "tenant",
        ],

        default:
          "tenant",

        required:
          true,

        index:
          true,
      },


      // =================================================
      // RESOURCE
      // =================================================
      //
      // Defines what the invitation grants access to.
      //
      // For the current implementation:
      //
      // {
      //   type: "tenant",
      //   id: tenantId
      // }
      //
      // Future invitation types can use the same contract:
      //
      // {
      //   type: "project",
      //   id: projectId
      // }
      //
      // {
      //   type: "training",
      //   id: sessionId
      // }
      //
      // etc.
      //
      // =================================================

      resource: {

        type: {
          type: String,
          required: true,
        },

        id: {
          type:
            mongoose.Schema.Types.ObjectId,

          required:
            true,
        },

      },


      // =================================================
      // TENANT
      // =================================================
      //
      // Kept as a first-class field because tenant
      // membership and authorisation are currently
      // authoritative for this invitation type.
      //
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
      // RECIPIENT
      // =================================================

      email: {

        type:
          String,

        required:
          true,

        lowercase:
          true,

        trim:
          true,

        index:
          true,

      },


      // =================================================
      // INVITER
      // =================================================

      invitedByUserId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        required:
          true,

      },


      // =================================================
      // TENANT-LEVEL ROLE
      // =================================================

      tenantRole: {

        type:
          String,

        enum: [
          "admin",
          "builder",
          "member",
        ],

        default:
          "member",

      },


      tenantPermissions: {

        canBuild: {

          type:
            Boolean,

          default:
            false,

        },

        canInvite: {

          type:
            Boolean,

          default:
            false,

        },

      },


      // =================================================
      // PROJECT-LEVEL ACCESS
      // =================================================

      projects: [

        {

          projectId: {

            type:
              mongoose.Schema.Types.ObjectId,

            ref:
              "Project",

            required:
              true,

          },


          role: {

            type:
              String,

            enum: [
              "admin",
              "editor",
              "viewer",
            ],

            default:
              "viewer",

          },


          permissions: {

            canView: {

              type:
                Boolean,

              default:
                true,

            },

            canEdit: {

              type:
                Boolean,

              default:
                false,

            },

            canRun: {

              type:
                Boolean,

              default:
                true,

            },

            canManageData: {

              type:
                Boolean,

              default:
                false,

            },

            canViewInterviews: {

              type:
                Boolean,

              default:
                false,

            },

            canViewRecordings: {

              type:
                Boolean,

              default:
                false,

            },

            canViewTranscriptions: {

              type:
                Boolean,

              default:
                false,

            },

            canViewEvaluations: {

              type:
                Boolean,

              default:
                false,

            },

            canCreateData: {

              type:
                Boolean,

              default:
                false,

            },

            canEditData: {

              type:
                Boolean,

              default:
                false,

            },

            canDeleteData: {

              type:
                Boolean,

              default:
                false,

            },

            canExportData: {

              type:
                Boolean,

              default:
                false,

            },

          },

        },

      ],


      // =================================================
      // INVITATION TOKEN
      // =================================================
      //
      // Only the hash is persisted.
      //
      // The raw token is never stored in MongoDB.
      //
      // =================================================

      tokenHash: {

        type:
          String,

        required:
          true,

        index:
          true,

      },


      // =================================================
      // EXPIRY
      // =================================================

      expiresAt: {

        type:
          Date,

        required:
          true,

        index:
          true,

      },


      // =================================================
      // LIFECYCLE STATUS
      // =================================================
      //
      // This is the authoritative invitation state.
      //
      // pending
      //   Invitation exists and may be accepted.
      //
      // accepted
      //   Invitation was successfully accepted.
      //
      // revoked
      //   Owner/admin explicitly invalidated it.
      //
      // expired
      //   Invitation passed its expiry time.
      //
      // =================================================

      status: {

        type:
          String,

        enum: [
          "pending",
          "accepted",
          "revoked",
          "expired",
        ],

        default:
          "pending",

        index:
          true,

      },


      // =================================================
      // ACCEPTANCE HISTORY
      // =================================================
      //
      // These fields describe the acceptance transition.
      // They are NOT used as the lifecycle state.
      //
      // =================================================

      acceptedAt: {

        type:
          Date,

        default:
          null,

      },


      acceptedByUserId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        default:
          null,

      },


      // =================================================
      // REVOCATION HISTORY
      // =================================================

      revokedAt: {

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
// INDEXES
// =====================================================

tenantInvitationSchema.index({

  tenantId:
    1,

  email:
    1,

  status:
    1,

});


// =====================================================
// MODEL
// =====================================================
//
// Use the existing compiled model when available.
// This avoids OverwriteModelError during development
// reloads/test environments.
// =====================================================

const TenantInvitation =
  mongoose.models.TenantInvitation ||
  mongoose.model(
    "TenantInvitation",
    tenantInvitationSchema
  );


export default TenantInvitation;