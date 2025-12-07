import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateTemplates = async (req, res) => {
  const { prompt } = req.body;
  console.log("AIKEY:", process.env.OPENAI_API_KEY)
  console.log("Received prompt for template generation:", prompt);

  const systemPrompt = `
    You are an assistant that generates JSON schemas for a video app builder.
    Use this JSON format only:

    {
      "version": "1.0.0",
      "name": "string",
      "tree": {
        "type": "App",
        "children": [
          { "type": "AppBar", "props": { "title": "string", "actions": ["EndCall"] } },
          {
            "type": "Container",
            "props": { "layout": "grid", "align": "center", "justify": "center" },
            "children": [
              { "type": "VideoFeed", "props": { "autoplay": true, "muted": true, "controls": true } },
              { "type": "ChatPanel", "props": { "room": "default", "showAvatars": true } }
            ]
          }
        ]
      }
    }
    Return ONLY valid JSON.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    });

    const text = completion.choices[0].message.content;
    const schema = JSON.parse(text);

    res.json({ schema });
  } catch (err) {
    console.error("Template generation error:", err);
    res.status(500).json({ error: "Failed to generate template", details: err.message });
  }
};
