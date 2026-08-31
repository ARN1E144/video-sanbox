import crypto from "crypto";

import User from "../models/User.js";
import Tenant from "../models/Tenant.js";
import Membership from "../models/Membership.js";
import Project from "../models/project.js";
import ProjectMembership from "../models/projectMembership.js";
import TenantInvitation from "../models/TenantInvitation.js";

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function makeInviteToken() {
  return crypto.randomBytes(32).toString("hex");
}

function tenantPermissionsForRole(role) {
  switch (role) {
    case "admin":
      return {
        canBuild: true,
        canInvite: true,
      };

    case "builder":
      return {
        canBuild: true,
        canInvite: false,
      };

    case "member":
    default:
      return {
        canBuild: false,
        canInvite: false,
      };
  }
}

function projectPermissionsForRole(role) {
  switch (role) {
    case "admin":
      return {
        canView: true,
        canEdit: true,
        canRun: true,
        canManageData: true,
        canViewInterviews: true,
        canViewRecordings: true,
        canViewTranscriptions: true,
        canViewEvaluations: true,
        canCreateData: true,
        canEditData: true,
        canDeleteData: true,
        canExportData: true,
      };

    case "editor":
      return {
        canView: true,
        canEdit: true,
        canRun: true,
        canManageData: false,
        canViewInterviews: true,
        canViewRecordings: true,
        canViewTranscriptions: true,
        canViewEvaluations: true,
        canCreateData: true,
        canEditData: true,
        canDeleteData: false,
        canExportData: false,
      };

    case "viewer":
    default:
      return {
        canView: true,
        canEdit: false,
        canRun: true,
        canManageData: false,
        canViewInterviews: false,
        canViewRecordings: false,
        canViewTranscriptions: false,
        canViewEvaluations: false,
        canCreateData: false,
        canEditData: false,
        canDeleteData: false,
        canExportData: false,
      };
  }
}

// =====================================================
// GET TEAM
// =====================================================

export async function getTenantTeam(req, res) {
  try {
    const tenantId = req.user.tenantId;

    const members = await Membership.find({
      tenantId,
    })
      .populate(
        "userId",
        "firstName lastName email emailVerifiedAt availability"
      )
      .sort({ createdAt: 1 })
      .lean();

    const projectMemberships =
      await ProjectMembership.find({
        tenantId,
      })
        .populate("projectId", "name")
        .lean();

    return res.json({
      ok: true,
      members,
      projectMemberships,
    });
  } catch (err) {
    console.error("[TenantTeam] getTenantTeam", err);

    return res.status(500).json({
      error: "Failed to load tenant team",
    });
  }
}

// =====================================================
// GET INVITATIONS
// =====================================================

export async function getTenantInvitations(req, res) {
  try {
    const invitations =
      await TenantInvitation.find({
        tenantId: req.user.tenantId,
        acceptedAt: null,
        expiresAt: {
          $gt: new Date(),
        },
      })
        .populate(
          "invitedByUserId",
          "firstName lastName email"
        )
        .populate("projects.projectId", "name")
        .sort({ createdAt: -1 })
        .lean();

    return res.json({
      ok: true,
      invitations,
    });
  } catch (err) {
    console.error(
      "[TenantTeam] getTenantInvitations",
      err
    );

    return res.status(500).json({
      error: "Failed to load invitations",
    });
  }
}

// =====================================================
// INVITE USER
// =====================================================

