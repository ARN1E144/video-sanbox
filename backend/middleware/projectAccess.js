// backend/middleware/projectAccess.js

  console.log(
  "🔥 PROJECT ACCESS MODULE LOADED:",
  import.meta.url
);



import mongoose from "mongoose";

import Project from "../models/project.js";
import ProjectMembership
  from "../models/projectMembership.js";

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


// =====================================================
// CURRENT USER ID
// =====================================================
//
// IMPORTANT:
//
// Your existing authentication middleware exposes:
//
// req.user.userId
//
// We use that consistently everywhere.
// =====================================================

function getAuthenticatedUserId(
  req
) {

  const rawUserId =
    req.user?.userId;


  if (!rawUserId) {

    return null;

  }


  if (
    !isValidObjectId(
      rawUserId
    )
  ) {

    return null;

  }


  return new mongoose.Types.ObjectId(
    rawUserId
  );

}


// =====================================================
// TENANT ID
// =====================================================
//
// Uses the same authenticated tenant identity that is
// stored on ProjectMembership.
// =====================================================

function getAuthenticatedTenantId(
  req
) {

  const rawTenantId =
    req.user?.tenantId;


  if (!rawTenantId) {

    return null;

  }


  if (
    !isValidObjectId(
      rawTenantId
    )
  ) {

    return null;

  }


  return new mongoose.Types.ObjectId(
    rawTenantId
  );

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
// Permission examples:
//
// canView
// canEdit
// canRun
// canManageData
// canViewInterviews
// canViewRecordings
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
  // AUTHENTICATED USER
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
  // USER VALIDATION
  // ===================================================

  if (!userId) {

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

  if (!tenantId) {

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

  if (!projectId) {

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
    projectId instanceof mongoose.Types.ObjectId

      ? projectId

      : (
          isValidObjectId(
            projectId
          )
            ? new mongoose.Types.ObjectId(
                projectId
              )
            : null
        );


  if (!normalizedProjectId) {

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
      .findOne({

        tenantId,

        projectId:
          normalizedProjectId,

        userId,

      })
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
  // EXPLICIT MEMBERSHIP
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
  //
  // Existing projects may predate ProjectMembership.
  //
  // New projects should have a membership document.
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
// EXPRESS MIDDLEWARE
// =====================================================
//
// Optional reusable middleware:
//
// requireProjectPermission("canRun")
//
// It expects:
// req.params.projectId
// OR
// req.params.id
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

      const projectId =
        req.params.projectId ||
        req.params.id;


      if (!projectId) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "PROJECT_ID_REQUIRED",

          });

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


      // Make access available to downstream handlers.

      req.projectAccess =
        access;


      next();

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

