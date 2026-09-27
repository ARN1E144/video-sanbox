// backend/routes/tenantRoutes.js

import express from "express";

import User from "../models/User.js";
import Membership from "../models/Membership.js";
import ProjectMembership from "../models/projectMembership.js";
import Project from "../models/project.js";



import { requireAuth } from "../middleware/requireAuth.js";
import requireTenant from "../middleware/requireTenant.js";
import requirePermission from "../middleware/requirePemission.js";


const router = express.Router();


// =====================================================
// DEBUG
// =====================================================

router.use((req, _res, next) => {

  console.log(
    "[tenantRoutes] hit:",
    req.method,
    req.originalUrl
  );

  next();

});


// =====================================================
// TENANT ROLE PERMISSIONS
// =====================================================
//
// IMPORTANT:
//
// These roles must remain aligned with:
// backend/models/Membership.js
//
// Membership currently supports:
//
// owner
// admin
// builder
// member
//
// "operative" is intentionally NOT included because
// the Membership schema does not currently allow it.
// =====================================================

function roleToPermissions(role) {

  if (
    role === "owner" ||
    role === "admin"
  ) {

    return {
      canBuild: true,
      canInvite: true,
    };

  }


  if (role === "builder") {

    return {
      canBuild: true,
      canInvite: false,
    };

  }


  return {
    canBuild: false,
    canInvite: false,
  };

}


const ALLOWED_ROLES = [
  "owner",
  "admin",
  "builder",
  "member",
];


// =====================================================
// PROJECT ROLE PERMISSIONS
// =====================================================
//
// ProjectMembership supports:
//
// owner
// admin
// editor
// viewer
//
// Existing-member management deliberately exposes only:
//
// admin
// editor
// viewer
//
// Project ownership should not be transferred through the
// tenant access-management UI.
// =====================================================

function projectRoleToPermissions(role) {

  if (role === "admin") {

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

  }


  if (role === "editor") {

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
      canDeleteData: false,
      canExportData: false,
    };

  }


  // viewer

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


const ALLOWED_PROJECT_ROLES = [
  "admin",
  "editor",
  "viewer",
];


// =====================================================
// NORMALISE HELPERS
// =====================================================

function normaliseId(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }

  return String(value);

}


function normaliseEmail(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }

  return String(value)
    .trim()
    .toLowerCase();

}


// =====================================================
// TENANT OWNERSHIP CHECK
// =====================================================

function assertTenantMatch(
  tenantId,
  req
) {

  return (
    String(tenantId) ===
    String(req.user.tenantId)
  );

}


// =====================================================
// PROJECT ASSIGNMENT NORMALISATION
// =====================================================
//
// Incoming:
//
// {
//   projectId,
//   role,
//   permissions
// }
//
// The role is authoritative.
// Permissions are normalised from the role so that the
// access-management UI cannot accidentally create a
// contradictory role/permission combination.
// =====================================================

function normaliseProjectAssignments(
  projects
) {

  if (!Array.isArray(projects)) {

    return [];

  }


  const seen = new Set();

  const assignments = [];


  for (
    const project of projects
  ) {

    const projectId =
      normaliseId(
        project?.projectId ??
        project?.id ??
        project?._id
      );


    if (!projectId) {

      continue;

    }


    if (seen.has(projectId)) {

      continue;

    }


    const role =
      project?.role || "viewer";


    if (
      !ALLOWED_PROJECT_ROLES.includes(role)
    ) {

      continue;

    }


    seen.add(projectId);


    assignments.push({

      projectId,

      role,

      permissions:
        projectRoleToPermissions(role),

    });

  }


  return assignments;

}


// =====================================================
// ROOT TEST
// =====================================================

router.get(
  "/",
  (req, res) => {

    console.log(
      "[tenantRoutes] Root accessed:",
      req.method,
      req.originalUrl
    );

    return res.send(
      "TENANT Routes are working"
    );

  }
);


// =====================================================
// LIST MEMBERS OF THIS TENANT
// =====================================================
//
// GET
// /api/tenant/:tenantId/members
//
// Used by TenantTeamSettings.
//
// Returns:
//
// {
//   id,
//   user,
//   role,
//   permissions,
//   createdAt
// }
// =====================================================

