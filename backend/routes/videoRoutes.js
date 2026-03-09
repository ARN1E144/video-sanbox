import express from "express";
import { startStream, stopStream, togglePlay } from "../controllers/videoController.js";

const router = express.Router();

router.get("/:id/start", startStream);
router.get("/:id/stop", stopStream);
router.get("/:id/toggle", togglePlay);

export default router;