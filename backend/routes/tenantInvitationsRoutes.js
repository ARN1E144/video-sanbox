// backend/routes/tenantInvitationsRoutes.js

import express from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";

import User from "../models/User.js";
import Tenant from "../models/Tenant.js";
import Membership from "../models/Membership.js";
import Project from "../models/project.js";
import ProjectMembership from "../models/projectMembership.js";
import TenantInvitation from "../models/TenantInvitation.js";

import {
  requireAuth,
} from "../middleware/requireAuth.js";

import requireTenant from "../middleware/requireTenant.js";

import {
  signAccessToken,
  signRefreshToken,
} from "../utils/authTokens.js";


const router =
  express.Router();


// =====================================================
// INVITATION CONTRACT
// =====================================================
//
// This route currently implements:
//
//   type: "tenant"
//   resource: { type: "tenant", id: tenantId }
//
// The invitation/token/URL distinction is intentional.
//
// Invitation = business object
// Token      = transport credential
// URL        = delivery mechanism
// Acceptance = authorization transition
//
// =====================================================

const INVITATION_TYPE =
  "tenant";

const RESOURCE_TYPE =
  "tenant";

const INVITATION_VALID_DAYS =
  7;


// =====================================================
// HELPERS
// =====================================================

function hashToken(
  token
) {

  return crypto
    .createHash(
      "sha256"
    )
    .update(
      token
    )
    .digest(
      "hex"
    );

}


function createInviteToken() {

  return crypto
    .randomBytes(
      32
    )
    .toString(
      "hex"
    );

}


function normaliseEmail(
  email
) {

  return String(
    email ||
    ""
  )
    .trim()
    .toLowerCase();

}


function normaliseId(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  if (
    typeof value === "object"
  ) {

    return normaliseId(
      value._id ??
      value.id
    );

  }


  return String(
    value
  );

}


// =====================================================
// INVITATION EXPIRY
// =====================================================

function createInvitationExpiry() {

  return new Date(

    Date.now() +
      INVITATION_VALID_DAYS *
        24 *
        60 *
        60 *
        1000

  );

}


// =====================================================
// EXPIRE INVITATION IF NECESSARY
// =====================================================
//
// Expiry remains derived from expiresAt.
//
// We do not need a background worker merely to make the
// invitation unusable.
//
// When a pending invitation is encountered after expiry,
// it is transitioned to:
//
//   status: "expired"
//
// This gives us both:
//
//   - immediate security enforcement
//   - accurate historical lifecycle
//
// =====================================================

async function expireIfNecessary(
  invitation
) {

  if (
    !invitation
  ) {

    return null;

  }


  if (
    invitation.status !==
    "pending"
  ) {

    return invitation;

  }


  if (
    !invitation.expiresAt ||
    invitation.expiresAt >
      new Date()
  ) {

    return invitation;

  }


  invitation.status =
    "expired";


  await invitation.save();


  return invitation;

}


// =====================================================
// TENANT ROLE DEFAULTS
// =====================================================

function getTenantPermissions(
  role
) {

  switch (
    role
  ) {

    case "admin":

      return {

        canBuild:
          true,

        canInvite:
          true,

      };


    case "builder":

      return {

        canBuild:
          true,

        canInvite:
          false,

      };


    case "member":

    default:

      return {

        canBuild:
          false,

        canInvite:
          false,

      };

  }

}


// =====================================================
// PROJECT ROLE DEFAULTS
// =====================================================

