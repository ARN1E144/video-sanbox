import express from "express";
import mongoose from "mongoose";
import multer from "multer";

import Compliance from "../models/Compliance.js";

import iso27001AnnexA
  from "../../frontend/src/data/compliance/iso27001/iso27001AnnexA.js";

import {
  requireAuth,
  getProjectAccess,
} from "../middleware/projectAccess.js";


const router =
  express.Router();


// =====================================================
// HELPERS
// =====================================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});


// =====================================================
// PROJECT ID
// =====================================================

function getProjectId(req) {

  return (
    req.params.projectId ||
    req.query.projectId ||
    req.body?.projectId ||
    null
  );

}


// =====================================================
// PROJECT ACCESS
// =====================================================

async function requireComplianceProject(
  req,
  res
) {

  const projectId =
    getProjectId(req);


  if (!projectId) {

    return {
      error: res.status(400).json({
        error:
          "projectId is required",
      }),
    };

  }


  if (
    !mongoose.Types.ObjectId.isValid(
      projectId
    )
  ) {

    return {
      error: res.status(400).json({
        error:
          "Invalid projectId",
      }),
    };

  }


  const access =
    await getProjectAccess(
      req,
      projectId,
      "canView"
    );


  if (!access.allowed) {

    return {
      error: res.status(403).json({
        error:
          "You do not have access to this project",
      }),
    };

  }


  return {
    projectId,
    project:
      access.project,
    membership:
      access.membership,
  };

}


// =====================================================
// REVIEW ACTOR SNAPSHOT
// =====================================================
//
// We deliberately store a small snapshot rather than
// making DataHub resolve the user every time.
//
// This means historical records remain readable even
// if the user's display name changes later.
//
// =====================================================

function getReviewActor(
  req
) {

  const user =
    req?.user ||
    {};


  return {

    userId:
      user?.userId ||
      user?.id ||
      null,

    name:
      user?.name ||
      user?.displayName ||
      user?.fullName ||
      user?.email ||
      "Unknown user",

    email:
      user?.email ||
      null,

  };

}


// =====================================================
// NORMALISE CONTROL
// =====================================================

function normaliseControl(
  control
) {

  const controlId =
    control.controlId ||
    control.id ||
    control.key;


  return {

    ...control,

    controlId,

    name:
      control.name ||
      control.title ||
      "",

    description:
      control.description ||
      "",

    category:
      control.category ||
      "",

    status:
      control.status ||
      "not_started",

    evidenceStatus:
      control.evidenceStatus ||
      "none",

    evidenceIds:
      Array.isArray(
        control.evidenceIds
      )
        ? control.evidenceIds
        : [],

    evidenceVerified:
      control.evidenceVerified === true,

    evidenceVerifiedAt:
      control.evidenceVerifiedAt ||
      null,

    lastEvidenceId:
      control.lastEvidenceId ||
      null,

    lastReviewedAt:
      control.lastReviewedAt ||
      null,

    lastReviewedByUserId:
      control.lastReviewedByUserId ||
      null,

  };

}


// =====================================================
// CREATE INITIAL COMPLIANCE
// =====================================================

async function createInitialCompliance(
  req,
  projectId,
  project
) {

  const controls =
    (
      iso27001AnnexA.controls ||
      []
    ).map(
      normaliseControl
    );


  return Compliance.create({

    tenantId:
      req.user.tenantId,

    projectId,

    organisation: {

      id:
        project?._id
          ?.toString() ||
        null,

      name:
        project?.name ||
        "",

      industry:
        "",

      ownerId:
        project?.ownerId ||
        null,

    },

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
        controls.length,

    },

    controls,

    evidence: [],

    reviewHistory: [],

    risks: [],

    actions: [],

    policies: [],

    suppliers: [],

    training: [],

    audits: [],

  });

}


// =====================================================
// FIND OR CREATE COMPLIANCE
// =====================================================

async function getOrCreateCompliance(
  req,
  projectId,
  project
) {

  let compliance =
    await Compliance.findOne({

      tenantId:
        req.user.tenantId,

      projectId,

    });


  if (compliance) {

    return compliance;

  }


  try {

    compliance =
      await createInitialCompliance(
        req,
        projectId,
        project
      );

    return compliance;

  }
  catch (error) {

    if (
      error?.code === 11000
    ) {

      compliance =
        await Compliance.findOne({

          tenantId:
            req.user.tenantId,

          projectId,

        });


      if (compliance) {

        return compliance;

      }

    }


    throw error;

  }

}


