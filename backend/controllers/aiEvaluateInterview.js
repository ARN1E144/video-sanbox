import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export const evaluateInterview = async (req, res) => {

  const {
    questions,
    answers,
  } = req.body;


  console.log(
    "[AI Interview] Evaluation request"
  );


  if (
    !Array.isArray(questions) ||
    !Array.isArray(answers)
  ) {

    return res.status(400).json({

      error:
        "questions and answers must be arrays",

    });

  }


  const systemPrompt = `
You are an expert professional interviewer evaluating a candidate's interview performance.

Evaluate ONLY the information contained in the supplied interview questions and candidate answers.

Return ONLY valid JSON.

Use exactly this structure:

{
  "overallScore": 0,
  "communicationScore": 0,
  "problemSolvingScore": 0,
  "technicalScore": 0,
  "strengths": [],
  "weaknesses": [],
  "questionFeedback": [
    {
      "questionIndex": 0,
      "score": 0,
      "feedback": "string"
    }
  ],
  "summary": "string"
}

Scoring:

0-100 for every score.

Do not invent qualifications, experience, facts or achievements that are not present in the candidate's answers.

Evaluate the quality of the answers, including:

- clarity
- relevance
- structure
- communication
- reasoning
- evidence
- problem solving
- technical understanding where applicable

Be objective and constructive.
`;


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
              JSON.stringify(
                {
                  questions,
                  answers,
                },
                null,
                2
              ),

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
        "AI returned empty response"
      );

    }


    const result =
      JSON.parse(text);


    console.log(
      "[AI Interview] Evaluation complete",
      result
    );


    return res.json({

      result,

    });


  } catch (err) {

    console.error(
      "[AI Interview] Evaluation failed",
      err
    );


    return res.status(500).json({

      error:
        "Failed to evaluate interview",

      details:
        err?.message,

    });

  }

};