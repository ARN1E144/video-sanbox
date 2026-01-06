import crypto from "crypto";
import User from "../models/User.js";

function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export default async function verifyEmail(req, res) {
  try {
    const { email, code } = req.query;
    if (!email || !code) {
      return res.status(400).send("Missing email or code");
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).send("User not found");

    if (user.emailVerifiedAt) return res.send("Already verified");

    if (!user.emailVerifyCodeHash || !user.emailVerifyCodeExpiresAt) {
      return res.status(400).send("No verification code available");
    }

    if (user.emailVerifyCodeExpiresAt.getTime() < Date.now()) {
      return res.status(400).send("Code expired");
    }

    const ok = hashCode(String(code)) === user.emailVerifyCodeHash;
    if (!ok) return res.status(400).send("Invalid code");

    user.emailVerifiedAt = new Date();
    user.emailVerifyCodeHash = null;
    user.emailVerifyCodeExpiresAt = null;
    await user.save();

    return res.send("Email verified ✅ You can return to the app.");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Verify failed");
  }
}
