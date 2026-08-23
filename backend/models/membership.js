import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
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

    // =====================================================
    // ROLE
    // =====================================================

    role: {
      type: String,
      enum: ["owner", "admin", "builder", "member"],
      default: "member",
      index: true,
    },

    // =====================================================
    // PERMISSIONS
    // =====================================================

    permissions: {
      canBuild: {
        type: Boolean,
        default: false,
      },

      canInvite: {
        type: Boolean,
        default: false,
      },
    },

    // =====================================================
    // AVAILABILITY
    //
    // Tenant-specific availability.
    //
    // true  = member is available to receive/discover calls
    // false = member is unavailable
    // =====================================================

    isAvailable: {
      type: Boolean,
      default: false,
      index: true,
    },
  },

  { timestamps: true }
);

// One membership per user per tenant
membershipSchema.index(
  { tenantId: 1, userId: 1 },
  { unique: true }
);

export default mongoose.model("Membership", membershipSchema);