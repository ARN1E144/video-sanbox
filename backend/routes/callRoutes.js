import express from "express";
import crypto from "crypto";
import mongoose from "mongoose";

import Call from "../models/call.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";

import { requireAuth } from "../middleware/requireAuth.js";
import requireTenant from "../middleware/requireTenant.js";

const router = express.Router();

function isEmployeeRole(role) {
  return role === "owner" || role === "admin" || role === "builder" || role === "operative";
}

async function loadMembership(req) {
  const { userId, tenantId } = req.user;

  const membership = await Membership.findOne({
    userId,
    tenantId,
  });

  console.log("[LOAD MEMBERSHIP DEBUG]", {
    userId,
    tenantId,
    membershipId: membership?._id,
    role: membership?.role,
    availability: membership?.availability,
  });

  return membership;
}

function makeChannelName({ tenantId, userId }) {
  const short = crypto.randomBytes(6).toString("hex");
  return `t_${String(tenantId).slice(-6)}_u_${String(userId).slice(-6)}_${short}`;
}

// ---- Call policy (Jan launch default) ----
// "queue" = client creates waiting call; responder claims atomically
// "room"  = creator makes a channel; others can join (no claim needed)
const DEFAULT_CALL_POLICY = {
  mode: "queue",
  creators: ["member", "owner", "admin", "builder", "operative"], // who can create a call
  responders: ["owner", "admin", "builder", "operative"], // who can accept/claim
};

// role helpers using policy (NOT platform permissions)
function canCreateCall(membership, policy = DEFAULT_CALL_POLICY) {
  return !!membership?.role && policy.creators.includes(membership.role);
}

function canAcceptCall(membership, policy = DEFAULT_CALL_POLICY) {
  return !!membership?.role && policy.responders.includes(membership.role);
}

/**
 * CLIENT: Create a call request (status=waiting)
 * POST /api/calls
 */
router.post("/", requireAuth, requireTenant, async (req, res) => {
  console.log("REQ USER:", req.user);
    
  try {
    const membership = await loadMembership(req);

    console.log("[CALLS AVAILABLE] Loaded membership:", {
      id: membership?._id,
      userId: membership?.userId,
      tenantId: membership?.tenantId,
      role: membership?.role,
      availability: membership?.availability,
    });
    const callPolicy = DEFAULT_CALL_POLICY;

    if (!membership) return res.status(403).json({ error: "Not a member of this tenant" });

    // Option A: "member" is client. (You can relax this later.)
    if (!canCreateCall(membership, callPolicy)) {
    return res.status(403).json({
    error: `Not allowed to create calls (role=${membership.role})`,
  });
}

    const channelName = makeChannelName({ tenantId: req.user.tenantId, userId: req.user.userId });

    const call = await Call.create({
      tenantId: req.user.tenantId,
      clientUserId: req.user.userId,
      channelName,
      status: "waiting",
    });

    return res.status(201).json({ ok: true, call });
  } catch (err) {
    console.error("POST /api/calls error:", err);
    return res.status(500).json({ error: "Failed to create call" });
  }
});

/**
 * EMPLOYEE: List available calls
 * GET /api/calls/available
 */
