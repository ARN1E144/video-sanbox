import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/User.js";
import Tenant from "../models/Tenant.js";
import Membership from "../models/Membership.js";
import { signAccessToken, signRefreshToken } from "../utils/authTokens.js";

function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function make6DigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default async function registerUser(req, res) {
  try {
    const { firstName, lastName, email, password, tenantName } = req.body;

    if (!email || !password || !tenantName) {
      return res.status(400).json({ error: "email, password, tenantName are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);

    // email verification code
    const code = make6DigitCode();
    const emailVerifyCodeHash = hashCode(code);
    const emailVerifyCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      passwordHash,
      emailVerifyCodeHash,
      emailVerifyCodeExpiresAt,
    });

    const tenant = await Tenant.create({
      name: tenantName,
      ownerUserId: user._id,
    });

    await Membership.create({
      tenantId: tenant._id,
      userId: user._id,
      role: "owner",
      permissions: { canBuild: true, canInvite: true },
    });

    // Issue tokens (you can require verification before issuing if you want)
    const accessToken = signAccessToken({ userId: user._id, tenantId: tenant._id, role: "owner" });
    const refreshToken = signRefreshToken({ userId: user._id });

    // store refresh hash
    const refreshTokenHash = hashCode(refreshToken);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    // TODO: send verification code via email (SendGrid etc)
    console.log("EMAIL VERIFY CODE (dev only):", code);

    return res.status(201).json({
      user: { id: user._id, email: user.email, emailVerified: !!user.emailVerifiedAt },
      tenant: { id: tenant._id, name: tenant.name },
      tokens: { accessToken, refreshToken },
      verify: { devCode: code }, // remove in production
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Registration failed" });
  }
}
