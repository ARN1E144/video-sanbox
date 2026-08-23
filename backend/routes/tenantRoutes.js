// backend/routes/tenantRoutes.js
import express from "express";
import User from "../models/User.js";
import Membership from "../models/Membership.js";
import { requireAuth } from "../middleware/requireAuth.js";
import  requireTenant  from "../middleware/requireTenant.js";
import requirePermission from "../middleware/requirePemission.js";


const router = express.Router();

router.use((req, _res, next) => {
  console.log("[tenantRoutes] hit:", req.method, req.originalUrl);
  next();
});


function roleToPermissions(role) {
  if (role === "owner" || role === "admin") return { canBuild: true, canInvite: true };
  if (role === "builder") return { canBuild: true, canInvite: false };
  if (role === "operative") return { canBuild: true, canInvite: false };

  return { canBuild: false, canInvite: false }; // member
}

const ALLOWED_ROLES = ["owner", "admin", "builder", "operative" ,"member"];

router.get('/', (req, res) => {
  res.send('TENANT Routes are working', req.method, req.originalUrl);
  console.log('TENANT Routes accessed, ', req.method, req.originalUrl);
});

// List members of THIS tenant
router.get(
  "/:tenantId/members",
  requireAuth,
  requireTenant,
  requirePermission("canInvite"), // or canBuild if you want builders to view members
  async (req, res) => {
    const { tenantId } = req.params;

    console.log("[TenantRoutes] Compare tenant:", tenantId, "by user:", req.user.tenantId);    

    // prevent cross-tenant token misuse
    if (tenantId !== String(req.user.tenantId)) {
      return res.status(403).json({ error: "Tenant mismatch" });
    }

    const memberships = await Membership.find({ tenantId })
      .populate("userId", "email firstName lastName emailVerifiedAt")
      .sort({ createdAt: 1 });

    const members = memberships.map((m) => ({
      id: m._id,
      user: m.userId,
      role: m.role,
      permissions: m.permissions,
      createdAt: m.createdAt,
    }));

    return res.json({ ok: true, tenantId, members });
  }
);



// Invite/add a user to THIS tenant
router.post(
  "/:tenantId/invite",
  requireAuth,
  requireTenant,
  requirePermission("canInvite"),
  async (req, res) => {
    const { tenantId } = req.params;

    console.log("Invite to tenant:", tenantId, "by user:", req.user.userId);

    // prevent cross-tenant token misuse
    if (tenantId !== String(req.user.tenantId)) {
      return res.status(403).json({ error: "Tenant mismatch" });
    }

    const { email, role = "member" } = req.body;
    if (!email) return res.status(400).json({ error: "email required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "User not found (must register first for now)" });
    }

    const permissions =
      role === "owner" || role === "admin"
        ? { canBuild: true, canInvite: true }
        : role === "builder"
        ? { canBuild: true, canInvite: false }
        : { canBuild: false, canInvite: false };
        

    const membership = await Membership.findOneAndUpdate(
      { tenantId, userId: user._id },
      { tenantId, userId: user._id, role, permissions },
      { upsert: true, new: true }
    );

    return res.json({ ok: true, membership });
  }
);

// Change a member's role in THIS tenant
router.patch(
  "/:tenantId/members/:userId/role",
  requireAuth,
  requireTenant,
  requirePermission("canInvite"),
  async (req, res) => {
    const { tenantId, userId } = req.params;
    const { role } = req.body;

    if (tenantId !== String(req.user.tenantId)) {
      return res.status(403).json({ error: "Tenant mismatch" });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${ALLOWED_ROLES.join(", ")}` });
    }

    // Prevent changing your own role (your code already does this)
    if (String(req.user.userId) === String(userId)) {
      return res.status(400).json({ error: "You cannot change your own role" });
    }

    const membership = await Membership.findOne({ tenantId, userId });
    if (!membership) return res.status(404).json({ error: "Membership not found" });

    membership.role = role;
    membership.permissions = roleToPermissions(role);
    await membership.save();

    return res.json({ ok: true, membership });
  }
);

router.patch(
  "/:tenantId/members/me/availability",
  requireAuth,
  requireTenant,
  async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { isAvailable } = req.body;

      // -------------------------------------------------
      // Tenant protection
      // -------------------------------------------------

      if (tenantId !== String(req.user.tenantId)) {
        return res.status(403).json({
          error: "Tenant mismatch",
        });
      }

      // -------------------------------------------------
      // Validate value
      // -------------------------------------------------

      if (typeof isAvailable !== "boolean") {
        return res.status(400).json({
          error: "isAvailable must be a boolean",
        });
      }

      // -------------------------------------------------
      // Find THIS user's membership
      // -------------------------------------------------

      const membership = await Membership.findOne({
        tenantId,
        userId: req.user.userId,
      });

      if (!membership) {
        return res.status(404).json({
          error: "Membership not found",
        });
      }

      // -------------------------------------------------
      // Update availability
      // -------------------------------------------------

      membership.isAvailable = isAvailable;

      await membership.save();

      console.log("[AVAILABILITY PATCH] Saved membership:", {
        membershipId: membership._id,
        userId: membership.userId,
        tenantId: membership.tenantId,
        availability: membership.availability,
      });

      console.log(
        "[TenantRoutes] Availability changed:",
        {
          tenantId,
          userId: req.user.userId,
          role: membership.role,
          isAvailable: membership.isAvailable,
        }
      );

      return res.json({
        ok: true,
        availability: {
          isAvailable: membership.isAvailable,
        },
      });

    } catch (err) {

      console.error(
        "[TenantRoutes] Availability update error:",
        err
      );

      return res.status(500).json({
        error: "Failed to update availability",
      });
    }
  }
);

router.patch(
  "/members/me/availability",
  requireAuth,
  requireTenant,
  async (req, res) => {
    try {
      const { userId, tenantId } = req.user;
      const { isAvailable } = req.body;

      if (typeof isAvailable !== "boolean") {
        return res.status(400).json({
          error: "isAvailable must be a boolean",
        });
      }

      const membership = await Membership.findOne({
        userId,
        tenantId,
      });

      if (!membership) {
        return res.status(403).json({
          error: "Membership not found",
        });
      }

      membership.isAvailable = isAvailable;

      await membership.save();

      console.log("[TenantRoutes] Availability changed:", {
        tenantId: String(tenantId),
        userId: String(userId),
        role: membership.role,
        isAvailable: membership.isAvailable,
      });

      return res.json({
        ok: true,
        availability: {
          isAvailable: membership.isAvailable,
        },
      });
    } catch (err) {
      console.error(
        "[TenantRoutes] Failed to update availability:",
        err
      );

      return res.status(500).json({
        error: "Failed to update availability",
      });
    }
  }
);



export default router;
