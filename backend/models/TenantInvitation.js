// backend/models/TenantInvitation.js

import mongoose from "mongoose";

const tenantInvitationSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    invitedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Tenant-level role
    tenantRole: {
      type: String,
      enum: [
        "admin",
        "builder",
        "member",
      ],
      default: "member",
    },

    tenantPermissions: {
      canBuild: {
        type: Boolean,
        default: false,
      },

      canInvite: {
        type: Boolean,
        default: false,
      },
    },

    // Project-level access
    projects: [
      {
        projectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project",
          required: true,
        },

        role: {
          type: String,
          enum: [
            "admin",
            "editor",
            "viewer",
          ],
          default: "viewer",
        },

        permissions: {
          canView: {
            type: Boolean,
            default: true,
          },

          canEdit: {
            type: Boolean,
            default: false,
          },

          canRun: {
            type: Boolean,
            default: true,
          },

          canManageData: {
            type: Boolean,
            default: false,
          },

          canViewInterviews: {
            type: Boolean,
            default: false,
          },

          canViewRecordings: {
            type: Boolean,
            default: false,
          },

          canViewTranscriptions: {
            type: Boolean,
            default: false,
          },

          canViewEvaluations: {
            type: Boolean,
            default: false,
          },

          canCreateData: {
            type: Boolean,
            default: false,
          },

          canEditData: {
            type: Boolean,
            default: false,
          },

          canDeleteData: {
            type: Boolean,
            default: false,
          },

          canExportData: {
            type: Boolean,
            default: false,
          },
        },
      },
    ],

    tokenHash: {
      type: String,
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "revoked",
        "expired",
      ],
      default: "pending",
      index: true,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    acceptedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

tenantInvitationSchema.index({
  tenantId: 1,
  email: 1,
  status: 1,
});

export default mongoose.model(
  "TenantInvitation",
  tenantInvitationSchema
);