function getProjectPermissions(
  role
) {

  switch (
    role
  ) {

    case "admin":

      return {

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

        canViewTranscriptions:
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


    case "editor":

      return {

        canView:
          true,

        canEdit:
          true,

        canRun:
          true,

        canManageData:
          false,

        canViewInterviews:
          true,

        canViewRecordings:
          true,

        canViewTranscriptions:
          true,

        canViewEvaluations:
          true,

        canCreateData:
          true,

        canEditData:
          true,

        canDeleteData:
          false,

        canExportData:
          false,

      };


    case "viewer":

    default:

      return {

        canView:
          true,

        canEdit:
          false,

        canRun:
          true,

        canManageData:
          false,

        canViewInterviews:
          false,

        canViewRecordings:
          false,

        canViewTranscriptions:
          false,

        canViewEvaluations:
          false,

        canCreateData:
          false,

        canEditData:
          false,

        canDeleteData:
          false,

        canExportData:
          false,

      };

  }

}


// =====================================================
// VALIDATION CONSTANTS
// =====================================================

const ALLOWED_TENANT_ROLES = [

  "admin",
  "builder",
  "member",

];


const ALLOWED_PROJECT_ROLES = [

  "admin",
  "editor",
  "viewer",

];


// =====================================================
// AUTHORISATION
// =====================================================

function requireInviteManagement(
  req,
  res,
  next
) {

  const role =
    req.user?.role;


  if (
    role !== "owner" &&
    role !== "admin"
  ) {

    return res
      .status(403)
      .json({

        error:
          "Only tenant owners and admins can manage invitations",

      });

  }


  next();

}


// =====================================================
// VALIDATE TENANT ROLE
// =====================================================

function validateTenantRole(
  tenantRole
) {

  if (
    !ALLOWED_TENANT_ROLES.includes(
      tenantRole
    )
  ) {

    return {

      valid:
        false,

      error:
        "Invalid tenant role",

    };

  }


  return {

    valid:
      true,

  };

}


// =====================================================
// BUILD INVITATION CONTRACT
// =====================================================
//
// Keeps the resource/type representation consistent
// across create/update/preview/accept responses.
//
// =====================================================

function getInvitationContract(
  invitation
) {

  return {

    id:
      invitation._id,

    type:
      invitation.type ||
      INVITATION_TYPE,

    status:
      invitation.status,

    tenantId:
      invitation.tenantId,

    resource: {

      type:
        invitation.resource?.type ||
        RESOURCE_TYPE,

      id:
        invitation.resource?.id ||
        invitation.tenantId,

    },

    email:
      invitation.email,

    tenantRole:
      invitation.tenantRole,

    tenantPermissions:
      invitation.tenantPermissions,

    projects:
      invitation.projects,

    expiresAt:
      invitation.expiresAt,

    acceptedAt:
      invitation.acceptedAt ||
      null,

    acceptedByUserId:
      invitation.acceptedByUserId ||
      null,

    revokedAt:
      invitation.revokedAt ||
      null,

    createdAt:
      invitation.createdAt,

    updatedAt:
      invitation.updatedAt,

  };

}


// =====================================================
// VALIDATE PROJECT ASSIGNMENTS
// =====================================================
//
// Project currently has no tenantId.
//
// Tenant ownership is therefore established by checking
// that the project owner belongs to the current tenant.
//
// =====================================================

async function validateProjectAssignments(
  {
    tenantId,
    projects,
    existingUser = null,
    checkExistingMembership = false,
  }
) {

  if (
    !Array.isArray(
      projects
    )
  ) {

    return {

      ok:
        false,

      status:
        400,

      error:
        "projects must be an array",

    };

  }


  const projectAssignments =
    [];


  const seenProjects =
    new Set();


  for (
    const assignment
    of projects
  ) {

    const projectId =
      assignment?.projectId;


    if (
      !projectId
    ) {

      continue;

    }


    const projectIdString =
      normaliseId(
        projectId
      );


    if (
      !projectIdString
    ) {

      continue;

    }


    if (
      seenProjects.has(
        projectIdString
      )
    ) {

      continue;

    }


    seenProjects.add(
      projectIdString
    );


    const project =
      await Project.findById(
        projectId
      ).lean();


    if (
      !project
    ) {

      return {

        ok:
          false,

        status:
          404,

        error:
          `Project not found: ${projectId}`,

      };

    }


    // -------------------------------------------------
    // VERIFY PROJECT BELONGS TO TENANT
    // -------------------------------------------------

    const projectOwnerMembership =
      await Membership.findOne({

        tenantId,

        userId:
          project.ownerId,

      });


    if (
      !projectOwnerMembership
    ) {

      return {

        ok:
          false,

        status:
          403,

        error:
          "Project does not belong to the current tenant",

      };

    }


    const role =
      ALLOWED_PROJECT_ROLES.includes(
        assignment?.role
      )
        ? assignment.role
        : "viewer";


    // -------------------------------------------------
    // EXISTING PROJECT MEMBERSHIP
    // -------------------------------------------------

    if (
      checkExistingMembership &&
      existingUser
    ) {

      const existingProjectMembership =
        await ProjectMembership.findOne({

          tenantId,

          projectId:
            project._id,

          userId:
            existingUser._id,

        });


      if (
        existingProjectMembership
      ) {

        return {

          ok:
            false,

          status:
            409,

          error:
            "This user is already a member of this project",

        };

      }

    }


    projectAssignments.push({

      projectId:
        project._id,

      role,

      permissions:
        assignment?.permissions ||
        getProjectPermissions(
          role
        ),

    });

  }


  return {

    ok:
      true,

    projectAssignments,

  };

}


// =====================================================
// GET PENDING INVITATIONS
// =====================================================
//
// GET /api/tenant/invitations
//
// Only status === "pending" invitations are returned.
//
// Expired invitations are transitioned to "expired"
// when encountered.
//
// =====================================================

router.get(
  "/invitations",
  requireAuth,
  requireTenant,
  requireInviteManagement,
  async (
    req,
    res
  ) => {

    try {

      const tenantId =
        req.user.tenantId;


      const invitations =
        await TenantInvitation
          .find({

            tenantId,

            status:
              "pending",

          })
          .populate(
            "invitedByUserId",
            "firstName lastName email"
          )
          .populate(
            "projects.projectId",
            "name"
          )
          .sort({

            createdAt:
              -1,

          })
          .lean();


      const now =
        new Date();


      const activeInvitations =
        [];


      for (
        const invitation
        of invitations
      ) {

        if (
          invitation.expiresAt &&
          invitation.expiresAt <=
            now
        ) {

          await TenantInvitation.updateOne(

            {
              _id:
                invitation._id,

              status:
                "pending",

            },

            {
              $set: {

                status:
                  "expired",

              },

            }

          );


          continue;

        }


        activeInvitations.push(
          invitation
        );

      }


      return res.json({

        ok:
          true,

        invitations:
          activeInvitations,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[TenantInvitations] GET failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to load invitations",

        });

    }

  }
);


// =====================================================
// CREATE INVITATION
// =====================================================
//
// POST /api/tenant/invitations
//
// =====================================================

router.post(
  "/invitations",
  requireAuth,
  requireTenant,
  requireInviteManagement,
  async (
    req,
    res
  ) => {

    try {

      const tenantId =
        req.user.tenantId;


      const {
        email,
        tenantRole =
          "member",
        projects =
          [],
      } =
        req.body;


      const normalisedEmail =
        normaliseEmail(
          email
        );


      if (
        !normalisedEmail
      ) {

        return res
          .status(400)
          .json({

            error:
              "Email is required",

          });

      }


      const tenantRoleValidation =
        validateTenantRole(
          tenantRole
        );


      if (
        !tenantRoleValidation.valid
      ) {

        return res
          .status(400)
          .json({

            error:
              tenantRoleValidation.error,

          });

      }


      const tenant =
        await Tenant.findById(
          tenantId
        );


      if (
        !tenant
      ) {

        return res
          .status(404)
          .json({

            error:
              "Tenant not found",

          });

      }


      // -------------------------------------------------
      // PREVENT SELF INVITE
      // -------------------------------------------------

      const inviter =
        await User.findById(
          req.user.userId
        )
          .select(
            "email"
          )
          .lean();


      if (
        inviter?.email?.toLowerCase() ===
        normalisedEmail
      ) {

        return res
          .status(400)
          .json({

            error:
              "You are already a member of this tenant",

          });

      }


      // -------------------------------------------------
      // EXISTING USER
      // -------------------------------------------------

      const existingUser =
        await User.findOne({

          email:
            normalisedEmail,

        });


      let existingTenantMembership =
        null;


      if (
        existingUser
      ) {

        existingTenantMembership =
          await Membership.findOne({

            tenantId,

            userId:
              existingUser._id,

          });

      }


      // -------------------------------------------------
      // EXISTING PENDING INVITATION
      // -------------------------------------------------

      const existingInvitation =
        await TenantInvitation.findOne({

          tenantId,

          email:
            normalisedEmail,

          status:
            "pending",

        });


      if (
        existingInvitation
      ) {

        if (
          existingInvitation.expiresAt <=
          new Date()
        ) {

          existingInvitation.status =
            "expired";

          await existingInvitation.save();

        }
        else {

          return res
            .status(409)
            .json({

              error:
                "A pending invitation already exists for this email",

              invitationId:
                existingInvitation._id,

            });

        }

      }


      // -------------------------------------------------
      // PROJECT VALIDATION
      // -------------------------------------------------

      const projectValidation =
        await validateProjectAssignments({

          tenantId,

          projects,

          existingUser,

          checkExistingMembership:
            Boolean(
              existingUser &&
              existingTenantMembership
            ),

        });


      if (
        !projectValidation.ok
      ) {

        return res
          .status(
            projectValidation.status
          )
          .json({

            error:
              projectValidation.error,

          });

      }


      // -------------------------------------------------
      // SECURE TOKEN
      // -------------------------------------------------

      const rawToken =
        createInviteToken();


      const tokenHash =
        hashToken(
          rawToken
        );


      const expiresAt =
        createInvitationExpiry();


      // -------------------------------------------------
      // CREATE INVITATION
      // -------------------------------------------------

      const invitation =
        await TenantInvitation.create({

          type:
            INVITATION_TYPE,

          resource: {

            type:
              RESOURCE_TYPE,

            id:
              tenantId,

          },

          tenantId,

          email:
            normalisedEmail,

          invitedByUserId:
            req.user.userId,

          tenantRole,

          tenantPermissions:
            getTenantPermissions(
              tenantRole
            ),

          projects:
            projectValidation.projectAssignments,

          tokenHash,

          expiresAt,

          status:
            "pending",

        });


      // -------------------------------------------------
      // DEVELOPMENT ONLY
      // -------------------------------------------------

      if (
        process.env.NODE_ENV !==
        "production"
      ) {

        console.log(
          "[TenantInvitations] DEV INVITE",
          {

            invitationId:
              invitation._id,

            email:
              normalisedEmail,

            tenant:
              tenant.name,

            token:
              rawToken,

          }
        );

      }


      return res
        .status(201)
        .json({

          ok:
            true,

          invitation:
            getInvitationContract(
              invitation
            ),

          // Development only.
          devInviteToken:
            process.env.NODE_ENV !==
            "production"
              ? rawToken
              : undefined,

        });

    }
    catch (
      error
    ) {

      console.error(
        "[TenantInvitations] POST failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to create invitation",

        });

    }

  }
);


