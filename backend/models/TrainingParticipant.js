import mongoose from "mongoose";

const trainingParticipantSchema =
  new mongoose.Schema(
    {
      sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TrainingSession",
        required: true,
        index: true,
      },

      tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true,
        index: true,
      },

      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      status: {
        type: String,
        enum: [
          "invited",
          "joined",
          "left",
          "declined",
          "expired",
        ],
        default: "invited",
        index: true,
      },

      invitedAt: {
        type: Date,
        default: Date.now,
      },

      joinedAt: {
        type: Date,
        default: null,
      },

      leftAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

trainingParticipantSchema.index(
  {
    sessionId: 1,
    userId: 1,
  },
  {
    unique: true,
  }
);

trainingParticipantSchema.index({
  tenantId: 1,
  userId: 1,
  status: 1,
  createdAt: -1,
});

export default mongoose.model(
  "TrainingParticipant",
  trainingParticipantSchema
);