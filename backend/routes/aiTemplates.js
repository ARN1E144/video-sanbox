import express from "express";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";

const router = express.Router();

let openai;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log("✅ OpenAI live mode enabled");
  } else {
    console.log("⚙️ Running in MOCK (offline) AI mode");
  }
} catch (err) {
  console.error("Failed to initialize OpenAI:", err);
}

router.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    let code;
//     if (!openai) {
//       // Offline Mock Mode
//       code = `
// import React from 'react';

// export default function App() {
//   return (
//     <div style={{ textAlign: "center", padding: 50 }}>
//       <h1>Mock Generated App</h1>
//       <p>This is a placeholder app generated for: "${prompt}"</p>
//       <p>Once you add your OpenAI API key, real templates will be created.</p>
//     </div>
//   );
// }`;
//     } else {
//       // Live OpenAI Mode
//       const response = await openai.chat.completions.create({
//         model: "gpt-4o-mini",
//         messages: [
//           {
//             role: "system",
//             content:
//               "You are an expert frontend developer that generates React apps integrated with the Agora Web SDK for video streaming.",
//           },
//           {
//             role: "user",
//             content: `Generate a React app based on this prompt: ${prompt}. Only return the code for App.js.`,
//           },
//         ],
//         temperature: 0.4,
//       });

//       code = response.choices[0].message.content;
//     }
    if (!openai) {
  // 🎥 Smarter mock mode for video apps
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes("stream") || lowerPrompt.includes("live")) {
    code =
`import React, { useState } from 'react';

export default function App() {
  const [isStreaming, setIsStreaming] = useState(false);

  return (
    <div style={{ textAlign: "center", padding: 50 }}>
      <h1>🎥 Mock Live Streaming Template</h1>
      <p>This is a placeholder for a live stream app.</p>
      {!isStreaming ? (
        <button onClick={() => setIsStreaming(true)} style={{ padding: 10, fontSize: 18 }}>
          Go Live
        </button>
      ) : (
        <div>
          <p>🔴 Live Now</p>
          <video width="400" controls autoPlay muted loop>
            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
          </video>
        </div>
      )}
    </div>
  );
}`;
  } else if (lowerPrompt.includes("chat") || lowerPrompt.includes("call")) {
    code =
`import React, { useState } from 'react';

export default function App() {
  const [inCall, setInCall] = useState(false);

  return (
    <div style={{ textAlign: "center", padding: 50 }}>
      <h1>📞 Mock Video Call Template</h1>
      <p>This is a placeholder for a 1:1 video call app.</p>
      {!inCall ? (
        <button onClick={() => setInCall(true)} style={{ padding: 10, fontSize: 18 }}>
          Start Call
        </button>
      ) : (
        <div>
          <p>Connected to peer...</p>
          <video width="300" autoPlay muted loop>
            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
          </video>
          <p>Remote video simulated</p>
        </div>
      )}
    </div>
  );
}`;
  } else {
    code =
`import React from 'react';

export default function App() {
  return (
    <div style={{ textAlign: "center", padding: 50 }}>
      <h1>📹 Mock Video App Template</h1>
      <p>Prompt: "${prompt.replace(/`/g, "\\`")}"</p>
      <p>This mock template simulates a generated video app layout.</p>
      <video width="400" controls autoPlay muted loop>
        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
      </video>
    </div>
  );
}`;
  }
}


    const id = uuidv4();
    const dir = `./generated_templates/${id}`;
    await fs.ensureDir(dir);
    await fs.writeFile(`${dir}/App.js`, code);

    res.json({ success: true, templateId: id, code });
  } catch (err) {
    console.error("AI generation error:", err);
    res.status(500).json({ error: "Failed to generate template" });
  }
});

export default router;
