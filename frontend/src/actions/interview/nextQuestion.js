// src/actions/interview/nextQuestion.js

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
//      DO NOT complete the interview.
//      update runtime state to:
//
//        currentQuestion: "Interview Completed"
//        status: "active"
//        completed: false
//
// The actual interview completion is owned exclusively
// by completeInterview.js.
//
// Answer persistence is owned by submitAnswer.js.
// This action should NOT write answers to the backend.
//
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
    //
    // IMPORTANT:
    //
    // The interview must remain active when the final
    // question is reached.
    //
    // completeInterview.js is responsible for changing
    // the interview to "completed".
    //
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

        ok:
          false,

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


    if (
      !projectId
    ) {

      console.error(
        "[nextQuestion] Missing projectId",
        {
          interviewId:
            interview.id,
        }
      );


      return {

        ok:
          false,

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
      questions.length ===
      0
    ) {

      console.warn(
        "[nextQuestion] Interview contains no questions"
      );


      return {

        ok:
          false,

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
    // END OF QUESTION SET
    // =================================================
    //
    // IMPORTANT:
    //
    // Reaching the end of the question set does NOT
    // complete the interview.
    //
    // We deliberately keep:
    //
    //   status:    "active"
    //   completed: false
    //
    // This allows the Complete Interview button to
    // become the single authoritative completion action.
    //
    // The existing TextLabel:
    //
    //   {{interview.currentQuestion}}
    //
    // will therefore display:
    //
    //   Interview Completed
    //
    // instead of falling back to "Text Label".
    //
    // =================================================

    if (
      nextIndex >=
      questions.length
    ) {

      console.log(
        "[nextQuestion] Final question reached",
        {

          interviewId:
            interview.id,

          projectId,

          currentIndex,

          nextIndex,

          questionCount:
            questions.length,

        }
      );


      // =================================================
      // UPDATE RUNTIME ONLY
      // =================================================
      //
      // Do NOT call the backend completion endpoint here.
      //
      // The interview remains active.
      //
      // =================================================

      ctx.patch?.(
        "interview",
        {

          status:
            "active",

          completed:
            false,

          currentQuestion:
            "Interview Completed",

          // Keep the index pointing at the final
          // real question rather than the non-existent
          // next index.

          currentQuestionIndex:
            currentIndex,

          answer: {

            text:
              "",

            startedAt:
              null,

            completedAt:
              null,

          },

        }
      );


      console.log(
        "[nextQuestion] Interview ready for completion",
        {

          interviewId:
            interview.id,

          projectId,

          status:
            "active",

          completed:
            false,

          currentQuestion:
            "Interview Completed",

          currentQuestionIndex:
            currentIndex,

        }
      );


      // =================================================
      // RETURN
      // =================================================

      return {

        ok:
          true,

        completed:
          false,

        finalQuestion:
          true,

        result: {

          id:
            interview.id,

          projectId,

          status:
            "active",

          completed:
            false,

          currentQuestion:
            "Interview Completed",

          currentQuestionIndex:
            currentIndex,

          finalQuestion:
            true,

        },

      };

    }


    // =================================================
    // NEXT QUESTION EXISTS
    // =================================================

    const nextQuestionText =
      questions[nextIndex];


    // =================================================
    // VALIDATE NEXT QUESTION
    // =================================================
    //
    // This remains an actual error condition.
    //
    // We should NOT use this block to represent the end
    // of the interview because the end-of-set condition
    // has already been handled above.
    //
    // =================================================

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

        ok:
          false,

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
    // We only advance the live runtime state here.
    //
    // =================================================

    ctx.patch?.(
      "interview",
      {

        status:
          "active",

        completed:
          false,

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


    // =================================================
    // SUCCESS
    // =================================================

    return {

      ok:
        true,

      completed:
        false,

      finalQuestion:
        false,

      result: {

        id:
          interview.id,

        projectId,

        status:
          "active",

        completed:
          false,

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

    // =================================================
    // ERROR
    // =================================================

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

      ok:
        false,

      error:
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "NEXT_QUESTION_FAILED",

    };

  }

}