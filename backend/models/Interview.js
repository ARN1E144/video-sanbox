// backend/models/Interview.js

import mongoose from "mongoose";


// =====================================================
// INTERVIEW ANSWER
// =====================================================

const interviewAnswerSchema = new mongoose.Schema(
  {
    questionIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
    -----------------------------------------------------
    Snapshot of the exact question asked.

    This must never depend on the current project
    configuration because project questions may change
    after an interview has taken place.
    -----------------------------------------------------
    */

    question: {
      type: String,
      required: true,
    },

    /*
    -----------------------------------------------------
    Original candidate input.

    This can contain typed input, captured answer text,
    or the answer value collected by the runtime.
    -----------------------------------------------------
    */

    text: {
      type: String,
      default: "",
    },

    /*
    -----------------------------------------------------
    Final transcript for this answer.

    This can be populated after transcription.
    -----------------------------------------------------
    */

    transcript: {
      type: String,
      default: "",
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);


// =====================================================
// INTERVIEW SCHEMA
// =====================================================

const interviewSchema = new mongoose.Schema(
  {

    // ===================================================
    // SECURITY / PROJECT OWNERSHIP
    // ===================================================

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

    /*
    -----------------------------------------------------
    User who created/launched the interview.

    This is intentionally separate from candidateUserId.

    Example:

    HR manager
      ↓
    createdByUserId

    Candidate
      ↓
    candidateUserId
    -----------------------------------------------------
    */

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
    -----------------------------------------------------
    Authenticated candidate.

    Optional because we may support public interview
    links where the candidate does not have an account.
    -----------------------------------------------------
    */

    candidateUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },


    // ===================================================
    // CANDIDATE DETAILS
    // ===================================================

    /*
    -----------------------------------------------------
    Allows interviews to be completed by candidates
    without a platform account.

    For authenticated candidates these can still be
    populated as a snapshot.
    -----------------------------------------------------
    */

    candidate: {
      name: {
        type: String,
        default: "",
      },

      email: {
        type: String,
        default: "",
      },
    },


    // ===================================================
    // INTERVIEW LIFECYCLE
    // ===================================================

    status: {
      type: String,

      enum: [
        "active",
        "completed",
        "failed",
        "cancelled",
      ],

      default: "active",

      index: true,
    },


    // ===================================================
    // QUESTION CONFIGURATION SNAPSHOT
    // ===================================================

    /*
    -----------------------------------------------------
    Records where the questions came from.

    This is useful when the project supports both:

    - manually configured questions
    - AI-generated questions
    - project defaults
    -----------------------------------------------------
    */

    questionSource: {
      type: String,
      enum: [
        "manual",
        "ai_generated",
        "imported",
        "project_default",
      ],
      default: "project_default",
    },

    /*
    -----------------------------------------------------
    Snapshot of the questions actually used.

    IMPORTANT:

    Never regenerate these from the project schema when
    displaying a historical interview.

    This is the authoritative question set for this
    interview.
    -----------------------------------------------------
    */

    questionSetId: {
      type: String,
      default: null,
    },

    questionSetName: {
      type: String,
      default: null,
      trim: true,
    },

    questions: {
      type: [String],
      default: [],
    },


    // ===================================================
    // INTERVIEW CONFIGURATION SNAPSHOT
    // ===================================================

    /*
    -----------------------------------------------------
    These values describe what was enabled when the
    interview was created.

    Project configuration may change later, but the
    historical interview retains its original settings.
    -----------------------------------------------------
    */

    interviewConfig: {

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


    // ===================================================
    // ANSWERS
    // ===================================================

    answers: {
      type: [interviewAnswerSchema],
      default: [],
    },


    // ===================================================
    // RECORDING
    // ===================================================

    recording: {

      /*
      ---------------------------------------------------
      Browser/client recording lifecycle.

      pending
        ↓
      uploading
        ↓
      uploaded
        ↓
      processing
        ↓
      completed

      failed can occur at any stage.
      ---------------------------------------------------
      */

      status: {
        type: String,

        enum: [
          "pending",
          "uploading",
          "uploaded",
          "processing",
          "completed",
          "failed",
        ],

        default: "pending",
      },


      /*
      ---------------------------------------------------
      Storage provider.

      Kept explicit so another storage provider could be
      introduced later without changing the interview
      model.
      ---------------------------------------------------
      */

      storageProvider: {
        type: String,

        enum: [
          "s3",
        ],

        default: "s3",
      },


      /*
      ---------------------------------------------------
      Permanent S3 object key.

      Never store the temporary presigned URL here.
      ---------------------------------------------------
      */

      s3Key: {
        type: String,
        default: null,
      },


      contentType: {
        type: String,
        default: null,
      },


      originalFileName: {
        type: String,
        default: null,
      },


      sizeBytes: {
        type: Number,
        default: 0,
        min: 0,
      },


      durationSeconds: {
        type: Number,
        default: 0,
        min: 0,
      },


      recordingStartedAt: {
        type: Date,
        default: null,
      },


      recordingCompletedAt: {
        type: Date,
        default: null,
      },


      uploadedAt: {
        type: Date,
        default: null,
      },

    },


    // ===================================================
    // TRANSCRIPTION
    // ===================================================

    transcription: {

      status: {
        type: String,

        enum: [
          "pending",
          "processing",
          "completed",
          "failed",
        ],

        default: "pending",
      },


      /*
      ---------------------------------------------------
      Full transcript.

      Individual answer transcripts are also stored on
      answers[].transcript where possible.
      ---------------------------------------------------
      */

      text: {
        type: String,
        default: "",
      },


      completedAt: {
        type: Date,
        default: null,
      },

    },


    // ===================================================
    // AI EVALUATION
    // ===================================================

    aiEvaluation: {

      overallScore: {
        type: Number,
        default: null,
      },

      communicationScore: {
        type: Number,
        default: null,
      },

      problemSolvingScore: {
        type: Number,
        default: null,
      },

      technicalScore: {
        type: Number,
        default: null,
      },


      strengths: {
        type: [String],
        default: [],
      },


      weaknesses: {
        type: [String],
        default: [],
      },


      /*
      ---------------------------------------------------
      Kept as Mixed because the exact feedback structure
      may evolve as the evaluator improves.
      ---------------------------------------------------
      */

      questionFeedback: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },


      summary: {
        type: String,
        default: "",
      },

    },


    // ===================================================
    // DATES
    // ===================================================

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },


    /*
    -----------------------------------------------------
    Used for data-retention enforcement.

    This lets the platform determine when interview data
    should be deleted/anonymised later.
    -----------------------------------------------------
    */

    retentionUntil: {
      type: Date,
      default: null,
      index: true,
    },

  },

  {
    timestamps: true,
  }

);


// =====================================================
// INDEXES
// =====================================================


// -----------------------------------------------------
// Main project interview listing.
//
// GET /projects/:projectId/interviews
// -----------------------------------------------------

interviewSchema.index({
  tenantId: 1,
  projectId: 1,
  createdAt: -1,
});


// -----------------------------------------------------
// Candidate interview lookup.
// -----------------------------------------------------

interviewSchema.index({
  tenantId: 1,
  projectId: 1,
  candidateUserId: 1,
  createdAt: -1,
});


// -----------------------------------------------------
// Creator lookup.
// -----------------------------------------------------

interviewSchema.index({
  tenantId: 1,
  projectId: 1,
  createdByUserId: 1,
  createdAt: -1,
});


// -----------------------------------------------------
// Retention cleanup.
//
// Useful later for scheduled deletion jobs.
// -----------------------------------------------------

interviewSchema.index({
  retentionUntil: 1,
});


// =====================================================
// MODEL
// =====================================================

export default mongoose.model(
  "Interview",
  interviewSchema
);