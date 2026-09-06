import express from "express";

import iso27001AnnexA
  from "../../frontend/src/data/compliance/iso27001/iso27001AnnexA.js";

const router = express.Router();


// =====================================================
// GET COMPLIANCE DATA
// =====================================================
//
// Initial runtime endpoint.
//
// This deliberately returns seed data rather than
// querying MongoDB.
//
// Purpose:
//   Prove the complete Confo compliance runtime flow:
//
//   compliance.load
//        ↓
//   API
//        ↓
//   RuntimeState
//        ↓
//   RuntimeTriggers
//
// MongoDB persistence will be added after the
// runtime contract is proven.
// =====================================================

router.get(
  "/",
  async (
    req,
    res
  ) => {

    try {

      console.log(
        "[Compliance API] GET /api/compliance"
      );


      const response = {

        // =============================================
        // ORGANISATION
        // =============================================

        organisation: {

          id: "org-demo",

          name:
            "Demo Organisation",

          industry:
            "Technology",

          ownerId:
            null,

          createdAt:
            null,

          updatedAt:
            null,

        },


        // =============================================
        // FRAMEWORK
        // =============================================

        framework: {

          id:
            "iso27001-2022",

          name:
            "ISO/IEC 27001",

          version:
            "2022",

          status:
            "active",

          controlCount:
            iso27001AnnexA.controlCount,

          createdAt:
            null,

          updatedAt:
            null,

        },


        // =============================================
        // CONTROLS
        // =============================================

        controls:
            iso27001AnnexA.controls,


        // =============================================
        // OTHER COMPLIANCE ENTITIES
        // =============================================

        evidence: [],

        risks: [],

        actions: [],

        policies: [],

        suppliers: [],

        training: [],

        audits: [],

        notifications: [],

        activity: [],


        // =============================================
        // METRICS
        // =============================================

        metrics: {

          overallScore:
            0,

          controlsSatisfied:
            0,

          controlsOutstanding:
            93,

          evidenceComplete:
            0,

          overdueActions:
            0,

          openRisks:
            0,

          policiesDueReview:
            0,

          auditReadiness:
            0,

        },

      };


      console.log(
        "[Compliance API] Returning compliance data",
        {
          framework:
            response.framework.name,

          controls:
            response.controls.length,

        }
      );


      return res.json(
        response
      );

    }
    catch (error) {

      console.error(
        "[Compliance API] Failed",
        error
      );


      return res.status(
        500
      ).json({

        error:
          "Failed to load compliance data",

      });

    }

  }
);

router.post("/evidence/request", async (req, res) => {
  try {
    const {
      controlId,
      name = "Evidence required",
      description = "",
      type = "document",
      dueDate = null,
      requestedFor = null,
    } = req.body || {};

    if (!controlId) {
      return res.status(400).json({
        error: "controlId is required",
      });
    }

    const evidence = {
      id: `evidence-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

      controlId,
      name,
      description,
      type,

      source: "request",
      url: null,

      uploadedBy: null,
      uploadedAt: null,

      expiresAt: null,
      dueDate,
      requestedFor,

      status: "requested",

      aiAssessment: null,

      reviewedBy: null,
      reviewedAt: null,

      createdAt: new Date().toISOString(),
    };

    console.log(
      "[POST /api/compliance/evidence/request]",
      evidence
    );

    return res.status(201).json({
      evidence,
    });
  } catch (error) {
    console.error(
      "[POST /api/compliance/evidence/request]",
      error
    );

    return res.status(500).json({
      error: "Failed to request evidence",
    });
  }
});

router.post("/evidence/upload", async (req, res) => {
  try {
    const {
      evidenceId,
      fileName,
      fileUrl = null,
    } = req.body || {};

    if (!evidenceId) {
      return res.status(400).json({
        error: "evidenceId is required",
      });
    }

    if (!fileName) {
      return res.status(400).json({
        error: "fileName is required",
      });
    }

    const evidence = {
      id: evidenceId,
      fileName,
      url: fileUrl,
      status: "processing",
      uploadedAt: new Date().toISOString(),
    };

    console.log(
      "[POST /api/compliance/evidence/upload]",
      evidence
    );

    return res.status(201).json({
      evidence,
    });
  } catch (error) {
    console.error(
      "[POST /api/compliance/evidence/upload]",
      error
    );

    return res.status(500).json({
      error: "Failed to upload evidence",
    });
  }
});

router.post("/evidence/analyse", async (req, res) => {
  try {
    const {
      evidenceId,
      fileName,
      controlId,
    } = req.body || {};

    if (!evidenceId) {
      return res.status(400).json({
        error: "evidenceId is required",
      });
    }

    /*
     * Temporary deterministic AI assessment.
     *
     * We are deliberately NOT connecting an LLM yet.
     * First prove the runtime transition.
     */
    const assessment = {
      decision: "likely_sufficient",
      confidence: 0.87,
      summary:
        "The submitted evidence appears relevant to the control and should be reviewed by a human assessor.",
      findings: [
        "Evidence document identified",
        "Evidence is associated with the requested control",
        "Human review is still required",
      ],
      controlId: controlId || null,
      analysedAt: new Date().toISOString(),
      model: "temporary-assessment",
    };

    console.log(
      "[POST /api/compliance/evidence/analyse]",
      {
        evidenceId,
        fileName,
        assessment,
      }
    );

    return res.status(200).json({
      assessment,
    });
  } catch (error) {
    console.error(
      "[POST /api/compliance/evidence/analyse]",
      error
    );

    return res.status(500).json({
      error: "Failed to analyse evidence",
    });
  }
});


export default router;