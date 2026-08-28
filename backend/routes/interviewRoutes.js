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


  if (
    !userId
  ) {

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


  if (
    !tenantId
  ) {

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
    getProjectId(
      req
    );


  if (
    !projectId
  ) {

    res
      .status(400)
      .json({

        success:
          false,

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


  if (
    !access.allowed
  ) {

    res
      .status(
        access.status ||
        403
      )
      .json({

        success:
          false,

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
//
// tenant
// project
// interview
//
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


  return Interview.findOne({

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

  });

}


// =====================================================
// NORMALISE QUESTIONS
// =====================================================

function normaliseQuestions(
  questions
) {

  if (
    !Array.isArray(
      questions
    )
  ) {

    return [];

  }


  return questions
    .map(
      question =>
        String(
          question
        ).trim()
    )
    .filter(
      Boolean
    );

}


// =====================================================
// NORMALISE QUESTION SOURCE
// =====================================================

function isValidQuestionSource(
  source
) {

  return [
    "custom",
    "ai_generated",
    "project_default",
    "manual",
    "imported",
  ].includes(
    source
  );

}


// =====================================================
// RESOLVE QUESTION SET AGAINST PROJECT
// =====================================================
//
// The frontend resolves the question set, but the backend
// performs a defensive validation when questionSetId is
// supplied.
//
// This prevents an interview from claiming to use a
// question set that isn't part of the current project.
//
// =====================================================

function validateQuestionSetAgainstProject(
  project,
  questionSetId,
  questionSetName
) {

  if (
    !questionSetId
  ) {

    return {

      valid:
        true,

      questionSet:
        null,

    };

  }


  const questionSets =
    Array.isArray(
      project?.interviewConfig?.questionSets
    )

      ? project.interviewConfig.questionSets

      : [];


  const questionSet =
    questionSets.find(
      item =>
        String(
          item?.id
        ) ===
        String(
          questionSetId
        )
    );


  if (
    !questionSet
  ) {

    return {

      valid:
        false,

      error:
        "QUESTION_SET_NOT_FOUND",

    };

  }


  if (
    questionSetName &&
    questionSet.name &&
    String(
      questionSetName
    ) !==
    String(
      questionSet.name
    )
  ) {

    return {

      valid:
        false,

      error:
        "QUESTION_SET_NAME_MISMATCH",

    };

  }


  return {

    valid:
      true,

    questionSet,

  };

}


// =====================================================
// CREATE / START INTERVIEW
// =====================================================
//
// POST
// /api/projects/:projectId/interviews
//
// Requires:
// canRun
//
// The Interview stores:
//
// questionSetId
// questionSetName
// questions[]
//
// IMPORTANT:
//
// questions[] is a snapshot.
//
// Future changes to the Project Question Set do NOT
// alter historical Interviews.
// =====================================================

router.post(
  "/projects/:projectId/interviews",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      // =================================================
      // PROJECT ACCESS
      // =================================================

      const projectAccess =
        await requireInterviewProjectAccess(
          req,
          res,
          "canRun"
        );


      if (
        !projectAccess
      ) {

        return;

      }


      const userId =
        getUserId(
          req
        );


      const tenantId =
        getTenantId(
          req
        );


      if (
        !userId ||
        !tenantId
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "IDENTITY_REQUIRED",

            message:
              "Authenticated user and tenant are required.",

          });

      }


      // =================================================
      // PROJECT
      // =================================================

      const project =
        projectAccess.access?.project;


      /*
      getProjectAccess() normally returns project in
      membership access. For maximum compatibility,
      use the project supplied by the access result.
      */


      // =================================================
      // REQUEST BODY
      // =================================================

      const {

        questions = [],

        questionSource =
          "project_default",

        questionSetId =
          null,

        questionSetName =
          null,

        interviewConfig =
          {},

        candidate =
          {},

        candidateUserId =
          null,

      } =
        req.body || {};


      // =================================================
      // QUESTION VALIDATION
      // =================================================

      const normalizedQuestions =
        normaliseQuestions(
          questions
        );


      if (
        normalizedQuestions.length ===
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "NO_QUESTIONS",

            message:
              "At least one interview question is required.",

          });

      }


      // =================================================
      // QUESTION SOURCE VALIDATION
      // =================================================

      if (
        !isValidQuestionSource(
          questionSource
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "INVALID_QUESTION_SOURCE",

          });

      }


      // =================================================
      // QUESTION SET VALIDATION
      // =================================================

      const questionSetValidation =
        validateQuestionSetAgainstProject(
          project,
          questionSetId,
          questionSetName
        );


      if (
        !questionSetValidation.valid
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              questionSetValidation.error,

          });

      }


      const resolvedQuestionSet =
        questionSetValidation.questionSet;


      // =================================================
      // QUESTION SET METADATA
      // =================================================

      const finalQuestionSetId =
        questionSetId ||
        resolvedQuestionSet?.id ||
        null;


      const finalQuestionSetName =
        questionSetName ||
        resolvedQuestionSet?.name ||
        null;


      // =================================================
      // INTERVIEW CONFIG
      // =================================================

      const finalInterviewConfig = {

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

      };


      // =================================================
      // CANDIDATE USER ID
      // =================================================

      const normalizedCandidateUserId =
        isValidObjectId(
          candidateUserId
        )

          ? new mongoose.Types.ObjectId(
              candidateUserId
            )

          : userId;


      // =================================================
      // CREATE INTERVIEW
      // =================================================

      const interview =
        await Interview.create({

          tenantId,

          projectId:
            projectAccess.projectId,

          createdByUserId:
            userId,

          candidateUserId:
            normalizedCandidateUserId,

          candidate: {

            name:
              String(
                candidate?.name ||
                ""
              )
                .trim(),

            email:
              String(
                candidate?.email ||
                ""
              )
                .trim()
                .toLowerCase(),

          },


          // =================================================
          // LIFECYCLE
          // =================================================

          status:
            "active",


          // =================================================
          // QUESTION SOURCE
          // =================================================

          questionSource:


            resolvedQuestionSet

              ? (
                  resolvedQuestionSet.source ||
                  questionSource
                )

              : questionSource,


          // =================================================
          // QUESTION SET SNAPSHOT METADATA
          // =================================================

          questionSetId:
            finalQuestionSetId,

          questionSetName:
            finalQuestionSetName,


          // =================================================
          // QUESTION SNAPSHOT
          // =================================================
          //
          // THIS IS THE IMPORTANT HISTORICAL COPY.
          //
          // =================================================

          questions:
            normalizedQuestions,


          // =================================================
          // INTERVIEW CONFIG SNAPSHOT
          // =================================================

          interviewConfig:
            finalInterviewConfig,


          // =================================================
          // ANSWERS
          // =================================================

          answers:
            [],


          // =================================================
          // RECORDING
          // =================================================

          recording: {

            status:
              "pending",

            storageProvider:
              "s3",

            s3Key:
              null,

            contentType:
              null,

            originalFileName:
              null,

            sizeBytes:
              0,

            durationSeconds:
              0,

            recordingStartedAt:
              null,

            recordingCompletedAt:
              null,

            uploadedAt:
              null,

          },


          // =================================================
          // TRANSCRIPTION
          // =================================================

          transcription: {

            status:
              "pending",

            text:
              "",

            completedAt:
              null,

          },


          // =================================================
          // AI EVALUATION
          // =================================================

          aiEvaluation: {

            overallScore:
              null,

            communicationScore:
              null,

            problemSolvingScore:
              null,

            technicalScore:
              null,

            strengths:
              [],

            weaknesses:
              [],

            questionFeedback:
              [],

            summary:
              "",

          },


          // =================================================
          // DATES
          // =================================================

          startedAt:
            new Date(),

          completedAt:
            null,

          retentionUntil:
            null,

        });


      // =================================================
      // DEBUG
      // =================================================

      console.log(
        "[Interviews] Created",
        {

          interviewId:
            interview._id,

          projectId:
            projectAccess.projectId,

          tenantId,

          candidateUserId:
            interview.candidateUserId,

          questionCount:
            normalizedQuestions.length,

          questionSource:
            interview.questionSource,

          questionSetId:
            interview.questionSetId,

          questionSetName:
            interview.questionSetName,

          recordingEnabled:
            interview
              .interviewConfig
              ?.recordingEnabled,

        }
      );


      // =================================================
      // RESPONSE
      // =================================================

      return res
        .status(201)
        .json({

          success:
            true,

          interview,

        });

    }
    catch (
      error
    ) {

      console.error(
        "[Interviews] POST create",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

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


      if (
        !projectAccess
      ) {

        return;

      }


      const tenantId =
        getTenantId(
          req
        );


      if (
        !tenantId
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

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

          success:
            true,

          interviews,

        });

    }
    catch (
      error
    ) {

      console.error(
        "[Interviews] GET list",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            "INTERVIEW_LIST_FAILED",

        });

    }

  }
);


