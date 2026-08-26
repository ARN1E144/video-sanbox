// src/actions/interview/evaluateInterview.js

import api from "../../services/api";

// =====================================================
// IN-FLIGHT EVALUATIONS
//
// Prevents duplicate AI requests for the same interview
// while an evaluation is already running.
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


  try {

    // =====================================================
    // GET CURRENT INTERVIEW
    // =====================================================

    const interview =
      ctx.get?.("interview") || {};


    // =====================================================
    // VALIDATE INTERVIEW
    // =====================================================

    if (!interview.id) {

      return {

        ok: false,

        error:
          "INTERVIEW_NOT_FOUND",

      };

    }


    if (
      interview.status !==
      "completed"
    ) {

      return {

        ok: false,

        error:
          "INTERVIEW_NOT_COMPLETED",

      };

    }


    // =====================================================
    // EXISTING RESULT GUARD
    // =====================================================

    if (
      interview.result
    ) {

      console.log(
        "[evaluateInterview] RESULT ALREADY EXISTS - SKIPPING AI REQUEST"
      );


      return {

        ok: true,

        cached: true,

        result:
          interview.result,

      };

    }


    // =====================================================
    // IN-FLIGHT GUARD
    // =====================================================

    if (
      evaluationInFlight.has(
        interview.id
      )
    ) {

      console.log(
        "[evaluateInterview] EVALUATION ALREADY IN FLIGHT - SKIPPING"
      );


      return {

        ok: false,

        error:
          "EVALUATION_IN_PROGRESS",

      };

    }


    evaluationInFlight.add(
      interview.id
    );


    // =====================================================
    // QUESTIONS / ANSWERS
    // =====================================================

    const questions =
      interview.questions || [];


    const answers =
      interview.answers || [];


    if (!questions.length) {

      return {

        ok: false,

        error:
          "NO_INTERVIEW_QUESTIONS",

      };

    }


    if (!answers.length) {

      return {

        ok: false,

        error:
          "NO_INTERVIEW_ANSWERS",

      };

    }


    // =====================================================
    // CALL AI BACKEND
    // =====================================================

    console.log(
      "[evaluateInterview] Sending interview to AI"
    );


    const {
      data
    } =
      await api.post(
        "/ai/evaluateInterview",
        {
          questions,
          answers,
        }
      );


    const result =
      data?.result;


    if (!result) {

      return {

        ok: false,

        error:
          "INVALID_AI_RESULT",

      };

    }


    // =====================================================
    // STORE RESULT IN RUNTIME
    // =====================================================

    ctx.patch?.(
      "interview",
      {
        result,
      }
    );


    console.log(
      "[evaluateInterview] RESULT STORED",
      result
    );


    // =====================================================
    // SUCCESS
    // =====================================================

    return {

      ok: true,

      cached: false,

      result,

    };


  } catch (err) {

    console.error(
      "[evaluateInterview] FAILED",
      err
    );


    console.error(
      "[evaluateInterview] Backend error",
      err?.response?.data
    );


    return {

      ok: false,

      error:
        err?.response?.data?.error ||
        err?.message ||
        "INTERVIEW_EVALUATION_FAILED",

    };


  } finally {

    // =====================================================
    // RELEASE IN-FLIGHT LOCK
    // =====================================================

    const interview =
      ctx.get?.("interview") || {};


    if (interview?.id) {

      evaluationInFlight.delete(
        interview.id
      );

    }

  }

}