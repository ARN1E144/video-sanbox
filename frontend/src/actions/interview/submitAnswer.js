// src/actions/interview/submitAnswer.js

import api from "../../services/api";


// =====================================================
// OBJECT / ID HELPERS
// =====================================================

function getId(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  if (
    typeof value ===
    "string"
  ) {

    const trimmed =
      value.trim();

    return trimmed ||
      null;

  }


  if (
    typeof value ===
    "object"
  ) {

    return (
      value?.id ||
      value?._id ||
      value?.interviewId ||
      value?.interview_id ||
      null
    );

  }


  return null;

}


// =====================================================
// RESOLVE INTERVIEW ID
// =====================================================
//
// Canonical runtime:
//
// interview.id
//
// Defensive fallbacks:
//
// interview._id
// interview.interviewId
// interview.interview_id
//
// =====================================================

function resolveInterviewId(
  interview,
  params = {},
  ctx
) {

  return (

    getId(
      interview
    ) ||

    getId(
      params?.interviewId
    ) ||

    getId(
      params?.id
    ) ||

    getId(
      ctx?.get?.(
        "interview.id"
      )
    ) ||

    getId(
      ctx?.get?.(
        "interview._id"
      )
    ) ||

    getId(
      ctx?.get?.(
        "interview.interviewId"
      )
    ) ||

    getId(
      ctx?.get?.(
        "interview.interview_id"
      )
    ) ||

    null

  );

}


// =====================================================
// RESOLVE PROJECT ID
// =====================================================
//
// Priority:
//
// 1. interview.projectId
// 2. explicit params.projectId
// 3. runtime.project.id
// 4. runtime project fallback fields
//
// =====================================================

function resolveProjectId(
  interview,
  params = {},
  ctx
) {

  const runtimeProject =
    ctx?.get?.(
      "project"
    ) || {};


  return (

    getId(
      interview?.projectId
    ) ||

    getId(
      interview?.project?._id
    ) ||

    getId(
      interview?.project?.id
    ) ||

    getId(
      params?.projectId
    ) ||

    getId(
      runtimeProject?.id
    ) ||

    getId(
      runtimeProject?._id
    ) ||

    getId(
      runtimeProject?.projectId
    ) ||

    getId(
      ctx?.get?.(
        "project.id"
      )
    ) ||

    getId(
      ctx?.get?.(
        "project._id"
      )
    ) ||

    getId(
      ctx?.get?.(
        "project.projectId"
      )
    ) ||

    getId(
      ctx?.get?.(
        "projectId"
      )
    ) ||

    null

  );

}


// =====================================================
// NORMALISE ANSWER ARRAY
// =====================================================

function normaliseAnswers(
  answers
) {

  if (
    !Array.isArray(
      answers
    )
  ) {

    return [];

  }


  return answers
    .filter(
      Boolean
    )
    .map(
      answer => ({

        ...answer,

        questionIndex:
          Number(
            answer?.questionIndex ??
            0
          ),

        question:
          String(
            answer?.question ||
            ""
          ),

        text:
          String(
            answer?.text ||
            ""
          ),

        transcript:
          String(
            answer?.transcript ||
            ""
          ),

        startedAt:
          answer?.startedAt ||
          null,

        completedAt:
          answer?.completedAt ||
          null,

      })
    );

}


// =====================================================
// MERGE PERSISTED ANSWER
// =====================================================
//
// Used only when the backend does not return the full
// interview document.
//
// =====================================================

function mergeAnswer(
  existingAnswers,
  persistedAnswer,
  questionIndex
) {

  const answers =
    normaliseAnswers(
      existingAnswers
    );


  const existingIndex =
    answers.findIndex(
      answer =>
        Number(
          answer?.questionIndex
        ) ===
        Number(
          questionIndex
        )
    );


  if (
    existingIndex >= 0
  ) {

    answers[
      existingIndex
    ] =
      persistedAnswer;


    return answers;

  }


  return [

    ...answers,

    persistedAnswer,

  ];

}


