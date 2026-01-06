import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Membership from "../models/Membership.js";
import { signAccessToken, signRefreshToken } from "../utils/authTokens.js";

function hash(v) {
  return crypto.createHash("sha256").update(v).digest("hex");
}

export default async function refreshController(req, res) {
  try {
    const { refreshToken, tenantId } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: "Invalid/expired refresh token" });
    }

    const user = await User.findById(payload.userId);
    if (!user || !user.refreshTokenHash) return res.status(401).json({ error: "Refresh not allowed" });

    if (hash(refreshToken) !== user.refreshTokenHash) {
      return res.status(401).json({ error: "Refresh token mismatch" });
    }

    const membership = tenantId
      ? await Membership.findOne({ userId: user._id, tenantId })
      : await Membership.findOne({ userId: user._id }).sort({ createdAt: 1 });

    if (!membership) return res.status(403).json({ error: "No tenant membership found" });

    const newAccessToken = signAccessToken({
      userId: user._id,
      tenantId: membership.tenantId,
      role: membership.role,
    });

    const newRefreshToken = signRefreshToken({ userId: user._id });
    user.refreshTokenHash = hash(newRefreshToken);
    await user.save();

    return res.json({ tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Refresh failed" });
  }
}