// =====================================================
// UPDATE PENDING INVITATION
// =====================================================

router.patch(
  "/invitations/:id",
  requireAuth,
  requireTenant,
  requireInviteManagement,
  async (
    req,
    res
  ) => {

    try {

      const tenantId =
        req.user.tenantId;


      const invitationId =
        req.params.id;


      const {
        tenantRole =
          "member",
        projects =
          [],
      } =
        req.body;


      const invitation =
        await TenantInvitation.findOne({

          _id:
            invitationId,

          tenantId,

          status:
            "pending",

        });


      if (
        !invitation
      ) {

        return res
          .status(404)
          .json({

            error:
              "Pending invitation not found or expired",

          });

      }


      if (
        invitation.expiresAt <=
        new Date()
      ) {

        invitation.status =
          "expired";

        await invitation.save();


        return res
          .status(404)
          .json({

            error:
              "Pending invitation not found or expired",

          });

      }


      const tenantRoleValidation =
        validateTenantRole(
          tenantRole
        );


      if (
        !tenantRoleValidation.valid
      ) {

        return res
          .status(400)
          .json({

            error:
              tenantRoleValidation.error,

          });

      }


      const existingUser =
        await User.findOne({

          email:
            invitation.email,

        });


      const projectValidation =
        await validateProjectAssignments({

          tenantId,

          projects,

          existingUser,

          checkExistingMembership:
            false,

        });


      if (
        !projectValidation.ok
      ) {

        return res
          .status(
            projectValidation.status
          )
          .json({

            error:
              projectValidation.error,

          });

      }


      invitation.tenantRole =
        tenantRole;


      invitation.tenantPermissions =
        getTenantPermissions(
          tenantRole
        );


      invitation.projects =
        projectValidation.projectAssignments;


      // IMPORTANT:
      //
      // tokenHash and expiresAt remain unchanged.
      //
      // The existing invitation URL remains valid.

      await invitation.save();


      return res.json({

        ok:
          true,

        invitation:
          getInvitationContract(
            invitation
          ),

      });

    }
    catch (
      error
    ) {

      console.error(
        "[TenantInvitations] PATCH failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to update invitation",

        });

    }

  }
);


