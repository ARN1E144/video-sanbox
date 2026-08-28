// backend/routes/projectRoutes.js

import express from "express";
import mongoose from "mongoose";

import Project from "../models/project.js";
import ProjectMembership from "../models/projectMembership.js";

import { requireAuth } from "../middleware/requireAuth.js";


const router = express.Router();


// =====================================================
// PROJECT PERMISSION DEFAULTS
// =====================================================
//
// Owner permissions represent the maximum permissions
// currently supported by the platform.
//
// These are also used for legacy projects that do not yet
// have a ProjectMembership document.
// =====================================================

const OWNER_PERMISSIONS = {

  canView: true,

  canEdit: true,

  canRun: true,

  canManageData: true,

  canViewInterviews: true,

  canViewRecordings: true,

  canViewEvaluations: true,

};


// =====================================================
// DEFAULT INTERVIEW CONFIG
// =====================================================
//
// The project remains the source of truth for AI
// Interviewer configuration.
//
// This protects older projects that do not yet contain
// interviewConfig.
// =====================================================

const DEFAULT_INTERVIEW_CONFIG = {

  activeQuestionSetId: null,

  questionSets: [],

  recordingEnabled: true,

  transcriptionEnabled: true,

  evaluationEnabled: true,

};


// =====================================================
// NORMALISE QUESTION SET
// =====================================================

function normaliseQuestionSet(
  questionSet = {}
) {

  const id =
    questionSet?.id ||
    questionSet?._id ||
    null;


  if (!id) {

    return null;

  }


  const questions =
    Array.isArray(
      questionSet?.questions
    )

      ? questionSet.questions

          .map(
            question =>
              String(
                question ?? ""
              ).trim()
          )

          .filter(
            Boolean
          )

      : [];


  return {

    id:
      String(
        id
      ),

    name:
      String(
        questionSet?.name ||
        "Untitled Question Set"
      ).trim(),

    description:
      String(
        questionSet?.description ||
        ""
      ).trim(),

    questions,

    source:
      questionSet?.source ||
      "manual",

  };

}


// =====================================================
// NORMALISE INTERVIEW CONFIG
// =====================================================
//
// Backend remains authoritative.
//
// Important:
// We do NOT generate IDs here.
//
// A question set's ID should remain stable when the
// project is loaded/saved.
// =====================================================

function normaliseInterviewConfig(
  config
) {

  const safeConfig =
    config &&
    typeof config === "object"

      ? config

      : {};


  const sourceQuestionSets =
    Array.isArray(
      safeConfig.questionSets
    )

      ? safeConfig.questionSets

      : [];


  const questionSets =
    sourceQuestionSets

      .map(
        normaliseQuestionSet
      )

      .filter(Boolean);


  let activeQuestionSetId =
    safeConfig.activeQuestionSetId ||
    null;


  // ===================================================
  // VALIDATE ACTIVE SET
  // ===================================================

  const activeExists =
    activeQuestionSetId &&
    questionSets.some(
      questionSet =>
        String(
          questionSet.id
        ) ===
        String(
          activeQuestionSetId
        )
    );


  if (
    !activeExists
  ) {

    activeQuestionSetId =
      questionSets[0]?.id ||
      null;

  }


  // ===================================================
  // FIRST SET FALLBACK
  // ===================================================

  if (
    !activeQuestionSetId &&
    questionSets.length > 0
  ) {

    activeQuestionSetId =
      questionSets[0].id;

  }


  return {

    ...DEFAULT_INTERVIEW_CONFIG,

    ...safeConfig,

    activeQuestionSetId,

    questionSets,

    recordingEnabled:
      safeConfig.recordingEnabled !== false,

    transcriptionEnabled:
      safeConfig.transcriptionEnabled !== false,

    evaluationEnabled:
      safeConfig.evaluationEnabled !== false,

  };

}


// =====================================================
// NORMALISE PROJECT
// =====================================================
//
// All project responses pass through this function before
// being returned to the frontend.
//
// This means:
// project list
// single project
// created project
// updated project
//
// all have exactly the same project shape.
// =====================================================