// =====================================================
// SUBMIT ANSWER
// =====================================================
//
// Runtime input:
//
// interview
//   .id
//   .projectId
//   .status
//   .currentQuestionIndex
//   .currentQuestion
//   .answer.text
//   .answer.startedAt
//
// Persistent:
//
// Interview.answers[]
//
// IMPORTANT:
//
// The database is updated first.
// Runtime answer state is only cleared after the
// persistence request succeeds.
//
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
    // RUNTIME INTERVIEW
    // =================================================

    const interview =
      ctx?.get?.(
        "interview"
      ) || {};


    // =================================================
    // RUNTIME PROJECT
    // =================================================

    const runtimeProject =
      ctx?.get?.(
        "project"
      ) || {};


    console.log(
      "[submitAnswer] CURRENT RUNTIME",
      {

        interview,

        runtimeProject,

      }
    );


    // =================================================
    // RESOLVE INTERVIEW ID
    // =================================================

    const interviewId =
      resolveInterviewId(
        interview,
        params,
        ctx
      );


    // =================================================
    // RESOLVE PROJECT ID
    // =================================================

    const projectId =
      resolveProjectId(
        interview,
        params,
        ctx
      );


    console.log(
      "[submitAnswer] IDENTITY RESOLUTION",
      {

        interviewId,

        projectId,

        runtimeInterviewId:
          getId(
            interview
          ),

        runtimeInterviewProjectId:
          getId(
            interview?.projectId
          ),

        runtimeProjectId:
          getId(
            runtimeProject
          ),

        paramInterviewId:
          params?.interviewId ||
          params?.id ||
          null,

        paramProjectId:
          params?.projectId ||
          null,

      }
    );


    // =================================================
    // VALIDATE INTERVIEW
    // =================================================

    if (
      !interviewId
    ) {

      console.warn(
        "[submitAnswer] Missing interview ID",
        {
          interview,
          params,
        }
      );


      return {

        ok:
          false,

        error:
          "INTERVIEW_ID_REQUIRED",

      };

    }


    if (
      interview?.status !==
      "active"
    ) {

      console.warn(
        "[submitAnswer] Interview is not active",
        {

          interviewId,

          status:
            interview?.status,

        }
      );


      return {

        ok:
          false,

        error:
          "INTERVIEW_NOT_ACTIVE",

      };

    }


    // =================================================
    // VALIDATE PROJECT
    // =================================================

    if (
      !projectId
    ) {

      console.warn(
        "[submitAnswer] Missing project ID",
        {

          interviewId,

          interview,

          runtimeProject,

          params,

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
    // QUESTION INDEX
    // =================================================

    const questionIndex =
      Number(
        params?.questionIndex ??
        interview?.currentQuestionIndex ??
        0
      );


    if (
      !Number.isInteger(
        questionIndex
      ) ||
      questionIndex < 0
    ) {

      console.warn(
        "[submitAnswer] Invalid question index",
        {

          interviewId,

          questionIndex,

        }
      );


      return {

        ok:
          false,

        error:
          "INVALID_QUESTION_INDEX",

      };

    }


    // =================================================
    // CURRENT QUESTION
    // =================================================

    const question =
      String(
        params?.question ??
        interview?.currentQuestion ??
        interview?.questions?.[
          questionIndex
        ] ??
        ""
      ).trim();


    if (
      !question
    ) {

      console.warn(
        "[submitAnswer] No active question",
        {

          interviewId,

          questionIndex,

        }
      );


      return {

        ok:
          false,

        error:
          "NO_ACTIVE_QUESTION",

      };

    }


    // =================================================
    // ANSWER TEXT
    // =================================================
    //
    // Explicit params value wins over runtime value.
    //
    // IMPORTANT:
    //
    // We do not mutate runtime state before the request.
    //
    // =================================================

    const answerText =
      params?.text ??
      interview?.answer?.text ??
      "";


    const trimmedAnswer =
      String(
        answerText
      ).trim();


    if (
      !trimmedAnswer
    ) {

      console.warn(
        "[submitAnswer] Empty answer",
        {

          interviewId,

          questionIndex,

        }
      );


      return {

        ok:
          false,

        error:
          "ANSWER_EMPTY",

      };

    }


    // =================================================
    // TRANSCRIPT
    // =================================================

    const transcript =
      String(
        params?.transcript ??
        interview?.answer?.transcript ??
        ""
      );


    // =================================================
    // ANSWER TIMES
    // =================================================

    const startedAt =
      params?.startedAt ??
      interview?.answer?.startedAt ??
      null;


    const completedAt =
      params?.completedAt ??
      new Date().toISOString();


    // =================================================
    // ANSWER RECORD
    // =================================================

    const answerRecord = {

      questionIndex,

      question,

      text:
        trimmedAnswer,

      transcript,

      startedAt:
        startedAt
          ? new Date(
              startedAt
            ).toISOString()
          : null,

      completedAt:
        new Date(
          completedAt
        ).toISOString(),

    };


    // =================================================
    // DEBUG
    // =================================================

    console.log(
      "[submitAnswer] PERSISTING ANSWER",
      {

        projectId,

        interviewId,

        questionIndex,

        question,

        text:
          trimmedAnswer,

        hasTranscript:
          Boolean(
            transcript
          ),

        startedAt:
          answerRecord.startedAt,

        completedAt:
          answerRecord.completedAt,

      }
    );


    // =================================================
    // PERSIST
    // =================================================
    //
    // Backend route:
    //
    // PATCH
    // /projects/:projectId/interviews/:interviewId/
    // answers/:questionIndex
    //
    // =================================================

    const response =
      await api.patch(

        `/projects/${projectId}/interviews/${interviewId}/answers/${questionIndex}`,

        {

          text:
            trimmedAnswer,

          transcript,

          startedAt:
            answerRecord.startedAt,

          completedAt:
            answerRecord.completedAt,

        }

      );


    console.log(
      "[submitAnswer] API RESPONSE",
      {

        status:
          response?.status,

        data:
          response?.data,

      }
    );


    // =================================================
    // SERVER ANSWER
    // =================================================

    const persistedAnswer =
      response?.data?.answer ||
      answerRecord;


    // =================================================
    // SERVER INTERVIEW
    // =================================================

    const persistedInterview =
      response?.data?.interview ||
      null;


    // =================================================
    // RESOLVE CANONICAL ANSWERS
    // =================================================
    //
    // Prefer the server's complete answers array.
    //
    // Otherwise merge the persisted answer into the
    // current runtime array.
    //
    // =================================================

    const answers =
      Array.isArray(
        persistedInterview?.answers
      )

        ? normaliseAnswers(
            persistedInterview.answers
          )

        : mergeAnswer(

            interview?.answers,

            persistedAnswer,

            questionIndex

          );


    // =================================================
    // RESOLVE NEXT INTERVIEW STATE
    // =================================================

    const nextInterviewPatch = {

      answers,

      answer: {

        ...(interview?.answer || {}),

        text:
          "",

        transcript:
          "",

        startedAt:
          null,

        completedAt:
          null,

      },

    };


    // =================================================
    // OPTIONAL SERVER STATE
    // =================================================
    //
    // The backend currently returns the full Interview.
    // When it does, preserve any useful canonical fields
    // without allowing an incomplete response to wipe
    // runtime values.
    //
    // =================================================

    if (
      persistedInterview
    ) {

      if (
        persistedInterview.status
      ) {

        nextInterviewPatch.status =
          persistedInterview.status;

      }


      if (
        persistedInterview.projectId
      ) {

        nextInterviewPatch.projectId =
          persistedInterview.projectId;

      }


      if (
        persistedInterview.questions
      ) {

        nextInterviewPatch.questions =
          persistedInterview.questions;

      }

    }


    // =================================================
    // UPDATE RUNTIME
    // =================================================
    //
    // ONLY after persistence succeeded.
    //
    // =================================================

    ctx?.patch?.(
      "interview",
      nextInterviewPatch
    );


    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      "[submitAnswer] ANSWER SUBMITTED",
      {

        projectId,

        interviewId,

        questionIndex,

        answer:
          persistedAnswer,

        answerCount:
          answers.length,

      }
    );


    return {

      ok:
        true,

      result: {

        answer:
          persistedAnswer,

        answers,

        interviewId,

        projectId,

        questionIndex,

        question,

      },

    };

  }
  catch (
    error
  ) {

    // =================================================
    // FAILURE
    // =================================================

    console.error(
      "[submitAnswer] FAILED",
      {

        name:
          error?.name,

        message:
          error?.message,

        response:
          error?.response?.data ||
          null,

        status:
          error?.response?.status ||
          null,

      }
    );


    // =================================================
    // IMPORTANT
    // =================================================
    //
    // DO NOT clear interview.answer.text here.
    //
    // The candidate can retry their answer.
    //
    // =================================================

    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "SUBMIT_ANSWER_FAILED",

    };

  }

}
