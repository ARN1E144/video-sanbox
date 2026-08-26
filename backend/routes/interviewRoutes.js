
// backend/routes/interviewRoutes.js

import express from "express";
import mongoose from "mongoose";

import Interview from "../models/Interview.js";

import {
  requireAuth,
} from "../middleware/requireAuth.js";

import {
  getProjectAccess,
} from "../middleware/projectAccess.js";

import {
  createInterviewRecordingUploadUrl,
  verifyInterviewRecordingObject,
} from "../services/s3RecordingService.js";


const router =
  express.Router();


// =====================================================
// HELPERS
// =====================================================

function isValidObjectId(
  value
) {

  return mongoose.Types.ObjectId.isValid(
    value
  );

}


function getUserId(
  req
) {

  const userId =
    req.user?.userId;

  if (!userId) {
    return null;
  }

  if (
    !isValidObjectId(
      userId
    )
  ) {

    return null;

  }

  return new mongoose.Types.ObjectId(
    userId
  );

}


function getTenantId(
  req
) {

  const tenantId =
    req.user?.tenantId;

  if (!tenantId) {
    return null;
  }

  if (
    !isValidObjectId(
      tenantId
    )
  ) {

    return null;

  }

  return new mongoose.Types.ObjectId(
    tenantId
  );

}


function getProjectId(
  req
) {

  const {
    projectId,
  } =
    req.params;

  if (
    !isValidObjectId(
      projectId
    )
  ) {

    return null;

  }

  return new mongoose.Types.ObjectId(
    projectId
  );

}


async function requireInterviewProjectAccess(
  req,
  res,
  permission
) {

  const projectId =
    getProjectId(req);


  if (!projectId) {

    res
      .status(400)
      .json({
        success: false,
        error:
          "INVALID_PROJECT_ID",
        message:
          "Invalid project ID.",
      });

    return null;

  }


  const access =
    await getProjectAccess(
      req,
      projectId,
      permission
    );


  if (!access.allowed) {

    res
      .status(
        access.status ||
        403
      )
      .json({
        success: false,
        error:
          access.error ||
          "PROJECT_ACCESS_DENIED",
      });

    return null;

  }


  return {
    projectId,
    access,
  };

}

// =====================================================
// FIND PROJECT INTERVIEW
// =====================================================
//
// Ensures the interview belongs to:
//   - the authenticated tenant
//   - the requested project
//   - the requested interview ID
//
// This prevents someone with access to one project from
// attempting to upload against an interview belonging to
// another project.
// =====================================================

async function findProjectInterview(
  req,
  projectId,
  interviewId
) {

  const tenantId =
    req.user?.tenantId;

  if (
    !tenantId ||
    !mongoose.Types.ObjectId.isValid(
      tenantId
    )
  ) {

    return null;

  }

  if (
    !mongoose.Types.ObjectId.isValid(
      projectId
    )
  ) {

    return null;

  }

  if (
    !mongoose.Types.ObjectId.isValid(
      interviewId
    )
  ) {

    return null;

  }

  return (
    await Interview.findOne({
      _id:
        interviewId,

      tenantId:
        new mongoose.Types.ObjectId(
          tenantId
        ),

      projectId:
        new mongoose.Types.ObjectId(
          projectId
        ),
    })
  );

}

// =====================================================
// CREATE / START INTERVIEW
// =====================================================
//
// POST
// /api/projects/:projectId/interviews
//
// Used when a candidate starts an interview.
//
// Requires:
// canRun
//
// The question set and interview configuration are
// snapshotted into the Interview document.
// =====================================================