router.get(
  "/:tenantId/members",
  requireAuth,
  requireTenant,
  requirePermission("canInvite"),

  async (
    req,
    res
  ) => {

    try {

      const {
        tenantId,
      } = req.params;


      console.log(
        "[TenantRoutes] Compare tenant:",
        tenantId,
        "by user:",
        req.user.tenantId
      );


      if (
        !assertTenantMatch(
          tenantId,
          req
        )
      ) {

        return res.status(403).json({
          error: "Tenant mismatch",
        });

      }


      const memberships =
        await Membership
          .find({
            tenantId,
          })
          .populate(
            "userId",
            "email firstName lastName emailVerifiedAt"
          )
          .sort({
            createdAt: 1,
          });


      const members =
        memberships.map(
          membership => ({

            id:
              membership._id,

            user:
              membership.userId,

            role:
              membership.role,

            permissions:
              membership.permissions,

            isAvailable:
              membership.isAvailable,

            createdAt:
              membership.createdAt,

          })
        );


      return res.json({

        ok: true,

        tenantId,

        members,

      });

    } catch (error) {

      console.error(
        "[TenantRoutes] Failed to list members:",
        error
      );

      return res.status(500).json({

        error:
          "Failed to load tenant members",

      });

    }

  }
);


// =====================================================
// LEGACY DIRECT TENANT ADD
// =====================================================
//
// POST
// /api/tenant/:tenantId/invite
//
// IMPORTANT:
//
// This is retained for backwards compatibility.
//
// The canonical invitation flow is:
//
// POST /api/tenant/invitations
//       ↓
// pending invitation
//       ↓
// recipient acceptance
//       ↓
// tenant Membership
//
// This legacy route directly creates membership and should
// not be used by the new TeamSettings invitation flow.
// =====================================================

router.post(
  "/:tenantId/invite",
  requireAuth,
  requireTenant,
  requirePermission("canInvite"),

  async (
    req,
    res
  ) => {

    try {

      const {
        tenantId,
      } = req.params;


      if (
        !assertTenantMatch(
          tenantId,
          req
        )
      ) {

        return res.status(403).json({
          error: "Tenant mismatch",
        });

      }


      const email =
        normaliseEmail(
          req.body?.email
        );


      const role =
        req.body?.role ||
        "member";


      if (!email) {

        return res.status(400).json({
          error: "email required",
        });

      }


      if (
        !ALLOWED_ROLES.includes(role)
      ) {

        return res.status(400).json({

          error:
            `Invalid role. Must be one of: ${ALLOWED_ROLES.join(", ")}`,

        });

      }


      console.log(
        "[TenantRoutes] Legacy direct invite:",
        {
          tenantId,
          email,
          role,
          byUser:
            req.user.userId,
        }
      );


      const user =
        await User.findOne({
          email,
        });


      if (!user) {

        return res.status(404).json({

          error:
            "User not found (must register first for now)",

        });

      }


      const permissions =
        roleToPermissions(
          role
        );


      const membership =
        await Membership.findOneAndUpdate(

          {
            tenantId,
            userId:
              user._id,
          },

          {
            tenantId,
            userId:
              user._id,
            role,
            permissions,
          },

          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }

        );


      return res.json({

        ok: true,

        membership,

      });

    } catch (error) {

      console.error(
        "[TenantRoutes] Legacy invite error:",
        error
      );

      return res.status(500).json({

        error:
          "Failed to add tenant member",

      });

    }

  }
);


// =====================================================
// CHANGE MEMBER TENANT ROLE
// =====================================================
//
// PATCH
// /api/tenant/:tenantId/members/:userId/role
//
// Body:
//
// {
//   role: "admin" | "builder" | "member"
// }
//
// Owner role is deliberately not exposed as a normal
// editable role.
// =====================================================

