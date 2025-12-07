import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const refineTemplate = async (req, res) => {
 const { schema, instruction } = req.body;

  const systemPrompt = `
You are an assistant that modifies JSON schemas for a video app builder.
Always return a valid JSON schema following this structure:

{
  "version": "1.0.0",
  "name": "string",
  "tree": { "type": "App", "children": [ ... ] }
}

You will be given the current schema and a modification instruction.
Apply ONLY the requested change and preserve all other data.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Current schema:\n${JSON.stringify(schema, null, 2)}` },
        { role: "user", content: `Instruction: ${instruction}` },
      ],
    });

    const text = completion.choices[0].message.content;
    const updatedSchema = JSON.parse(text);

    res.json({ schema: updatedSchema });
  } catch (err) {
    console.error("Refine error:", err);
    res.status(500).json({ error: "Failed to refine schema", details: err.message });
  }
};
