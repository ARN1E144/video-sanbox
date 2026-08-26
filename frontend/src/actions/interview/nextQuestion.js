
// src/actions/interview/nextQuestion.js

import api from "../../services/api";


// =====================================================
// NEXT QUESTION
// =====================================================
//
// Responsibilities:
//
// 1. Validate active interview.
// 2. Determine whether another question exists.
// 3. If another question exists:
//      update runtime question state.
// 4. If no question remains:
//      persist interview completion.
//      update runtime completion state.
//
// Answer persistence is owned by submitAnswer.js.
// This action should NOT write answers.
// =====================================================

export default async function nextQuestion(
  ctx,
  params = {}
) {

  console.log(
    "=============================================="
  );

  console.log(
    "[nextQuestion] START"
  );

  console.log(
    "=============================================="
  );


  try {

    // =================================================
    // GET CURRENT INTERVIEW
    // =================================================

    const interview =
      ctx.get?.(
        "interview"
      ) || {};


    console.log(
      "[nextQuestion] CURRENT INTERVIEW",
      interview
    );


    // =================================================
    // VALIDATE ACTIVE INTERVIEW
    // =================================================

    if (
      !interview.id ||
      interview.status !==
        "active"
    ) {

      console.warn(
        "[nextQuestion] No active interview"
      );


      return {

        ok: false,

        error:
          "INTERVIEW_NOT_ACTIVE",

      };

    }


    // =================================================
    // RESOLVE PROJECT ID
    // =================================================

    const projectId =
      interview.projectId ||
      params?.projectId ||
      ctx.get?.(
        "project.id"
      ) ||
      null;


    if (!projectId) {

      console.error(
        "[nextQuestion] Missing projectId",
        {
          interviewId:
            interview.id,
        }
      );


      return {

        ok: false,

        error:
          "PROJECT_ID_REQUIRED",

      };

    }


    // =================================================
    // QUESTIONS
    // =================================================

    const questions =
      Array.isArray(
        interview.questions
      )
        ? interview.questions
        : [];


    if (
      questions.length === 0
    ) {

      console.warn(
        "[nextQuestion] Interview contains no questions"
      );


      return {

        ok: false,

        error:
          "NO_INTERVIEW_QUESTIONS",

      };

    }


    // =================================================
    // CURRENT INDEX
    // =================================================

    const currentIndex =
      Number(
        interview.currentQuestionIndex ??
        0
      );


    // =================================================
    // NEXT INDEX
    // =================================================

    const nextIndex =
      currentIndex + 1;


    // =================================================
    // INTERVIEW COMPLETE
    // =================================================
    //
    // No question remains.
    //
    // Persist completion FIRST.
    // Only update runtime after the backend confirms it.
    // =================================================

    if (
      nextIndex >=
      questions.length
    ) {

      console.log(
        "[nextQuestion] Interview complete - persisting",
        {
          projectId,

          interviewId:
            interview.id,

          currentIndex,

        }
      );


      const response =
        await api.post(
          `/projects/${projectId}/interviews/${interview.id}/complete`
        );


      console.log(
        "[nextQuestion] COMPLETE API RESPONSE",
        {
          status:
            response.status,

          data:
            response.data,
        }
      );


      const persistedInterview =
        response.data?.interview;


      const completedAt =
        persistedInterview?.completedAt ||
        new Date();


      // =================================================
      // UPDATE RUNTIME
      // =================================================

      ctx.patch?.(
        "interview",
        {

          status:
            "completed",

          completed:
            true,

          currentQuestion:
            null,

          currentQuestionIndex:
            currentIndex,

          completedAt:
            completedAt,

        }
      );


      console.log(
        "[nextQuestion] INTERVIEW COMPLETE",
        {
          interviewId:
            interview.id,

          completedAt,
        }
      );


      return {

        ok: true,

        completed:
          true,

        result: {

          id:
            interview.id,

          projectId,

          status:
            "completed",

          currentQuestion:
            null,

          currentQuestionIndex:
            currentIndex,

          completedAt,

        },

      };

    }


    // =================================================
    // NEXT QUESTION EXISTS
    // =================================================

    const nextQuestionText =
      questions[nextIndex];


    if (
      !nextQuestionText
    ) {

      console.error(
        "[nextQuestion] Next question is empty",
        {
          nextIndex,
        }
      );


      return {

        ok: false,

        error:
          "NEXT_QUESTION_NOT_FOUND",

      };

    }


    // =================================================
    // UPDATE RUNTIME
    // =================================================
    //
    // The question list itself is already persisted as
    // part of the Interview snapshot.
    //
    // We only need to advance the live runtime state.
    // =================================================

    ctx.patch?.(
      "interview",
      {

        currentQuestionIndex:
          nextIndex,

        currentQuestion:
          nextQuestionText,

        answer: {

          text:
            "",

          startedAt:
            Date.now(),

          completedAt:
            null,

        },

      }
    );


    console.log(
      "[nextQuestion] NEXT QUESTION",
      {

        interviewId:
          interview.id,

        projectId,

        index:
          nextIndex,

        question:
          nextQuestionText,

      }
    );


    return {

      ok: true,

      completed:
        false,

      result: {

        id:
          interview.id,

        projectId,

        currentQuestionIndex:
          nextIndex,

        currentQuestion:
          nextQuestionText,

      },

    };


  }
  catch (
    err
  ) {

    console.error(
      "[nextQuestion] FAILED",
      {

        error:
          err,

        response:
          err?.response?.data,

      }
    );


    return {

      ok: false,

      error:
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "NEXT_QUESTION_FAILED",

    };

  }

}

