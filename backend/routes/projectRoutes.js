
// backend/routes/projectRoutes.js

import express from "express";
import mongoose from "mongoose";

import Project from "../models/project.js";
import ProjectMembership
  from "../models/projectMembership.js";

import { requireAuth }
  from "../middleware/requireAuth.js";

const router =
  express.Router();


// =====================================================
// PROJECT PERMISSION DEFAULTS
// =====================================================

const OWNER_PERMISSIONS = {

  canView: true,

  canEdit: true,

  canRun: true,

  canManageData: true,

  canViewInterviews: true,

  canViewRecordings: true,

};


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
// REQUIRE TENANT
// =====================================================

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


// =====================================================
// GET CURRENT USER ID
// =====================================================

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


// =====================================================
// FIND PROJECT MEMBERSHIP
// =====================================================

async function getMembership(
  req,
  projectId
) {

  const userId =
    getUserId(req);

  const tenantId =
    getTenantId(req);


  if (
    !userId ||
    !tenantId ||
    !projectId
  ) {

    return null;

  }


  return ProjectMembership.findOne({

    tenantId,

    projectId,

    userId,

  }).lean();

}


// =====================================================
// PROJECT ACCESS CHECK
// =====================================================

async function getProjectAccess(
  req,
  projectId,
  permission = "canView"
) {

  const userId =
    getUserId(req);

  const tenantId =
    getTenantId(req);


  if (!userId) {

    return {

      allowed: false,

      status: 400,

      error:
        "Invalid authenticated user ID.",

    };

  }


  if (!tenantId) {

    return {

      allowed: false,

      status: 400,

      error:
        "Authenticated tenant ID is required.",

    };

  }


  const membership =
    await ProjectMembership.findOne({

      tenantId,

      projectId,

      userId,

    }).lean();


  /*
  -----------------------------------------------------
  LEGACY OWNER FALLBACK
  -----------------------------------------------------

  Existing projects may not yet have a membership
  document.

  Until the migration is complete, allow the project
  owner to access their existing projects.

  When accessed this way, we return "legacy-owner".
  -----------------------------------------------------
  */

  if (!membership) {

    const ownerProject =
      await Project.findOne({

        _id:
          projectId,

        ownerId:
          userId,

      }).lean();


    if (ownerProject) {

      return {

        allowed: true,

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

      allowed: false,

      status: 403,

      error:
        "PROJECT_ACCESS_DENIED",

    };

  }


  const allowed =
    membership
      ?.permissions?.[
        permission
      ] === true;


  if (!allowed) {

    return {

      allowed: false,

      status: 403,

      error:
        "PROJECT_PERMISSION_DENIED",

      membership,

    };

  }


  return {

    allowed: true,

    membership,

  };

}


// =====================================================
// GET ALL PROJECTS
//
// Returns projects the current user can view.
//
// Includes:
// - Explicit memberships
// - Legacy owned projects
//
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
        getUserId(req);

      const tenantId =
        getTenantId(req);


      if (!userId) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid authenticated user ID.",

          });

      }


      if (!tenantId) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Authenticated tenant ID is required.",

          });

      }


      // -------------------------------------------------
      // EXPLICIT MEMBERSHIPS
      // -------------------------------------------------

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
        memberships.map(
          membership =>
            membership.projectId
        );


      // -------------------------------------------------
      // LEGACY OWNER PROJECTS
      // -------------------------------------------------

      const ownedProjects =
        await Project.find({

          ownerId:
            userId,

        })
        .select("_id")
        .lean();


      const ownedProjectIds =
        ownedProjects.map(
          project =>
            project._id
        );


      // -------------------------------------------------
      // COMBINE PROJECT IDS
      // -------------------------------------------------

      const projectIdStrings =
        new Set(

          [
            ...membershipProjectIds,
            ...ownedProjectIds,
          ]
            .filter(Boolean)
            .map(
              id =>
                id.toString()
            )

        );


      const projectIds =
        Array.from(
          projectIdStrings
        )
          .map(
            id =>
              new mongoose.Types.ObjectId(
                id
              )
          );


      if (!projectIds.length) {

        return res
          .status(200)
          .json({

            success: true,

            projects: [],

          });

      }


      const projects =
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


      // -------------------------------------------------
      // ATTACH ACCESS INFORMATION
      // -------------------------------------------------

      const membershipMap =
        new Map(

          memberships.map(
            membership => [
              membership.projectId.toString(),
              membership,
            ]
          )

        );


      const result =
        projects.map(
          project => {

            const membership =
              membershipMap.get(
                project._id.toString()
              );


            if (membership) {

              return {

                ...project,

                access: {

                  role:
                    membership.role,

                  permissions:
                    membership.permissions,

                },

              };

            }


            // Legacy owner

            return {

              ...project,

              access: {

                role:
                  "owner",

                permissions:
                  OWNER_PERMISSIONS,

                legacy:
                  true,

              },

            };

          }
        );


      return res
        .status(200)
        .json({

          success: true,

          projects:
            result,

        });

    }
    catch (error) {

      console.error(
        "[Projects] GET /",
        error
      );


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to load projects.",

        });

    }

  }
);


