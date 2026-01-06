import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/User.js";
import Membership from "../models/Membership.js";
import { signAccessToken, signRefreshToken } from "../utils/authTokens.js";

function hashCode(v) {
  return crypto.createHash("sha256").update(v).digest("hex");
}

export default async function loginUser(req, res) {
  try {
    const { email, password, tenantId } = req.body;

    if (!email || !password) return res.status(400).json({ error: "email + password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // If you support multiple tenants per email, require tenantId (or pick last used)
    const membership = tenantId
      ? await Membership.findOne({ userId: user._id, tenantId })
      : await Membership.findOne({ userId: user._id }).sort({ createdAt: 1 });

    if (!membership) return res.status(403).json({ error: "No tenant membership found" });

    const accessToken = signAccessToken({
      userId: user._id,
      tenantId: membership.tenantId,
      role: membership.role,
    });

    const refreshToken = signRefreshToken({ userId: user._id });

    user.refreshTokenHash = hashCode(refreshToken);
    await user.save();

    return res.json({
      user: { id: user._id, email: user.email, emailVerified: !!user.emailVerifiedAt },
      membership: { tenantId: membership.tenantId, role: membership.role },
      tokens: { accessToken, refreshToken },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Login failed" });
  }
}
