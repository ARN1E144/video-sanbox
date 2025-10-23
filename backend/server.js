import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import aiTemplateRoutes from "./routes/aiTemplates.js";
import agoraRoutes from "./routes/agora.js";



dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/agora", agoraRoutes);
app.use("/api/ai", aiTemplateRoutes);

app.get("/", (req, res) => {
  res.send("Video Sandbox API running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