router.patch(
  "/:tenantId/members/:userId/role",
  requireAuth,
  requireTenant,
  requirePermission("canInvite"),

  async (
    req,
    res
  ) => {

    try {

      const {
        tenantId,
        userId,
      } = req.params;


      const {
        role,
      } = req.body;


      if (
        !assertTenantMatch(
          tenantId,
          req
        )
      ) {

        return res.status(403).json({
          error: "Tenant mismatch",
        });

      }


      if (
        !ALLOWED_ROLES.includes(role)
      ) {

        return res.status(400).json({

          error:
            `Invalid role. Must be one of: ${ALLOWED_ROLES.join(", ")}`,

        });

      }


      // -----------------------------------------------
      // Prevent self-role changes
      // -----------------------------------------------

      if (
        String(req.user.userId) ===
        String(userId)
      ) {

        return res.status(400).json({

          error:
            "You cannot change your own role",

        });

      }


      const membership =
        await Membership.findOne({

          tenantId,

          userId,

        });


      if (!membership) {

        return res.status(404).json({

          error:
            "Membership not found",

        });

      }


      // -----------------------------------------------
      // Do not allow an existing owner to be demoted
      // through the ordinary member-management UI.
      // -----------------------------------------------

      if (
        membership.role === "owner"
      ) {

        return res.status(400).json({

          error:
            "Owner membership cannot be changed through this route",

        });

      }


      membership.role =
        role;


      membership.permissions =
        roleToPermissions(
          role
        );


      await membership.save();


      return res.json({

        ok: true,

        membership,

      });

    } catch (error) {

      console.error(
        "[TenantRoutes] Role update error:",
        error
      );

      return res.status(500).json({

        error:
          "Failed to update member role",

      });

    }

  }
);


// =====================================================
// REMOVE MEMBER FROM TENANT
// =====================================================
//
// DELETE
// /api/tenant/:tenantId/members/:userId
//
// IMPORTANT:
//
// This removes the user's ACCESS to this tenant.
//
// It does NOT delete the global User account.
//
// It also removes the user's non-owner project
// memberships belonging to this tenant.
//
// Project ownership is deliberately preserved because
// removing a tenant membership must not silently destroy
// project ownership.
//
// Owner membership is protected.
// A user cannot remove themselves through this route.
//
// This is the tenant-membership counterpart to the global
// invitation acceptance flow:
//
// Invitation accepted
//       ↓
// Membership created
//
// Member removed
//       ↓
// Membership removed
//
// The User itself remains available for future invitations.
// =====================================================

router.delete(
  "/:tenantId/members/:userId",
  requireAuth,
  requireTenant,
  requirePermission("canInvite"),

  async (
    req,
    res
  ) => {

    try {

      const {
        tenantId,
        userId,
      } = req.params;


      // -----------------------------------------------
      // Tenant protection
      // -----------------------------------------------

      if (
        !assertTenantMatch(
          tenantId,
          req
        )
      ) {

        return res.status(403).json({

          error:
            "Tenant mismatch",

        });

      }


      // -----------------------------------------------
      // Prevent self-removal
      // -----------------------------------------------

      if (
        String(req.user.userId) ===
        String(userId)
      ) {

        return res.status(400).json({

          error:
            "You cannot remove yourself from the tenant",

        });

      }


      // -----------------------------------------------
      // Confirm target membership
      // -----------------------------------------------

      const membership =
        await Membership.findOne({

          tenantId,

          userId,

        });


      if (!membership) {

        return res.status(404).json({

          error:
            "Membership not found",

        });

      }


      // -----------------------------------------------
      // Protect tenant owner
      // -----------------------------------------------

      if (
        membership.role ===
        "owner"
      ) {

        return res.status(400).json({

          error:
            "Owner membership cannot be removed",

        });

      }


      // -----------------------------------------------
      // Remove tenant membership
      // -----------------------------------------------

      await Membership.deleteOne({

        _id:
          membership._id,

      });


      // -----------------------------------------------
      // Remove non-owner project access
      // -----------------------------------------------
      //
      // Project ownership is deliberately preserved.
      //
      // This prevents tenant-member removal from
      // accidentally destroying ownership of a project.
      // -----------------------------------------------

      await ProjectMembership.deleteMany({

        tenantId,

        userId,

        role: {
          $ne:
            "owner",
        },

      });


      console.log(
        "[TenantRoutes] Tenant member removed:",
        {
          tenantId,
          userId,
          previousRole:
            membership.role,
        }
      );


      return res.json({

        ok: true,

        tenantId,

        userId,

        removed: true,

      });

    } catch (error) {

      console.error(
        "[TenantRoutes] Failed to remove tenant member:",
        error
      );

      return res.status(500).json({

        error:
          "Failed to remove tenant member",

      });

    }

  }
);


