import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    clientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // -------------------------------------------------
    // Targeted recipient.
    //
    // null = queue call
    // user id = targeted call
    // -------------------------------------------------

    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // employee who accepted the call
    claimedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "waiting",
        "ringing",
        "claimed",
        "active",
        "ended",
        "canceled",
        "expired",
      ],
      default: "waiting",
      index: true,
    },

    channelName: {
      type: String,
      required: true,
      index: true,
    },

    claimedAt: {
      type: Date,
      default: null,
    },

    endedAt: {
      type: Date,
      default: null,
    },

    canceledAt: {
      type: Date,
      default: null,
    },

    expiredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

callSchema.index({
  tenantId: 1,
  status: 1,
  createdAt: -1,
});

// Useful for targeted invitation lookup
callSchema.index({
  tenantId: 1,
  recipientUserId: 1,
  status: 1,
  createdAt: -1,
});

export default mongoose.model("Call", callSchema);