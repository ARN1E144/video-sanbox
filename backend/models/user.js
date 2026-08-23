import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    email: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },

    passwordHash: { type: String }, // null if Google-only

    // =====================================================
    // VERIFICATION
    // =====================================================

    emailVerifiedAt: { type: Date, default: null },
    emailVerifyCodeHash: { type: String, default: null },
    emailVerifyCodeExpiresAt: { type: Date, default: null },

    // =====================================================
    // REFRESH TOKEN ROTATION
    // =====================================================

    refreshTokenHash: { type: String, default: null },

    // =====================================================
    // OAUTH
    // =====================================================

    googleSub: { type: String, default: null },

    // =====================================================
    // AVAILABILITY
    //
    // Controls whether this user is available to receive
    // incoming calls.
    //
    // "busy" will be used later by the runtime when the
    // user is actively handling a call.
    // =====================================================

    availability: {
      status: {
        type: String,
        enum: ["available", "unavailable", "busy"],
        default: "unavailable",
        index: true,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