// =====================================================
// GET SINGLE INTERVIEW
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


      if (
        !projectAccess
      ) {

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

            success:
              false,

            error:
              "INVALID_INTERVIEW_ID",

          });

      }


      const tenantId =
        getTenantId(
          req
        );


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


      if (
        !interview
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            error:
              "INTERVIEW_NOT_FOUND",

          });

      }


      return res
        .status(200)
        .json({

          success:
            true,

          interview,

        });

    }
    catch (
      error
    ) {

      console.error(
        "[Interviews] GET single",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            "INTERVIEW_GET_FAILED",

        });

    }

  }
);


// =====================================================
// SUBMIT ANSWER
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


      if (
        !projectAccess
      ) {

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

            success:
              false,

            error:
              "INVALID_INTERVIEW_ID",

          });

      }


      const index =
        Number(
          questionIndex
        );


      if (
        !Number.isInteger(
          index
        ) ||
        index < 0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "INVALID_QUESTION_INDEX",

          });

      }


      const tenantId =
        getTenantId(
          req
        );


      const interview =
        await Interview.findOne({

          _id:
            interviewId,

          tenantId,

          projectId:
            projectAccess.projectId,

        });


      if (
        !interview
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

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

            success:
              false,

            error:
              "INTERVIEW_NOT_ACTIVE",

          });

      }


      const question =
        interview.questions?.[
          index
        ];


      if (
        !question
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

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
        req.body || {};


      const answer = {

        questionIndex:
          index,

        question,

        text:
          String(
            text
          ),

        transcript:
          String(
            transcript
          ),

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


      const existingIndex =
        interview.answers.findIndex(
          existing =>
            existing.questionIndex ===
            index
        );


      if (
        existingIndex >=
        0
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

          success:
            true,

          answer,

          interview,

        });

    }
    catch (
      error
    ) {

      console.error(
        "[Interviews] PATCH answer",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            "INTERVIEW_ANSWER_SAVE_FAILED",

        });

    }

  }
);