// =====================================================
// CONTROL STATE REBUILDER
// =====================================================
//
// A control may have multiple evidence records.
//
// Therefore deleting or changing one piece of evidence
// must not blindly reset the control.
//
// Priority:
//
// accepted
//    ↓
// review_required
//    ↓
// processing
//    ↓
// requested
//    ↓
// rejected
//    ↓
// none
//
// =====================================================

function rebuildControlState(
  control,
  evidenceRecords
) {

  if (!control) {
    return;
  }


  const evidence =
    Array.isArray(
      evidenceRecords
    )
      ? evidenceRecords
      : [];


  const related =
    evidence.filter(
      item =>
        item?.controlId ===
        control.controlId
    );


  control.evidenceIds =
    related
      .map(
        item =>
          item?.evidenceId
      )
      .filter(Boolean);


  const accepted =
    related
      .filter(
        item =>
          item?.status ===
          "accepted"
      )
      .sort(
        (
          a,
          b
        ) =>
          new Date(
            b?.reviewedAt ||
            b?.createdAt ||
            0
          ) -
          new Date(
            a?.reviewedAt ||
            a?.createdAt ||
            0
          )
      );


  const reviewRequired =
    related
      .filter(
        item =>
          item?.status ===
          "review_required"
      );


  const processing =
    related
      .filter(
        item =>
          item?.status ===
            "processing" ||
          item?.status ===
            "requested"
      );


  const rejected =
    related
      .filter(
        item =>
          item?.status ===
          "rejected"
      );


  if (
    accepted.length > 0
  ) {

    const latest =
      accepted[0];


    control.status =
      "compliant";

    control.evidenceStatus =
      "verified";

    control.evidenceVerified =
      true;

    control.evidenceVerifiedAt =
      latest?.reviewedAt ||
      null;

    control.lastEvidenceId =
      latest?.evidenceId ||
      null;

    control.lastReviewedAt =
      latest?.reviewedAt ||
      null;

    control.lastReviewedByUserId =
      latest?.reviewedByUserId ||
      null;

    return;

  }


  if (
    reviewRequired.length > 0
  ) {

    control.status =
      "review_required";

    control.evidenceStatus =
      "review_required";

    control.evidenceVerified =
      false;

    control.evidenceVerifiedAt =
      null;

    control.lastEvidenceId =
      reviewRequired[
        reviewRequired.length - 1
      ]?.evidenceId ||
      null;

    return;

  }


  if (
    processing.length > 0
  ) {

    const hasProcessing =
      processing.some(
        item =>
          item?.status ===
          "processing"
      );


    control.status =
      hasProcessing
        ? "review_required"
        : "evidence_requested";


    control.evidenceStatus =
      hasProcessing
        ? "processing"
        : "requested";

    control.evidenceVerified =
      false;

    control.evidenceVerifiedAt =
      null;

    control.lastEvidenceId =
      processing[
        processing.length - 1
      ]?.evidenceId ||
      null;

    return;

  }


  if (
    rejected.length > 0
  ) {

    const latest =
      rejected[
        rejected.length - 1
      ];


    control.status =
      "remediation";

    control.evidenceStatus =
      "rejected";

    control.evidenceVerified =
      false;

    control.evidenceVerifiedAt =
      null;

    control.lastEvidenceId =
      latest?.evidenceId ||
      null;

    control.lastReviewedAt =
      latest?.reviewedAt ||
      null;

    control.lastReviewedByUserId =
      latest?.reviewedByUserId ||
      null;

    return;

  }


  control.status =
    "not_started";

  control.evidenceStatus =
    "none";

  control.evidenceVerified =
    false;

  control.evidenceVerifiedAt =
    null;

  control.lastEvidenceId =
    null;

}


// =====================================================
// SERIALISE COMPLIANCE
// =====================================================