// =====================================================
// ROTATE INVITATION TOKEN
// =====================================================
//
// POST /api/tenant/invitations/:id/link
//
// This does NOT create a new invitation.
//
// It rotates the transport credential attached to the
// existing invitation.
//
// =====================================================

router.post(
  "/invitations/:id/link",
  requireAuth,
  requireTenant,
  requireInviteManagement,
  async (
    req,
    res
  ) => {

    try {

      const tenantId =
        req.user.tenantId;


      const invitationId =
        req.params.id;


      const invitation =
        await TenantInvitation.findOne({

          _id:
            invitationId,

          tenantId,

          status:
            "pending",

        });


      if (
        !invitation
      ) {

        return res
          .status(404)
          .json({

            error:
              "Pending invitation not found or expired",

          });

      }


      if (
        invitation.expiresAt <=
        new Date()
      ) {

        invitation.status =
          "expired";

        await invitation.save();


        return res
          .status(404)
          .json({

            error:
              "Pending invitation not found or expired",

          });

      }


      const rawToken =
        createInviteToken();


      invitation.tokenHash =
        hashToken(
          rawToken
        );


      invitation.expiresAt =
        createInvitationExpiry();


      invitation.status =
        "pending";


      await invitation.save();


      if (
        process.env.NODE_ENV !==
        "production"
      ) {

        console.log(
          "[TenantInvitations] DEV INVITE LINK GENERATED",
          {

            invitationId:
              invitation._id,

            email:
              invitation.email,

            token:
              rawToken,

          }
        );

      }


      return res.json({

        ok:
          true,

        invitation:
          getInvitationContract(
            invitation
          ),

        // Development only.
        devInviteToken:
          process.env.NODE_ENV !==
          "production"
            ? rawToken
            : undefined,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[TenantInvitations] LINK rotation failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to generate invitation link",

        });

    }

  }
);


