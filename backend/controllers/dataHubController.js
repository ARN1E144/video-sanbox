// backend/controllers/dataHubController.js

import mongoose from "mongoose";

import Project from "../models/project.js";
import ProjectMembership from "../models/projectMembership.js";
import Interview from "../models/Interview.js";

import {
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import {
  getSignedUrl,
} from "@aws-sdk/s3-request-presigner";


// =====================================================
// S3
// =====================================================

const s3Client =
  new S3Client({
    region:
      process.env.AWS_REGION ||
      process.env.AWS_DEFAULT_REGION ||
      "eu-west-2",
  });


// =====================================================
// S3 CONFIG
// =====================================================

const RECORDINGS_BUCKET =
  process.env.INTERVIEW_RECORDINGS_BUCKET ||
  process.env.AWS_INTERVIEW_RECORDINGS_BUCKET ||
  process.env.S3_INTERVIEW_RECORDINGS_BUCKET ||
  null;


// Presigned URL lifetime.
//
// 15 minutes gives the user enough time to click/play
// without creating long-lived public access.
// =====================================================

const SIGNED_URL_EXPIRES_IN =
  60 * 15;


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


function normaliseId(
  value
) {

  if (
    !value ||
    !isValidObjectId(
      value
    )
  ) {

    return null;

  }


  return (
    value instanceof mongoose.Types.ObjectId
      ? value
      : new mongoose.Types.ObjectId(
          value
        )
  );

}


function getAuthenticatedUserId(
  req
) {

  return normaliseId(
    req.user?.userId
  );

}


function getAuthenticatedTenantId(
  req
) {

  return normaliseId(
    req.user?.tenantId
  );

}


function getProjectId(
  project
) {

  return (
    project?._id ||
    project?.id ||
    null
  );

}


function getProjectName(
  project
) {

  return (
    project?.name ||
    "Untitled Project"
  );

}


function safeArray(
  value
) {

  return Array.isArray(
    value
  )
    ? value
    : [];

}


// =====================================================
// RECORDING STATE
// =====================================================

function hasUploadedRecording(
  interview
) {

  return (

    interview?.recording?.status ===
      "uploaded" &&

    Boolean(
      interview?.recording?.s3Key
    )

  );

}


// =====================================================
// TRANSCRIPTION STATE
// =====================================================

function hasCompletedTranscription(
  interview
) {

  return (
    interview?.transcription?.status ===
    "completed"
  );

}


// =====================================================
// EVALUATION STATE
// =====================================================
//
// The aiEvaluation object exists on every Interview,
// therefore checking object existence is insufficient.
//
// =====================================================

function hasCompletedEvaluation(
  interview
) {

  const evaluation =
    interview?.aiEvaluation;


  if (
    !evaluation
  ) {

    return false;

  }


  if (
    evaluation.overallScore !==
    null &&
    evaluation.overallScore !==
    undefined
  ) {

    return true;

  }


  if (
    typeof evaluation.summary ===
      "string" &&
    evaluation.summary.trim()
  ) {

    return true;

  }


  if (
    safeArray(
      evaluation.strengths
    ).length > 0
  ) {

    return true;

  }


  if (
    safeArray(
      evaluation.weaknesses
    ).length > 0
  ) {

    return true;

  }


  if (
    safeArray(
      evaluation.questionFeedback
    ).length > 0
  ) {

    return true;

  }


  return false;

}


// =====================================================
// FORMAT INTERVIEW FOR DATA HUB
// =====================================================
//
// IMPORTANT:
//
// The Data Hub does not need to expose the complete
// database document by default.
//
// We convert the document into a UI-friendly resource.
//
// =====================================================

function formatInterview(
  interview
) {

  const answers =
    safeArray(
      interview?.answers
    );


  const evaluation =
    interview?.aiEvaluation ||
    {};


  const recording =
    interview?.recording ||
    {};


  const transcription =
    interview?.transcription ||
    {};


  return {

    id:
      interview?._id,

    interviewId:
      interview?._id,

    candidate: {

      name:
        interview?.candidate?.name ||
        "Unnamed candidate",

      email:
        interview?.candidate?.email ||
        "",

    },

    status:
      interview?.status ||
      "unknown",

    questionSource:
      interview?.questionSource ||
      null,

    questions:
      safeArray(
        interview?.questions
      ),

    answers:

      answers.map(
        answer => ({

          questionIndex:
            answer?.questionIndex ??
            null,

          question:
            answer?.question ||
            "",

          text:
            answer?.text ||
            "",

          transcript:
            answer?.transcript ||
            "",

          startedAt:
            answer?.startedAt ||
            null,

          completedAt:
            answer?.completedAt ||
            null,

        })
      ),

    recording: {

      status:
        recording?.status ||
        "pending",

      available:
        hasUploadedRecording(
          interview
        ),

      contentType:
        recording?.contentType ||
        null,

      sizeBytes:
        Number(
          recording?.sizeBytes ||
          0
        ),

      durationSeconds:
        Number(
          recording?.durationSeconds ||
          0
        ),

      recordingStartedAt:
        recording?.recordingStartedAt ||
        null,

      recordingCompletedAt:
        recording?.recordingCompletedAt ||
        null,

      uploadedAt:
        recording?.uploadedAt ||
        null,

    },

    transcription: {

      status:
        transcription?.status ||
        "pending",

      available:
        hasCompletedTranscription(
          interview
        ),

      text:
        transcription?.text ||
        "",

      completedAt:
        transcription?.completedAt ||
        null,

    },

    evaluation: {

      available:
        hasCompletedEvaluation(
          interview
        ),

      overallScore:
        evaluation?.overallScore ??
        null,

      communicationScore:
        evaluation?.communicationScore ??
        null,

      problemSolvingScore:
        evaluation?.problemSolvingScore ??
        null,

      technicalScore:
        evaluation?.technicalScore ??
        null,

      strengths:
        safeArray(
          evaluation?.strengths
        ),

      weaknesses:
        safeArray(
          evaluation?.weaknesses
        ),

      questionFeedback:
        safeArray(
          evaluation?.questionFeedback
        ),

      summary:
        evaluation?.summary ||
        "",

    },

    startedAt:
      interview?.startedAt ||
      null,

    completedAt:
      interview?.completedAt ||
      null,

    retentionUntil:
      interview?.retentionUntil ||
      null,

    createdAt:
      interview?.createdAt ||
      null,

    updatedAt:
      interview?.updatedAt ||
      null,

  };

}


// =====================================================
// FORMAT RECORDING
// =====================================================
//
// Keep S3 keys private.
//
// The browser receives temporary URLs only.
//
// =====================================================

async function createRecordingAccess(
  recording
) {

  if (
    !recording?.s3Key
  ) {

    return {

      playbackUrl:
        null,

      downloadUrl:
        null,

    };

  }


  if (
    !RECORDINGS_BUCKET
  ) {

    throw new Error(
      "INTERVIEW_RECORDINGS_BUCKET_NOT_CONFIGURED"
    );

  }


  const contentType =
    recording?.contentType ||
    "video/webm";


  // ---------------------------------------------------
  // Playback URL
  //
  // Content-Disposition inline
  // ---------------------------------------------------

  const playbackCommand =
    new GetObjectCommand({
      Bucket:
        RECORDINGS_BUCKET,

      Key:
        recording.s3Key,

      ResponseContentType:
        contentType,

      ResponseContentDisposition:
        "inline",

    });


  // ---------------------------------------------------
  // Download URL
  //
  // Content-Disposition attachment
  // ---------------------------------------------------

  const downloadCommand =
    new GetObjectCommand({
      Bucket:
        RECORDINGS_BUCKET,

      Key:
        recording.s3Key,

      ResponseContentType:
        contentType,

      ResponseContentDisposition:
        "attachment",

    });


  const [
    playbackUrl,
    downloadUrl,
  ] =
    await Promise.all([

      getSignedUrl(
        s3Client,
        playbackCommand,
        {
          expiresIn:
            SIGNED_URL_EXPIRES_IN,
        }
      ),

      getSignedUrl(
        s3Client,
        downloadCommand,
        {
          expiresIn:
            SIGNED_URL_EXPIRES_IN,
        }
      ),

    ]);


  return {

    playbackUrl,

    downloadUrl,

  };

}

// =====================================================
// RESOURCE DEFINITIONS
// =====================================================
//
// These are the logical resources exposed by the Data Hub.
//
// They do not need to map 1:1 to MongoDB collections.
// For the AI Interviewer:
//
// interviews       → Interview documents
// recordings      → uploaded Interview recordings
// transcriptions  → completed Interview transcriptions
// evaluations     → completed AI evaluations
//
// =====================================================

const RESOURCE_DEFINITIONS = {

  interviews: {

    label:
      "Interviews",

    permission:
      "canViewInterviews",

  },

  recordings: {

    label:
      "Recordings",

    permission:
      "canViewRecordings",

  },

  transcriptions: {

    label:
      "Transcriptions",

    permission:
      "canViewTranscriptions",

  },

  evaluations: {

    label:
      "Evaluations",

    permission:
      "canViewEvaluations",

  },

};



// =====================================================
// PROJECT ACCESS
// =====================================================

async function resolveProjectAccess(
  req,
  projectId,
  requiredPermission = "canView"
) {

  const userId =
    getAuthenticatedUserId(
      req
    );


  const tenantId =
    getAuthenticatedTenantId(
      req
    );


  const normalizedProjectId =
    normaliseId(
      projectId
    );


  if (
    !userId
  ) {

    return {

      allowed:
        false,

      status:
        401,

      error:
        "INVALID_AUTHENTICATED_USER",

    };

  }


  if (
    !tenantId
  ) {

    return {

      allowed:
        false,

      status:
        400,

      error:
        "TENANT_REQUIRED",

    };

  }


  if (
    !normalizedProjectId
  ) {

    return {

      allowed:
        false,

      status:
        400,

      error:
        "INVALID_PROJECT_ID",

    };

  }


  const membership =
    await ProjectMembership
      .findOne({
        tenantId,

        projectId:
          normalizedProjectId,

        userId,

      })
      .lean();


  // ===================================================
  // EXPLICIT MEMBERSHIP
  // ===================================================

  if (
    membership
  ) {

    const allowed =
      membership
        ?.permissions?.[
          requiredPermission
        ] === true;


    if (
      !allowed
    ) {

      return {

        allowed:
          false,

        status:
          403,

        error:
          "PROJECT_PERMISSION_DENIED",

        membership,

      };

    }


    const project =
      await Project
        .findOne({
          _id:
            normalizedProjectId,
        })
        .lean();


    if (
      !project
    ) {

      return {

        allowed:
          false,

        status:
          404,

        error:
          "PROJECT_NOT_FOUND",

        membership,

      };

    }


    return {

      allowed:
        true,

      project,

      membership,

    };

  }


  // ===================================================
  // LEGACY OWNER
  // ===================================================

  const ownedProject =
    await Project
      .findOne({

        _id:
          normalizedProjectId,

        ownerId:
          userId,

      })
      .lean();


  if (
    ownedProject
  ) {

    const legacyPermissions = {

      canView:
        true,

      canEdit:
        true,

      canRun:
        true,

      canManageData:
        true,

      canCreateData:
        true,

      canEditData:
        true,

      canDeleteData:
        true,

      canExportData:
        true,

      canViewInterviews:
        true,

      canViewRecordings:
        true,

      canViewTranscriptions:
        true,

      canViewEvaluations:
        true,

    };


    if (
      legacyPermissions[
        requiredPermission
      ] !== true
    ) {

      return {

        allowed:
          false,

        status:
          403,

        error:
          "PROJECT_PERMISSION_DENIED",

      };

    }


    return {

      allowed:
        true,

      project:
        ownedProject,

      membership: {

        role:
          "owner",

        permissions:
          legacyPermissions,

        legacy:
          true,

      },

    };

  }


  return {

    allowed:
      false,

    status:
      403,

    error:
      "PROJECT_ACCESS_DENIED",

  };

}


// =====================================================
// GET ACCESSIBLE PROJECTS
// =====================================================
//
// GET /api/data/projects
//
// =====================================================

export async function getAccessibleProjects(
  req,
  res
) {

  try {

    const userId =
      getAuthenticatedUserId(
        req
      );


    const tenantId =
      getAuthenticatedTenantId(
        req
      );


    if (
      !userId
    ) {

      return res
        .status(401)
        .json({

          success:
            false,

          error:
            "INVALID_AUTHENTICATED_USER",

        });

    }


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


    const memberships =
      await ProjectMembership
        .find({

          tenantId,

          userId,

          "permissions.canView":
            true,

        })
        .lean();


    const membershipByProjectId =
      new Map();


    memberships.forEach(
      membership => {

        membershipByProjectId.set(
          String(
            membership.projectId
          ),
          membership
        );

      }
    );


    const membershipProjectIds =
      memberships
        .map(
          membership =>
            membership.projectId
        )
        .filter(Boolean);


    const memberProjects =
      membershipProjectIds.length > 0

        ? await Project.find({
            _id: {
              $in:
                membershipProjectIds,
            },
          })
          .lean()

        : [];


    const ownedProjects =
      await Project.find({
        ownerId:
          userId,
      })
      .lean();


    const projectMap =
      new Map();


    memberProjects.forEach(
      project => {

        const projectId =
          String(
            getProjectId(
              project
            )
          );


        const membership =
          membershipByProjectId.get(
            projectId
          );


        projectMap.set(
          projectId,
          {

            _id:
              project._id,

            name:
              getProjectName(
                project
              ),

            type:
              project.type ||
              "single",

            role:
              membership?.role ||
              "viewer",

            permissions:
              membership?.permissions ||
              {},

          }
        );

      }
    );


    ownedProjects.forEach(
      project => {

        const projectId =
          String(
            getProjectId(
              project
            )
          );


        if (
          projectMap.has(
            projectId
          )
        ) {

          return;

        }


        projectMap.set(
          projectId,
          {

            _id:
              project._id,

            name:
              getProjectName(
                project
              ),

            type:
              project.type ||
              "single",

            role:
              "owner",

            permissions: {

              canView:
                true,

              canEdit:
                true,

              canRun:
                true,

              canManageData:
                true,

              canCreateData:
                true,

              canEditData:
                true,

              canDeleteData:
                true,

              canExportData:
                true,

              canViewInterviews:
                true,

              canViewRecordings:
                true,

              canViewTranscriptions:
                true,

              canViewEvaluations:
                true,

            },

          }
        );

      }
    );


    const projects =
      Array.from(
        projectMap.values()
      );


    return res
      .status(200)
      .json({

        success:
          true,

        projects,

      });

  }
  catch (
    error
  ) {

    console.error(
      "[DataHub] getAccessibleProjects failed",
      error
    );


    return res
      .status(500)
      .json({

        success:
          false,

        error:
          "DATA_HUB_PROJECTS_FAILED",

      });

  }

}


// =====================================================
// GET PROJECT DATA SUMMARY
// =====================================================
//
// GET /api/data/projects/:projectId
//
// =====================================================

export async function getProjectDataSummary(
  req,
  res
) {

  try {

    const {
      projectId,
    } =
      req.params;


    const access =
      await resolveProjectAccess(
        req,
        projectId,
        "canView"
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


    const project =
      access.project;


    const permissions =
      access.membership
        ?.permissions ||
      {};


    const [
      interviewCount,
      recordingCount,
      transcriptionCount,
      evaluationCount,
    ] =
      await Promise.all([

        permissions.canViewInterviews

          ? Interview.countDocuments({
              projectId:
                project._id,
            })

          : Promise.resolve(0),


        permissions.canViewRecordings

          ? Interview.countDocuments({
              projectId:
                project._id,

              "recording.status":
                "uploaded",

              "recording.s3Key": {
                $nin: [
                  null,
                  "",
                ],
              },

            })

          : Promise.resolve(0),


        permissions.canViewTranscriptions

          ? Interview.countDocuments({
              projectId:
                project._id,

              "transcription.status":
                "completed",

            })

          : Promise.resolve(0),


        permissions.canViewEvaluations

          ? Interview.countDocuments({

              projectId:
                project._id,

              $or: [

                {
                  "aiEvaluation.overallScore": {
                    $ne:
                      null,
                  },
                },

                {
                  "aiEvaluation.summary": {
                    $nin: [
                      null,
                      "",
                    ],
                  },
                },

                {
                  "aiEvaluation.strengths.0": {
                    $exists:
                      true,
                  },
                },

                {
                  "aiEvaluation.weaknesses.0": {
                    $exists:
                      true,
                  },
                },

                {
                  "aiEvaluation.questionFeedback.0": {
                    $exists:
                      true,
                  },
                },

              ],

            })

          : Promise.resolve(0),

    ]);


    const resources = [];


    if (
      permissions.canViewInterviews
    ) {

      resources.push({

        type:
          "interviews",

        label:
          RESOURCE_DEFINITIONS
            .interviews
            .label,

        count:
          interviewCount,

        view:
          true,

      });

    }


    if (
      permissions.canViewRecordings
    ) {

      resources.push({

        type:
          "recordings",

        label:
          RESOURCE_DEFINITIONS
            .recordings
            .label,

        count:
          recordingCount,

        view:
          true,

      });

    }


    if (
      permissions.canViewTranscriptions
    ) {

      resources.push({

        type:
          "transcriptions",

        label:
          RESOURCE_DEFINITIONS
            .transcriptions
            .label,

        count:
          transcriptionCount,

        view:
          true,

      });

    }


    if (
      permissions.canViewEvaluations
    ) {

      resources.push({

        type:
          "evaluations",

        label:
          RESOURCE_DEFINITIONS
            .evaluations
            .label,

        count:
          evaluationCount,

        view:
          true,

      });

    }


    return res
      .status(200)
      .json({

        success:
          true,

        project: {

          id:
            project._id,

          _id:
            project._id,

          name:
            getProjectName(
              project
            ),

          role:
            access.membership
              ?.role ||
            "viewer",

          permissions,

          resources,

        },

      });

  }
  catch (
    error
  ) {

    console.error(
      "[DataHub] getProjectDataSummary failed",
      error
    );


    return res
      .status(500)
      .json({

        success:
          false,

        error:
          "DATA_HUB_PROJECT_SUMMARY_FAILED",

      });

  }

}


// =====================================================
// GET PROJECT INTERVIEWS
// =====================================================
//
// GET /api/data/projects/:projectId/interviews
//
// =====================================================

export async function getProjectInterviews(
  req,
  res
) {

  try {

    const {
      projectId,
    } =
      req.params;


    const access =
      await resolveProjectAccess(
        req,
        projectId,
        "canViewInterviews"
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


    const interviews =
      await Interview
        .find({
          projectId:
            access.project._id,
        })
        .sort({
          createdAt:
            -1,
        })
        .lean();


    const records =
      interviews.map(
        formatInterview
      );


    return res
      .status(200)
      .json({

        success:
          true,

        projectId:
          access.project._id,

        resourceType:
          "interviews",

        records,

      });

  }
  catch (
    error
  ) {

    console.error(
      "[DataHub] getProjectInterviews failed",
      error
    );


    return res
      .status(500)
      .json({

        success:
          false,

        error:
          "DATA_HUB_INTERVIEWS_FAILED",

      });

  }

}


// =====================================================
// GET PROJECT RECORDINGS
// =====================================================
//
// GET /api/data/projects/:projectId/recordings
//
// =====================================================

export async function getProjectRecordings(
  req,
  res
) {

  try {

    const {
      projectId,
    } =
      req.params;


    const access =
      await resolveProjectAccess(
        req,
        projectId,
        "canViewRecordings"
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


    const interviews =
      await Interview
        .find({

          projectId:
            access.project._id,

          "recording.status":
            "uploaded",

          "recording.s3Key": {
            $nin: [
              null,
              "",
            ],
          },

        })
        .sort({

          "recording.uploadedAt":
            -1,

          "recording.recordingCompletedAt":
            -1,

          createdAt:
            -1,

        })
        .lean();


    const records =
      await Promise.all(

        interviews.map(
          async interview => {

            const accessUrls =
              await createRecordingAccess(
                interview.recording
              );


            return {

              interviewId:
                interview._id,

              candidate:
                interview.candidate ||
                null,

              interviewStatus:
                interview.status ||
                null,

              createdAt:
                interview.createdAt ||
                null,

              recording: {

                status:
                  interview.recording?.status ||
                  "uploaded",

                contentType:
                  interview.recording?.contentType ||
                  null,

                sizeBytes:
                  Number(
                    interview.recording?.sizeBytes ||
                    0
                  ),

                durationSeconds:
                  Number(
                    interview.recording?.durationSeconds ||
                    0
                  ),

                recordingStartedAt:
                  interview.recording?.recordingStartedAt ||
                  null,

                recordingCompletedAt:
                  interview.recording?.recordingCompletedAt ||
                  null,

                uploadedAt:
                  interview.recording?.uploadedAt ||
                  null,

                playbackUrl:
                  accessUrls.playbackUrl,

                downloadUrl:
                  accessUrls.downloadUrl,

              },

            };

          }
        )

      );


    return res
      .status(200)
      .json({

        success:
          true,

        projectId:
          access.project._id,

        resourceType:
          "recordings",

        records,

      });

  }
  catch (
    error
  ) {

    console.error(
      "[DataHub] getProjectRecordings failed",
      error
    );


    return res
      .status(500)
      .json({

        success:
          false,

        error:
          error?.message ===
          "INTERVIEW_RECORDINGS_BUCKET_NOT_CONFIGURED"

            ? "INTERVIEW_RECORDINGS_BUCKET_NOT_CONFIGURED"

            : "DATA_HUB_RECORDINGS_FAILED",

      });

  }

}


// =====================================================
// GET PROJECT TRANSCRIPTIONS
// =====================================================
//
// GET /api/data/projects/:projectId/transcriptions
//
// =====================================================

export async function getProjectTranscriptions(
  req,
  res
) {

  try {

    const {
      projectId,
    } =
      req.params;


    const access =
      await resolveProjectAccess(
        req,
        projectId,
        "canViewTranscriptions"
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


    const interviews =
      await Interview
        .find({

          projectId:
            access.project._id,

          "transcription.status":
            "completed",

        })
        .sort({

          "transcription.completedAt":
            -1,

          updatedAt:
            -1,

        })
        .lean();


    const records =
      interviews.map(
        interview => ({

          interviewId:
            interview._id,

          candidate:
            interview.candidate ||
            null,

          interviewStatus:
            interview.status ||
            null,

          transcription:
            interview.transcription ||
            null,

          createdAt:
            interview.createdAt ||
            null,

          updatedAt:
            interview.updatedAt ||
            null,

        })
      );


    return res
      .status(200)
      .json({

        success:
          true,

        projectId:
          access.project._id,

        resourceType:
          "transcriptions",

        records,

      });

  }
  catch (
    error
  ) {

    console.error(
      "[DataHub] getProjectTranscriptions failed",
      error
    );


    return res
      .status(500)
      .json({

        success:
          false,

        error:
          "DATA_HUB_TRANSCRIPTIONS_FAILED",

      });

  }

}


// =====================================================
// GET PROJECT EVALUATIONS
// =====================================================
//
// GET /api/data/projects/:projectId/evaluations
//
// =====================================================

export async function getProjectEvaluations(
  req,
  res
) {

  try {

    const {
      projectId,
    } =
      req.params;


    const access =
      await resolveProjectAccess(
        req,
        projectId,
        "canViewEvaluations"
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


    const interviews =
      await Interview
        .find({

          projectId:
            access.project._id,

          $or: [

            {
              "aiEvaluation.overallScore": {
                $ne:
                  null,
              },
            },

            {
              "aiEvaluation.summary": {
                $nin: [
                  null,
                  "",
                ],
              },
            },

            {
              "aiEvaluation.strengths.0": {
                $exists:
                  true,
              },
            },

            {
              "aiEvaluation.weaknesses.0": {
                $exists:
                  true,
              },
            },

            {
              "aiEvaluation.questionFeedback.0": {
                $exists:
                  true,
              },
            },

          ],

        })
        .sort({

          updatedAt:
            -1,

          createdAt:
            -1,

        })
        .lean();


    const records =
      interviews.map(
        interview => ({

          interviewId:
            interview._id,

          candidate:
            interview.candidate ||
            null,

          interviewStatus:
            interview.status ||
            null,

          evaluation:
            interview.aiEvaluation ||
            null,

          createdAt:
            interview.createdAt ||
            null,

          updatedAt:
            interview.updatedAt ||
            null,

        })
      );


    return res
      .status(200)
      .json({

        success:
          true,

        projectId:
          access.project._id,

        resourceType:
          "evaluations",

        records,

      });

  }
  catch (
    error
  ) {

    console.error(
      "[DataHub] getProjectEvaluations failed",
      error
    );


    return res
      .status(500)
      .json({

        success:
          false,

        error:
          "DATA_HUB_EVALUATIONS_FAILED",

      });

  }

}