// =====================================================
// GET EXISTING MEMBER PROJECT ACCESS
// =====================================================
//
// GET
// /api/tenant/:tenantId/members/:userId/projects
//
// This is required by TenantTeamSettings when the email
// belongs to an existing tenant member.
//
// Returns:
//
// {
//   ok: true,
//   tenantId,
//   userId,
//   projects: [
//     {
//       projectId,
//       role,
//       permissions
//     }
//   ]
// }
//
// ProjectMembership.tenantId is used to establish that
// the project access belongs to this tenant.
// =====================================================

router.get(
  "/:tenantId/members/:userId/projects",
  requireAuth,
  requireTenant,
  requirePermission("canInvite"),

  async (
    req,
    res
  ) => {

    try {

      const {
        tenantId,
        userId,
      } = req.params;


      // -----------------------------------------------
      // Tenant protection
      // -----------------------------------------------

      if (
        !assertTenantMatch(
          tenantId,
          req
        )
      ) {

        return res.status(403).json({
          error: "Tenant mismatch",
        });

      }


      // -----------------------------------------------
      // Confirm target user is actually a tenant member
      // -----------------------------------------------

      const membership =
        await Membership.findOne({

          tenantId,

          userId,

        });


      if (!membership) {

        return res.status(404).json({

          error:
            "Tenant membership not found",

        });

      }


      // -----------------------------------------------
      // Load project memberships
      // -----------------------------------------------

      const projectMemberships =
        await ProjectMembership
          .find({

            tenantId,

            userId,

          })
          .sort({
            createdAt: 1,
          });


      const projects =
        projectMemberships.map(
          projectMembership => ({

            id:
              projectMembership._id,

            projectId:
              projectMembership.projectId,

            role:
              projectMembership.role,

            permissions:
              projectMembership.permissions,

            createdAt:
              projectMembership.createdAt,

          })
        );


      return res.json({

        ok: true,

        tenantId,

        userId,

        projects,

      });

    } catch (error) {

      console.error(
        "[TenantRoutes] Failed to load member project access:",
        error
      );

      return res.status(500).json({

        error:
          "Failed to load member project access",

      });

    }

  }
);


// =====================================================
// UPDATE EXISTING MEMBER PROJECT ACCESS
// =====================================================
//
// PATCH
// /api/tenant/:tenantId/members/:userId/projects
//
// Body:
//
// {
//   projects: [
//     {
//       projectId,
//       role
//     }
//   ]
// }
//
// The submitted project list is authoritative.
//
// Therefore:
//
// submitted project
//     ↓
// create/update access
//
// omitted project
//     ↓
// remove access
//
// Project ownership is protected.
// A user's owner ProjectMembership cannot be removed
// through this route.
// =====================================================

