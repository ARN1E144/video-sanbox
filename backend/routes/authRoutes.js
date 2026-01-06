import express from "express";

import registerUser from "../controllers/registerController.js";
import loginUser from "../controllers/loginController.js";
import { googleLogin } from "../controllers/googleController.js";
import refreshController from "../controllers/refreshController.js";
import verifyEmail from "../controllers/verifyEmailController.js";
import verifyCode from "../controllers/verifyCodeController.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("✅ Auth route hit successfully!");
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/refresh", refreshController);

router.get("/verify-email", verifyEmail);
router.post("/verify-code", verifyCode);

export default router;
