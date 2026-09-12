import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import OpenAI from "openai";

import {
  PDFParse,
} from "pdf-parse";

import mammoth from "mammoth";

import Compliance from "../models/Compliance.js";

import iso27001AnnexA
  from "../../frontend/src/data/compliance/iso27001/iso27001AnnexA.js";

import {
  requireAuth,
  getProjectAccess,
} from "../middleware/projectAccess.js";


// =====================================================
// OPENAI
// =====================================================

const openai =
  new OpenAI({
    apiKey:
      process.env.OPENAI_API_KEY,
  });


// =====================================================
// ROUTER
// =====================================================

const router =
  express.Router();


// =====================================================
// UPLOAD
// =====================================================

const upload =
  multer({

    storage:
      multer.memoryStorage(),

    limits: {

      fileSize:
        25 *
        1024 *
        1024,

    },

  });


// =====================================================
// CONSTANTS
// =====================================================

const MAX_EXTRACTED_TEXT_LENGTH =
  120000;

const MAX_AI_INPUT_TEXT_LENGTH =
  60000;


// =====================================================
// HELPERS
// =====================================================

function getProjectId(
  req
) {

  return (

    req.params?.projectId ||

    req.query?.projectId ||

    req.body?.projectId ||

    null

  );

}


async function requireComplianceProject(
  req,
  res
) {

  const projectId =
    getProjectId(
      req
    );


  if (
    !projectId
  ) {

    return {

      error:
        res.status(400).json({

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

      error:
        res.status(400).json({

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


  if (
    !access.allowed
  ) {

    return {

      error:
        res.status(403).json({

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


function normaliseExtractedText(
  value
) {

  return String(
    value ||
    ""
  )

    .replace(
      /\u0000/g,
      ""
    )

    .replace(
      /\r\n/g,
      "\n"
    )

    .replace(
      /\r/g,
      "\n"
    )

    .replace(
      /[ \t]+/g,
      " "
    )

    .replace(
      /\n{3,}/g,
      "\n\n"
    )

    .trim();

}


function clampScore(
  value
) {

  const number =
    Number(
      value
    );


  if (
    !Number.isFinite(
      number
    )
  ) {

    return 0;

  }


  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        number
      )
    )
  );

}


function clampConfidence(
  value
) {

  const number =
    Number(
      value
    );


  if (
    !Number.isFinite(
      number
    )
  ) {

    return 0;

  }


  return Math.max(
    0,
    Math.min(
      1,
      number
    )
  );

}


function normaliseStringArray(
  value
) {

  if (
    !Array.isArray(
      value
    )
  ) {

    return [];

  }


  return value

    .map(
      item =>
        String(
          item ??
          ""
        ).trim()
    )

    .filter(
      Boolean
    );

}


function extractJsonText(
  text
) {

  const raw =
    String(
      text ||
      ""
    ).trim();


  if (
    !raw
  ) {

    return "";

  }


  if (
    raw.startsWith(
      "{"
    ) &&
    raw.endsWith(
      "}"
    )
  ) {

    return raw;

  }


  const fenced =
    raw.match(
      /```(?:json)?\s*([\s\S]*?)\s*```/i
    );


  if (
    fenced?.[1]
  ) {

    return fenced[1].trim();

  }


  const firstBrace =
    raw.indexOf(
      "{"
    );


  const lastBrace =
    raw.lastIndexOf(
      "}"
    );


  if (
    firstBrace >= 0 &&
    lastBrace > firstBrace
  ) {

    return raw.slice(
      firstBrace,
      lastBrace + 1
    );

  }


  return raw;

}


// =====================================================
// DOCUMENT TEXT EXTRACTION
// =====================================================
//
// Supported:
//
// PDF
// DOCX
// TXT
// MD
// JSON
//
// Images intentionally do not use OCR in V1.
// =====================================================

async function extractDocumentText(
  file
) {

  if (
    !file?.buffer
  ) {

    return {

      text:
        "",

      method:
        "none",

    };

  }


  const fileName =
    String(
      file.originalname ||
      ""
    ).toLowerCase();


  const mimeType =
    String(
      file.mimetype ||
      ""
    ).toLowerCase();


  try {

    // =================================================
    // PDF
    // =================================================

    if (
      mimeType ===
        "application/pdf" ||
      fileName.endsWith(
        ".pdf"
      )
    ) {

      const parser =
        new PDFParse({
          data:
            file.buffer,
        });


      try {

        const parsed =
          await parser.getText();


        const text =
          normaliseExtractedText(
            parsed?.text
          );


        return {

          text:
            text.slice(
              0,
              MAX_EXTRACTED_TEXT_LENGTH
            ),

          method:
            "pdf",

        };

      }
      finally {

        await parser.destroy();

      }

    }


    // =================================================
    // DOCX
    // =================================================

    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(
        ".docx"
      )
    ) {

      const result =
        await mammoth.extractRawText({

          buffer:
            file.buffer,

        });


      const text =
        normaliseExtractedText(
          result?.value
        );


      return {

        text:
          text.slice(
            0,
            MAX_EXTRACTED_TEXT_LENGTH
          ),

        method:
          "docx",

      };

    }


    // =================================================
    // TEXT
    // =================================================

    if (
      mimeType.startsWith(
        "text/"
      ) ||
      fileName.endsWith(
        ".txt"
      ) ||
      fileName.endsWith(
        ".md"
      ) ||
      fileName.endsWith(
        ".json"
      )
    ) {

      const text =
        normaliseExtractedText(
          file.buffer.toString(
            "utf8"
          )
        );


      return {

        text:
          text.slice(
            0,
            MAX_EXTRACTED_TEXT_LENGTH
          ),

        method:
          "text",

      };

    }


    return {

      text:
        "",

      method:
        "none",

    };

  }
  catch (
    error
  ) {

    console.error(
      "[COMPLIANCE] Document extraction failed",
      {

        fileName:
          file.originalname,

        mimeType:
          file.mimetype,

        error:
          error?.message,

      }
    );


    return {

      text:
        "",

      method:
        "failed",

      error:
        error?.message,

    };

  }

}


// =====================================================
// NORMALISE CONTROL
// =====================================================

function normaliseControl(
  control
) {

  const safeControl =
    control ||
    {};


  const controlId =
    safeControl.controlId ||
    safeControl.id ||
    safeControl.key;


  return {

    ...safeControl,

    controlId,

    name:
      safeControl.name ||
      safeControl.title ||
      "",

    description:
      safeControl.description ||
      "",

    category:
      safeControl.category ||
      "",

    status:
      safeControl.status ||
      "not_started",

    evidenceStatus:
      safeControl.evidenceStatus ||
      "none",

    evidenceIds:
      Array.isArray(
        safeControl.evidenceIds
      )
        ? safeControl.evidenceIds
        : [],

    evidenceVerified:
      safeControl.evidenceVerified ===
      true,

    evidenceVerifiedAt:
      safeControl.evidenceVerifiedAt ||
      null,

    lastEvidenceId:
      safeControl.lastEvidenceId ||
      null,

    lastReviewedAt:
      safeControl.lastReviewedAt ||
      null,

    lastReviewedByUserId:
      safeControl.lastReviewedByUserId ||
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
// FIND OR CREATE
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


  if (
    compliance
  ) {

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
  catch (
    error
  ) {

    if (
      error?.code ===
      11000
    ) {

      compliance =
        await Compliance.findOne({

          tenantId:
            req.user.tenantId,

          projectId,

        });


      if (
        compliance
      ) {

        return compliance;

      }

    }


    throw error;

  }

}


// =====================================================
// CONTROL STATE REBUILDER
// =====================================================

function rebuildControlState(
  control,
  evidenceRecords
) {

  if (
    !control
  ) {

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

      .filter(
        Boolean
      );


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


  if (
    accepted.length >
    0
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


  const reviewRequired =
    related

      .filter(
        item =>
          item?.status ===
          "review_required"
      )

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
      );


  if (
    reviewRequired.length >
    0
  ) {

    const latest =
      reviewRequired[0];


    control.status =
      "review_required";

    control.evidenceStatus =
      "review_required";

    control.evidenceVerified =
      false;

    control.evidenceVerifiedAt =
      null;

    control.lastEvidenceId =
      latest?.evidenceId ||
      null;

    return;

  }


  const processing =
    related

      .filter(
        item =>
          item?.status ===
          "processing"
      )

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
      );


  if (
    processing.length >
    0
  ) {

    control.status =
      "review_required";

    control.evidenceStatus =
      "processing";

    control.evidenceVerified =
      false;

    control.evidenceVerifiedAt =
      null;

    control.lastEvidenceId =
      processing[0]?.evidenceId ||
      null;

    return;

  }


  const requested =
    related

      .filter(
        item =>
          item?.status ===
          "requested"
      )

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
      );


  if (
    requested.length >
    0
  ) {

    control.status =
      "evidence_requested";

    control.evidenceStatus =
      "requested";

    control.evidenceVerified =
      false;

    control.evidenceVerifiedAt =
      null;

    control.lastEvidenceId =
      requested[0]?.evidenceId ||
      null;

    return;

  }


  const rejected =
    related

      .filter(
        item =>
          item?.status ===
          "rejected"
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


  if (
    rejected.length >
    0
  ) {

    const latest =
      rejected[0];


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

  control.lastReviewedAt =
    null;

  control.lastReviewedByUserId =
    null;

}


// =====================================================
// REBUILD ALL
// =====================================================

function rebuildAllControlStates(
  compliance
) {

  if (
    !compliance
  ) {

    return;

  }


  const evidence =
    compliance.evidence ||
    [];


  (
    compliance.controls ||
    []
  ).forEach(
    control => {

      rebuildControlState(
        control,
        evidence
      );

    }
  );

}


// =====================================================
// SERIALISE
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
    controls.length >
    0

      ? Math.round(
          (
            controlsSatisfied /
            controls.length
          ) *
          100
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

    notifications:
      [],

    activity:
      [],

    createdAt:
      compliance.createdAt,

    updatedAt:
      compliance.updatedAt,

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


      if (
        access.error
      ) {

        return;

      }


      const compliance =
        await getOrCreateCompliance(

          req,

          access.projectId,

          access.project

        );


      rebuildAllControlStates(
        compliance
      );


      await compliance.save();


      return res.json(
        serialiseCompliance(
          compliance
        )
      );

    }
    catch (
      error
    ) {

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


      if (
        access.error
      ) {

        return;

      }


      const {

        controlId,

        name,

        description,

        type,

        dueDate,

        requestedFor,

      } =
        req.body || {};


      if (
        !controlId
      ) {

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


      if (
        !control
      ) {

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
          String(
            name ||
            "Evidence required"
          ).trim(),

        description:
          String(
            description ||
            ""
          ),

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
            ? new Date(
                dueDate
              )
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


      rebuildControlState(
        control,
        compliance.evidence
      );


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
    catch (
      error
    ) {

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
//
// IMPORTANT:
//
// This endpoint now:
//
// 1. receives the actual file
// 2. extracts text
// 3. stores the extracted text
// 4. stores extraction metadata
// 5. marks evidence as processing
//
// The separate AI action can therefore analyse the
// persisted document content later.
// =====================================================

router.post(
  "/evidence/upload",
  requireAuth,
  upload.single(
    "file"
  ),
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


      if (
        access.error
      ) {

        return;

      }


      const evidenceId =
        req.body?.evidenceId;


      const file =
        req.file;


      if (
        !evidenceId
      ) {

        return res.status(400).json({

          error:
            "evidenceId is required",

        });

      }


      if (
        !file
      ) {

        return res.status(400).json({

          error:
            "file is required",

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


      if (
        !evidence
      ) {

        return res.status(404).json({

          error:
            "Evidence not found",

        });

      }


      const extraction =
        await extractDocumentText(
          file
        );


      if (
        extraction.method ===
          "failed"
      ) {

        return res.status(422).json({

          error:
            "Unable to extract document text",

          details:
            extraction.error ||
            "Document extraction failed.",

        });

      }


      const now =
        new Date();


      // =================================================
      // FILE METADATA
      // =================================================

      evidence.fileName =
        file.originalname ||
        evidence.fileName ||
        null;


      /*
       * A separate storage flow may populate fileUrl.
       * Preserve it rather than overwriting it.
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


      // =================================================
      // DOCUMENT ANALYSIS DATA
      // =================================================

      /*
       * These fields require the Compliance model update
       * shown below.
       */

      evidence.extractedText =
        extraction.text;


      evidence.extractionMethod =
        extraction.method;


      evidence.extractedAt =
        extraction.text
          ? now
          : null;


      // =================================================
      // RESET OLD AI RESULT
      // =================================================

      evidence.aiAssessment =
        null;


      // =================================================
      // CONTROL
      // =================================================

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


      // =================================================
      // AUDIT EVENT
      // =================================================

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

          extractionMethod:
            extraction.method,

          extractedTextLength:
            extraction.text.length,

        },

        createdAt:
          now,

      });


      await compliance.save();


      console.log(
        "[COMPLIANCE] Evidence uploaded and text extracted",
        {

          projectId:
            access.projectId,

          evidenceId,

          fileName:
            evidence.fileName,

          extractionMethod:
            extraction.method,

          extractedTextLength:
            extraction.text.length,

        }
      );


      return res.json({

        evidence,

        extraction: {

          method:
            extraction.method,

          textLength:
            extraction.text.length,

        },

      });

    }
    catch (
      error
    ) {

      console.error(
        "[COMPLIANCE] Failed to upload evidence",
        error
      );


      return res.status(500).json({

        error:
          "Failed to upload evidence",

        details:
          error?.message,

      });

    }

  }
);


// =====================================================
// ANALYSE EVIDENCE WITH OPENAI
// =====================================================
//
// OpenAI receives:
//
// - framework
// - control ID
// - control name
// - control description
// - evidence name
// - evidence type
// - extracted document text
//
// The model is explicitly instructed NOT to treat
// unrelated professional content as compliance evidence.
// =====================================================

router.post(
  "/evidence/analyse",
  requireAuth,
  async (
    req,
    res
  ) => {

    console.log(
      "================================================="
    );

    console.log(
      "[COMPLIANCE] AI ANALYSIS REQUEST RECEIVED"
    );

    console.log(
      "================================================="
    );


    try {

      const {

        evidenceId,

        controlId,

      } =
        req.body || {};


      const access =
        await requireComplianceProject(
          req,
          res
        );


      if (
        access.error
      ) {

        return;

      }


      if (
        !evidenceId
      ) {

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


      if (
        !evidence
      ) {

        return res.status(404).json({

          error:
            "Evidence not found",

        });

      }


      const resolvedControlId =
        controlId ||
        evidence.controlId;


      const control =
        compliance.controls.find(

          item =>
            item.controlId ===
            resolvedControlId

        );


      if (
        !control
      ) {

        return res.status(404).json({

          error:
            "Compliance control not found",

        });

      }


      const extractedText =
        normaliseExtractedText(
          evidence.extractedText
        );


      console.log(
        "[COMPLIANCE] ANALYSIS INPUT",
        {

          projectId:
            access.projectId,

          evidenceId,

          controlId:
            resolvedControlId,

          fileName:
            evidence.fileName,

          extractionMethod:
            evidence.extractionMethod ||
            "unknown",

          extractedTextLength:
            extractedText.length,

        }
      );


      if (
        !extractedText
      ) {

        return res.status(422).json({

          error:
            "No extracted document text is available for AI analysis.",

          details:
            "Upload a text-readable PDF, DOCX or text document before analysing the evidence.",

        });

      }


      if (
        !process.env.OPENAI_API_KEY
      ) {

        return res.status(500).json({

          error:
            "OPENAI_API_KEY is not configured",

        });

      }


      // =================================================
      // CACHE PROTECTION
      // =================================================

      if (
        evidence.aiAssessment &&
        evidence.aiAssessment.analysedAt
      ) {

        console.log(
          "[COMPLIANCE] Existing AI assessment found"
        );


        return res.json({

          cached:
            true,

          evidence,

          assessment:
            evidence.aiAssessment,

        });

      }


      const analysisText =
        extractedText.slice(
          0,
          MAX_AI_INPUT_TEXT_LENGTH
        );


      const truncated =
        extractedText.length >
        MAX_AI_INPUT_TEXT_LENGTH;


      // =================================================
      // SYSTEM PROMPT
      // =================================================

      const systemPrompt = `
You are an expert ISO/IEC 27001 compliance evidence assessor.

Your job is to determine whether a supplied document is actually relevant evidence for ONE specific ISO/IEC 27001 control.

This is NOT a general document quality assessment.

A document must directly support the requirements of the specified control to receive a meaningful evidence score.

IMPORTANT RULES:

1. Evaluate ONLY the supplied control and supplied document.
2. Do NOT assume facts that are not present in the document.
3. Do NOT infer compliance merely because a document belongs to a professional person or organisation.
4. A CV, résumé, job description, marketing document, generic profile or unrelated professional document should normally be considered NOT_RELEVANT unless its actual content directly evidences the control.
5. Job titles alone are NOT evidence.
6. General statements such as "experienced in security" are NOT sufficient evidence unless they directly address the control requirements.
7. Distinguish between:
   - directly relevant evidence
   - partially relevant evidence
   - unrelated material
8. Evidence quality must be based on content, not file type.
9. If the document does not meaningfully address the control, score relevance very low.
10. Do not award a high score because the document sounds credible.
11. Human review remains authoritative. The AI assessment is advisory.

Return ONLY valid JSON using exactly this structure:

{
  "relevanceScore": 0,
  "confidence": 0,
  "decision": "not_relevant",
  "summary": "string",
  "findings": [],
  "matchedRequirements": [],
  "gaps": []
}

relevanceScore:
0-100 indicating how strongly this document actually supports this specific control.

confidence:
0-1 indicating how confident you are in the assessment.

decision must be exactly one of:

"sufficient"
"partially_sufficient"
"insufficient"
"not_relevant"

Use "not_relevant" when the document does not materially support the control.

Use "insufficient" when the document is relevant but does not provide enough evidence.

Use "partially_sufficient" when the document provides some meaningful evidence but important requirements remain unsupported.

Use "sufficient" only when the supplied document contains strong, direct and specific evidence for the control.

findings:
Concrete observations from the document.

matchedRequirements:
Specific control requirements that the document appears to support.

gaps:
Specific requirements or evidence that are missing.

Never invent evidence.
`;


      // =================================================
      // USER PROMPT
      // =================================================

      const userPrompt = `

FRAMEWORK:
${compliance.framework?.name || "ISO/IEC 27001"}

FRAMEWORK VERSION:
${compliance.framework?.version || "2022"}

CONTROL ID:
${control.controlId}

CONTROL NAME:
${control.name || ""}

CONTROL CATEGORY:
${control.category || ""}

CONTROL DESCRIPTION:
${control.description || ""}

EVIDENCE NAME:
${evidence.name || evidence.fileName || "Evidence"}

EVIDENCE TYPE:
${evidence.type || "document"}

DOCUMENT EXTRACTION METHOD:
${evidence.extractionMethod || "unknown"}

DOCUMENT TEXT:
${analysisText}

DOCUMENT TEXT TRUNCATED:
${truncated ? "true" : "false"}

Assess ONLY whether this document is relevant evidence for the specified control.
`;


      // =================================================
      // OPENAI
      // =================================================

      console.log(
        "[COMPLIANCE] CALLING OPENAI",
        {

          model:
            "gpt-4o-mini",

          controlId:
            control.controlId,

          extractedTextLength:
            extractedText.length,

          analysisTextLength:
            analysisText.length,

        }
      );


      const completion =
        await openai.chat.completions.create({

          model:
            "gpt-4o-mini",

          messages: [

            {

              role:
                "system",

              content:
                systemPrompt,

            },

            {

              role:
                "user",

              content:
                userPrompt,

            },

          ],

          temperature:
            0.1,

          response_format: {

            type:
              "json_object",

          },

        });


      const text =
        completion
          ?.choices?.[0]
          ?.message
          ?.content;


      console.log(
        "[COMPLIANCE] OPENAI RESPONSE RECEIVED",
        {

          finishReason:
            completion
              ?.choices?.[0]
              ?.finish_reason ||
            null,

        }
      );


      if (
        !text
      ) {

        throw new Error(
          "OpenAI returned an empty response."
        );

      }


      const jsonText =
        extractJsonText(
          text
        );


      let result;


      try {

        result =
          JSON.parse(
            jsonText
          );

      }
      catch (
        parseError
      ) {

        console.error(
          "[COMPLIANCE] AI JSON PARSE FAILED",
          {

            rawText:
              text,

            extracted:
              jsonText,

            error:
              parseError?.message,

          }
        );


        throw new Error(
          `AI returned invalid JSON: ${parseError.message}`
        );

      }


      // =================================================
      // NORMALISE ASSESSMENT
      // =================================================

      const allowedDecisions = [

        "sufficient",

        "partially_sufficient",

        "insufficient",

        "not_relevant",

      ];


      const decision =
        allowedDecisions.includes(
          result?.decision
        )

          ? result.decision

          : "insufficient";


      let relevanceScore =
        clampScore(
          result?.relevanceScore
        );


      let confidence =
        clampConfidence(
          result?.confidence
        );


      /*
       * Safety rule:
       *
       * "not_relevant" should never accidentally carry
       * a high relevance score because of a malformed AI
       * response.
       */

      if (
        decision ===
        "not_relevant"
      ) {

        relevanceScore =
          Math.min(
            relevanceScore,
            20
          );

      }


      if (
        decision ===
        "sufficient"
      ) {

        relevanceScore =
          Math.max(
            relevanceScore,
            70
          );

      }


      const persistedAssessment = {

        relevanceScore,

        confidence,

        decision,

        summary:
          String(
            result?.summary ||
            ""
          ).trim(),

        findings:
          normaliseStringArray(
            result?.findings
          ),

        matchedRequirements:
          normaliseStringArray(
            result?.matchedRequirements
          ),

        gaps:
          normaliseStringArray(
            result?.gaps
          ),

        controlId:
          resolvedControlId,

        analysedAt:
          new Date(),

        model:
          "gpt-4o-mini",

      };


      // =================================================
      // PERSIST
      // =================================================

      evidence.aiAssessment =
        persistedAssessment;


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


      rebuildControlState(
        control,
        compliance.evidence
      );


      // =================================================
      // AUDIT
      // =================================================

      compliance.reviewHistory.push({

        event:
          "compliance.evidenceReviewRequired",

        controlId:
          resolvedControlId,

        evidenceId,

        userId:
          req.user.userId,

        data: {

          decision,

          relevanceScore,

          confidence,

          model:
            "gpt-4o-mini",

          extractionMethod:
            evidence.extractionMethod ||
            "unknown",

          extractedTextLength:
            extractedText.length,

        },

        createdAt:
          new Date(),

      });


      await compliance.save();


      console.log(
        "[COMPLIANCE] AI ASSESSMENT PERSISTED",
        {

          projectId:
            access.projectId,

          evidenceId,

          controlId:
            resolvedControlId,

          decision,

          relevanceScore,

          confidence,

        }
      );


      return res.json({

        cached:
          false,

        evidence,

        assessment:
          persistedAssessment,

      });

    }
    catch (
      error
    ) {

      console.error(
        "================================================="
      );

      console.error(
        "[COMPLIANCE] AI ANALYSIS FAILED"
      );

      console.error(
        "================================================="
      );


      console.error(
        error
      );


      console.error(
        "[COMPLIANCE] ERROR MESSAGE",
        error?.message
      );


      console.error(
        "[COMPLIANCE] OPENAI STATUS",
        error?.status
      );


      console.error(
        "[COMPLIANCE] OPENAI CODE",
        error?.code
      );


      console.error(
        "[COMPLIANCE] OPENAI TYPE",
        error?.type
      );


      return res.status(500).json({

        error:
          "Failed to analyse compliance evidence",

        details:
          error?.message,

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


      if (
        access.error
      ) {

        return;

      }


      const {
        evidenceId,
      } =
        req.body || {};


      if (
        !evidenceId
      ) {

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


      if (
        !evidence
      ) {

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


      const actor =
        getReviewActor(
          req
        );


      const now =
        new Date();


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


      rebuildControlState(
        control,
        compliance.evidence
      );


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
          evidence.status,

        reviewDecision:
          evidence.reviewDecision,

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
    catch (
      error
    ) {

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


      if (
        access.error
      ) {

        return;

      }


      const {
        evidenceId,
      } =
        req.body || {};


      if (
        !evidenceId
      ) {

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


      if (
        !evidence
      ) {

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


      const actor =
        getReviewActor(
          req
        );


      const now =
        new Date();


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


      rebuildControlState(
        control,
        compliance.evidence
      );


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
          evidence.status,

        reviewDecision:
          evidence.reviewDecision,

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
    catch (
      error
    ) {

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


      if (
        access.error
      ) {

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


      if (
        !evidence
      ) {

        return res.status(404).json({

          error:
            "Evidence not found",

        });

      }


      const history =
        (
          compliance.reviewHistory ||
          []
        )

          .filter(
            item =>
              item.evidenceId ===
              evidence.evidenceId
          )

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
          );


      return res.json({

        evidence,

        history,

      });

    }
    catch (
      error
    ) {

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


      if (
        access.error
      ) {

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


      if (
        !evidence
      ) {

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

      } =
        req.body || {};


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


        if (
          !targetControl
        ) {

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
            description ||
            ""
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


        /*
         * Moving evidence to a different control means
         * the previous AI assessment may no longer be valid.
         */

        evidence.aiAssessment =
          null;


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


        rebuildControlState(
          oldControl,
          compliance.evidence
        );


        rebuildControlState(
          newControl,
          compliance.evidence
        );

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


      const changedFields =
        Object.keys(
          req.body ||
          {}
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
        );


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

          changedFields,

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
    catch (
      error
    ) {

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


      if (
        access.error
      ) {

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


      const evidenceId =
        evidence.evidenceId;


      const controlId =
        evidence.controlId;


      const deletedEvidence = {

        evidenceId,

        controlId,

        name:
          evidence.name,

        description:
          evidence.description,

        type:
          evidence.type,

        fileName:
          evidence.fileName,

        fileUrl:
          evidence.fileUrl,

        source:
          evidence.source,

        previousStatus:
          evidence.status,

        reviewDecision:
          evidence.reviewDecision,

        aiAssessment:
          evidence.aiAssessment,

      };


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

        data:
          deletedEvidence,

        createdAt:
          new Date(),

      });


      await compliance.save();


      return res.json({

        ok:
          true,

        evidenceId,

        controlId,

        deleted:
          true,

      });

    }
    catch (
      error
    ) {

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


      if (
        access.error
      ) {

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
    catch (
      error
    ) {

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