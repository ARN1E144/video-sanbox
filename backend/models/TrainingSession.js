import mongoose from "mongoose";

const trainingSessionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    hostUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    channelName: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "inviting",
        "active",
        "ended",
        "canceled",
        "expired",
      ],
      default: "inviting",
      index: true,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    endedAt: {
      type: Date,
      default: null,
    },

    invitationExpiresAt: {
        type: Date,
        default: null,
        index: true,
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

trainingSessionSchema.index({
  tenantId: 1,
  status: 1,
  createdAt: -1,
});

trainingSessionSchema.index({
  tenantId: 1,
  hostUserId: 1,
  createdAt: -1,
});

export default mongoose.model(
  "TrainingSession",
  trainingSessionSchema
);