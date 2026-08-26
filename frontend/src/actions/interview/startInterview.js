// src/actions/interview/startInterview.js

import api from "../../services/api";


// =====================================================
// TEMPORARY DEFAULT QUESTIONS
// =====================================================
//
// These are fallback questions until project-level
// interview configuration is implemented.
//
// Eventually these can come from:
//
// - project configuration
// - custom questions
// - AI-generated questions
// - interview templates
//
// =====================================================

const DEFAULT_QUESTIONS = [

  "Tell me about yourself.",

  "What is your greatest professional achievement?",

  "Tell me about a difficult problem you solved.",

];


// =====================================================
// RESOLVE PROJECT ID
// =====================================================
//
// Canonical project identity:
//
// runtime.project.id
//
// Explicit params.projectId can override it.
//
// =====================================================

function resolveProjectId(
  ctx,
  params = {}
) {

  const explicitProjectId =
    params?.projectId ||
    null;


  const runtimeProject =
    ctx?.get?.(
      "project"
    ) ||
    {};


  const runtimeProjectId =
    runtimeProject?.id ||
    runtimeProject?._id ||
    runtimeProject?.projectId ||
    ctx?.get?.(
      "project.id"
    ) ||
    ctx?.get?.(
      "project._id"
    ) ||
    ctx?.get?.(
      "projectId"
    ) ||
    null;


  console.log(
    "[startInterview] PROJECT RESOLUTION",
    {

      explicitProjectId,

      runtimeProject,

      runtimeProjectId,

    }
  );


  return (
    explicitProjectId ||
    runtimeProjectId ||
    null
  );

}


// =====================================================
// NORMALISE QUESTIONS
// =====================================================

function normaliseQuestions(
  questions
) {

  if (
    !Array.isArray(
      questions
    )
  ) {

    return [];

  }


  return questions

    .map(
      question =>
        String(
          question
        ).trim()
    )

    .filter(
      Boolean
    );

}


// =====================================================
// RESOLVE INTERVIEW ID
// =====================================================
//
// The backend is authoritative.
//
// Expected backend response:
//
// {
//   interview: {
//     _id: "..."
//   }
// }
//
// We also support:
//
// interview.id
// interview.interviewId
//
// =====================================================

function resolveInterviewId(
  interview
) {

  if (
    !interview ||
    typeof interview !==
      "object"
  ) {

    return null;

  }


  return (

    interview._id ||

    interview.id ||

    interview.interviewId ||

    interview.interview_id ||

    null

  );

}


// =====================================================
// BUILD RUNTIME INTERVIEW
// =====================================================
//
// This creates the canonical shape used by:
//
// useRuntimeValue("interview")
//
// VideoFeed then consumes:
//
// interview.id
//
// =====================================================

function buildRuntimeInterview({
  interview,
  interviewId,
  projectId,
  questions,
  questionSource,
  interviewConfig,
}) {

  const persistedQuestions =
    normaliseQuestions(
      interview?.questions
    );


  const finalQuestions =
    persistedQuestions.length > 0
      ? persistedQuestions
      : questions;


  const firstQuestion =
    finalQuestions[0] ||
    null;


  return {

    // -------------------------------------------------
    // PERSISTENT IDENTITY
    // -------------------------------------------------

    id:
      interviewId,

    projectId:
      interview?.projectId ||
      projectId,


    // -------------------------------------------------
    // LIFECYCLE
    // -------------------------------------------------

    status:
      interview?.status ||
      "active",

    started:
      true,

    completed:
      false,


    // -------------------------------------------------
    // QUESTIONS
    // -------------------------------------------------

    questionSource:
      interview?.questionSource ||
      questionSource,

    questions:
      finalQuestions,


    currentQuestionIndex:
      0,

    currentQuestion:
      firstQuestion,


    // -------------------------------------------------
    // CURRENT ANSWER
    // -------------------------------------------------

    answer: {

      text:
        "",

      startedAt:
        Date.now(),

      completedAt:
        null,

    },


    // -------------------------------------------------
    // EXISTING ANSWERS
    // -------------------------------------------------

    answers:
      Array.isArray(
        interview?.answers
      )
        ? interview.answers
        : [],


    // -------------------------------------------------
    // INTERVIEW CONFIGURATION
    // -------------------------------------------------

    interviewConfig:
      interview?.interviewConfig ||
      interviewConfig,


    // -------------------------------------------------
    // EVALUATION
    // -------------------------------------------------

    result:
      null,


    // -------------------------------------------------
    // DATES
    // -------------------------------------------------

    startedAt:
      interview?.startedAt ||
      Date.now(),

    completedAt:
      null,

  };

}