router.patch(
  
  "/:tenantId/members/:userId/projects",
  requireAuth,
  requireTenant,
  requirePermission("canInvite"),

  async (
    req,
    res
  ) => {

  
console.log(
  "[TenantRoutes] PATCH PROJECT ACCESS HANDLER RUNNING"
);


    try {

      const {
        tenantId,
        userId,
      } = req.params;


      // -----------------------------------------------
      // Tenant protection
      // -----------------------------------------------

      if (
        !assertTenantMatch(
          tenantId,
          req
        )
      ) {

        return res.status(403).json({
          error: "Tenant mismatch",
        });

      }


      // -----------------------------------------------
      // Prevent administrators from changing their own
      // project access through this route.
      // -----------------------------------------------

      if (
        String(req.user.userId) ===
        String(userId)
      ) {

        return res.status(400).json({

          error:
            "You cannot change your own project access",

        });

      }


      // -----------------------------------------------
      // Confirm target tenant membership
      // -----------------------------------------------

      const membership =
        await Membership.findOne({

          tenantId,

          userId,

        });


      if (!membership) {

        return res.status(404).json({

          error:
            "Tenant membership not found",

        });

      }


      // -----------------------------------------------
      // Normalise submitted assignments
      // -----------------------------------------------

      const assignments =
        normaliseProjectAssignments(
          req.body?.projects
        );


      const requestedProjectIds =
        assignments.map(
          assignment =>
            assignment.projectId
        );


      // -----------------------------------------------
      // Validate that every requested project belongs
      // to this tenant.
      //
      // ProjectMembership.tenantId is the tenant boundary
      // for project access.
      // -----------------------------------------------

    
        if (
          requestedProjectIds.length
        ) {

          // ===================================================
          // VALIDATE PROJECTS BELONG TO THIS TENANT
          // ===================================================
          //
          // Project ownership is currently determined through:
          //
          //   Membership.userId
          //          ↓
          //   Project.ownerId
          //
          // ProjectMembership represents access to a project.
          // It must not be used to prove tenant ownership because
          // we are creating that ProjectMembership here.
          //
          // ===================================================

          const tenantMemberships =
            await Membership.find({

              tenantId,

            })
              .select(
                "userId"
              )
              .lean();


          const tenantUserIds =
            tenantMemberships
              .map(
                membership =>
                  membership.userId
              )
              .filter(Boolean);

              console.log(
                "[TenantRoutes] Project access validation",
                {
                  tenantId:
                    String(
                      tenantId
                    ),

                  requestedProjectIds:
                    requestedProjectIds.map(
                      id =>
                        String(
                          id
                        )
                    ),

                  tenantUserIds:
                    tenantUserIds.map(
                      id =>
                        String(
                          id
                        )
                    ),
                }
              );



          const tenantProjects =
            tenantUserIds.length > 0

              ? await Project.find({

                  ownerId: {
                    $in:
                      tenantUserIds,
                  },

                  _id: {
                    $in:
                      requestedProjectIds,
                  },

                })
                  .select(
                    "_id ownerId"
                  )
                  .lean()

              : [];


          
            const requestedProjectRecords =
              await Project.find({
                _id: {
                  $in: requestedProjectIds,
                },
              })
                .select("_id ownerId name")
                .lean();


           

          const validProjectIds =
            new Set(

              tenantProjects.map(
                project =>
                  String(
                    project._id
                  )
              )

            );


          const invalidProjectIds =
            requestedProjectIds.filter(
              projectId =>
                !validProjectIds.has(
                  String(
                    projectId
                  )
                )
            );


          if (
            invalidProjectIds.length
          ) {

            return res
              .status(400)
              .json({

                error:
                  "One or more projects do not belong to this tenant",

                projectIds:
                  invalidProjectIds,

              });

          }

        }


      // -----------------------------------------------
      // Existing project memberships
      // -----------------------------------------------

      const existingMemberships =
        await ProjectMembership.find({

          tenantId,

          userId,

        });


      // -----------------------------------------------
      // Protect project ownership
      // -----------------------------------------------

      const ownerMemberships =
        existingMemberships.filter(
          projectMembership =>
            projectMembership.role ===
            "owner"
        );


      const ownerProjectIds =
        new Set(
          ownerMemberships.map(
            projectMembership =>
              String(
                projectMembership.projectId
              )
          )
        );


      // -----------------------------------------------
      // Upsert requested access
      // -----------------------------------------------

      for (
        const assignment of assignments
      ) {

        const projectId =
          assignment.projectId;


        // ---------------------------------------------
        // Never downgrade an owner through this route
        // ---------------------------------------------

        if (
          ownerProjectIds.has(
            String(projectId)
          )
        ) {

          continue;

        }


        await ProjectMembership.findOneAndUpdate(

          {
            tenantId,

            projectId,

            userId,

          },

          {
            tenantId,

            projectId,

            userId,

            role:
              assignment.role,

            permissions:
              assignment.permissions,

          },

          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }

        );

      }


      // -----------------------------------------------
      // Remove project access which is no longer selected
      // -----------------------------------------------

      const requestedIds =
        new Set(
          requestedProjectIds.map(
            id =>
              String(id)
          )
        );


      const removableMemberships =
        existingMemberships.filter(
          projectMembership => {

            if (
              projectMembership.role ===
              "owner"
            ) {

              return false;

            }


            return !requestedIds.has(
              String(
                projectMembership.projectId
              )
            );

          }
        );


      if (
        removableMemberships.length
      ) {

        await ProjectMembership.deleteMany({

          _id: {
            $in:
              removableMemberships.map(
                projectMembership =>
                  projectMembership._id
              ),
          },

        });

      }


      // -----------------------------------------------
      // Return final state
      // -----------------------------------------------

      const updatedMemberships =
        await ProjectMembership
          .find({

            tenantId,

            userId,

          })
          .sort({
            createdAt: 1,
          });


      const projects =
        updatedMemberships.map(
          projectMembership => ({

            id:
              projectMembership._id,

            projectId:
              projectMembership.projectId,

            role:
              projectMembership.role,

            permissions:
              projectMembership.permissions,

            createdAt:
              projectMembership.createdAt,

          })
        );


      return res.json({

        ok: true,

        tenantId,

        userId,

        projects,

      });

    } catch (error) {

      console.error(
        "[TenantRoutes] Failed to update member project access:",
        error
      );

      return res.status(500).json({

        error:
          "Failed to update member project access",

      });

    }

  }
);


