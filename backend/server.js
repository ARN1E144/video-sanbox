import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import aiTemplateRoutes from "./routes/aiTemplates.js";
import agoraRoutes from "./routes/agora.js";
import aiRoutes from "./routes/aiRoutes.js";




const app = express();

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/agora", agoraRoutes);
app.use("/api/ai", aiRoutes);

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


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
