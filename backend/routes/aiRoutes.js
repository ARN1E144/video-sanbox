import express from "express";

import {
  generateTemplates
} from "../controllers/aiGenrateTemplate.js";

import {
  refineTemplate
} from "../controllers/aiRefineTemplate.js";

import {
  evaluateInterview
} from "../controllers/aiEvaluateInterview.js";

import {
  requireAuth
} from "../middleware/requireAuth.js";


const router =
  express.Router();


// =====================================================
// TEST
// =====================================================

router.get(
  "/",
  requireAuth,
  (req, res) => {

    console.log(
      "[AI Routes] accessed",
      {
        userId:
          req.user?.userId,

        tenantId:
          req.user?.tenantId,

      }
    );

    res.send(
      "AI Routes are working"
    );

  }
);


// =====================================================
// GENERATE TEMPLATE
// =====================================================

router.post(
  "/generateTemplate",
  requireAuth,
  generateTemplates
);


// =====================================================
// REFINE TEMPLATE
// =====================================================

router.post(
  "/refineTemplate",
  requireAuth,
  refineTemplate
);


// =====================================================
// EVALUATE INTERVIEW
// =====================================================

router.post(
  "/evaluateInterview",
  requireAuth,
  evaluateInterview
);


export default router;