function serialiseCompliance(
  compliance
) {

  const controls =
    compliance.controls ||
    [];

  const evidence =
    compliance.evidence ||
    [];


  const controlsSatisfied =
    controls.filter(
      control =>
        control.status ===
        "compliant"
    ).length;


  const controlsOutstanding =
    Math.max(
      controls.length -
      controlsSatisfied,
      0
    );


  const evidenceComplete =
    evidence.filter(
      item =>
        item.status ===
        "accepted"
    ).length;


  const overallScore =
    controls.length > 0
      ? Math.round(
          (
            controlsSatisfied /
            controls.length
          ) * 100
        )
      : 0;


  return {

    id:
      compliance._id,

    projectId:
      compliance.projectId,

    organisation:
      compliance.organisation,

    framework:
      compliance.framework,

    controls,

    evidence,

    reviewHistory:
      compliance.reviewHistory ||
      [],

    risks:
      compliance.risks ||
      [],

    actions:
      compliance.actions ||
      [],

    policies:
      compliance.policies ||
      [],

    suppliers:
      compliance.suppliers ||
      [],

    training:
      compliance.training ||
      [],

    audits:
      compliance.audits ||
      [],

    notifications: [],

    activity: [],

    metrics: {

      overallScore,

      controlsSatisfied,

      controlsOutstanding,

      evidenceComplete,

      overdueActions:
        0,

      openRisks:
        (
          compliance.risks ||
          []
        ).filter(
          risk =>
            risk?.status ===
            "open"
        ).length,

      policiesDueReview:
        0,

      auditReadiness:
        overallScore,

    },

  };

}


// =====================================================
// GET COMPLIANCE
// =====================================================

router.get(
  "/",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireComplianceProject(
          req,
          res
        );


      if (access.error) {
        return;
      }


      const compliance =
        await getOrCreateCompliance(
          req,
          access.projectId,
          access.project
        );


      return res.json(
        serialiseCompliance(
          compliance
        )
      );

    }
    catch (error) {

      console.error(
        "[COMPLIANCE] Failed to load compliance",
        error
      );


      return res.status(500).json({
        error:
          "Failed to load compliance data",
      });

    }

  }
);


// =====================================================
// REQUEST EVIDENCE
// =====================================================

