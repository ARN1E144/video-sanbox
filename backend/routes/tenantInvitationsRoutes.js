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
// HELPERS
// =====================================================

function hashToken(
  token
) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}


function createInviteToken() {
  return crypto.randomBytes(
    32
  ).toString("hex");
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
// AUTHORISATION
// =====================================================
//
// Only tenant owner/admin may create/read invitations.
//
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
// GET PENDING INVITATIONS
// =====================================================
//
// GET /api/tenant/invitations
//
// Tenant scoped.
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

            acceptedAt:
              null,

            expiresAt: {
              $gt:
                new Date(),
            },
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


      return res.json({

        ok:
          true,

        invitations,

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
// Body:
//
// {
//   email,
//   tenantRole,
//   projects: [
//     {
//       projectId,
//       role
//     }
//   ]
// }
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


      // =================================================
      // VALIDATE EMAIL
      // =================================================

      const normalisedEmail =
        String(
          email ||
          ""
        )
          .trim()
          .toLowerCase();


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


      // =================================================
      // VALIDATE TENANT ROLE
      // =================================================

      const allowedTenantRoles = [
        "admin",
        "builder",
        "member",
      ];


      if (
        !allowedTenantRoles.includes(
          tenantRole
        )
      ) {

        return res
          .status(400)
          .json({
            error:
              "Invalid tenant role",
          });

      }


      // =================================================
      // VERIFY TENANT
      // =================================================

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


      // =================================================
      // PREVENT SELF INVITE
      // =================================================

      const inviter =
        await User.findById(
          req.user.userId
        )
          .select("email")
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


      // =================================================
      // CHECK EXISTING USER
      // =================================================

      const existingUser =
        await User.findOne({
          email:
            normalisedEmail,
        });


      if (
        existingUser
      ) {

        const existingMembership =
          await Membership.findOne({
            tenantId,

            userId:
              existingUser._id,
          });


        if (
          existingMembership
        ) {

          return res
            .status(409)
            .json({
              error:
                "This user is already a member of the tenant",
            });

        }

      }


      // =================================================
      // CHECK EXISTING PENDING INVITATION
      // =================================================

      const existingInvitation =
        await TenantInvitation.findOne({
          tenantId,

          email:
            normalisedEmail,

          acceptedAt:
            null,

          expiresAt: {
            $gt:
              new Date(),
          },
        });


      if (
        existingInvitation
      ) {

        return res
          .status(409)
          .json({
            error:
              "A pending invitation already exists for this email",
          });

      }


      // =================================================
      // VALIDATE PROJECT ASSIGNMENTS
      // =================================================

      if (
        !Array.isArray(
          projects
        )
      ) {

        return res
          .status(400)
          .json({
            error:
              "projects must be an array",
          });

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
          String(
            projectId
          );


        // Prevent duplicate
        // project assignments.

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


        // -------------------------------------------------
        // IMPORTANT:
        // Project must belong to this tenant.
        //
        // Your Project model currently uses ownerId but
        // does not contain tenantId, so we establish tenant
        // ownership via project membership / owner membership.
        // -------------------------------------------------

        const project =
          await Project.findById(
            projectId
          ).lean();


        if (
          !project
        ) {

          return res
            .status(404)
            .json({
              error:
                `Project not found: ${projectId}`,
            });

        }


        const projectOwnerMembership =
          await Membership.findOne({
            tenantId,

            userId:
              project.ownerId,
          });


        if (
          !projectOwnerMembership
        ) {

          return res
            .status(403)
            .json({
              error:
                "Project does not belong to the current tenant",
            });

        }


        const allowedProjectRoles = [
          "admin",
          "editor",
          "viewer",
        ];


        const role =
          allowedProjectRoles.includes(
            assignment?.role
          )
            ? assignment.role
            : "viewer";


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


      // =================================================
      // CREATE SECURE TOKEN
      // =================================================

      const rawToken =
        createInviteToken();


      const tokenHash =
        hashToken(
          rawToken
        );


      // 7 days

      const expiresAt =
        new Date(
          Date.now() +
            7 *
              24 *
              60 *
              60 *
              1000
        );


      // =================================================
      // CREATE INVITATION
      // =================================================

      const invitation =
        await TenantInvitation.create({

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
            projectAssignments,

          tokenHash,

          expiresAt,

        });


      // =================================================
      // EMAIL
      // =================================================
      //
      // SendGrid/Nodemailer can be connected here.
      //
      // For development, return the token.
      //
      // DO NOT keep devInviteToken in production.
      // =================================================

      console.log(
        "[TenantInvitations] DEV INVITE",
        {
          email:
            normalisedEmail,

          tenant:
            tenant.name,

          token:
            rawToken,

        }
      );


      return res
        .status(201)
        .json({

          ok:
            true,

          invitation: {

            id:
              invitation._id,

            email:
              invitation.email,

            tenantRole:
              invitation.tenantRole,

            projects:
              invitation.projects,

            expiresAt:
              invitation.expiresAt,

          },

          // Development only.
          devInviteToken:
            rawToken,

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
// REVOKE INVITATION
// =====================================================
//
// DELETE /api/tenant/invitations/:id
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

          acceptedAt:
            null,
        });


      if (
        !invitation
      ) {

        return res
          .status(404)
          .json({
            error:
              "Invitation not found",
          });

      }


      // Mark expired/revoked
      // without deleting history.

      invitation.acceptedAt =
        new Date();


      await invitation.save();


      return res.json({

        ok:
          true,

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
// ACCEPT INVITATION
// =====================================================
//
// POST /api/tenant/invitations/accept
//
// Body:
//
// {
//   token,
//   firstName,
//   lastName,
//   password
// }
//
// This endpoint intentionally does NOT require
// requireAuth because the invitee may not yet have
// an account.
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


      // Password is required
      // only for a new user.

      const invitation =
        await TenantInvitation.findOne({
          tokenHash:
            hashToken(
              String(
                token
              )
            ),

          acceptedAt:
            null,

          expiresAt: {
            $gt:
              new Date(),
          },
        });


      if (
        !invitation
      ) {

        return res
          .status(400)
          .json({
            error:
              "Invitation is invalid or expired",
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

            // Invitation is tied
            // to email ownership.
            //
            // We can require
            // email verification
            // separately later.
            emailVerifiedAt:
              null,

          });

      }


      // =================================================
      // MEMBERSHIP
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

      invitation.acceptedAt =
        new Date();


      invitation.acceptedByUserId =
        user._id;


      await invitation.save();


      // =================================================
      // ISSUE SESSION
      // =================================================
      //
      // This makes mobile/first-login significantly easier:
      // the invite acceptance itself can establish a session.
      //
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