// =====================================================
// GET SINGLE PROJECT
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

            success: false,

            message:
              "Invalid project ID.",

          });

      }


      const projectId =
        new mongoose.Types.ObjectId(
          id
        );


      const access =
        await getProjectAccess(
          req,
          projectId,
          "canView"
        );


      if (!access.allowed) {

        return res
          .status(
            access.status ||
              403
          )
          .json({

            success: false,

            message:
              access.error,

          });

      }


      const project =
        access.project ||
        await Project
          .findById(
            projectId
          )
          .lean();


      if (!project) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Project not found.",

          });

      }


      return res
        .status(200)
        .json({

          success: true,

          project: {

            ...project,

            access: {

              role:
                access.membership?.role ||
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
    catch (error) {

      console.error(
        "[Projects] GET /:id",
        error
      );


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to load project.",

        });

    }

  }
);


// =====================================================
// CREATE PROJECT
//
// IMPORTANT:
// The creator automatically receives an owner
// ProjectMembership.
//
// This is the point where the model becomes part
// of the real backend lifecycle.
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
        installedFromConfo,
        confoVersion,
      } =
        req.body;


      const userId =
        getUserId(req);

      const tenantId =
        getTenantId(req);


      // -------------------------------------------------
      // VALIDATION
      // -------------------------------------------------

      if (
        !name ||
        !name.trim()
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Project name is required.",

          });

      }


      if (!schema) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Project schema is required.",

          });

      }


      if (!userId) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid authenticated user ID.",

          });

      }


      if (!tenantId) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Authenticated tenant ID is required.",

          });

      }


      // -------------------------------------------------
      // CREATE PROJECT
      // -------------------------------------------------

      const project =
        await Project.create({

          name:
            name.trim(),

          type:
            type ||
            "single",

          schema,

          backgroundConfigs:
            backgroundConfigs ||
            {},

          installedFromConfo:
            installedFromConfo ||
            null,

          confoVersion:
            confoVersion ||
            null,

          ownerId:
            userId,

        });


      // -------------------------------------------------
      // CREATE OWNER MEMBERSHIP
      // -------------------------------------------------

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

        /*
        -------------------------------------------------
        IMPORTANT

        Do not leave an orphaned project if the owner
        membership cannot be created.
        -------------------------------------------------
        */

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


      console.log(
        "[Projects] Created",
        {

          id:
            project._id,

          name:
            project.name,

          ownerId:
            project.ownerId,

          tenantId,

          membership:
            "owner",

        }
      );


      return res
        .status(201)
        .json({

          success: true,

          project: {

            ...project.toObject(),

            access: {

              role:
                "owner",

              permissions:
                OWNER_PERMISSIONS,

            },

          },

        });

    }
    catch (error) {

      console.error(
        "[Projects] POST /",
        error
      );


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to create project.",

        });

    }

  }
);


// =====================================================
// UPDATE PROJECT
//
// Requires:
// canEdit
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

            success: false,

            message:
              "Invalid project ID.",

          });

      }


      const projectId =
        new mongoose.Types.ObjectId(
          id
        );


      const access =
        await getProjectAccess(
          req,
          projectId,
          "canEdit"
        );


      if (!access.allowed) {

        return res
          .status(
            access.status ||
              403
          )
          .json({

            success: false,

            message:
              access.error,

          });

      }


      // -------------------------------------------------
      // KNOWN FIELDS ONLY
      // -------------------------------------------------

      const updates = {};


      if (
        req.body.name !==
        undefined
      ) {

        if (
          !req.body.name.trim()
        ) {

          return res
            .status(400)
            .json({

              success: false,

              message:
                "Project name cannot be empty.",

            });

        }


        updates.name =
          req.body.name.trim();

      }


      if (
        req.body.type !==
        undefined
      ) {

        updates.type =
          req.body.type;

      }


      if (
        req.body.schema !==
        undefined
      ) {

        updates.schema =
          req.body.schema;

      }


      if (
        req.body.backgroundConfigs !==
        undefined
      ) {

        updates.backgroundConfigs =
          req.body.backgroundConfigs;

      }


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


      const project =
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


      if (!project) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Project not found.",

          });

      }


      const membership =
        access.membership;


      return res
        .status(200)
        .json({

          success: true,

          project: {

            ...project,

            access: {

              role:
                membership?.role ||
                "owner",

              permissions:
                membership?.permissions ||
                OWNER_PERMISSIONS,

            },

          },

        });

    }
    catch (error) {

      console.error(
        "[Projects] PATCH /:id",
        error
      );


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to update project.",

        });

    }

  }
);


// =====================================================
// DELETE PROJECT
//
// Requires:
// canManageData
//
// Owners receive this automatically.
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

            success: false,

            message:
              "Invalid project ID.",

          });

      }


      const projectId =
        new mongoose.Types.ObjectId(
          id
        );


      const access =
        await getProjectAccess(
          req,
          projectId,
          "canManageData"
        );


      if (!access.allowed) {

        return res
          .status(
            access.status ||
              403
          )
          .json({

            success: false,

            message:
              access.error,

          });

      }


      const project =
        await Project.findByIdAndDelete(
          projectId
        );


      if (!project) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Project not found.",

          });

      }


      // -------------------------------------------------
      // DELETE ALL MEMBERSHIPS
      // -------------------------------------------------

      await ProjectMembership.deleteMany({

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

          success: true,

          message:
            "Project deleted.",

        });

    }
    catch (error) {

      console.error(
        "[Projects] DELETE /:id",
        error
      );


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to delete project.",

        });

    }

  }
);


export default router;
