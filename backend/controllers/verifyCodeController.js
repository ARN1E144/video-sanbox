import crypto from "crypto";
import User from "../models/User.js";

function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export default async function verifyCode(req, res) {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "email + code required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.emailVerifiedAt) return res.json({ ok: true, alreadyVerified: true });

    if (!user.emailVerifyCodeHash || !user.emailVerifyCodeExpiresAt) {
      return res.status(400).json({ error: "No verification code available" });
    }

    if (user.emailVerifyCodeExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: "Code expired" });
    }

    const ok = hashCode(code) === user.emailVerifyCodeHash;
    if (!ok) return res.status(400).json({ error: "Invalid code" });

    user.emailVerifiedAt = new Date();
    user.emailVerifyCodeHash = null;
    user.emailVerifyCodeExpiresAt = null;
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Verify failed" });
  }
}
