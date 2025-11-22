import express from "express";
import { generateTemplates } from "../controllers/aiGenrateTemplate.js";
import { refineTemplate } from "../controllers/aiRefineTemplate.js";

const router = express.Router();

router.get('/', (req, res) => {
  res.send('AI Routes are working');
  console.log('AI Routes accessed');
});
router.post('/generateTemplate', generateTemplates);
router.post('/refineTemplate', refineTemplate);

export default router;