export async function inviteTenantUser(req, res) {
  try {
    const {
      email,
      tenantRole = "member",
      projects = [],
    } = req.body;

    const normalisedEmail =
      String(email || "").trim().toLowerCase();

    if (!normalisedEmail) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    if (
      !["admin", "builder", "member"].includes(
        tenantRole
      )
    ) {
      return res.status(400).json({
        error: "Invalid tenant role",
      });
    }

    // ===================================================
    // ENSURE TENANT EXISTS
    // ===================================================

    const tenant = await Tenant.findById(
      req.user.tenantId
    );

    if (!tenant) {
      return res.status(404).json({
        error: "Tenant not found",
      });
    }

    // ===================================================
    // CHECK EXISTING MEMBERSHIP
    // ===================================================

    const existingUser = await User.findOne({
      email: normalisedEmail,
    });

    if (existingUser) {
      const existingMembership =
        await Membership.findOne({
          tenantId: req.user.tenantId,
          userId: existingUser._id,
        });

      if (existingMembership) {
        return res.status(409).json({
          error:
            "This user is already a member of the tenant",
        });
      }
    }

    // ===================================================
    // VALIDATE PROJECTS
    // ===================================================

    const validProjects = [];

    for (const project of projects) {
      if (!project?.projectId) continue;

      const dbProject = await Project.findOne({
        _id: project.projectId,
      });

      if (!dbProject) {
        return res.status(404).json({
          error: `Project not found: ${project.projectId}`,
        });
      }

      validProjects.push({
        projectId: dbProject._id,
        role:
          ["admin", "editor", "viewer"].includes(
            project.role
          )
            ? project.role
            : "viewer",
        permissions:
          project.permissions ||
          projectPermissionsForRole(
            project.role
          ),
      });
    }

    // ===================================================
    // CREATE INVITATION
    // ===================================================

    const token = makeInviteToken();

    const invitation =
      await TenantInvitation.create({
        tenantId: req.user.tenantId,

        email: normalisedEmail,

        invitedByUserId:
          req.user.userId,

        tenantRole,

        tenantPermissions:
          tenantPermissionsForRole(
            tenantRole
          ),

        projects: validProjects,

        tokenHash:
          hashToken(token),

        expiresAt: new Date(
          Date.now() +
            7 * 24 * 60 * 60 * 1000
        ),
      });

    // ===================================================
    // DEVELOPMENT TOKEN
    // ===================================================

    return res.status(201).json({
      ok: true,

      invitation: {
        id: invitation._id,
        email: invitation.email,
        tenantRole:
          invitation.tenantRole,
        expiresAt:
          invitation.expiresAt,
      },

      // Remove in production.
      devInviteToken: token,
    });
  } catch (err) {
    console.error(
      "[TenantTeam] inviteTenantUser",
      err
    );

    return res.status(500).json({
      error: "Failed to create invitation",
    });
  }
}

// =====================================================
// ACCEPT INVITATION
// =====================================================

export async function acceptTenantInvitation(
  req,
  res
) {
  try {
    const {
      token,
      firstName,
      lastName,
      password,
    } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error:
          "token and password are required",
      });
    }

    const invitation =
      await TenantInvitation.findOne({
        tokenHash: hashToken(token),

        acceptedAt: null,

        expiresAt: {
          $gt: new Date(),
        },
      });

    if (!invitation) {
      return res.status(400).json({
        error:
          "Invitation is invalid or expired",
      });
    }

    // ===================================================
    // FIND OR CREATE USER
    // ===================================================

    let user = await User.findOne({
      email: invitation.email,
    });

    if (!user) {
      const bcrypt = await import("bcrypt");

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      user = await User.create({
        firstName:
          firstName || "",
        lastName:
          lastName || "",
        email:
          invitation.email,
        passwordHash,
      });
    }

    // ===================================================
    // TENANT MEMBERSHIP
    // ===================================================

    let membership =
      await Membership.findOne({
        tenantId:
          invitation.tenantId,

        userId: user._id,
      });

    if (!membership) {
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

    // ===================================================
    // PROJECT MEMBERSHIPS
    // ===================================================

    for (const project
      of invitation.projects) {

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
              project.permissions,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    // ===================================================
    // ACCEPT
    // ===================================================

    invitation.acceptedAt =
      new Date();

    await invitation.save();

    return res.json({
      ok: true,

      user: {
        id: user._id,
        email: user.email,
        firstName:
          user.firstName,
        lastName:
          user.lastName,
      },

      tenantId:
        invitation.tenantId,
    });
  } catch (err) {
    console.error(
      "[TenantTeam] acceptTenantInvitation",
      err
    );

    return res.status(500).json({
      error:
        "Failed to accept invitation",
    });
  }
}