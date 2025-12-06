// routes/authRoutes.js
import express from "express";

// import registerUser from "../controllers/registerController.js";
import loginUser from "../controllers/loginController.js";
// import { googleLogin } from "../controllers/googleController.js";
// import refreshController from "../controllers/refreshController.js";
// import verifyEmail from "../controllers/verifyEmailController.js";
// import verifyCode from "../controllers/verifyCodeController.js";

const router = express.Router();

// Test route
router.get("/", (req, res) => {
  res.send("✅ Auth route hit successfully!");
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/refresh", refreshController);

// GET for email links (optional)
router.get("/verify-email", verifyEmail);

// POST for app verification via token in body
router.post("/verify-code", verifyCode);

export default router;

