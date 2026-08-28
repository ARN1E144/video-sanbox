import api from "../../services/api";


// =====================================================
// IN-FLIGHT EVALUATIONS
// =====================================================

const evaluationInFlight =
  new Set();


export default async function evaluateInterview(
  ctx,
  params = {}
) {

  console.log(
    "=============================================="
  );

  console.log(
    "[evaluateInterview] START"
  );

  console.log(
    "=============================================="
  );


  let interviewId =
    null;


  try {

    // =================================================
    // GET INTERVIEW
    // =================================================

    const interview =
      ctx?.get?.(
        "interview"
      ) || {};


    interviewId =
      interview?.id ||
      interview?._id ||
      null;


    console.log(
      "[evaluateInterview] CURRENT INTERVIEW",
      {

        interviewId,

        status:
          interview?.status,

        questionCount:
          interview?.questions?.length ||
          0,

        answerCount:
          interview?.answers?.length ||
          0,

        result:
          interview?.result ||
          null,

        aiEvaluation:
          interview?.aiEvaluation ||
          null,

      }
    );


    // =================================================
    // VALIDATE
    // =================================================

    if (
      !interviewId
    ) {

      return {

        ok:
          false,

        error:
          "INTERVIEW_NOT_FOUND",

      };

    }


    if (
      interview.status !==
      "completed"
    ) {

      return {

        ok:
          false,

        error:
          "INTERVIEW_NOT_COMPLETED",

      };

    }


    // =================================================
    // PROJECT
    // =================================================

    const projectId =
      interview.projectId ||
      params?.projectId ||
      ctx?.get?.(
        "project.id"
      ) ||
      null;


    if (
      !projectId
    ) {

      return {

        ok:
          false,

        error:
          "PROJECT_ID_REQUIRED",

      };

    }


    // =================================================
    // EXISTING RESULT
    // =================================================

     const existingEvaluation =
  interview?.aiEvaluation || null;

const hasValidEvaluation =
  existingEvaluation &&
  typeof existingEvaluation === "object" &&
  existingEvaluation.overallScore !== undefined &&
  existingEvaluation.overallScore !== null;

if (hasValidEvaluation) {

  console.log(
    "[evaluateInterview] EXISTING AI EVALUATION FOUND - USING CACHE",
    {
      interviewId,
      overallScore:
        existingEvaluation.overallScore,
    }
  );



      return {

        ok:
          true,

        cached:
          true,

        result:
          existingEvaluation,

      };

    }


    // =================================================
    // IN-FLIGHT
    // =================================================

    if (
      evaluationInFlight.has(
        String(
          interviewId
        )
      )
    ) {

      return {

        ok:
          false,

        error:
          "EVALUATION_IN_PROGRESS",

      };

    }


    // =================================================
    // QUESTIONS / ANSWERS
    // =================================================

    const questions =
      Array.isArray(
        interview.questions
      )
        ? interview.questions
        : [];


    const answers =
      Array.isArray(
        interview.answers
      )
        ? interview.answers
        : [];


    if (
      questions.length ===
      0
    ) {

      return {

        ok:
          false,

        error:
          "NO_INTERVIEW_QUESTIONS",

      };

    }


    if (
      answers.length ===
      0
    ) {

      return {

        ok:
          false,

        error:
          "NO_INTERVIEW_ANSWERS",

      };

    }


    // =================================================
    // LOCK
    // =================================================

    evaluationInFlight.add(
      String(
        interviewId
      )
    );


    // =================================================
    // BACKEND REQUEST
    // =================================================

    console.log(
      "[evaluateInterview] POSTING TO AI BACKEND",
      {

        projectId,

        interviewId,

        questionCount:
          questions.length,

        answerCount:
          answers.length,

      }
    );


    const response =
      await api.post(
        "/ai/evaluateInterview",
        {

          projectId,

          interviewId,

          questions,

          answers,

        }
      );


    console.log(
      "[evaluateInterview] AI BACKEND RESPONSE",
      {

        status:
          response?.status,

        data:
          response?.data,

      }
    );


    const result =
      response?.data?.result;


    if (
      !result
    ) {

      return {

        ok:
          false,

        error:
          "INVALID_AI_RESULT",

      };

    }


    // =================================================
    // RUNTIME
    // =================================================

    ctx?.patch?.(
      "interview",
      {

        result,

        aiEvaluation:
          result,

      }
    );


    console.log(
      "[evaluateInterview] RESULT WRITTEN TO RUNTIME",
      result
    );


    return {

      ok:
        true,

      cached:
        response?.data?.cached ===
        true,

      result,

    };

  }
  catch (
    err
  ) {

    console.error(
      "[evaluateInterview] FAILED",
      {

        interviewId,

        error:
          err,

        response:
          err?.response?.data,

      }
    );


    return {

      ok:
        false,

      error:
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.response?.data?.details ||
        err?.message ||
        "INTERVIEW_EVALUATION_FAILED",

    };

  }
  finally {

    if (
      interviewId
    ) {

      evaluationInFlight.delete(
        String(
          interviewId
        )
      );

    }

  }

}