function normaliseProject(
  project
) {

  if (
    !project ||
    typeof project !== "object"
  ) {

    return null;

  }


  const projectId =
    project?._id ||
    project?.id ||
    null;


  if (!projectId) {

    return null;

  }


  return {

    ...project,

    _id:
      projectId,

    name:
      project?.name ||
      "Untitled Project",

    type:
      project?.type ||
      "single",

    schema:
      project?.schema ||
      {},

    backgroundConfigs:
      project?.backgroundConfigs ||
      {},

    interviewConfig:
      normaliseInterviewConfig(
        project?.interviewConfig
      ),

  };

}


// =====================================================
// VALIDATE OBJECT ID
// =====================================================

function isValidObjectId(
  value
) {

  return mongoose.Types.ObjectId.isValid(
    value
  );

}


// =====================================================
// NORMALISE OBJECT ID
// =====================================================

function normaliseObjectId(
  value
) {

  if (
    !isValidObjectId(
      value
    )
  ) {

    return null;

  }


  return new mongoose.Types.ObjectId(
    value
  );

}


// =====================================================
// GET TENANT ID
// =====================================================

function getTenantId(
  req
) {

  return normaliseObjectId(
    req.user?.tenantId
  );

}


// =====================================================
// GET USER ID
// =====================================================

function getUserId(
  req
) {

  return normaliseObjectId(
    req.user?.userId
  );

}


// =====================================================
// GET PROJECT ACCESS
// =====================================================
//
// Supports:
//
// 1. Explicit ProjectMembership
// 2. Legacy ownership fallback
//
// Tenant isolation is always enforced.
// =====================================================

async function getProjectAccess(
  req,
  projectId,
  permission = "canView"
) {

  const userId =
    getUserId(
      req
    );


  const tenantId =
    getTenantId(
      req
    );


  const normalizedProjectId =
    normaliseObjectId(
      projectId
    );


  if (!userId) {

    return {

      allowed: false,

      status: 401,

      error:
        "INVALID_AUTHENTICATED_USER",

    };

  }


  if (!tenantId) {

    return {

      allowed: false,

      status: 400,

      error:
        "TENANT_REQUIRED",

    };

  }


  if (!normalizedProjectId) {

    return {

      allowed: false,

      status: 400,

      error:
        "INVALID_PROJECT_ID",

    };

  }


  // ===================================================
  // EXPLICIT MEMBERSHIP
  // ===================================================

  const membership =
    await ProjectMembership
      .findOne({

        tenantId,

        projectId:
          normalizedProjectId,

        userId,

      })
      .lean();


  if (
    membership
  ) {

    const allowed =
      membership
        ?.permissions?.[
          permission
        ] === true;


    if (!allowed) {

      console.warn(
        "[Projects] Permission denied",
        {

          projectId:
            normalizedProjectId.toString(),

          userId:
            userId.toString(),

          role:
            membership.role,

          permission,

        }
      );


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


    return {

      allowed:
        true,

      membership,

    };

  }


  // ===================================================
  // LEGACY OWNER FALLBACK
  // ===================================================

  const ownerProject =
    await Project
      .findOne({

        _id:
          normalizedProjectId,

        ownerId:
          userId,

      })
      .lean();


  if (
    ownerProject
  ) {

    const allowed =
      OWNER_PERMISSIONS[
        permission
      ] === true;


    if (!allowed) {

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
        ownerProject,

      membership: {

        role:
          "owner",

        permissions:
          OWNER_PERMISSIONS,

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
// GET ALL ACCESSIBLE PROJECTS
// =====================================================
//
// GET /api/projects
//
// IMPORTANT:
//
// The returned projects now include the complete
// interviewConfig from MongoDB.
//
// This is critical because the frontend uses the project
// list to populate its initial project state.
// =====================================================

router.get(
  "/",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const userId =
        getUserId(
          req
        );


      const tenantId =
        getTenantId(
          req
        );


      if (!userId) {

        return res
          .status(401)
          .json({

            success:
              false,

            error:
              "INVALID_AUTHENTICATED_USER",

          });

      }


      if (!tenantId) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "TENANT_REQUIRED",

          });

      }


      // =================================================
      // EXPLICIT MEMBERSHIPS
      // =================================================

      const memberships =
        await ProjectMembership
          .find({

            tenantId,

            userId,

            "permissions.canView":
              true,

          })
          .lean();


      const membershipProjectIds =
        memberships

          .map(
            membership =>
              membership.projectId
          )

          .filter(Boolean);


      // =================================================
      // OWNED PROJECTS
      // =================================================

      const ownedProjects =
        await Project
          .find({

            ownerId:
              userId,

          })

          .select("_id")

          .lean();


      const ownedProjectIds =
        ownedProjects

          .map(
            project =>
              project._id
          )

          .filter(Boolean);


      // =================================================
      // UNIQUE PROJECT IDS
      // =================================================

      const projectIdStrings =
        new Set(

          [

            ...membershipProjectIds,

            ...ownedProjectIds,

          ]

            .filter(Boolean)

            .map(
              id =>
                String(
                  id
                )
            )

        );


      const projectIds =
        Array.from(
          projectIdStrings
        )

          .map(
            id =>
              normaliseObjectId(
                id
              )
          )

          .filter(Boolean);


      if (
        projectIds.length === 0
      ) {

        return res
          .status(200)
          .json({

            success:
              true,

            projects:
              [],

          });

      }


      // =================================================
      // LOAD PROJECTS
      // =================================================

      const loadedProjects =
        await Project
          .find({

            _id: {

              $in:
                projectIds,

            },

          })

          .sort({

            updatedAt:
              -1,

          })

          .lean();


      // =================================================
      // MEMBERSHIP MAP
      // =================================================

      const membershipMap =
        new Map(

          memberships.map(
            membership => [

              String(
                membership.projectId
              ),

              membership,

            ]
          )

        );


      // =================================================
      // BUILD RESPONSE
      // =================================================

      const result =
        loadedProjects

          .map(
            project => {

              const hydratedProject =
                normaliseProject(
                  project
                );


              if (
                !hydratedProject
              ) {

                return null;

              }


              const membership =
                membershipMap.get(
                  String(
                    project._id
                  )
                );


              return {

                ...hydratedProject,

                access: {

                  role:
                    membership?.role ||
                    "owner",

                  permissions:
                    membership?.permissions ||
                    OWNER_PERMISSIONS,

                  legacy:
                    membership
                      ? false
                      : true,

                },

              };

            }
          )

          .filter(Boolean);


      console.log(
        "[Projects] Accessible projects",
        {

          userId:
            userId.toString(),

          tenantId:
            tenantId.toString(),

          count:
            result.length,

          projects:
            result.map(
              project => ({

                id:
                  project._id,

                name:
                  project.name,

                questionSetCount:
                  project
                    .interviewConfig
                    ?.questionSets
                    ?.length ||
                  0,

                activeQuestionSetId:
                  project
                    .interviewConfig
                    ?.activeQuestionSetId ||
                  null,

              })
            ),

        }
      );


      return res
        .status(200)
        .json({

          success:
            true,

          projects:
            result,

        });

    }
    catch (
      error
    ) {

      console.error(
        "[Projects] GET / failed",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            "PROJECT_LIST_FAILED",

          message:
            "Failed to load projects.",

        });

    }

  }
);


