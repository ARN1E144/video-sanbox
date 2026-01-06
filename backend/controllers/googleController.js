import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import Tenant from "../models/Tenant.js";
import Membership from "../models/Membership.js";
import { signAccessToken, signRefreshToken } from "../utils/authTokens.js";

function hash(v) {
  return crypto.createHash("sha256").update(v).digest("hex");
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function googleLogin(req, res) {
  try {
    const { idToken, tenantName, tenantId } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "idToken is required" });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: "GOOGLE_CLIENT_ID is not set" });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = (payload?.email || "").toLowerCase();
    const sub = payload?.sub;

    if (!email || !sub) {
      return res.status(401).json({ error: "Invalid Google token payload" });
    }

    // Upsert user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        firstName: payload?.given_name || "",
        lastName: payload?.family_name || "",
        googleSub: sub,
        emailVerifiedAt: new Date(), // Google accounts considered verified
      });
    } else {
      // Link googleSub if missing
      if (!user.googleSub) user.googleSub = sub;
      // If user signed up with password earlier, keep passwordHash as-is
      if (!user.emailVerifiedAt) user.emailVerifiedAt = new Date();
      await user.save();
    }

    // Determine which tenant to sign into / create
    let membership = null;

    // (A) tenantId supplied => must already be a member
    if (tenantId) {
      membership = await Membership.findOne({ userId: user._id, tenantId });
      if (!membership) {
        return res.status(403).json({
          error: "No membership for this tenant. Ask an admin to invite you.",
        });
      }
    }

    // (B) tenantName supplied => self-serve create tenant ONLY if user has none yet
    if (!membership && tenantName) {
      const existingMembership = await Membership.findOne({ userId: user._id });
      if (!existingMembership) {
        const tenant = await Tenant.create({
          name: tenantName,
          ownerUserId: user._id,
        });

        membership = await Membership.create({
          tenantId: tenant._id,
          userId: user._id,
          role: "owner",
          permissions: { canBuild: true, canInvite: true },
        });
      } else {
        // User already belongs somewhere; don’t silently create a new tenant
        // Sign them into their existing tenant instead
        membership = existingMembership;
      }
    }

    // (C) no tenant specified => pick one if exists
    if (!membership) {
      membership = await Membership.findOne({ userId: user._id }).sort({ createdAt: -1 });
      if (!membership) {
        return res.status(404).json({
          error:
            "No tenant membership found. Create a tenant (send tenantName) or ask an admin to invite you.",
        });
      }
    }

    // Issue tokens
    const accessToken = signAccessToken({
      userId: user._id,
      tenantId: membership.tenantId,
      role: membership.role,
    });

    const refreshToken = signRefreshToken({ userId: user._id });

    // Store refresh hash
    user.refreshTokenHash = hash(refreshToken);
    await user.save();

    return res.json({
      user: { id: user._id, email: user.email, emailVerified: true },
      membership: { tenantId: membership.tenantId, role: membership.role },
      tokens: { accessToken, refreshToken },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Google login failed" });
  }
}