router.get("/available", requireAuth, requireTenant, async (req, res) => {

   console.log("🔥🔥🔥 AVAILABLE ROUTE HIT 🔥🔥🔥");
  console.log(
    "GET /api/calls/available called by user:",
    req.user.userId
  );

  

  try {
    
    const membership = await loadMembership(req);
    const callPolicy = DEFAULT_CALL_POLICY;

    if (!membership) {
      return res.status(403).json({
        error: "Not a member of this tenant",
      });
    }

    if (!canAcceptCall(membership, callPolicy)) {
      return res.status(403).json({
        error: "Not allowed to view available calls",
      });
    }

    // =====================================================
    // AVAILABILITY GATE
    // =====================================================

    if (!membership.isAvailable) {
      console.log(
        "[CALLS AVAILABLE] User is unavailable:",
        req.user.userId
      );

      return res.json({
        ok: true,
        calls: [],
      });
    }

    // =====================================================
    // FETCH WAITING CALLS
    // =====================================================

    console.log("[CALLS AVAILABLE] Query:", {
      tenantId: String(req.user.tenantId),
      userId: String(req.user.userId),
      isAvailable: membership.availability?.isAvailable,
    });

    
    async function expireWaitingCalls(tenantId) {
      const CALL_EXPIRY_MINUTES = 5;

      const expiryDate = new Date(
        Date.now() - CALL_EXPIRY_MINUTES * 60 * 1000
      );

      const result = await Call.updateMany(
        {
          tenantId,
          status: "waiting",
          createdAt: { $lt: expiryDate },
        },
        {
          $set: {
            status: "expired",
            expiredAt: new Date(),
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(
          "[CALL EXPIRY] Expired calls:",
          result.modifiedCount
        );
      }

      return result.modifiedCount;
    }

     await expireWaitingCalls(req.user.tenantId);
    

    const calls = await Call.find({
      tenantId: req.user.tenantId,
      status: "waiting",
      claimedByUserId: null,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();


      console.log("[CALLS AVAILABLE] Loaded membership:", {
        membershipId: membership?._id,
        userId: membership?.userId,
        tenantId: membership?.tenantId,
        role: membership?.role,
        availability: membership?.availability,
      });

    console.log(
  "[CALLS AVAILABLE] Raw waiting calls:",
    calls.map((c) => ({
      id: c._id,
      tenantId: c.tenantId,
      status: c.status,
      claimedByUserId: c.claimedByUserId,
      clientUserId: c.clientUserId,
      channelName: c.channelName,
    }))
  );

    // =====================================================
    // ENRICH CLIENT DATA
    // =====================================================

    const clientIds = [
      ...new Set(
        calls.map((c) => String(c.clientUserId))
      ),
    ];

    const users = await User.find({
      _id: { $in: clientIds },
    })
      .select("email firstName lastName")
      .lean();

    const userMap = new Map(
      users.map((u) => [String(u._id), u])
    );

    const enriched = calls.map((c) => ({
      ...c,
      client:
        userMap.get(String(c.clientUserId)) || null,
    }));

    console.log(
      "[CALLS AVAILABLE] Returning calls:",
      enriched.length
    );

    return res.json({
      ok: true,
      calls: enriched,
    });

  } catch (err) {
    console.error(
      "GET /api/calls/available error:",
      err
    );

    return res.status(500).json({
      error: "Failed to load available calls",
    });
  }
});

/**
 * EMPLOYEE: Accept/claim a call (atomic)
 * POST /api/calls/:callId/accept
 */
router.post("/:callId/accept", requireAuth, requireTenant, async (req, res) => {

  try {
    const membership = await loadMembership(req);
    const callPolicy = DEFAULT_CALL_POLICY;

    if (!membership) return res.status(403).json({ error: "Not a member of this tenant" });

    if (!canAcceptCall(membership, callPolicy)) {
    return res.status(403).json({ error: "Not allowed to accept calls" });
}

    const { callId } = req.params;
    if (!mongoose.isValidObjectId(callId)) {
      return res.status(400).json({ error: "Invalid callId" });
    }

    // Atomic "claim"
    const call = await Call.findOneAndUpdate(
      {
        _id: callId,
        tenantId: req.user.tenantId,
        status: "waiting",
        claimedByUserId: null,
      },
      {
        $set: {
          status: "claimed",
          claimedByUserId: req.user.userId,
          claimedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!call) {
      return res.status(409).json({
        ok: false,
        error: "CALL_NOT_AVAILABLE",
        message: "This call is no longer available",
      });
    }

    return res.json({ ok: true, call });
  } catch (err) {
    console.error("POST /api/calls/:callId/accept error:", err);
    return res.status(500).json({ error: "Failed to accept call" });
  }
});

/**
 * EMPLOYEE: Release a claimed call
 *
 * Used when an employee successfully claims a call
 * but cannot establish the Agora session.
 *
 * The call is returned to the waiting queue.
 */
router.post("/:callId/release", requireAuth, requireTenant, async (req, res) => {

  try {

    const membership =
      await loadMembership(req);


    if (!membership) {

      return res.status(403).json({
        error: "Not a member of this tenant",
      });

    }


    if (
      !canAcceptCall(
        membership,
        DEFAULT_CALL_POLICY
      )
    ) {

      return res.status(403).json({
        error: "Not allowed to release calls",
      });

    }


    const {
      callId
    } = req.params;


    if (
      !mongoose.isValidObjectId(callId)
    ) {

      return res.status(400).json({
        error: "Invalid callId",
      });

    }


    // =====================================================
    // ATOMIC RELEASE
    //
    // Only the employee who claimed the call
    // can release it.
    // =====================================================

    const call =
      await Call.findOneAndUpdate(

        {
          _id:
            callId,

          tenantId:
            req.user.tenantId,

          status:
            "claimed",

          claimedByUserId:
            req.user.userId,
        },

        {
          $set: {
            status:
              "waiting",
          },

          $unset: {
            claimedByUserId: "",
            claimedAt: "",
          },
        },

        {
          new: true,
        }

      );


    if (!call) {

      return res.status(409).json({
        error:
          "Call is no longer claimed by this user",
      });

    }


    console.log(
      "[CALL RELEASED]",
      {
        callId:
          call._id,

        releasedBy:
          req.user.userId,

        status:
          call.status,

        claimedByUserId:
          call.claimedByUserId,

      }
    );


    return res.json({

      ok:
        true,

      call,

    });


  } catch (err) {

    console.error(
      "POST /api/calls/:callId/release error:",
      err
    );


    return res.status(500).json({

      error:
        "Failed to release call",

    });

  }

});

/**
 * END a call (client who created OR employee who claimed OR admin/owner)
 * POST /api/calls/:callId/end
 */
router.post("/:callId/end", requireAuth, requireTenant, async (req, res) => {
  try {
    const membership = await loadMembership(req);
    if (!membership) return res.status(403).json({ error: "Not a member of this tenant" });

    const { callId } = req.params;
    if (!mongoose.isValidObjectId(callId)) {
      return res.status(400).json({ error: "Invalid callId" });
    }

    const call = await Call.findOne({ _id: callId, tenantId: req.user.tenantId });
    if (!call) return res.status(404).json({ error: "Call not found" });

    const isOwnerAdmin = membership.role === "owner" || membership.role === "admin";
    const isClientCreator = String(call.clientUserId) === String(req.user.userId);
    const isClaimedEmployee = call.claimedByUserId && String(call.claimedByUserId) === String(req.user.userId);

    if (!isOwnerAdmin && !isClientCreator && !isClaimedEmployee) {
      return res.status(403).json({ error: "Not allowed to end this call" });
    }

    call.status = "ended";
    call.endedAt = new Date();
    await call.save();

    return res.json({ ok: true, call });
  } catch (err) {
    console.error("POST /api/calls/:callId/end error:", err);
    return res.status(500).json({ error: "Failed to end call" });
  }
});

export default router;