// =====================================================
// GET SINGLE PROJECT
// =====================================================
//
// GET /api/projects/:id
//
// The full interview configuration is always returned.
// =====================================================

router.get(
  "/:id",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } =
        req.params;


      if (
        !isValidObjectId(
          id
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "INVALID_PROJECT_ID",

            message:
              "Invalid project ID.",

          });

      }


      const projectId =
        normaliseObjectId(
          id
        );


      const access =
        await getProjectAccess(
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
              access.error,

          });

      }


      const rawProject =
        access.project ||
        await Project
          .findById(
            projectId
          )
          .lean();


      if (
        !rawProject
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            error:
              "PROJECT_NOT_FOUND",

            message:
              "Project not found.",

          });

      }


      const project =
        normaliseProject(
          rawProject
        );


      if (!project) {

        return res
          .status(500)
          .json({

            success:
              false,

            error:
              "PROJECT_NORMALISATION_FAILED",

          });

      }


      return res
        .status(200)
        .json({

          success:
            true,

          project: {

            ...project,

            access: {

              role:
                access.membership
                  ?.role ||
                "owner",

              permissions:
                access.membership
                  ?.permissions ||
                OWNER_PERMISSIONS,

              legacy:
                access.membership
                  ?.legacy ||
                false,

            },

          },

        });

    }
    catch (
      error
    ) {

      console.error(
        "[Projects] GET /:id failed",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            "PROJECT_GET_FAILED",

          message:
            "Failed to load project.",

        });

    }

  }
);


