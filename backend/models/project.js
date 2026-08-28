// backend/models/project.js

import mongoose from "mongoose";


// =====================================================
// QUESTION SET SCHEMA
// =====================================================

const questionSetSchema =
  new mongoose.Schema(
    {

      id: {
        type: String,
        required: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      questions: {
        type: [
          {
            type: String,
            trim: true,
          },
        ],
        default: [],
      },

      source: {
        type: String,
        enum: [
          "manual",
          "ai_generated",
          "imported",
          "project_default",
        ],
        default: "manual",
      },

    },
    {
      _id: false,
    }
  );


// =====================================================
// INTERVIEW CONFIG
// =====================================================

const interviewConfigSchema =
  new mongoose.Schema(
    {

      activeQuestionSetId: {
        type: String,
        default: null,
      },

      questionSets: {
        type: [
          questionSetSchema,
        ],
        default: [],
      },

      recordingEnabled: {
        type: Boolean,
        default: true,
      },

      transcriptionEnabled: {
        type: Boolean,
        default: true,
      },

      evaluationEnabled: {
        type: Boolean,
        default: true,
      },

    },
    {
      _id: false,
    }
  );


// =====================================================
// PROJECT
// =====================================================

const ProjectSchema =
  new mongoose.Schema(
    {

      name: {
        type: String,
        required: true,
        trim: true,
      },

      type: {
        type: String,
        default: "single",
      },

      schema: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },

      backgroundConfigs: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },

      // =====================================================
      // AI INTERVIEWER CONFIGURATION
      // =====================================================

      interviewConfig: {
        activeQuestionSetId: {
          type: String,
          default: null,
        },

        questionSets: {
          type: [
            {
              id: {
                type: String,
                required: true,
              },

              name: {
                type: String,
                required: true,
                trim: true,
              },

              description: {
                type: String,
                default: "",
              },

              questions: {
                type: [String],
                default: [],
              },

              source: {
                type: String,
                enum: [
                  "manual",
                  "ai_generated",
                  "imported",
                  "project_default",
                ],
                default: "manual",
              },
            },
          ],

          default: [],
        },

        recordingEnabled: {
          type: Boolean,
          default: true,
        },

        transcriptionEnabled: {
          type: Boolean,
          default: true,
        },

        evaluationEnabled: {
          type: Boolean,
          default: true,
        },
      },

      // =================================================
      // CONFO METADATA
      // =================================================

      installedFromConfo: {
        type: String,
        default: null,
      },

      confoVersion: {
        type: String,
        default: null,
      },

      // =================================================
      // OWNER
      // =================================================

      ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

    },
    {
      timestamps: true,
    }
  );


// =====================================================
// NAME UNIQUENESS
// =====================================================

ProjectSchema.index(
  {
    ownerId: 1,
    name: 1,
  },
  {
    unique: true,
  }
);


export default mongoose.model(
  "Project",
  ProjectSchema
);