router.post(
  "/evidence/request",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireComplianceProject(
          req,
          res
        );


      if (access.error) {
        return;
      }


      const {
        controlId,
        name,
        description,
        type,
        dueDate,
        requestedFor,
      } = req.body;


      if (!controlId) {

        return res.status(400).json({
          error:
            "controlId is required",
        });

      }


      const compliance =
        await getOrCreateCompliance(
          req,
          access.projectId,
          access.project
        );


      const control =
        compliance.controls.find(
          item =>
            item.controlId ===
            controlId
        );


      if (!control) {

        return res.status(404).json({
          error:
            "Compliance control not found",
        });

      }


      const evidenceId =
        `evidence-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;


      const now =
        new Date();


      const evidence = {

        evidenceId,

        controlId,

        name:
          name ||
          "Evidence required",

        description:
          description ||
          "",

        type:
          type ||
          "document",

        source:
          "request",

        status:
          "requested",

        fileName:
          null,

        fileUrl:
          null,

        requestedFor:
          requestedFor ||
          null,

        dueDate:
          dueDate
            ? new Date(dueDate)
            : null,

        aiAssessment:
          null,

        reviewDecision:
          null,

        reviewedByUserId:
          null,

        reviewedByName:
          null,

        reviewedByEmail:
          null,

        reviewedAt:
          null,

        createdByUserId:
          req.user.userId,

        createdAt:
          now,

      };


      compliance.evidence.push(
        evidence
      );


      control.evidenceIds.push(
        evidenceId
      );


      control.status =
        "evidence_requested";

      control.evidenceStatus =
        "requested";


      compliance.reviewHistory.push({

        event:
          "compliance.evidenceRequested",

        controlId,

        evidenceId,

        userId:
          req.user.userId,

        data: {

          name:
            evidence.name,

          type:
            evidence.type,

        },

        createdAt:
          now,

      });


      await compliance.save();


      return res.status(201).json({
        evidence,
      });

    }
    catch (error) {

      console.error(
        "[COMPLIANCE] Failed to request evidence",
        error
      );


      return res.status(500).json({
        error:
          "Failed to request evidence",
      });

    }

  }
);


// =====================================================
// UPLOAD EVIDENCE
// =====================================================

router.post(
  "/evidence/upload",
  requireAuth,
  upload.single("file"),
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireComplianceProject(
          req,
          res
        );


      if (access.error) {
        return;
      }


      const evidenceId =
        req.body?.evidenceId;


      const file =
        req.file;


      if (!evidenceId) {

        return res.status(400).json({
          error:
            "evidenceId is required",
        });

      }


      const compliance =
        await getOrCreateCompliance(
          req,
          access.projectId,
          access.project
        );


      const evidence =
        compliance.evidence.find(
          item =>
            item.evidenceId ===
            evidenceId
        );


      if (!evidence) {

        return res.status(404).json({
          error:
            "Evidence not found",
        });

      }


      const now =
        new Date();


      evidence.fileName =
        file?.originalname ||
        evidence.fileName ||
        null;


      /*
       * The actual S3 URL can continue to be supplied by
       * the separate storage flow.
       */
      evidence.fileUrl =
        evidence.fileUrl ||
        null;


      evidence.source =
        "upload";

      evidence.status =
        "processing";

      evidence.reviewDecision =
        null;

      evidence.reviewedByUserId =
        null;

      evidence.reviewedByName =
        null;

      evidence.reviewedByEmail =
        null;

      evidence.reviewedAt =
        null;


      compliance.reviewHistory.push({

        event:
          "compliance.evidenceUploaded",

        controlId:
          evidence.controlId,

        evidenceId,

        userId:
          req.user.userId,

        data: {

          fileName:
            evidence.fileName,

          fileUrl:
            evidence.fileUrl,

        },

        createdAt:
          now,

      });


      const control =
        compliance.controls.find(
          item =>
            item.controlId ===
            evidence.controlId
        );


      rebuildControlState(
        control,
        compliance.evidence
      );


      await compliance.save();


      return res.json({
        evidence,
      });

    }
    catch (error) {

      console.error(
        "[COMPLIANCE] Failed to upload evidence",
        error
      );


      return res.status(500).json({
        error:
          "Failed to upload evidence",
      });

    }

  }
);


// =====================================================
// ANALYSE EVIDENCE
// =====================================================

router.post(
  "/evidence/analyse",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireComplianceProject(
          req,
          res
        );


      if (access.error) {
        return;
      }


      const {
        evidenceId,
        controlId,
      } = req.body;


      if (!evidenceId) {

        return res.status(400).json({
          error:
            "evidenceId is required",
        });

      }


      const compliance =
        await getOrCreateCompliance(
          req,
          access.projectId,
          access.project
        );


      const evidence =
        compliance.evidence.find(
          item =>
            item.evidenceId ===
            evidenceId
        );


      if (!evidence) {

        return res.status(404).json({
          error:
            "Evidence not found",
        });

      }


      const resolvedControlId =
        controlId ||
        evidence.controlId;


      const assessment = {

        decision:
          "likely_sufficient",

        confidence:
          0.87,

        summary:
          "The submitted evidence appears relevant to the control and should be reviewed by a human assessor.",

        findings: [
          "Evidence document identified",
          "Evidence is associated with the requested control",
          "Human review is still required",
        ],

        controlId:
          resolvedControlId,

        analysedAt:
          new Date(),

        model:
          "temporary-assessment",

      };


      evidence.aiAssessment =
        assessment;

      evidence.status =
        "review_required";

      evidence.reviewDecision =
        null;

      evidence.reviewedByUserId =
        null;

      evidence.reviewedByName =
        null;

      evidence.reviewedByEmail =
        null;

      evidence.reviewedAt =
        null;


      const control =
        compliance.controls.find(
          item =>
            item.controlId ===
            resolvedControlId
        );


      if (control) {

        control.status =
          "review_required";

        control.evidenceStatus =
          "review_required";

        control.evidenceVerified =
          false;

      }


      compliance.reviewHistory.push({

        event:
          "compliance.evidenceReviewRequired",

        controlId:
          resolvedControlId,

        evidenceId,

        userId:
          req.user.userId,

        data: {

          decision:
            assessment.decision,

          confidence:
            assessment.confidence,

          model:
            assessment.model,

        },

        createdAt:
          new Date(),

      });


      await compliance.save();


      return res.json({
        evidence,
        assessment,
      });

    }
    catch (error) {

      console.error(
        "[COMPLIANCE] Failed to analyse evidence",
        error
      );


      return res.status(500).json({
        error:
          "Failed to analyse evidence",
      });

    }

  }
);


// =====================================================
// ACCEPT EVIDENCE
// =====================================================

router.post(
  "/evidence/accept",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireComplianceProject(
          req,
          res
        );


      if (access.error) {
        return;
      }


      const {
        evidenceId,
      } = req.body;


      if (!evidenceId) {

        return res.status(400).json({
          error:
            "evidenceId is required",
        });

      }


      const compliance =
        await getOrCreateCompliance(
          req,
          access.projectId,
          access.project
        );


      const evidence =
        compliance.evidence.find(
          item =>
            item.evidenceId ===
            evidenceId
        );


      if (!evidence) {

        return res.status(404).json({
          error:
            "Evidence not found",
        });

      }


      if (
        evidence.status !==
        "review_required"
      ) {

        return res.status(400).json({
          error:
            "Evidence is not awaiting review",
        });

      }


      const now =
        new Date();


      const actor =
        getReviewActor(
          req
        );


      evidence.status =
        "accepted";

      evidence.reviewDecision =
        "accepted";

      evidence.reviewedByUserId =
        actor.userId;

      evidence.reviewedByName =
        actor.name;

      evidence.reviewedByEmail =
        actor.email;

      evidence.reviewedAt =
        now;


      const control =
        compliance.controls.find(
          item =>
            item.controlId ===
            evidence.controlId
        );


      if (control) {

        control.status =
          "compliant";

        control.evidenceStatus =
          "verified";

        control.evidenceVerified =
          true;

        control.evidenceVerifiedAt =
          now;

        control.lastEvidenceId =
          evidenceId;

        control.lastReviewedAt =
          now;

        control.lastReviewedByUserId =
          actor.userId;

      }


      compliance.reviewHistory.push({

        event:
          "compliance.evidenceAccepted",

        controlId:
          evidence.controlId,

        evidenceId,

        userId:
          actor.userId,

        data: {

          decision:
            "accepted",

          reviewer: {

            userId:
              actor.userId,

            name:
              actor.name,

            email:
              actor.email,

          },

        },

        createdAt:
          now,

      });


      await compliance.save();


      return res.json({

        ok:
          true,

        evidence,

        controlId:
          evidence.controlId,

        status:
          "accepted",

        reviewDecision:
          "accepted",

        reviewedByUserId:
          actor.userId,

        reviewedByName:
          actor.name,

        reviewedByEmail:
          actor.email,

        reviewedAt:
          now,

      });

    }
    catch (error) {

      console.error(
        "[COMPLIANCE] Failed to accept evidence",
        error
      );


      return res.status(500).json({
        error:
          "Failed to accept evidence",
      });

    }

  }
);


// =====================================================
// REJECT EVIDENCE
// =====================================================

router.post(
  "/evidence/reject",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireComplianceProject(
          req,
          res
        );


      if (access.error) {
        return;
      }


      const {
        evidenceId,
      } = req.body;


      if (!evidenceId) {

        return res.status(400).json({
          error:
            "evidenceId is required",
        });

      }


      const compliance =
        await getOrCreateCompliance(
          req,
          access.projectId,
          access.project
        );


      const evidence =
        compliance.evidence.find(
          item =>
            item.evidenceId ===
            evidenceId
        );


      if (!evidence) {

        return res.status(404).json({
          error:
            "Evidence not found",
        });

      }


      if (
        evidence.status !==
        "review_required"
      ) {

        return res.status(400).json({
          error:
            "Evidence is not awaiting review",
        });

      }


      const now =
        new Date();


      const actor =
        getReviewActor(
          req
        );


      evidence.status =
        "rejected";

      evidence.reviewDecision =
        "rejected";

      evidence.reviewedByUserId =
        actor.userId;

      evidence.reviewedByName =
        actor.name;

      evidence.reviewedByEmail =
        actor.email;

      evidence.reviewedAt =
        now;


      const control =
        compliance.controls.find(
          item =>
            item.controlId ===
            evidence.controlId
        );


      if (control) {

        control.status =
          "remediation";

        control.evidenceStatus =
          "rejected";

        control.evidenceVerified =
          false;

        control.evidenceVerifiedAt =
          null;

        control.lastEvidenceId =
          evidenceId;

        control.lastReviewedAt =
          now;

        control.lastReviewedByUserId =
          actor.userId;

      }


      compliance.reviewHistory.push({

        event:
          "compliance.evidenceRejected",

        controlId:
          evidence.controlId,

        evidenceId,

        userId:
          actor.userId,

        data: {

          decision:
            "rejected",

          reviewer: {

            userId:
              actor.userId,

            name:
              actor.name,

            email:
              actor.email,

          },

        },

        createdAt:
          now,

      });


      await compliance.save();


      return res.json({

        ok:
          true,

        evidence,

        controlId:
          evidence.controlId,

        status:
          "rejected",

        reviewDecision:
          "rejected",

        reviewedByUserId:
          actor.userId,

        reviewedByName:
          actor.name,

        reviewedByEmail:
          actor.email,

        reviewedAt:
          now,

      });

    }
    catch (error) {

      console.error(
        "[COMPLIANCE] Failed to reject evidence",
        error
      );


      return res.status(500).json({
        error:
          "Failed to reject evidence",
      });

    }

  }
);


// =====================================================
// GET SINGLE EVIDENCE
// =====================================================
//
// GET /api/compliance/evidence/:evidenceId
//
// Used by the future Data Hub evidence detail view.
// =====================================================

router.get(
  "/evidence/:evidenceId",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireComplianceProject(
          req,
          res
        );


      if (access.error) {
        return;
      }


      const compliance =
        await getOrCreateCompliance(
          req,
          access.projectId,
          access.project
        );


      const evidence =
        compliance.evidence.find(
          item =>
            item.evidenceId ===
            req.params.evidenceId
        );


      if (!evidence) {

        return res.status(404).json({
          error:
            "Evidence not found",
        });

      }


      const history =
        (
          compliance.reviewHistory ||
          []
        ).filter(
          item =>
            item.evidenceId ===
            evidence.evidenceId
        );


      return res.json({

        evidence,

        history,

      });

    }
    catch (error) {

      console.error(
        "[COMPLIANCE] Failed to load evidence detail",
        error
      );


      return res.status(500).json({
        error:
          "Failed to load evidence detail",
      });

    }

  }
);


// =====================================================
// UPDATE EVIDENCE
// =====================================================
//
// PATCH /api/compliance/evidence/:evidenceId
//
// Editable:
//
// name
// description
// type
// dueDate
// controlId
//
// Deliberately protected:
//
// evidenceId
// status
// reviewDecision
// reviewer
// createdAt
// AI assessment
//
// Those state transitions must happen through their
// dedicated endpoints.
// =====================================================

router.patch(
  "/evidence/:evidenceId",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireComplianceProject(
          req,
          res
        );


      if (access.error) {
        return;
      }


      const compliance =
        await getOrCreateCompliance(
          req,
          access.projectId,
          access.project
        );


      const evidence =
        compliance.evidence.find(
          item =>
            item.evidenceId ===
            req.params.evidenceId
        );


      if (!evidence) {

        return res.status(404).json({
          error:
            "Evidence not found",
        });

      }


      const {
        name,
        description,
        type,
        dueDate,
        controlId,
      } = req.body;


      const previousControlId =
        evidence.controlId;


      let nextControlId =
        previousControlId;


      if (
        controlId !==
        undefined
      ) {

        if (
          !controlId
        ) {

          return res.status(400).json({
            error:
              "controlId cannot be empty",
          });

        }


        const targetControl =
          compliance.controls.find(
            item =>
              item.controlId ===
              controlId
          );


        if (!targetControl) {

          return res.status(404).json({
            error:
              "Target compliance control not found",
          });

        }


        nextControlId =
          controlId;

      }


      if (
        name !==
        undefined
      ) {

        evidence.name =
          String(
            name
          ).trim();

      }


      if (
        description !==
        undefined
      ) {

        evidence.description =
          String(
            description
          );

      }


      if (
        type !==
        undefined
      ) {

        const allowedTypes = [
          "document",
          "image",
          "spreadsheet",
          "video",
          "other",
        ];


        if (
          !allowedTypes.includes(
            type
          )
        ) {

          return res.status(400).json({
            error:
              "Invalid evidence type",
          });

        }


        evidence.type =
          type;

      }


      if (
        dueDate !==
        undefined
      ) {

        if (
          dueDate ===
          null ||
          dueDate ===
          ""
        ) {

          evidence.dueDate =
            null;

        }
        else {

          const parsedDate =
            new Date(
              dueDate
            );


          if (
            Number.isNaN(
              parsedDate.getTime()
            )
          ) {

            return res.status(400).json({
              error:
                "Invalid dueDate",
            });

          }


          evidence.dueDate =
            parsedDate;

        }

      }


      if (
        nextControlId !==
        previousControlId
      ) {

        evidence.controlId =
          nextControlId;


        const oldControl =
          compliance.controls.find(
            item =>
              item.controlId ===
              previousControlId
          );


        const newControl =
          compliance.controls.find(
            item =>
              item.controlId ===
              nextControlId
          );


        if (oldControl) {

          rebuildControlState(
            oldControl,
            compliance.evidence
          );

        }


        if (newControl) {

          rebuildControlState(
            newControl,
            compliance.evidence
          );

        }

      }
      else {

        const control =
          compliance.controls.find(
            item =>
              item.controlId ===
              evidence.controlId
          );


        rebuildControlState(
          control,
          compliance.evidence
        );

      }


      compliance.reviewHistory.push({

        event:
          "compliance.evidenceUpdated",

        controlId:
          evidence.controlId,

        evidenceId:
          evidence.evidenceId,

        userId:
          req.user.userId,

        data: {

          changedFields:
            Object.keys(
              req.body || {}
            ).filter(
              field =>
                [
                  "name",
                  "description",
                  "type",
                  "dueDate",
                  "controlId",
                ].includes(
                  field
                )
            ),

          previousControlId,

          nextControlId,

        },

        createdAt:
          new Date(),

      });


      await compliance.save();


      return res.json({
        ok:
          true,

        evidence,
      });

    }
    catch (error) {

      console.error(
        "[COMPLIANCE] Failed to update evidence",
        error
      );


      return res.status(500).json({
        error:
          "Failed to update evidence",
      });

    }

  }
);


// =====================================================
// DELETE EVIDENCE
// =====================================================
//
// DELETE /api/compliance/evidence/:evidenceId
//
// Deletes the embedded evidence record and removes its
// reference from the associated control.
//
// The file itself is NOT deleted from S3 here because
// the current prototype deliberately separates storage
// from the compliance metadata service.
// =====================================================

router.delete(
  "/evidence/:evidenceId",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireComplianceProject(
          req,
          res
        );


      if (access.error) {
        return;
      }


      const compliance =
        await getOrCreateCompliance(
          req,
          access.projectId,
          access.project
        );


      const evidenceIndex =
        compliance.evidence.findIndex(
          item =>
            item.evidenceId ===
            req.params.evidenceId
        );


      if (
        evidenceIndex ===
        -1
      ) {

        return res.status(404).json({
          error:
            "Evidence not found",
        });

      }


      const evidence =
        compliance.evidence[
          evidenceIndex
        ];


      const controlId =
        evidence.controlId;


      const evidenceId =
        evidence.evidenceId;


      compliance.evidence.splice(
        evidenceIndex,
        1
      );


      const control =
        compliance.controls.find(
          item =>
            item.controlId ===
            controlId
        );


      rebuildControlState(
        control,
        compliance.evidence
      );


      compliance.reviewHistory.push({

        event:
          "compliance.evidenceDeleted",

        controlId,

        evidenceId,

        userId:
          req.user.userId,

        data: {

          name:
            evidence.name,

          fileName:
            evidence.fileName,

          previousStatus:
            evidence.status,

        },

        createdAt:
          new Date(),

      });


      await compliance.save();


      return res.json({

        ok:
          true,

        evidenceId,

        controlId,

      });

    }
    catch (error) {

      console.error(
        "[COMPLIANCE] Failed to delete evidence",
        error
      );


      return res.status(500).json({
        error:
          "Failed to delete evidence",
      });

    }

  }
);


// =====================================================
// COMPLIANCE HISTORY
// =====================================================
//
// GET /api/compliance/history?projectId=...
//
// Dedicated Data Hub audit feed.
// =====================================================

router.get(
  "/history",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireComplianceProject(
          req,
          res
        );


      if (access.error) {
        return;
      }


      const compliance =
        await getOrCreateCompliance(
          req,
          access.projectId,
          access.project
        );


      const history =
        Array.isArray(
          compliance.reviewHistory
        )
          ? compliance.reviewHistory
              .slice()
              .sort(
                (
                  a,
                  b
                ) =>
                  new Date(
                    b?.createdAt ||
                    0
                  ) -
                  new Date(
                    a?.createdAt ||
                    0
                  )
              )
          : [];


      return res.json({

        projectId:
          access.projectId,

        history,

      });

    }
    catch (error) {

      console.error(
        "[COMPLIANCE] Failed to load history",
        error
      );


      return res.status(500).json({
        error:
          "Failed to load compliance history",
      });

    }

  }
);


// =====================================================
// EXPORT
// =====================================================

export default router;