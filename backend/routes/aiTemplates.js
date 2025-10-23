import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";


const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert frontend developer that generates React apps integrated with the Agora Web SDK for video streaming. Include minimal dependencies and clear structure.",
        },
        {
          role: "user",
          content: `Generate a React app based on this prompt: ${prompt}. Only return the code for App.js.`,
        },
      ],
      temperature: 0.4,
    });

    const code = response.choices[0].message.content;
    const id = uuidv4();
    const dir = `./generated_templates/${id}`;
    await fs.ensureDir(dir);
    await fs.writeFile(`${dir}/App.js`, code);

    res.json({
      success: true,
      templateId: id,
      code,
    });
  } catch (err) {
    console.error("AI generation error:", err);
    res.status(500).json({ error: "Failed to generate template" });
  }
});

export default router;
