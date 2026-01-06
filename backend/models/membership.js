import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // roles determine permissions
    role: {
      type: String,
      enum: ["owner", "admin", "builder", "member"],
      default: "member",
      index: true,
    },

    // optional fine-grain flags if you want later
    permissions: {
      canBuild: { type: Boolean, default: false },
      canInvite: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

membershipSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

export default mongoose.model("Membership", membershipSchema);