// =====================================================
// START INTERVIEW
// =====================================================
//
// RESPONSIBILITY:
//
// 1. Resolve project
// 2. Create persistent interview
// 3. Receive backend interview ID
// 4. Store canonical interview state in runtime
//
// IMPORTANT:
//
// This action DOES NOT start MediaRecorder.
//
// Recording is a separate action:
//
// video.startRecording
//
// =====================================================

export default async function startInterview(
  ctx,
  params = {}
) {

  console.log(
    "=============================================="
  );

  console.log(
    "[startInterview] START"
  );

  console.log(
    "=============================================="
  );


  try {

    // =================================================
    // EXISTING RUNTIME INTERVIEW
    // =================================================

    const currentInterview =
      ctx?.get?.(
        "interview"
      ) ||
      {};


    console.log(
      "[startInterview] CURRENT RUNTIME INTERVIEW",
      currentInterview
    );


    // =================================================
    // ALREADY ACTIVE
    // =================================================
    //
    // Do not create another persistent interview when
    // an active interview already exists.
    //
    // =================================================

    if (
      currentInterview?.id &&
      currentInterview?.status ===
        "active"
    ) {

      console.log(
        "[startInterview] Interview already active",
        {

          interviewId:
            currentInterview.id,

          projectId:
            currentInterview.projectId ||

            ctx?.get?.(
              "project.id"
            ),

        }
      );


      return {

        ok:
          true,

        result: {

          id:
            currentInterview.id,

          projectId:
            currentInterview.projectId ||

            ctx?.get?.(
              "project.id"
            ),

          status:
            currentInterview.status,

          currentQuestion:
            currentInterview.currentQuestion,

          currentQuestionIndex:
            currentInterview.currentQuestionIndex,

          questions:
            currentInterview.questions ||
            [],

          alreadyActive:
            true,

        },

      };

    }


    // =================================================
    // RESOLVE PROJECT
    // =================================================

    const projectId =
      resolveProjectId(
        ctx,
        params
      );


    if (
      !projectId
    ) {

      console.error(
        "[startInterview] PROJECT_ID_REQUIRED",
        {

          runtimeProject:
            ctx?.get?.(
              "project"
            ),

          runtimeProjectId:
            ctx?.get?.(
              "project.id"
            ),

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
    // RESOLVE QUESTIONS
    // =================================================
    //
    // Priority:
    //
    // 1. params.questions
    // 2. existing runtime interview questions
    // 3. defaults
    //
    // =================================================

    const configuredQuestions =
      normaliseQuestions(
        params?.questions
      );


    const runtimeQuestions =
      normaliseQuestions(
        currentInterview?.questions
      );


    const questions =
      configuredQuestions.length > 0

        ? configuredQuestions

        : runtimeQuestions.length > 0

          ? runtimeQuestions

          : DEFAULT_QUESTIONS;


    if (
      questions.length ===
      0
    ) {

      return {

        ok:
          false,

        error:
          "INTERVIEW_QUESTIONS_REQUIRED",

      };

    }


    // =================================================
    // QUESTION SOURCE
    // =================================================

    const questionSource =
      params?.questionSource ||

      currentInterview?.questionSource ||

      "project_default";


    // =================================================
    // INTERVIEW CONFIGURATION
    // =================================================

    const interviewConfig = {

      recordingEnabled:
        params?.interviewConfig
          ?.recordingEnabled ??

        currentInterview
          ?.interviewConfig
          ?.recordingEnabled ??

        true,


      transcriptionEnabled:
        params?.interviewConfig
          ?.transcriptionEnabled ??

        currentInterview
          ?.interviewConfig
          ?.transcriptionEnabled ??

        true,


      evaluationEnabled:
        params?.interviewConfig
          ?.evaluationEnabled ??

        currentInterview
          ?.interviewConfig
          ?.evaluationEnabled ??

        true,

    };


    // =================================================
    // CANDIDATE
    // =================================================

    const candidate =
      params?.candidate ||
      {};


    const candidateUserId =
      params?.candidateUserId ||
      null;


    // =================================================
    // CREATE PERSISTENT INTERVIEW
    // =================================================

    console.log(
      "[startInterview] Creating persistent Interview",
      {

        projectId,

        questionCount:
          questions.length,

        questionSource,

        interviewConfig,

        candidateUserId,

      }
    );


    const response =
      await api.post(
        `/projects/${projectId}/interviews`,
        {

          questions,

          questionSource,

          interviewConfig,

          candidateUserId,

          candidate,

        }
      );


    // =================================================
    // API RESPONSE
    // =================================================

    console.log(
      "[startInterview] API RESPONSE",
      {

        status:
          response?.status,

        data:
          response?.data,

      }
    );


    const interview =
      response?.data?.interview ||
      null;


    if (
      !interview
    ) {

      throw new Error(
        "Interview API did not return an interview."
      );

    }


    // =================================================
    // PERSISTENT INTERVIEW ID
    // =================================================

    const interviewId =
      resolveInterviewId(
        interview
      );


    console.log(
      "[startInterview] PERSISTENT INTERVIEW ID",
      {

        interviewId,

        backendId:
          interview?._id ||

          null,

        backendPublicId:
          interview?.id ||

          null,

        backendInterviewId:
          interview?.interviewId ||

          null,

      }
    );


    if (
      !interviewId
    ) {

      throw new Error(
        "Interview API did not return an interview ID."
      );

    }


    // =================================================
    // SERVER QUESTIONS
    // =================================================

    const persistedQuestions =
      normaliseQuestions(
        interview?.questions
      );


    const finalQuestions =
      persistedQuestions.length > 0
        ? persistedQuestions
        : questions;


    const firstQuestion =
      finalQuestions[0];


    if (
      !firstQuestion
    ) {

      throw new Error(
        "Interview contains no questions."
      );

    }


    // =================================================
    // BUILD CANONICAL RUNTIME INTERVIEW
    // =================================================

    const runtimeInterview =
      buildRuntimeInterview({

        interview,

        interviewId,

        projectId,

        questions:
          finalQuestions,

        questionSource,

        interviewConfig,

      });


    // =================================================
    // DEFINITIVE RUNTIME IDENTITY CHECK
    // =================================================

    if (
      !runtimeInterview.id
    ) {

      throw new Error(
        "Runtime interview could not be initialised because no interview ID was available."
      );

    }


    if (
      !runtimeInterview.projectId
    ) {

      throw new Error(
        "Runtime interview could not be initialised because no project ID was available."
      );

    }


    console.log(
      "[startInterview] RUNTIME INTERVIEW INITIALISING",
      {

        id:
          runtimeInterview.id,

        projectId:
          runtimeInterview.projectId,

        status:
          runtimeInterview.status,

        questionCount:
          runtimeInterview.questions.length,

        currentQuestion:
          runtimeInterview.currentQuestion,

        recordingEnabled:
          runtimeInterview
            .interviewConfig
            ?.recordingEnabled,

      }
    );


    // =================================================
    // WRITE INTERVIEW TO RUNTIME STATE
    // =================================================
    //
    // IMPORTANT:
    //
    // Use patch("interview", ...) so the entire canonical
    // interview state is established in one runtime
    // transaction.
    //
    // =================================================

    ctx?.patch?.(
      "interview",
      runtimeInterview
    );


    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      "=============================================="
    );

    console.log(
      "[startInterview] SUCCESS"
    );

    console.log(
      "=============================================="
    );


    console.log(
      "[startInterview] Runtime interview active",
      {

        interviewId:
          runtimeInterview.id,

        projectId:
          runtimeInterview.projectId,

        status:
          runtimeInterview.status,

        currentQuestion:
          runtimeInterview.currentQuestion,

        currentQuestionIndex:
          runtimeInterview.currentQuestionIndex,

        questionCount:
          runtimeInterview.questions.length,

      }
    );


    return {

      ok:
        true,

      result: {

        id:
          runtimeInterview.id,

        projectId:
          runtimeInterview.projectId,

        status:
          runtimeInterview.status,

        currentQuestionIndex:
          runtimeInterview.currentQuestionIndex,

        currentQuestion:
          runtimeInterview.currentQuestion,

        questions:
          runtimeInterview.questions,

        questionCount:
          runtimeInterview.questions.length,

        recordingEnabled:
          runtimeInterview
            .interviewConfig
            ?.recordingEnabled ??
          true,

        transcriptionEnabled:
          runtimeInterview
            .interviewConfig
            ?.transcriptionEnabled ??
          true,

        evaluationEnabled:
          runtimeInterview
            .interviewConfig
            ?.evaluationEnabled ??
          true,

      },

    };

  }
  catch (
    err
  ) {

    console.error(
      "[startInterview] FAILED",
      {

        error:
          err,

        message:
          err?.message,

        response:
          err?.response?.data ||

          null,

        status:
          err?.response?.status ||

          null,

      }
    );


    return {

      ok:
        false,

      error:
        err?.response?.data?.error ||

        err?.response?.data?.message ||

        err?.message ||

        "START_INTERVIEW_FAILED",

    };

  }

}