router.post(
  "/projects/:projectId/interviews",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const projectAccess =
        await requireInterviewProjectAccess(
          req,
          res,
          "canRun"
        );


      if (!projectAccess) {
        return;
      }


      const userId =
        getUserId(req);

      const tenantId =
        getTenantId(req);


      if (
        !userId ||
        !tenantId
      ) {

        return res
          .status(400)
          .json({

            success: false,

            error:
              "IDENTITY_REQUIRED",

            message:
              "Authenticated user and tenant are required.",

          });

      }


      const {
        questions = [],
        questionSource =
          "project_default",
        interviewConfig = {},
        candidate = {},
      } =
        req.body;


      // -------------------------------------------------
      // QUESTION VALIDATION
      // -------------------------------------------------

      if (
        !Array.isArray(
          questions
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            error:
              "INVALID_QUESTIONS",

            message:
              "Questions must be an array.",

          });

      }


      const normalizedQuestions =
        questions
          .map(
            question =>
              String(
                question
              ).trim()
          )
          .filter(
            Boolean
          );


      if (
        normalizedQuestions.length === 0
      ) {

        return res
          .status(400)
          .json({

            success: false,

            error:
              "NO_QUESTIONS",

            message:
              "At least one interview question is required.",

          });

      }


      // -------------------------------------------------
      // QUESTION SOURCE VALIDATION
      // -------------------------------------------------

      const allowedQuestionSources = [
        "custom",
        "ai_generated",
        "project_default",
      ];


      if (
        !allowedQuestionSources.includes(
          questionSource
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            error:
              "INVALID_QUESTION_SOURCE",

          });

      }


      // -------------------------------------------------
      // CREATE INTERVIEW
      // -------------------------------------------------

      const interview =
        await Interview.create({

          tenantId,

          projectId:
            projectAccess.projectId,

          createdByUserId:
            userId,

          /*
          Candidate may be anonymous in V1.
          For authenticated candidates the runtime can
          provide candidateUserId later.
          */

          candidateUserId:
            isValidObjectId(
              req.body.candidateUserId
            )
              ? new mongoose.Types.ObjectId(
                  req.body.candidateUserId
                )
              : userId,

          candidate: {

            name:
              String(
                candidate?.name ||
                ""
              ).trim(),

            email:
              String(
                candidate?.email ||
                ""
              ).trim()
              .toLowerCase(),

          },

          status:
            "active",

          questionSource,

          /*
          CRITICAL:

          Store a snapshot of the exact questions used
          by THIS interview.
          */

          questions:
            normalizedQuestions,

          interviewConfig: {

            recordingEnabled:
              interviewConfig
                ?.recordingEnabled ??
              true,

            transcriptionEnabled:
              interviewConfig
                ?.transcriptionEnabled ??
              true,

            evaluationEnabled:
              interviewConfig
                ?.evaluationEnabled ??
              true,

          },

          answers: [],

          recording: {

            status:
              interviewConfig
                ?.recordingEnabled === false
                ? "pending"
                : "pending",

          },

          transcription: {

            status:
              interviewConfig
                ?.transcriptionEnabled === false
                ? "pending"
                : "pending",

          },

          aiEvaluation: {},

          startedAt:
            new Date(),

        });


      console.log(
        "[Interviews] Created",
        {
          interviewId:
            interview._id,

          projectId:
            projectAccess.projectId,

          candidateUserId:
            interview.candidateUserId,

          questionCount:
            normalizedQuestions.length,

        }
      );


      return res
        .status(201)
        .json({

          success: true,

          interview,

        });

    }
    catch (error) {

      console.error(
        "[Interviews] POST create",
        error
      );


      return res
        .status(500)
        .json({

          success: false,

          error:
            "INTERVIEW_CREATE_FAILED",

          message:
            "Failed to create interview.",

        });

    }

  }
);


// =====================================================
// LIST PROJECT INTERVIEWS
// =====================================================
//
// GET
// /api/projects/:projectId/interviews
//
// Requires:
// canViewInterviews
//
// Used by owner/admin review UI.
// =====================================================

router.get(
  "/projects/:projectId/interviews",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const projectAccess =
        await requireInterviewProjectAccess(
          req,
          res,
          "canViewInterviews"
        );


      if (!projectAccess) {
        return;
      }


      const tenantId =
        getTenantId(req);


      if (!tenantId) {

        return res
          .status(400)
          .json({

            success: false,

            error:
              "TENANT_REQUIRED",

          });

      }


      const interviews =
        await Interview
          .find({

            tenantId,

            projectId:
              projectAccess.projectId,

          })

          .sort({
            createdAt:
              -1,
          })

          .lean();


      return res
        .status(200)
        .json({

          success: true,

          interviews,

        });

    }
    catch (error) {

      console.error(
        "[Interviews] GET list",
        error
      );


      return res
        .status(500)
        .json({

          success: false,

          error:
            "INTERVIEW_LIST_FAILED",

        });

    }

  }
);


