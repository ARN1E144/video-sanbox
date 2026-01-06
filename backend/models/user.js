import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    email: { type: String, unique: true, index: true, required: true },
    passwordHash: { type: String }, // null if Google-only

    // verification
    emailVerifiedAt: { type: Date, default: null },
    emailVerifyCodeHash: { type: String, default: null },
    emailVerifyCodeExpiresAt: { type: Date, default: null },

    // refresh token rotation (store hashed)
    refreshTokenHash: { type: String, default: null },

    // oauth (optional)
    googleSub: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
