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


const router =
  express.Router();


router.get("/", (req, res) => {

  console.log(
    "AI Routes accessed"
  );

  res.send(
    "AI Routes are working"
  );

});


router.post(
  "/generateTemplate",
  generateTemplates
);


router.post(
  "/refineTemplate",
  refineTemplate
);


router.post(
  "/evaluateInterview",
  evaluateInterview
);


export default router;