// =====================================================
// REVOKE INVITATION
// =====================================================
//
// DELETE /api/tenant/invitations/:id
//
// The invitation is retained for history.
//
// status becomes "revoked".
//
// acceptedAt is NOT touched.
//
// =====================================================

router.delete(
  "/invitations/:id",
  requireAuth,
  requireTenant,
  requireInviteManagement,
  async (
    req,
    res
  ) => {

    try {

      const invitation =
        await TenantInvitation.findOne({

          _id:
            req.params.id,

          tenantId:
            req.user.tenantId,

          status:
            "pending",

        });


      if (
        !invitation
      ) {

        return res
          .status(404)
          .json({

            error:
              "Pending invitation not found",

          });

      }


      invitation.status =
        "revoked";


      invitation.revokedAt =
        new Date();


      await invitation.save();


      return res.json({

        ok:
          true,

        invitation:
          getInvitationContract(
            invitation
          ),

      });

    }
    catch (
      error
    ) {

      console.error(
        "[TenantInvitations] DELETE failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to revoke invitation",

        });

    }

  }
);


// =====================================================
// PREVIEW INVITATION
// =====================================================
//
// GET /api/tenant/invitations/preview/:token
//
// Public.
//
// The invitation itself is the business object.
// The token merely authenticates access to the preview.
//
// =====================================================