// =====================================================
// GET SINGLE INTERVIEW
// =====================================================
//
// GET
// /api/projects/:projectId/interviews/:interviewId
//
// Requires:
// canViewInterviews
// =====================================================

router.get(
  "/projects/:projectId/interviews/:interviewId",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const projectAccess =
        await requireInterviewProjectAccess(
          req,
          res,
          "canViewInterviews"
        );


      if (!projectAccess) {
        return;
      }


      const {
        interviewId,
      } =
        req.params;


      if (
        !isValidObjectId(
          interviewId
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            error:
              "INVALID_INTERVIEW_ID",

          });

      }


      const tenantId =
        getTenantId(req);


      const interview =
        await Interview
          .findOne({

            _id:
              interviewId,

            tenantId,

            projectId:
              projectAccess.projectId,

          })

          .lean();


      if (!interview) {

        return res
          .status(404)
          .json({

            success: false,

            error:
              "INTERVIEW_NOT_FOUND",

          });

      }


      return res
        .status(200)
        .json({

          success: true,

          interview,

        });

    }
    catch (error) {

      console.error(
        "[Interviews] GET single",
        error
      );


      return res
        .status(500)
        .json({

          success: false,

          error:
            "INTERVIEW_GET_FAILED",

        });

    }

  }
);


// =====================================================
// SUBMIT ANSWER
// =====================================================
//
// PATCH
// /api/projects/:projectId/interviews/:interviewId/answers/:questionIndex
//
// Requires:
// canRun
//
// Runtime submitAnswer will use this route.
//
// =====================================================

router.patch(
  "/projects/:projectId/interviews/:interviewId/answers/:questionIndex",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const projectAccess =
        await requireInterviewProjectAccess(
          req,
          res,
          "canRun"
        );


      if (!projectAccess) {
        return;
      }


      const {
        interviewId,
        questionIndex,
      } =
        req.params;


      if (
        !isValidObjectId(
          interviewId
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            error:
              "INVALID_INTERVIEW_ID",

          });

      }


      const index =
        Number(
          questionIndex
        );


      if (
        !Number.isInteger(index) ||
        index < 0
      ) {

        return res
          .status(400)
          .json({

            success: false,

            error:
              "INVALID_QUESTION_INDEX",

          });

      }


      const tenantId =
        getTenantId(req);


      const interview =
        await Interview.findOne({

          _id:
            interviewId,

          tenantId,

          projectId:
            projectAccess.projectId,

        });


      if (!interview) {

        return res
          .status(404)
          .json({

            success: false,

            error:
              "INTERVIEW_NOT_FOUND",

          });

      }


      if (
        interview.status !==
        "active"
      ) {

        return res
          .status(409)
          .json({

            success: false,

            error:
              "INTERVIEW_NOT_ACTIVE",

          });

      }


      const question =
        interview.questions?.[
          index
        ];


      if (!question) {

        return res
          .status(400)
          .json({

            success: false,

            error:
              "QUESTION_NOT_FOUND",

          });

      }


      const {
        text = "",
        transcript = "",
        startedAt = null,
        completedAt = null,
      } =
        req.body;


      const normalizedText =
        String(
          text
        );


      const normalizedTranscript =
        String(
          transcript
        );


      const answer = {

        questionIndex:
          index,

        question,

        text:
          normalizedText,

        transcript:
          normalizedTranscript,

        startedAt:
          startedAt
            ? new Date(
                startedAt
              )
            : null,

        completedAt:
          completedAt
            ? new Date(
                completedAt
              )
            : new Date(),

      };


      /*
      ---------------------------------------------------
      Replace an existing answer for the same question,
      otherwise append it.
      ---------------------------------------------------
      */

      const existingIndex =
        interview.answers.findIndex(
          existing =>
            existing.questionIndex ===
            index
        );


      if (
        existingIndex >= 0
      ) {

        interview.answers[
          existingIndex
        ] =
          answer;

      }
      else {

        interview.answers.push(
          answer
        );

      }


      await interview.save();


      console.log(
        "[Interviews] Answer saved",
        {
          interviewId,
          questionIndex:
            index,
        }
      );


      return res
        .status(200)
        .json({

          success: true,

          answer,

          interview,

        });

    }
    catch (error) {

      console.error(
        "[Interviews] PATCH answer",
        error
      );


      return res
        .status(500)
        .json({

          success: false,

          error:
            "INTERVIEW_ANSWER_SAVE_FAILED",

        });

    }

  }
);


