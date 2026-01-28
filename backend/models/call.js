import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },

    clientUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // employee who accepted the call (null until accepted)
    claimedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },

    status: {
      type: String,
      enum: ["waiting", "claimed", "active", "ended", "canceled"],
      default: "waiting",
      index: true,
    },

    // Agora / session info (optional but helpful)
    channelName: { type: String, required: true, index: true },

    claimedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    canceledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

callSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

export default mongoose.model("Call", callSchema);
