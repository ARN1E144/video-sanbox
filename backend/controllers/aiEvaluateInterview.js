import mongoose from "mongoose";
import OpenAI from "openai";

import Interview from "../models/Interview.js";

import {
  getProjectAccess,
} from "../middleware/projectAccess.js";


// =====================================================
// OPENAI
// =====================================================

const openai =
  new OpenAI({
    apiKey:
      process.env.OPENAI_API_KEY,
  });


// =====================================================
// HELPERS
// =====================================================

function normaliseStringArray(
  value
) {

  if (
    !Array.isArray(
      value
    )
  ) {

    return [];

  }


  return value
    .map(
      item =>
        String(
          item ?? ""
        ).trim()
    )
    .filter(
      Boolean
    );

}


function normaliseQuestionFeedback(
  value
) {

  if (
    !Array.isArray(
      value
    )
  ) {

    return [];

  }


  return value
    .map(
      item => ({

        questionIndex:
          Number(
            item?.questionIndex
          ),

        score:
          Math.max(
            0,
            Math.min(
              100,
              Number(
                item?.score
              ) || 0
            )
          ),

        feedback:
          String(
            item?.feedback ||
            ""
          ).trim(),

      })
    )
    .filter(
      item =>
        Number.isInteger(
          item.questionIndex
        ) &&
        item.questionIndex >= 0
    );

}


function clampScore(
  value
) {

  return Math.max(
    0,
    Math.min(
      100,
      Number(
        value
      ) || 0
    )
  );

}


function extractJsonText(
  text
) {

  const raw =
    String(
      text || ""
    ).trim();


  if (!raw) {

    return "";

  }


  // ---------------------------------------------------
  // Direct JSON
  // ---------------------------------------------------

  if (
    raw.startsWith("{") &&
    raw.endsWith("}")
  ) {

    return raw;

  }


  // ---------------------------------------------------
  // Markdown JSON fence
  // ---------------------------------------------------

  const fenced =
    raw.match(
      /```(?:json)?\s*([\s\S]*?)\s*```/i
    );


  if (
    fenced?.[1]
  ) {

    return fenced[1].trim();

  }


  // ---------------------------------------------------
  // Attempt to extract outer JSON object
  // ---------------------------------------------------

  const firstBrace =
    raw.indexOf("{");


  const lastBrace =
    raw.lastIndexOf("}");


  if (
    firstBrace >= 0 &&
    lastBrace > firstBrace
  ) {

    return raw.slice(
      firstBrace,
      lastBrace + 1
    );

  }


  return raw;

}


// =====================================================
// EVALUATE INTERVIEW
// =====================================================

