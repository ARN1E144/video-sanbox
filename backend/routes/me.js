// backend/routes/me.js
import express from "express";
import User from "../models/User.js";
import Tenant from "../models/Tenant.js";
import Membership from "../models/Membership.js";
import { requireAuth } from "../middleware/requireAuth.js";
import  requireTenant  from "../middleware/requireTenant.js";

const router = express.Router();

router.get(
  "/me",
  requireAuth,
  requireTenant,
  async (req, res) => {
    try {

      console.log("[ME ROUTE] Authenticated user info:", req.user);
      
      const { userId, tenantId } = req.user;

      console.log(
        "[ME ROUTE] Fetching session for user:",
        userId,
        "in tenant:",
        tenantId
      );

      const [user, membership, tenant] = await Promise.all([
        User.findById(userId).select("email firstName lastName emailVerifiedAt"),
        Membership.findOne({ userId, tenantId }).select(
          "role permissions tenantId userId"
        ),
        Tenant.findById(tenantId).select("name slug ownerUserId"),
      ]);

      if (!user) return res.status(404).json({ error: "User not found" });
      if (!membership)
        return res
          .status(404)
          .json({ error: "Membership not found for tenant" });

      return res.json({
        user,
        tenant,
        membership,
        auth: req.user,
      });
    } catch (err) {
      console.error("GET /me error:", err);
      return res.status(500).json({ error: "Failed to load session" });
    }
  }
);


export default router;
