// backend/routes/projectRoutes.js

import express from "express";
import mongoose from "mongoose";

import Project from "../models/project.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();


// =====================================================
// GET ALL PROJECTS
// =====================================================

router.get(
  "/",
  requireAuth,
  async (req, res) => {

    try {

      const ownerId =
        req.user.userId;


      if (
        !mongoose.Types.ObjectId.isValid(
          ownerId
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid authenticated user ID.",
        });

      }


      const projects =
        await Project
          .find({
            ownerId:
              new mongoose.Types.ObjectId(
                ownerId
              ),
          })
          .sort({
            updatedAt: -1,
          })
          .lean();


      return res.status(200).json({

        success: true,

        projects,

      });

    } catch (error) {

      console.error(
        "[Projects] GET /",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to load projects.",

      });

    }

  }
);


// =====================================================
// GET SINGLE PROJECT
// =====================================================

router.get(
  "/:id",
  requireAuth,
  async (req, res) => {

    try {

      const {
        id,
      } = req.params;


      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid project ID.",

        });

      }


      const ownerId =
        new mongoose.Types.ObjectId(
          req.user.userId
        );


      const project =
        await Project
          .findOne({

            _id:
              id,

            ownerId,

          })
          .lean();


      if (!project) {

        return res.status(404).json({

          success: false,

          message:
            "Project not found.",

        });

      }


      return res.status(200).json({

        success: true,

        project,

      });

    } catch (error) {

      console.error(
        "[Projects] GET /:id",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to load project.",

      });

    }

  }
);


// =====================================================
// CREATE PROJECT
// =====================================================

router.post(
  "/",
  requireAuth,
  async (req, res) => {

    try {

      const {
        name,
        type,
        schema,
        backgroundConfigs,
        installedFromConfo,
        confoVersion,
      } = req.body;


      // -------------------------------------------------
      // VALIDATE NAME
      // -------------------------------------------------

      if (
        !name ||
        !name.trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Project name is required.",

        });

      }


      // -------------------------------------------------
      // VALIDATE SCHEMA
      // -------------------------------------------------

      if (!schema) {

        return res.status(400).json({

          success: false,

          message:
            "Project schema is required.",

        });

      }


      // -------------------------------------------------
      // VALIDATE USER
      // -------------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          req.user.userId
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid authenticated user ID.",

        });

      }


      const ownerId =
        new mongoose.Types.ObjectId(
          req.user.userId
        );


      // -------------------------------------------------
      // CREATE
      // -------------------------------------------------

      const project =
        await Project.create({

          name:
            name.trim(),

          type:
            type ||
            "single",

          schema,

          backgroundConfigs:
            backgroundConfigs ||
            {},

          installedFromConfo:
            installedFromConfo ||
            null,

          confoVersion:
            confoVersion ||
            null,

          ownerId,

        });


      console.log(
        "[Projects] Created",
        {
          id:
            project._id,

          name:
            project.name,

          ownerId:
            project.ownerId,
        }
      );


      return res.status(201).json({

        success: true,

        project,

      });

    } catch (error) {

      console.error(
        "[Projects] POST /",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to create project.",

      });

    }

  }
);


// =====================================================
// UPDATE PROJECT
// =====================================================

router.patch(
  "/:id",
  requireAuth,
  async (req, res) => {

    try {

      const {
        id,
      } = req.params;


      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid project ID.",

        });

      }


      const ownerId =
        new mongoose.Types.ObjectId(
          req.user.userId
        );


      // -------------------------------------------------
      // ONLY ACCEPT KNOWN FIELDS
      // -------------------------------------------------

      const updates = {};


      if (
        req.body.name !== undefined
      ) {

        if (
          !req.body.name.trim()
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Project name cannot be empty.",

          });

        }


        updates.name =
          req.body.name.trim();

      }


      if (
        req.body.type !== undefined
      ) {

        updates.type =
          req.body.type;

      }


      if (
        req.body.schema !== undefined
      ) {

        updates.schema =
          req.body.schema;

      }


      if (
        req.body.backgroundConfigs !==
        undefined
      ) {

        updates.backgroundConfigs =
          req.body.backgroundConfigs;

      }


      if (
        req.body.installedFromConfo !==
        undefined
      ) {

        updates.installedFromConfo =
          req.body.installedFromConfo;

      }


      if (
        req.body.confoVersion !==
        undefined
      ) {

        updates.confoVersion =
          req.body.confoVersion;

      }


      const project =
        await Project.findOneAndUpdate(

          {
            _id:
              id,

            ownerId,
          },

          {
            $set:
              updates,
          },

          {
            new:
              true,

            runValidators:
              true,
          }

        ).lean();


      if (!project) {

        return res.status(404).json({

          success: false,

          message:
            "Project not found.",

        });

      }


      return res.status(200).json({

        success: true,

        project,

      });

    } catch (error) {

      console.error(
        "[Projects] PATCH /:id",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to update project.",

      });

    }

  }
);


// =====================================================
// DELETE PROJECT
// =====================================================

router.delete(
  "/:id",
  requireAuth,
  async (req, res) => {

    try {

      const {
        id,
      } = req.params;


      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid project ID.",

        });

      }


      const ownerId =
        new mongoose.Types.ObjectId(
          req.user.userId
        );


      const project =
        await Project.findOneAndDelete({

          _id:
            id,

          ownerId,

        });


      if (!project) {

        return res.status(404).json({

          success: false,

          message:
            "Project not found.",

        });

      }


      console.log(
        "[Projects] Deleted",
        id
      );


      return res.status(200).json({

        success: true,

        message:
          "Project deleted.",

      });

    } catch (error) {

      console.error(
        "[Projects] DELETE /:id",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to delete project.",

      });

    }

  }
);


export default router;