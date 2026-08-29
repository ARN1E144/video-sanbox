// backend/routes/tenantMembers.js

import express from "express";

import Membership from "../models/Membership.js";
import User from "../models/User.js";

import {
  requireAuth,
} from "../middleware/requireAuth.js";

import requireTenant from "../middleware/requireTenant.js";

const router = express.Router();

router.get(
  "/members",
  requireAuth,
  requireTenant,
  async (req, res) => {
    try {
      const memberships = await Membership.find({
        tenantId: req.user.tenantId,
      })
        .select("userId role isAvailable")
        .lean();

      const userIds = memberships.map(
        membership => membership.userId
      );

      const users = await User.find({
        _id: { $in: userIds },
      })
        .select("_id firstName lastName email")
        .lean();

      const membershipMap = new Map(
        memberships.map(membership => [
          String(membership.userId),
          membership,
        ])
      );

      const members = users.map(user => {
        const membership =
          membershipMap.get(
            String(user._id)
          );

        return {
          id: String(user._id),
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          role: membership?.role || null,
          isAvailable: Boolean(
            membership?.isAvailable
          ),
        };
      });

      return res.json({
        ok: true,
        members,
      });

    } catch (error) {

      console.error(
        "[TenantMembers] Failed to load members",
        error
      );

      return res.status(500).json({
        error: "Failed to load tenant members",
      });
    }
  }
);

export default router;