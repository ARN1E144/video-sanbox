// backend/models/ProjectMembership.js

import mongoose from "mongoose";

const projectMembershipSchema =
  new mongoose.Schema(
    {

      tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true,
        index: true,
      },

      projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        index: true,
      },

      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      role: {
        type: String,
        enum: [
          "owner",
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
    {
      timestamps: true,
    }
  );


// One membership per user/project.
projectMembershipSchema.index(
  {
    projectId: 1,
    userId: 1,
  },
  {
    unique: true,
  }
);


export default mongoose.model(
  "ProjectMembership",
  projectMembershipSchema
);