router.get(
  "/invitations/preview/:token",
  async (
    req,
    res
  ) => {

    try {

      const rawToken =
        String(
          req.params.token ||
          ""
        ).trim();


      if (
        !rawToken
      ) {

        return res
          .status(400)
          .json({

            ok:
              false,

            message:
              "Invitation token is required.",

          });

      }


      const tokenHash =
        hashToken(
          rawToken
        );


      const invitation =
        await TenantInvitation
          .findOne({

            tokenHash,

            status:
              "pending",

          })

          .populate(
            "invitedByUserId",
            "firstName lastName email"
          )

          .populate(
            "tenantId",
            "name"
          )

          .populate(
            "projects.projectId",
            "name"
          );


      if (
        !invitation
      ) {

        return res
          .status(404)
          .json({

            ok:
              false,

            message:
              "This invitation is invalid, expired, or has already been accepted.",

          });

      }


      if (
        invitation.expiresAt <=
        new Date()
      ) {

        invitation.status =
          "expired";

        await invitation.save();


        return res
          .status(404)
          .json({

            ok:
              false,

            message:
              "This invitation is invalid, expired, or has already been accepted.",

          });

      }


      const inviter =
        invitation.invitedByUserId;


      const tenant =
        invitation.tenantId;


      const projects =
        Array.isArray(
          invitation.projects
        )

          ? invitation.projects.map(
              project => ({

                projectId:
                  project.projectId?._id ||
                  project.projectId,

                name:
                  project.projectId?.name ||
                  "Project",

                role:
                  project.role,

                permissions:
                  project.permissions,

              })
            )

          : [];


      const existingUser =
        await User.findOne({

          email:
            normaliseEmail(
              invitation.email
            ),

        })
          .select(
            "_id"
          )
          .lean();


      return res.json({

        ok:
          true,

        invitation: {

          id:
            invitation._id,

          type:
            invitation.type ||
            INVITATION_TYPE,

          status:
            invitation.status,

          email:
            invitation.email,

          resource: {

            type:
              invitation.resource?.type ||
              RESOURCE_TYPE,

            id:
              invitation.resource?.id ||
              invitation.tenantId,

          },

          tenantRole:
            invitation.tenantRole,

          tenantPermissions:
            invitation.tenantPermissions,

          expiresAt:
            invitation.expiresAt,

          userExists:
            Boolean(
              existingUser
            ),

          tenant: {

            id:
              tenant?._id,

            name:
              tenant?.name ||
              "Organisation",

          },

          inviter: {

            id:
              inviter?._id,

            name:
              [
                inviter?.firstName,
                inviter?.lastName,
              ]
                .filter(Boolean)
                .join(" ") ||
              inviter?.email ||
              "Team member",

            email:
              inviter?.email ||
              null,

          },

          projects,

        },

      });

    }
    catch (
      error
    ) {

      console.error(
        "[TenantInvitations] PREVIEW failed",
        error
      );


      return res
        .status(500)
        .json({

          ok:
            false,

          message:
            "Unable to load invitation.",

        });

    }

  }
);


// =====================================================
// ACCEPT INVITATION
// =====================================================
//
// POST /api/tenant/invitations/accept
//
// Public because the invitee may not yet have an account.
//
// Acceptance performs:
//
//   1. Validate invitation credential
//   2. Create/find user
//   3. Create/find tenant membership
//   4. Grant project memberships
//   5. Transition invitation -> accepted
//   6. Issue authenticated session
//
// =====================================================