export const evaluateInterview =
  async (
    req,
    res
  ) => {

    console.log(
      "================================================="
    );

    console.log(
      "[AI Interview] EVALUATION REQUEST RECEIVED"
    );

    console.log(
      "================================================="
    );


    try {

      const {

        projectId,

        interviewId,

        questions,

        answers,

      } =
        req.body || {};


      console.log(
        "[AI Interview] REQUEST DATA",
        {

          projectId,

          interviewId,

          questionCount:
            Array.isArray(
              questions
            )
              ? questions.length
              : 0,

          answerCount:
            Array.isArray(
              answers
            )
              ? answers.length
              : 0,

          userId:
            req.user?.userId ||
            null,

          tenantId:
            req.user?.tenantId ||
            null,

        }
      );


      // =================================================
      // VALIDATE PROJECT
      // =================================================

      if (
        !projectId
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "PROJECT_ID_REQUIRED",

          });

      }


      if (
        !mongoose.Types.ObjectId.isValid(
          projectId
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "INVALID_PROJECT_ID",

          });

      }


      // =================================================
      // VALIDATE INTERVIEW
      // =================================================

      if (
        !interviewId
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "INTERVIEW_ID_REQUIRED",

          });

      }


      if (
        !mongoose.Types.ObjectId.isValid(
          interviewId
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "INVALID_INTERVIEW_ID",

          });

      }


      // =================================================
      // VALIDATE ARRAYS
      // =================================================

      if (
        !Array.isArray(
          questions
        ) ||
        !Array.isArray(
          answers
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "QUESTIONS_AND_ANSWERS_REQUIRED",

          });

      }


      if (
        questions.length ===
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "NO_INTERVIEW_QUESTIONS",

          });

      }


      if (
        answers.length ===
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "NO_INTERVIEW_ANSWERS",

          });

      }


      // =================================================
      // PROJECT ACCESS
      // =================================================

      console.log(
        "[AI Interview] CHECKING PROJECT ACCESS",
        {
          projectId,
        }
      );


      const access =
        await getProjectAccess(
          req,
          projectId,
          "canRun"
        );


      console.log(
        "[AI Interview] PROJECT ACCESS RESULT",
        access
      );


      if (
        !access.allowed
      ) {

        return res
          .status(
            access.status ||
            403
          )
          .json({

            success:
              false,

            error:
              access.error ||
              "PROJECT_ACCESS_DENIED",

          });

      }


      // =================================================
      // FIND INTERVIEW
      // =================================================

      console.log(
        "[AI Interview] FINDING INTERVIEW",
        {
          projectId,
          interviewId,
        }
      );


      const interview =
        await Interview.findOne({

          _id:
            new mongoose.Types.ObjectId(
              interviewId
            ),

          projectId:
            new mongoose.Types.ObjectId(
              projectId
            ),

          tenantId:
            new mongoose.Types.ObjectId(
              req.user.tenantId
            ),

        });


      if (
        !interview
      ) {

        console.warn(
          "[AI Interview] INTERVIEW NOT FOUND",
          {
            projectId,
            interviewId,
          }
        );


        return res
          .status(404)
          .json({

            success:
              false,

            error:
              "INTERVIEW_NOT_FOUND",

          });

      }


      console.log(
        "[AI Interview] INTERVIEW FOUND",
        {

          interviewId:
            interview._id,

          projectId:
            interview.projectId,

          status:
            interview.status,

          persistedQuestionCount:
            interview.questions?.length ||
            0,

          persistedAnswerCount:
            interview.answers?.length ||
            0,

          hasExistingEvaluation:
            Boolean(
              interview.aiEvaluation
            ),

        }
      );


      // =================================================
      // COMPLETED
      // =================================================

      if (
        interview.status !==
        "completed"
      ) {

        console.warn(
          "[AI Interview] INTERVIEW NOT COMPLETED",
          {
            interviewId,
            status:
              interview.status,
          }
        );


        return res
          .status(409)
          .json({

            success:
              false,

            error:
              "INTERVIEW_NOT_COMPLETED",

          });

      }


      // =================================================
      // EXISTING EVALUATION
      // =================================================

      const existingEvaluation =
        interview.aiEvaluation;


      if (
        existingEvaluation &&
        existingEvaluation.overallScore !==
          null &&
        existingEvaluation.overallScore !==
          undefined
      ) {

        console.log(
          "[AI Interview] EXISTING EVALUATION FOUND - RETURNING CACHE"
        );


        return res
          .status(200)
          .json({

            success:
              true,

            cached:
              true,

            interviewId:
              interview._id,

            result:
              existingEvaluation,

          });

      }


      // =================================================
      // OPENAI PROMPT
      // =================================================

      const systemPrompt = `
You are an expert professional interviewer evaluating a candidate's interview performance.

Evaluate ONLY the supplied interview questions and candidate answers.

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

Rules:

- Every score must be between 0 and 100.
- Do not invent qualifications, experience, achievements or facts.
- Evaluate only what the candidate actually said.
- Evaluate clarity, relevance, structure, communication, reasoning, evidence, problem solving and technical understanding where applicable.
- Be objective and constructive.
- questionFeedback should correspond to the supplied interview questions.
`;


      // =================================================
      // OPENAI REQUEST
      // =================================================

      console.log(
        "[AI Interview] CALLING OPENAI",
        {

          model:
            "gpt-4o-mini",

          questionCount:
            questions.length,

          answerCount:
            answers.length,

        }
      );


      const completion =
        await openai
          .chat
          .completions
          .create({

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

            temperature:
              0.2,

          });


      console.log(
        "[AI Interview] OPENAI RESPONSE RECEIVED",
        {

          choices:
            completion
              ?.choices
              ?.length ||
            0,

          finishReason:
            completion
              ?.choices?.[0]
              ?.finish_reason ||
            null,

        }
      );


      const text =
        completion
          ?.choices?.[0]
          ?.message
          ?.content;


      console.log(
        "[AI Interview] RAW AI CONTENT",
        text
      );


      if (
        !text
      ) {

        throw new Error(
          "AI returned empty response."
        );

      }


      // =================================================
      // PARSE
      // =================================================

      const jsonText =
        extractJsonText(
          text
        );


      console.log(
        "[AI Interview] PARSING AI JSON"
      );


      let result;


      try {

        result =
          JSON.parse(
            jsonText
          );

      }
      catch (
        parseError
      ) {

        console.error(
          "[AI Interview] AI JSON PARSE FAILED",
          {

            parseError:

              parseError?.message,

            rawText:
              text,

            extracted:
              jsonText,

          }
        );


        throw new Error(
          `AI returned invalid JSON: ${parseError.message}`
        );

      }


      // =================================================
      // NORMALISE EVALUATION
      // =================================================

      const persistedEvaluation = {

        overallScore:
          clampScore(
            result?.overallScore
          ),

        communicationScore:
          clampScore(
            result?.communicationScore
          ),

        problemSolvingScore:
          clampScore(
            result?.problemSolvingScore
          ),

        technicalScore:
          clampScore(
            result?.technicalScore
          ),

        strengths:
          normaliseStringArray(
            result?.strengths
          ),

        weaknesses:
          normaliseStringArray(
            result?.weaknesses
          ),

        questionFeedback:
          normaliseQuestionFeedback(
            result?.questionFeedback
          ),

        summary:
          String(
            result?.summary ||
            ""
          ).trim(),

      };


      console.log(
        "[AI Interview] NORMALISED EVALUATION",
        persistedEvaluation
      );


      // =================================================
      // PERSIST
      // =================================================

      interview.aiEvaluation =
        persistedEvaluation;


      await interview.save();


      console.log(
        "[AI Interview] EVALUATION PERSISTED",
        {

          interviewId:
            interview._id,

          projectId:
            interview.projectId,

          overallScore:
            persistedEvaluation.overallScore,

        }
      );


      // =================================================
      // RESPONSE
      // =================================================

      return res
        .status(200)
        .json({

          success:
            true,

          cached:
            false,

          interviewId:
            interview._id,

          result:
            persistedEvaluation,

        });

    }
    catch (
      err
    ) {

      console.error(
        "================================================="
      );

      console.error(
        "[AI Interview] EVALUATION FAILED"
      );

      console.error(
        "================================================="
      );

      console.error(
        err
      );


      console.error(
        "[AI Interview] ERROR MESSAGE",
        err?.message
      );


      console.error(
        "[AI Interview] OPENAI STATUS",
        err?.status
      );


      console.error(
        "[AI Interview] OPENAI CODE",
        err?.code
      );


      console.error(
        "[AI Interview] OPENAI TYPE",
        err?.type
      );


      console.error(
        "[AI Interview] RESPONSE DATA",
        err?.response?.data
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            "INTERVIEW_EVALUATION_FAILED",

          details:
            err?.message,

        });

    }

  };