// =====================================================
// CREATE PROJECT
// =====================================================
//
// POST /api/projects
//
// interviewConfig is persisted with the project.
// =====================================================

router.post(
  "/",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const {

        name,

        type,

        schema,

        backgroundConfigs,

        interviewConfig,

        installedFromConfo,

        confoVersion,

      } =
        req.body;


      const userId =
        getUserId(
          req
        );


      const tenantId =
        getTenantId(
          req
        );


      // =================================================
      // VALIDATION
      // =================================================

      if (
        !name ||
        !String(
          name
        ).trim()
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "PROJECT_NAME_REQUIRED",

            message:
              "Project name is required.",

          });

      }


      if (!schema) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "PROJECT_SCHEMA_REQUIRED",

            message:
              "Project schema is required.",

          });

      }


      if (!userId) {

        return res
          .status(401)
          .json({

            success:
              false,

            error:
              "INVALID_AUTHENTICATED_USER",

          });

      }


      if (!tenantId) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "TENANT_REQUIRED",

          });

      }


      // =================================================
      // INTERVIEW CONFIG
      // =================================================

      const normalizedInterviewConfig =
        normaliseInterviewConfig(
          interviewConfig
        );


      // =================================================
      // CREATE PROJECT
      // =================================================

      const project =
        await Project.create({

          name:
            String(
              name
            ).trim(),

          type:
            type ||
            "single",

          schema,

          backgroundConfigs:
            backgroundConfigs ||
            {},

          interviewConfig:
            normalizedInterviewConfig,

          installedFromConfo:
            installedFromConfo ||
            null,

          confoVersion:
            confoVersion ||
            null,

          ownerId:
            userId,

        });


      // =================================================
      // OWNER MEMBERSHIP
      // =================================================

      try {

        await ProjectMembership.create({

          tenantId,

          projectId:
            project._id,

          userId,

          role:
            "owner",

          permissions:
            OWNER_PERMISSIONS,

        });

      }
      catch (
        membershipError
      ) {

        console.error(
          "[Projects] Owner membership creation failed",
          membershipError
        );


        await Project.deleteOne({

          _id:
            project._id,

        });


        throw new Error(
          "Failed to create project access membership."
        );

      }


      const hydratedProject =
        normaliseProject(
          project.toObject()
        );


      console.log(
        "[Projects] Created",
        {

          id:
            project._id,

          name:
            project.name,

          tenantId,

          questionSetCount:
            hydratedProject
              ?.interviewConfig
              ?.questionSets
              ?.length ||
            0,

        }
      );


      return res
        .status(201)
        .json({

          success:
            true,

          project: {

            ...hydratedProject,

            access: {

              role:
                "owner",

              permissions:
                OWNER_PERMISSIONS,

            },

          },

        });

    }
    catch (
      error
    ) {

      console.error(
        "[Projects] POST / failed",
        error
      );


      if (
        error?.code ===
        11000
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            error:
              "PROJECT_NAME_ALREADY_EXISTS",

            message:
              "A project with this name already exists.",

          });

      }


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            "PROJECT_CREATE_FAILED",

          message:
            error?.message ||
            "Failed to create project.",

        });

    }

  }
);


// =====================================================
// UPDATE PROJECT
// =====================================================
//
// PATCH /api/projects/:id
//
// Requires canEdit.
//
// interviewConfig is explicitly persisted.
// =====================================================

