
// src/actions/interview/submitAnswer.js

import api from "../../services/api";


// =====================================================
// SUBMIT ANSWER
// =====================================================
//
// Runtime:
// interview.answer.text
//
// Persistent:
// Interview.answers[]
//
// The database is updated first.
// Runtime state is only cleared after persistence
// succeeds.
// =====================================================

export default async function submitAnswer(
  ctx,
  params = {}
) {

  console.log(
    "=============================================="
  );

  console.log(
    "[submitAnswer] START"
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
      "[submitAnswer] CURRENT INTERVIEW",
      interview
    );


    // =================================================
    // VALIDATE INTERVIEW
    // =================================================

    if (
      !interview.id ||
      interview.status !==
        "active"
    ) {

      console.warn(
        "[submitAnswer] No active interview"
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
        "[submitAnswer] Missing projectId",
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
    // GET ANSWER TEXT
    // =================================================

    const answerText =
      params?.text ??
      interview?.answer?.text ??
      "";


    const trimmedAnswer =
      String(
        answerText
      ).trim();


    if (!trimmedAnswer) {

      console.warn(
        "[submitAnswer] Empty answer"
      );


      return {

        ok: false,

        error:
          "ANSWER_EMPTY",

      };

    }


    // =================================================
    // CURRENT QUESTION
    // =================================================

    const questionIndex =
      Number(
        interview.currentQuestionIndex ??
        0
      );


    const question =
      interview.currentQuestion ??
      interview.questions?.[
        questionIndex
      ] ??
      null;


    if (!question) {

      console.warn(
        "[submitAnswer] No active question"
      );


      return {

        ok: false,

        error:
          "NO_ACTIVE_QUESTION",

      };

    }


    // =================================================
    // START / COMPLETE TIMES
    // =================================================

    const startedAt =
      interview?.answer?.startedAt ??
      null;


    const completedAt =
      Date.now();


    // =================================================
    // BUILD ANSWER
    // =================================================
    //
    // IMPORTANT:
    //
    // This matches the Mongo Interview schema:
    //
    // questionIndex
    // question
    // text
    // transcript
    // startedAt
    // completedAt
    //
    // =================================================

    const answerRecord = {

      questionIndex,

      question,

      text:
        trimmedAnswer,

      transcript:
        "",

      startedAt:
        startedAt
          ? new Date(
              startedAt
            )
          : null,

      completedAt:
        new Date(
          completedAt
        ),

    };


    // =================================================
    // DEBUG
    // =================================================

    console.log(
      "[submitAnswer] Persisting answer",
      {
        projectId,

        interviewId:
          interview.id,

        questionIndex,

        question,

        text:
          trimmedAnswer,
      }
    );


    // =================================================
    // PERSIST ANSWER
    // =================================================
    //
    // The backend route replaces an existing answer for
    // the same questionIndex, making this safe to retry.
    //
    // =================================================

    const response =
      await api.patch(
        `/projects/${projectId}/interviews/${interview.id}/answers/${questionIndex}`,
        {

          text:
            trimmedAnswer,

          transcript:
            params?.transcript ||
            "",

          startedAt,

          completedAt,

        }
      );


    console.log(
      "[submitAnswer] API RESPONSE",
      {
        status:
          response.status,

        data:
          response.data,
      }
    );


    const persistedAnswer =
      response.data?.answer ||
      answerRecord;


    const persistedInterview =
      response.data?.interview ||
      null;


    // =================================================
    // BUILD RUNTIME ANSWERS
    // =================================================
    //
    // Prefer the server response because it represents
    // the canonical persisted state.
    // =================================================

    const answers =
      Array.isArray(
        persistedInterview?.answers
      )

        ? persistedInterview.answers

        : (() => {

            const existingAnswers =
              Array.isArray(
                interview.answers
              )
                ? interview.answers
                : [];


            const existingIndex =
              existingAnswers.findIndex(
                existing =>
                  Number(
                    existing.questionIndex
                  ) ===
                  questionIndex
              );


            const nextAnswers = [
              ...existingAnswers,
            ];


            if (
              existingIndex >= 0
            ) {

              nextAnswers[
                existingIndex
              ] =
                persistedAnswer;

            }
            else {

              nextAnswers.push(
                persistedAnswer
              );

            }


            return nextAnswers;

          })();


    // =================================================
    // UPDATE RUNTIME
    // =================================================
    //
    // Only clear the answer AFTER the database write
    // has succeeded.
    // =================================================

    ctx.patch?.(
      "interview",
      {

        answers,

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


    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      "[submitAnswer] ANSWER SUBMITTED",
      {
        interviewId:
          interview.id,

        projectId,

        questionIndex,

        answer:
          persistedAnswer,

      }
    );


    return {

      ok: true,

      result: {

        answer:
          persistedAnswer,

        answers,

        interviewId:
          interview.id,

        projectId,

      },

    };


  }
  catch (
    err
  ) {

    console.error(
      "[submitAnswer] FAILED",
      {
        error:
          err,

        response:
          err?.response?.data,

      }
    );


    /*
    ---------------------------------------------------
    IMPORTANT

    We deliberately DO NOT clear interview.answer.text
    when persistence fails.

    The candidate can therefore retry rather than losing
    their answer.
    ---------------------------------------------------
    */


    return {

      ok: false,

      error:
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "SUBMIT_ANSWER_FAILED",

    };

  }

}