// =====================================================
// CURRENT USER AVAILABILITY
// =====================================================
//
// PATCH
// /api/tenant/:tenantId/members/me/availability
// =====================================================

router.patch(
  "/:tenantId/members/me/availability",
  requireAuth,
  requireTenant,

  async (
    req,
    res
  ) => {

    try {

      const {
        tenantId,
      } = req.params;


      const {
        isAvailable,
      } = req.body;


      // -----------------------------------------------
      // Tenant protection
      // -----------------------------------------------

      if (
        !assertTenantMatch(
          tenantId,
          req
        )
      ) {

        return res.status(403).json({

          error:
            "Tenant mismatch",

        });

      }


      // -----------------------------------------------
      // Validate value
      // -----------------------------------------------

      if (
        typeof isAvailable !==
        "boolean"
      ) {

        return res.status(400).json({

          error:
            "isAvailable must be a boolean",

        });

      }


      // -----------------------------------------------
      // Find current user's membership
      // -----------------------------------------------

      const membership =
        await Membership.findOne({

          tenantId,

          userId:
            req.user.userId,

        });


      if (!membership) {

        return res.status(404).json({

          error:
            "Membership not found",

        });

      }


      // -----------------------------------------------
      // Update
      // -----------------------------------------------

      membership.isAvailable =
        isAvailable;


      await membership.save();


      console.log(
        "[TenantRoutes] Availability changed:",
        {
          tenantId,
          userId:
            req.user.userId,
          role:
            membership.role,
          isAvailable:
            membership.isAvailable,
        }
      );


      return res.json({

        ok: true,

        availability: {

          isAvailable:
            membership.isAvailable,

        },

      });

    } catch (error) {

      console.error(
        "[TenantRoutes] Availability update error:",
        error
      );

      return res.status(500).json({

        error:
          "Failed to update availability",

      });

    }

  }
);


// =====================================================
// CURRENT USER AVAILABILITY
// =====================================================
//
// PATCH
// /api/tenant/members/me/availability
//
// Existing backwards-compatible route.
// =====================================================

router.patch(
  "/members/me/availability",
  requireAuth,
  requireTenant,

  async (
    req,
    res
  ) => {

    try {

      const {
        userId,
        tenantId,
      } = req.user;


      const {
        isAvailable,
      } = req.body;


      if (
        typeof isAvailable !==
        "boolean"
      ) {

        return res.status(400).json({

          error:
            "isAvailable must be a boolean",

        });

      }


      const membership =
        await Membership.findOne({

          userId,

          tenantId,

        });


      if (!membership) {

        return res.status(403).json({

          error:
            "Membership not found",

        });

      }


      membership.isAvailable =
        isAvailable;


      await membership.save();


      console.log(
        "[TenantRoutes] Availability changed:",
        {

          tenantId:
            String(tenantId),

          userId:
            String(userId),

          role:
            membership.role,

          isAvailable:
            membership.isAvailable,

        }
      );


      return res.json({

        ok: true,

        availability: {

          isAvailable:
            membership.isAvailable,

        },

      });

    } catch (error) {

      console.error(
        "[TenantRoutes] Failed to update availability:",
        error
      );

      return res.status(500).json({

        error:
          "Failed to update availability",

      });

    }

  }
);


export default router;