router.patch(
  "/:id",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } =
        req.params;


      if (
        !isValidObjectId(
          id
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "INVALID_PROJECT_ID",

            message:
              "Invalid project ID.",

          });

      }


      const projectId =
        normaliseObjectId(
          id
        );


      const access =
        await getProjectAccess(
          req,
          projectId,
          "canEdit"
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
              access.error,

          });

      }


      // =================================================
      // KNOWN FIELDS
      // =================================================

      const updates = {};


      // =================================================
      // NAME
      // =================================================

      if (
        req.body.name !==
        undefined
      ) {

        const name =
          String(
            req.body.name
          ).trim();


        if (!name) {

          return res
            .status(400)
            .json({

              success:
                false,

              error:
                "PROJECT_NAME_REQUIRED",

              message:
                "Project name cannot be empty.",

            });

        }


        updates.name =
          name;

      }


      // =================================================
      // TYPE
      // =================================================

      if (
        req.body.type !==
        undefined
      ) {

        updates.type =
          req.body.type;

      }


      // =================================================
      // SCHEMA
      // =================================================

      if (
        req.body.schema !==
        undefined
      ) {

        updates.schema =
          req.body.schema;

      }


      // =================================================
      // BACKGROUND CONFIG
      // =================================================

      if (
        req.body.backgroundConfigs !==
        undefined
      ) {

        updates.backgroundConfigs =
          req.body.backgroundConfigs;

      }


      // =================================================
      // AI INTERVIEWER CONFIG
      // =================================================

      if (
        req.body.interviewConfig !==
        undefined
      ) {

        updates.interviewConfig =
          normaliseInterviewConfig(
            req.body.interviewConfig
          );

      }


      // =================================================
      // CONFO METADATA
      // =================================================

      if (
        req.body.installedFromConfo !==
        undefined
      ) {

        updates.installedFromConfo =
          req.body.installedFromConfo;

      }


      if (
        req.body.confoVersion !==
        undefined
      ) {

        updates.confoVersion =
          req.body.confoVersion;

      }


      // =================================================
      // NOTHING TO UPDATE
      // =================================================

      if (
        Object.keys(
          updates
        ).length ===
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "NO_PROJECT_UPDATES",

            message:
              "No project changes were supplied.",

          });

      }


      // =================================================
      // UPDATE
      // =================================================

      const updatedProjectRaw =
        await Project.findOneAndUpdate(

          {
            _id:
              projectId,
          },

          {
            $set:
              updates,
          },

          {
            new:
              true,

            runValidators:
              true,

          }

        ).lean();


      if (
        !updatedProjectRaw
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            error:
              "PROJECT_NOT_FOUND",

            message:
              "Project not found.",

          });

      }


      const updatedProject =
        normaliseProject(
          updatedProjectRaw
        );


      const membership =
        access.membership;


      console.log(
        "[Projects] Updated",
        {

          projectId:
            projectId.toString(),

          updatedInterviewConfig:
            updatedProject
              ?.interviewConfig,

        }
      );


      return res
        .status(200)
        .json({

          success:
            true,

          project: {

            ...updatedProject,

            access: {

              role:
                membership?.role ||
                "owner",

              permissions:
                membership?.permissions ||
                OWNER_PERMISSIONS,

              legacy:
                membership?.legacy ||
                false,

            },

          },

        });

    }
    catch (
      error
    ) {

      console.error(
        "[Projects] PATCH /:id failed",
        error
      );


      if (
        error?.code ===
        11000
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            error:
              "PROJECT_NAME_ALREADY_EXISTS",

            message:
              "A project with this name already exists.",

          });

      }


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            "PROJECT_UPDATE_FAILED",

          message:
            error?.message ||
            "Failed to update project.",

        });

    }

  }
);


// =====================================================
// DELETE PROJECT
// =====================================================
//
// Requires canManageData.
//
// Deletes project and project memberships.
//
// Interviews/recordings should eventually be removed by
// a dedicated cascading deletion service.
// =====================================================

router.delete(
  "/:id",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } =
        req.params;


      if (
        !isValidObjectId(
          id
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "INVALID_PROJECT_ID",

            message:
              "Invalid project ID.",

          });

      }


      const projectId =
        normaliseObjectId(
          id
        );


      const access =
        await getProjectAccess(
          req,
          projectId,
          "canManageData"
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
              access.error,

          });

      }


      // =================================================
      // DELETE PROJECT
      // =================================================

      const project =
        await Project.findByIdAndDelete(
          projectId
        );


      if (
        !project
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            error:
              "PROJECT_NOT_FOUND",

            message:
              "Project not found.",

          });

      }


      // =================================================
      // DELETE MEMBERSHIPS
      // =================================================

      const tenantId =
        getTenantId(
          req
        );


      await ProjectMembership.deleteMany({

        tenantId,

        projectId:
          project._id,

      });


      console.log(
        "[Projects] Deleted",
        {

          projectId:
            project._id,

          membershipsRemoved:
            true,

        }
      );


      return res
        .status(200)
        .json({

          success:
            true,

          message:
            "Project deleted.",

        });

    }
    catch (
      error
    ) {

      console.error(
        "[Projects] DELETE /:id failed",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            "PROJECT_DELETE_FAILED",

          message:
            "Failed to delete project.",

        });

    }

  }
);


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default router;
