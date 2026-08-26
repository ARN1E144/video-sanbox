import OpenAI from "openai";

const isMockMode =
  process.env.AI_MODE === "mock";

let openai = null;

if (!isMockMode) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}


export const generateTemplates = async (req, res) => {

  const { prompt } = req.body;

  console.log(
    "[AI Template] Received prompt:",
    prompt
  );


  // =====================================================
  // MOCK MODE
  // =====================================================

  if (isMockMode) {

    console.log(
      "⚙️ Running in MOCK (offline) AI mode"
    );


    return res.json({

      schema: {

        version: "1.0.0",

        name: "Mock Video Template",

        tree: {

          type: "App",

          children: [

            {
              type: "AppBar",

              props: {
                title: "Mock Video App",
                actions: ["EndCall"],
              },

            },

            {

              type: "Container",

              props: {
                layout: "grid",
                align: "center",
                justify: "center",
              },

              children: [

                {
                  type: "VideoFeed",

                  props: {
                    autoplay: true,
                    muted: true,
                    controls: true,
                  },

                },

                {
                  type: "ChatPanel",

                  props: {
                    room: "default",
                    showAvatars: true,
                  },

                },

              ],

            },

          ],

        },

      },

    });

  }


  // =====================================================
  // LIVE MODE GUARD
  // =====================================================

  if (!openai) {

    console.error(
      "[AI Template] OpenAI client unavailable"
    );


    return res.status(500).json({

      error:
        "AI service is not configured",

    });

  }


  // =====================================================
  // SYSTEM PROMPT
  // =====================================================

  const systemPrompt = `
    You are an assistant that generates JSON schemas for a video app builder.
    Use this JSON format only:

    {
      "version": "1.0.0",
      "name": "string",
      "tree": {
        "type": "App",
        "children": [
          {
            "type": "AppBar",
            "props": {
              "title": "string",
              "actions": ["EndCall"]
            }
          },
          {
            "type": "Container",
            "props": {
              "layout": "grid",
              "align": "center",
              "justify": "center"
            },
            "children": [
              {
                "type": "VideoFeed",
                "props": {
                  "autoplay": true,
                  "muted": true,
                  "controls": true
                }
              },
              {
                "type": "ChatPanel",
                "props": {
                  "room": "default",
                  "showAvatars": true
                }
              }
            ]
          }
        ]
      }
    }

    Return ONLY valid JSON.
  `;


  // =====================================================
  // GENERATE
  // =====================================================

  try {

    const completion =
      await openai.chat.completions.create({

        model:
          "gpt-4o-mini",

        messages: [

          {
            role:
              "system",

            content:
              systemPrompt,

          },

          {
            role:
              "user",

            content:
              prompt,

          },

        ],

      });


    const text =
      completion
        ?.choices?.[0]
        ?.message
        ?.content;


    if (!text) {

      throw new Error(
        "OpenAI returned an empty response"
      );

    }


    const schema =
      JSON.parse(text);


    return res.json({
      schema,
    });


  } catch (err) {

    console.error(
      "[AI Template] Generation failed:",
      err
    );


    return res.status(500).json({

      error:
        "Failed to generate template",

      details:
        err?.message,

    });

  }

};