// =====================================================
// COMPLETE INTERVIEW
// =====================================================
//
// POST
// /api/projects/:projectId/interviews/:interviewId/complete
//
// Requires:
// canRun
//
// This marks the interview lifecycle as completed.
// Recording/transcription/evaluation can continue
// processing independently.
// =====================================================

router.post(
  "/projects/:projectId/interviews/:interviewId/complete",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const projectAccess =
        await requireInterviewProjectAccess(
          req,
          res,
          "canRun"
        );


      if (!projectAccess) {
        return;
      }


      const {
        interviewId,
      } =
        req.params;


      if (
        !isValidObjectId(
          interviewId
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            error:
              "INVALID_INTERVIEW_ID",

          });

      }


      const tenantId =
        getTenantId(req);


      const interview =
        await Interview.findOne({

          _id:
            interviewId,

          tenantId,

          projectId:
            projectAccess.projectId,

        });


      if (!interview) {

        return res
          .status(404)
          .json({

            success: false,

            error:
              "INTERVIEW_NOT_FOUND",

          });

      }


      if (
        interview.status ===
        "completed"
      ) {

        return res
          .status(200)
          .json({

            success: true,

            interview,

            alreadyCompleted:
              true,

          });

      }


      if (
        interview.status !==
        "active"
      ) {

        return res
          .status(409)
          .json({

            success: false,

            error:
              "INTERVIEW_NOT_ACTIVE",

          });

      }


      interview.status =
        "completed";

      interview.completedAt =
        new Date();


      await interview.save();


      console.log(
        "[Interviews] Completed",
        {
          interviewId,
          projectId:
            projectAccess.projectId,
        }
      );


      return res
        .status(200)
        .json({

          success: true,

          interview,

        });

    }
    catch (error) {

      console.error(
        "[Interviews] POST complete",
        error
      );


      return res
        .status(500)
        .json({

          success: false,

          error:
            "INTERVIEW_COMPLETE_FAILED",

        });

    }

  }
);

// =====================================================
// CREATE RECORDING UPLOAD URL
// =====================================================
//
// POST
// /projects/:projectId/interviews/:interviewId/recording/upload-url
//
// Permission:
// canRun
//
// The backend generates the S3 key.
// The client never supplies an arbitrary S3 key.
// =====================================================

router.post(
  "/projects/:projectId/interviews/:interviewId/recording/upload-url",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const {
        projectId,
        interviewId,
      } = req.params;


      // =================================================
      // PROJECT ACCESS
      // =================================================

      const access =
        await getProjectAccess(
          req,
          projectId,
          "canRun"
        );


      if (
        !access.allowed
      ) {

        return res.status(
          access.status ||
          403
        ).json({

          success:
            false,

          error:
            access.error ||
            "PROJECT_ACCESS_DENIED",

        });

      }


      // =================================================
      // FIND INTERVIEW
      // =================================================

      const interview =
        await findProjectInterview(
          req,
          projectId,
          interviewId
        );


      if (
        !interview
      ) {

        return res.status(
          404
        ).json({

          success:
            false,

          error:
            "INTERVIEW_NOT_FOUND",

        });

      }


      // =================================================
      // VALIDATE INTERVIEW STATUS
      // =================================================

      if (
        interview.status !==
        "active"
      ) {

        return res.status(
          409
        ).json({

          success:
            false,

          error:
            "INTERVIEW_NOT_ACTIVE",

        });

      }


      // =================================================
      // CONTENT TYPE
      // =================================================

      const contentType =
        req.body?.contentType ||
        "video/webm";


      // =================================================
      // CREATE PRESIGNED URL
      // =================================================

      const upload =
        await createInterviewRecordingUploadUrl({

          tenantId:
            req.user.tenantId,

          projectId,

          interviewId,

          contentType,

        });


      // =================================================
      // UPDATE RECORDING STATE
      // =================================================

      interview.recording.status =
        "uploading";


      interview.recording.s3Key =
        upload.key;


      interview.recording.contentType =
        upload.contentType;


      await interview.save();


      // =================================================
      // RESPONSE
      // =================================================

      console.log(
        "[Interviews] Recording upload URL created",
        {

          interviewId:
            interview._id,

          projectId:
            interview.projectId,

          s3Key:
            upload.key,

        }
      );


      return res.status(
        200
      ).json({

        success:
          true,

        interviewId:
          interview._id,

        uploadUrl:
          upload.uploadUrl,

        s3Key:
          upload.key,

        contentType:
          upload.contentType,

        expiresIn:
          upload.expiresIn,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[Interviews] Recording upload URL failed",
        error
      );


      return res.status(
        500
      ).json({

        success:
          false,

        error:
          error?.message ||
          "RECORDING_UPLOAD_URL_FAILED",

      });

    }

  }
);

