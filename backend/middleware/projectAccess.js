// backend/middleware/projectAccess.js

import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import Project from "../models/project.js";
import ProjectMembership
  from "../models/projectMembership.js";


// =====================================================
// MODULE LOADED
// =====================================================

console.log(
  "🔥 PROJECT ACCESS MODULE LOADED:",
  import.meta.url
);


// =====================================================
// OBJECT ID HELPERS
// =====================================================

function isValidObjectId(
  value
) {

  return mongoose.Types.ObjectId.isValid(
    value
  );

}


function normalizeObjectId(
  value
) {

  if (
    !value
  ) {

    return null;

  }


  if (
    value instanceof mongoose.Types.ObjectId
  ) {

    return value;

  }


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
// AUTHENTICATED USER ID
// =====================================================
//
// Canonical authentication payload:
//
// req.user.userId
//
// =====================================================

function getAuthenticatedUserId(
  req
) {

  return normalizeObjectId(
    req.user?.userId
  );

}


// =====================================================
// AUTHENTICATED TENANT ID
// =====================================================
//
// Canonical authentication payload:
//
// req.user.tenantId
//
// =====================================================

function getAuthenticatedTenantId(
  req
) {

  return normalizeObjectId(
    req.user?.tenantId
  );

}


// =====================================================
// REQUIRE AUTH
// =====================================================
//
// Verifies the JWT access token and creates the canonical:
//
// req.user
//
// shape:
//
// {
//   userId,
//   tenantId,
//   role
// }
//
// =====================================================

export function requireAuth(
  req,
  res,
  next
) {

  // ---------------------------------------------------
  // Browser preflight
  // ---------------------------------------------------

  if (
    req.method === "OPTIONS"
  ) {

    return next();

  }


  try {

    // =================================================
    // JWT SECRET
    // =================================================

    const secret =
      process.env.JWT_ACCESS_SECRET;


    if (
      !secret
    ) {

      console.error(
        "[requireAuth] JWT_ACCESS_SECRET is not set"
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            "JWT_ACCESS_SECRET_NOT_SET",

        });

    }


    // =================================================
    // AUTH HEADER
    // =================================================

    const authorization =
      req.headers.authorization ||
      "";


    const [
      scheme,
      token,
    ] =
      authorization.split(" ");


    if (
      scheme !== "Bearer" ||
      !token
    ) {

      console.warn(
        "[requireAuth] Missing or invalid Authorization header"
      );


      return res
        .status(401)
        .json({

          success:
            false,

          error:
            "MISSING_OR_INVALID_AUTHORIZATION",

        });

    }


    // =================================================
    // VERIFY TOKEN
    // =================================================

    const payload =
      jwt.verify(
        token,
        secret
      );


    // =================================================
    // VALIDATE REQUIRED CLAIMS
    // =================================================

    const userId =
      normalizeObjectId(
        payload?.userId
      );


    const tenantId =
      normalizeObjectId(
        payload?.tenantId
      );


    if (
      !userId
    ) {

      console.error(
        "[requireAuth] JWT missing valid userId",
        {
          payload,
        }
      );


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

      console.error(
        "[requireAuth] JWT missing valid tenantId",
        {
          payload,
        }
      );


      return res
        .status(401)
        .json({

          success:
            false,

          error:
            "TENANT_CONTEXT_MISSING",

        });

    }


    // =================================================
    // CANONICAL REQUEST USER
    // =================================================

    req.user = {

      userId:
        userId.toString(),

      tenantId:
        tenantId.toString(),

      role:
        payload?.role ||
        null,

    };


    console.log(
      "[requireAuth] Authenticated user:",
      req.user
    );


    return next();

  }
  catch (
    error
  ) {

    console.error(
      "[requireAuth] JWT error:",
      error?.message
    );


    return res
      .status(401)
      .json({

        success:
          false,

        error:
          "INVALID_OR_EXPIRED_ACCESS_TOKEN",

      });

  }

}


// =====================================================
// PROJECT ACCESS
// =====================================================
//
// Returns:
//
// {
//   allowed,
//   project,
//   membership
// }
//
// Examples:
//
// canView
// canEdit
// canRun
// canManageData
// canViewInterviews
// canViewRecordings
// canViewEvaluations
//
// =====================================================