router.post(
  "/invitations/accept",
  async (
    req,
    res
  ) => {

    try {

      const {
        token,
        firstName =
          "",
        lastName =
          "",
        password,
      } =
        req.body;


      if (
        !token
      ) {

        return res
          .status(400)
          .json({

            error:
              "Invitation token is required",

          });

      }


      // =================================================
      // FIND PENDING INVITATION
      // =================================================

      const invitation =
        await TenantInvitation.findOne({

          tokenHash:
            hashToken(
              String(
                token
              )
            ),

          status:
            "pending",

        });


      if (
        !invitation
      ) {

        return res
          .status(400)
          .json({

            error:
              "Invitation is invalid, expired, revoked, or has already been accepted",

          });

      }


      // =================================================
      // EXPIRE IF NECESSARY
      // =================================================

      if (
        invitation.expiresAt <=
        new Date()
      ) {

        invitation.status =
          "expired";

        await invitation.save();


        return res
          .status(400)
          .json({

            error:
              "Invitation has expired",

          });

      }


      // =================================================
      // USER
      // =================================================

      let user =
        await User.findOne({

          email:
            invitation.email,

        });


      // =================================================
      // CREATE USER IF NECESSARY
      // =================================================

      if (
        !user
      ) {

        if (
          !password ||
          String(
            password
          ).length <
            8
        ) {

          return res
            .status(400)
            .json({

              error:
                "A password of at least 8 characters is required",

            });

        }


        const passwordHash =
          await bcrypt.hash(
            password,
            12
          );


        user =
          await User.create({

            firstName:
              String(
                firstName
              ).trim(),

            lastName:
              String(
                lastName
              ).trim(),

            email:
              invitation.email,

            passwordHash,

            emailVerifiedAt:
              null,

          });

      }


      // =================================================
      // TENANT MEMBERSHIP
      // =================================================

      let membership =
        await Membership.findOne({

          tenantId:
            invitation.tenantId,

          userId:
            user._id,

        });


      if (
        !membership
      ) {

        membership =
          await Membership.create({

            tenantId:
              invitation.tenantId,

            userId:
              user._id,

            role:
              invitation.tenantRole,

            permissions:
              invitation.tenantPermissions,

          });

      }


      // =================================================
      // PROJECT MEMBERSHIPS
      // =================================================
      //
      // The invitation is authoritative for the project
      // access being granted at acceptance time.
      //
      // =================================================

      for (
        const project
        of invitation.projects
      ) {

        await ProjectMembership.findOneAndUpdate(

          {

            tenantId:
              invitation.tenantId,

            projectId:
              project.projectId,

            userId:
              user._id,

          },

          {

            $set: {

              role:
                project.role,

              permissions:
                project.permissions ||
                getProjectPermissions(
                  project.role
                ),

            },

          },

          {

            upsert:
              true,

            new:
              true,

            setDefaultsOnInsert:
              true,

          }

        );

      }


      // =================================================
      // ACCEPT INVITATION
      // =================================================

      invitation.status =
        "accepted";


      invitation.acceptedAt =
        new Date();


      invitation.acceptedByUserId =
        user._id;


      await invitation.save();


      // =================================================
      // ISSUE SESSION
      // =================================================

      const accessToken =
        signAccessToken({

          userId:
            user._id,

          tenantId:
            invitation.tenantId,

          role:
            membership.role,

        });


      const refreshToken =
        signRefreshToken({

          userId:
            user._id,

        });


      user.refreshTokenHash =
        hashToken(
          refreshToken
        );


      await user.save();


      // =================================================
      // RESPONSE
      // =================================================

      return res.json({

        ok:
          true,

        invitation: {

          id:
            invitation._id,

          type:
            invitation.type ||
            INVITATION_TYPE,

          status:
            invitation.status,

          resource: {

            type:
              invitation.resource?.type ||
              RESOURCE_TYPE,

            id:
              invitation.resource?.id ||
              invitation.tenantId,

          },

          tenantId:
            invitation.tenantId,

          acceptedAt:
            invitation.acceptedAt,

        },

        user: {

          id:
            user._id,

          email:
            user.email,

          firstName:
            user.firstName,

          lastName:
            user.lastName,

        },

        membership: {

          tenantId:
            membership.tenantId,

          role:
            membership.role,

          permissions:
            membership.permissions,

        },

        tokens: {

          accessToken,

          refreshToken,

        },

      });

    }
    catch (
      error
    ) {

      console.error(
        "[TenantInvitations] ACCEPT failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to accept invitation",

        });

    }

  }
);


export default router;