// =====================================================
// COMPLETE RECORDING UPLOAD
// =====================================================
//
// POST
// /projects/:projectId/interviews/:interviewId/recording/complete
//
// Permission:
// canRun
//
// Verifies the S3 object exists before marking the
// Interview recording as uploaded.
// =====================================================

router.post(
  "/projects/:projectId/interviews/:interviewId/recording/complete",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const {
        projectId,
        interviewId,
      } = req.params;


      // =================================================
      // PROJECT ACCESS
      // =================================================

      const access =
        await getProjectAccess(
          req,
          projectId,
          "canRun"
        );


      if (
        !access.allowed
      ) {

        return res.status(
          access.status ||
          403
        ).json({

          success:
            false,

          error:
            access.error ||
            "PROJECT_ACCESS_DENIED",

        });

      }


      // =================================================
      // FIND INTERVIEW
      // =================================================

      const interview =
        await findProjectInterview(
          req,
          projectId,
          interviewId
        );


      if (
        !interview
      ) {

        return res.status(
          404
        ).json({

          success:
            false,

          error:
            "INTERVIEW_NOT_FOUND",

        });

      }


      // =================================================
      // GET STORED S3 KEY
      // =================================================

      const s3Key =
        interview.recording?.s3Key;


      if (
        !s3Key
      ) {

        return res.status(
          400
        ).json({

          success:
            false,

          error:
            "RECORDING_S3_KEY_MISSING",

        });

      }


      // =================================================
      // VERIFY S3 OBJECT
      // =================================================

      const object =
        await verifyInterviewRecordingObject({
          key:
            s3Key,
        });


      // =================================================
      // CLIENT METADATA
      // =================================================

      const body =
        req.body || {};


      const clientContentType =
        body.contentType ||
        interview.recording.contentType ||
        object.contentType ||
        "video/webm";


      const sizeBytes =
        Number(
          body.sizeBytes ??
          object.sizeBytes ??
          0
        );


      const durationSeconds =
        Number(
          body.durationSeconds ??
          0
        );


      // =================================================
      // UPDATE INTERVIEW RECORDING
      // =================================================

      interview.recording.status =
        "uploaded";


      interview.recording.s3Key =
        s3Key;


      interview.recording.contentType =
        clientContentType;


      interview.recording.sizeBytes =
        sizeBytes;


      interview.recording.durationSeconds =
        durationSeconds;


      interview.recording.uploadedAt =
        new Date();


      await interview.save();


      // =================================================
      // RESPONSE
      // =================================================

      console.log(
        "[Interviews] Recording upload completed",
        {

          interviewId:
            interview._id,

          projectId:
            interview.projectId,

          s3Key,

          sizeBytes,

          durationSeconds,

        }
      );


      return res.status(
        200
      ).json({

        success:
          true,

        interviewId:
          interview._id,

        recording:
          interview.recording,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[Interviews] Recording completion failed",
        error
      );


      return res.status(
        500
      ).json({

        success:
          false,

        error:
          error?.message ||
          "RECORDING_COMPLETION_FAILED",

      });

    }

  }
);

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default router;
