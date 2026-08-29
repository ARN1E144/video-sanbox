import dotenv from "dotenv";
dotenv.config();

console.log("OPENAI_API_KEY loaded:", !!process.env.OPENAI_API_KEY);

import { requireEnv } from "./utils/requireEnv.js";

requireEnv([
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
]);

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import aiTemplateRoutes from "./routes/aiTemplates.js";
import agoraRoutes from "./routes/agora.js";
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { connectWithRetry } from "./db/connect.js";
import tenantRoutes from "./routes/tenantRoutes.js";
import meRoutes from "./routes/me.js";
import callRoutes from "./routes/callRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import dataHubRoutes from "./routes/dataHubRoutes.js"
import tenantMemberRoutes from "./routes/tenantMemberRoutes.js";


const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://192.168.0.111:3000",
    ],
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
    credentials: true,
  })
);

app.use(bodyParser.json());

// Routes
app.use("/api/agora", agoraRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tenant", tenantRoutes);
app.use("/api", meRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", interviewRoutes);
app.use("/api/data", dataHubRoutes);
app.use("/api/data", tenantMemberRoutes);



app.get("/", (req, res) => {
  res.send("Video Sandbox API running...");
});

app.get("/api/stream", (req, res) => {
  res.json({
    data: {
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
    }
  });
});

await connectWithRetry(process.env.MONGODB_URI);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