export async function getProjectAccess(
  req,
  projectId,
  permission = "canView"
) {

  console.log(
    "🔥 PROJECT ACCESS FUNCTION CALLED"
  );


  // ===================================================
  // USER
  // ===================================================

  const userId =
    getAuthenticatedUserId(
      req
    );


  // ===================================================
  // TENANT
  // ===================================================

  const tenantId =
    getAuthenticatedTenantId(
      req
    );


  // ===================================================
  // DEBUG
  // ===================================================

  console.log(
    "[ProjectAccess] LOOKUP",
    {

      tenantId:
        tenantId?.toString?.() ||
        null,

      projectId:
        projectId?.toString?.() ||
        String(
          projectId ||
          ""
        ),

      userId:
        userId?.toString?.() ||
        null,

      permission,

      reqUser:
        req.user,

    }
  );


  // ===================================================
  // AUTH VALIDATION
  // ===================================================

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


  // ===================================================
  // TENANT VALIDATION
  // ===================================================

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


  // ===================================================
  // PROJECT ID VALIDATION
  // ===================================================

  if (
    !projectId
  ) {

    return {

      allowed:
        false,

      status:
        400,

      error:
        "PROJECT_ID_REQUIRED",

    };

  }


  const normalizedProjectId =
    normalizeObjectId(
      projectId
    );


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


  // ===================================================
  // MEMBERSHIP LOOKUP
  // ===================================================

  const membership =
    await ProjectMembership
      .findOne(
        {

          tenantId,

          projectId:
            normalizedProjectId,

          userId,

        }
      )
      .lean();


  console.log(
    "[ProjectAccess] MEMBERSHIP RESULT",
    {

      found:
        Boolean(
          membership
        ),

      membership:
        membership
          ? {

              id:
                membership._id,

              tenantId:
                membership.tenantId,

              projectId:
                membership.projectId,

              userId:
                membership.userId,

              role:
                membership.role,

              permissions:
                membership.permissions,

            }
          : null,

    }
  );


  // ===================================================
  // EXPLICIT PROJECT MEMBERSHIP
  // ===================================================

  if (
    membership
  ) {

    const permissionAllowed =
      membership
        ?.permissions?.[
          permission
        ] === true;


    if (
      !permissionAllowed
    ) {

      console.warn(
        "[ProjectAccess] Permission denied",
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

        project:
          null,

        membership,

      };

    }


    // =================================================
    // PROJECT LOOKUP
    // =================================================

    const project =
      await Project
        .findOne(
          {
            _id:
              normalizedProjectId,

            // IMPORTANT:
            //
            // Do not allow a project from another tenant
            // to be returned accidentally.
            //
            // Project itself currently doesn't have tenantId,
            // so the membership remains the tenant boundary.
            //
          }
        )
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
  // LEGACY OWNER FALLBACK
  // ===================================================
  //
  // Some older projects may not have a ProjectMembership.
  //
  // ===================================================

  const ownedProject =
    await Project
      .findOne(
        {

          _id:
            normalizedProjectId,

          ownerId:
            userId,

        }
      )
      .lean();


  if (
    ownedProject
  ) {

    const OWNER_PERMISSIONS = {

      canView:
        true,

      canEdit:
        true,

      canRun:
        true,

      canManageData:
        true,

      canViewInterviews:
        true,

      canViewRecordings:
        true,

      canViewEvaluations:
        true,

      canCreateData:
        true,

      canEditData:
        true,

      canDeleteData:
        true,

      canExportData:
        true,

    };


    console.warn(
      "[ProjectAccess] Using legacy owner fallback",
      {

        projectId:
          normalizedProjectId.toString(),

        userId:
          userId.toString(),

      }
    );


    if (
      OWNER_PERMISSIONS[
        permission
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
          OWNER_PERMISSIONS,

        legacy:
          true,

      },

    };

  }


  // ===================================================
  // NO ACCESS
  // ===================================================

  console.warn(
    "[ProjectAccess] PROJECT_ACCESS_DENIED",
    {

      tenantId:
        tenantId.toString(),

      projectId:
        normalizedProjectId.toString(),

      userId:
        userId.toString(),

    }
  );


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
// REQUIRE PROJECT PERMISSION
// =====================================================
//
// Usage:
//
// router.get(
//   "/projects/:projectId/interviews",
//   requireAuth,
//   requireProjectPermission("canViewInterviews"),
//   controller
// );
//
// =====================================================

export function requireProjectPermission(
  permission
) {

  return async (
    req,
    res,
    next
  ) => {

    try {

      // =================================================
      // PROJECT ID
      // =================================================

      const projectId =
        req.params?.projectId ||
        req.params?.id;


      if (
        !projectId
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "PROJECT_ID_REQUIRED",

          });

      }


      // =================================================
      // PROJECT ACCESS
      // =================================================

      const access =
        await getProjectAccess(
          req,
          projectId,
          permission
        );


      // =================================================
      // DENIED
      // =================================================

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


      // =================================================
      // ATTACH ACCESS CONTEXT
      // =================================================

      req.projectAccess =
        access;


      // =================================================
      // CONTINUE
      // =================================================

      return next();

    }
    catch (
      error
    ) {

      console.error(
        "[ProjectAccess] Middleware failed",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            "PROJECT_ACCESS_CHECK_FAILED",

        });

    }

  };

}


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {

  requireAuth,

  getProjectAccess,

  requireProjectPermission,

};