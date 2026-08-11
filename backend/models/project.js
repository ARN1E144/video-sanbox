import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      default: "single",
    },

    schema: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    backgroundConfigs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    /*
    Optional Confo metadata.

    Useful because later we can tell whether
    a project originated from a Confo.
    */

    installedFromConfo: {
      type: String,
      default: null,
    },

    confoVersion: {
      type: String,
      default: null,
    },

    /*
    Ownership.

    Every project belongs to the authenticated user.
    */

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
=====================================================
PROJECT NAME UNIQUENESS
=====================================================

A user can only have one project with a given name.

Different users can still have projects with the
same name.

Example:

User A → "Remote Training"   ✅
User A → "Remote Training"   ❌

User B → "Remote Training"   ✅
*/

ProjectSchema.index(
  {
    ownerId: 1,
    name: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model(
  "Project",
  ProjectSchema
);