// =====================================================
// COMPLETE INTERVIEW
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


      if (
        !projectAccess
      ) {

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

            success:
              false,

            error:
              "INVALID_INTERVIEW_ID",

          });

      }


      const tenantId =
        getTenantId(
          req
        );


      const interview =
        await Interview.findOne({

          _id:
            interviewId,

          tenantId,

          projectId:
            projectAccess.projectId,

        });


      if (
        !interview
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

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

            success:
              true,

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

            success:
              false,

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

          success:
            true,

          interview,

        });

    }
    catch (
      error
    ) {

      console.error(
        "[Interviews] POST complete",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            "INTERVIEW_COMPLETE_FAILED",

        });

    }

  }
);


// =====================================================
// CREATE RECORDING UPLOAD URL
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
      } =
        req.params;


      const access =
        await getProjectAccess(
          req,
          projectId,
          "canRun"
        );


      if (
        !access.allowed
      ) {

        return res
          .status(
            access.status ||
            403
          )
          .json({

            success:
              false,

            error:
              access.error ||
              "PROJECT_ACCESS_DENIED",

          });

      }


      const interview =
        await findProjectInterview(
          req,
          projectId,
          interviewId
        );


      if (
        !interview
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

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

            success:
              false,

            error:
              "INTERVIEW_NOT_ACTIVE",

          });

      }


      const recordingEnabled =
        interview
          ?.interviewConfig
          ?.recordingEnabled !== false;


      if (
        !recordingEnabled
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            error:
              "INTERVIEW_RECORDING_DISABLED",

          });

      }


      const contentType =
        req.body?.contentType ||
        "video/webm";


      const upload =
        await createInterviewRecordingUploadUrl({

          tenantId:
            req.user.tenantId,

          projectId,

          interviewId,

          contentType,

        });


      if (
        !interview.recording
      ) {

        interview.recording = {

          status:
            "pending",

          storageProvider:
            "s3",

          s3Key:
            null,

          contentType:
            null,

          originalFileName:
            null,

          sizeBytes:
            0,

          durationSeconds:
            0,

          recordingStartedAt:
            null,

          recordingCompletedAt:
            null,

          uploadedAt:
            null,

        };

      }


      interview.recording.status =
        "uploading";


      interview.recording.s3Key =
        upload.key;


      interview.recording.contentType =
        upload.contentType;


      await interview.save();


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


      return res
        .status(200)
        .json({

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


      return res
        .status(500)
        .json({

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
      } =
        req.params;


      const access =
        await getProjectAccess(
          req,
          projectId,
          "canRun"
        );


      if (
        !access.allowed
      ) {

        return res
          .status(
            access.status ||
            403
          )
          .json({

            success:
              false,

            error:
              access.error ||
              "PROJECT_ACCESS_DENIED",

          });

      }


      const interview =
        await findProjectInterview(
          req,
          projectId,
          interviewId
        );


      if (
        !interview
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            error:
              "INTERVIEW_NOT_FOUND",

          });

      }


      const s3Key =
        interview.recording?.s3Key;


      if (
        !s3Key
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "RECORDING_S3_KEY_MISSING",

          });

      }


      // =================================================
      // VERIFY OBJECT EXISTS
      // =================================================

      const object =
        await verifyInterviewRecordingObject({

          key:
            s3Key,

        });


      // =================================================
      // METADATA
      // =================================================

      const body =
        req.body ||
        {};


      const contentType =
        body.contentType ||

        interview
          .recording
          ?.contentType ||

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


      const completedAt =
        body.completedAt
          ? new Date(
              body.completedAt
            )
          : new Date();


      // =================================================
      // UPDATE RECORDING
      // =================================================

      if (
        !interview.recording
      ) {

        interview.recording = {};

      }


      interview.recording.status =
        "uploaded";


      interview.recording.storageProvider =
        "s3";


      interview.recording.s3Key =
        s3Key;


      interview.recording.contentType =
        contentType;


      interview.recording.sizeBytes =
        sizeBytes;


      interview.recording.durationSeconds =
        durationSeconds;


      interview.recording.recordingCompletedAt =
        completedAt;


      interview.recording.uploadedAt =
        new Date();


      await interview.save();


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


      return res
        .status(200)
        .json({

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
        {

          error,

          message:
            error?.message,

          stack:
            error?.stack,

        }
      );


      return res
        .status(500)
        .json({

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
// EXPORT
// =====================================================

export default router;
