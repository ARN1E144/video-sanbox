
import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";

const router =
  express.Router();

router.post(
  "/dev/reset-password",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error:
            "email and password required",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error:
            "Password must be at least 8 characters",
        });
      }

      const user =
        await User.findOne({
          email:
            email.toLowerCase(),
        });

      if (!user) {
        return res.status(404).json({
          error:
            "User not found",
        });
      }

      user.passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      await user.save();

      return res.json({
        ok: true,
        userId: user._id,
      });

    } catch (err) {
      console.error(
        "[DEV RESET PASSWORD]",
        err
      );

      return res.status(500).json({
        error:
          "Password reset failed",
      });
    }
  }
);

export default router;