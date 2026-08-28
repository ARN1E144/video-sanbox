// src/actions/interview/startInterview.js

import api from "../../services/api";


// =====================================================
// TEMPORARY DEFAULT QUESTIONS
// =====================================================
//
// Final fallback only.
//
// Normal priority:
//
// 1. Explicit params.questions
// 2. Explicit params.questionSetId
// 3. Current project's activeQuestionSetId
// 4. Current project's first Question Set
// 5. Existing runtime interview questions
// 6. Temporary default questions
//
// =====================================================

const DEFAULT_QUESTIONS = [

  "Tell me about yourself.",

  "What is your greatest professional achievement?",

  "Tell me about a difficult problem you solved.",

];


// =====================================================
// DEFAULT INTERVIEW CONFIG
// =====================================================

const DEFAULT_INTERVIEW_CONFIG = {

  activeQuestionSetId:
    null,

  questionSets:
    [],

  recordingEnabled:
    true,

  transcriptionEnabled:
    true,

  evaluationEnabled:
    true,

};


// =====================================================
// GENERIC ID HELPER
// =====================================================

function normaliseId(
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

    return (
      trimmed ||
      null
    );

  }


  if (
    typeof value ===
    "object"
  ) {

    return (

      value?.id ||

      value?._id ||

      value?.projectId ||

      value?.interviewId ||

      value?.interview_id ||

      null

    );

  }


  return null;

}


// =====================================================
// PROJECT ID
// =====================================================
//
// Priority:
//
// 1. Explicit params.projectId
// 2. runtime.project.id
// 3. runtime.project._id
// 4. runtime.project.projectId
// 5. runtime project paths
//
// =====================================================

function resolveProjectId(
  ctx,
  params = {}
) {

  const explicitProjectId =
    normaliseId(
      params?.projectId
    );


  const runtimeProject =
    ctx?.get?.(
      "project"
    ) ||
    {};


  const runtimeProjectId =
    normaliseId(
      runtimeProject
    ) ||
    normaliseId(
      ctx?.get?.(
        "project.id"
      )
    ) ||
    normaliseId(
      ctx?.get?.(
        "project._id"
      )
    ) ||
    normaliseId(
      ctx?.get?.(
        "project.projectId"
      )
    ) ||
    normaliseId(
      ctx?.get?.(
        "projectId"
      )
    ) ||
    null;


  const resolved =
    explicitProjectId ||
    runtimeProjectId ||
    null;


  console.log(
    "[startInterview] PROJECT RESOLUTION",
    {

      explicitProjectId,

      runtimeProjectId,

      resolved,

      runtimeProject,

    }
  );


  return resolved;

}


// =====================================================
// QUESTIONS
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
          question ?? ""
        ).trim()
    )

    .filter(
      Boolean
    );

}


// =====================================================
// QUESTION SET
// =====================================================

function normaliseQuestionSet(
  questionSet = {}
) {

  return {

    id:
      questionSet?.id ||
      questionSet?._id ||
      null,

    name:
      String(
        questionSet?.name ||
        "Untitled Question Set"
      ).trim(),

    description:
      String(
        questionSet?.description ||
        ""
      ).trim(),

    questions:
      normaliseQuestions(
        questionSet?.questions
      ),

    source:
      questionSet?.source ||
      "manual",

  };

}


// =====================================================
// INTERVIEW CONFIG
// =====================================================
//
// Supports:
//
// runtime.project.interviewConfig
//
// runtime path:
//
// project.interviewConfig
//
// Explicit params.interviewConfig can override runtime
// configuration for an individual interview.
//
// =====================================================

function normaliseInterviewConfig(
  config
) {

  const source =
    config &&
    typeof config ===
      "object"

      ? config

      : {};


  const questionSets =
    Array.isArray(
      source?.questionSets
    )

      ? source.questionSets
          .map(
            normaliseQuestionSet
          )

      : [];


  let activeQuestionSetId =
    source?.activeQuestionSetId ||
    null;


  // ---------------------------------------------------
  // Validate active Question Set.
  // ---------------------------------------------------

  const activeExists =
    activeQuestionSetId &&
    questionSets.some(
      questionSet =>
        String(
          questionSet?.id
        ) ===
        String(
          activeQuestionSetId
        )
    );


  if (
    !activeExists
  ) {

    activeQuestionSetId =
      questionSets[0]?.id ||
      null;

  }


  return {

    ...DEFAULT_INTERVIEW_CONFIG,

    ...source,

    activeQuestionSetId,

    questionSets,

    recordingEnabled:
      source?.recordingEnabled !== false,

    transcriptionEnabled:
      source?.transcriptionEnabled !== false,

    evaluationEnabled:
      source?.evaluationEnabled !== false,

  };

}


// =====================================================
// RESOLVE PROJECT INTERVIEW CONFIG
// =====================================================

function resolveProjectInterviewConfig(
  ctx,
  params = {}
) {

  const runtimeProject =
    ctx?.get?.(
      "project"
    ) ||
    {};


  // ---------------------------------------------------
  // Project-level configuration.
  // ---------------------------------------------------

  const runtimeProjectConfig =
    runtimeProject?.interviewConfig ||
    ctx?.get?.(
      "project.interviewConfig"
    ) ||
    {};


  const projectConfig =
    normaliseInterviewConfig(
      runtimeProjectConfig
    );


  // ---------------------------------------------------
  // Explicit per-interview override.
  // ---------------------------------------------------

  const explicitConfig =
    params?.interviewConfig &&
    typeof params.interviewConfig ===
      "object"

      ? params.interviewConfig

      : {};


  const merged =
    {

      ...projectConfig,

      ...explicitConfig,

      questionSets:
        explicitConfig?.questionSets ??
        projectConfig.questionSets,

    };


  const resolved =
    normaliseInterviewConfig(
      merged
    );


  console.log(
    "[startInterview] PROJECT INTERVIEW CONFIG RESOLUTION",
    {

      runtimeProjectConfig,

      explicitConfig,

      activeQuestionSetId:
        resolved.activeQuestionSetId,

      questionSetCount:
        resolved.questionSets.length,

      recordingEnabled:
        resolved.recordingEnabled,

      transcriptionEnabled:
        resolved.transcriptionEnabled,

      evaluationEnabled:
        resolved.evaluationEnabled,

    }
  );


  return resolved;

}


// =====================================================
// RESOLVE QUESTION SET
// =====================================================
//
// Priority:
//
// 1. Explicit params.questionSetId
// 2. Project activeQuestionSetId
// 3. First available project Question Set
//
// =====================================================

function resolveQuestionSet(
  interviewConfig,
  params = {}
) {

  const questionSets =
    Array.isArray(
      interviewConfig?.questionSets
    )

      ? interviewConfig.questionSets

      : [];


  // ---------------------------------------------------
  // Explicit Question Set
  // ---------------------------------------------------

  const requestedId =
    params?.questionSetId ||
    null;


  if (
    requestedId
  ) {

    const explicitSet =
      questionSets.find(
        questionSet =>
          String(
            questionSet?.id
          ) ===
          String(
            requestedId
          )
      );


    if (
      explicitSet
    ) {

      console.log(
        "[startInterview] Using explicit Question Set",
        {

          id:
            explicitSet.id,

          name:
            explicitSet.name,

        }
      );


      return explicitSet;

    }


    console.warn(
      "[startInterview] Explicit Question Set not found",
      {

        requestedId,

        availableQuestionSets:
          questionSets.map(
            questionSet =>
              questionSet?.id
          ),

      }
    );

  }


  // ---------------------------------------------------
  // Active project Question Set
  // ---------------------------------------------------

  const activeId =
    interviewConfig
      ?.activeQuestionSetId ||
    null;


  if (
    activeId
  ) {

    const activeSet =
      questionSets.find(
        questionSet =>
          String(
            questionSet?.id
          ) ===
          String(
            activeId
          )
      );


    if (
      activeSet
    ) {

      console.log(
        "[startInterview] Using PROJECT ACTIVE Question Set",
        {

          id:
            activeSet.id,

          name:
            activeSet.name,

          questionCount:
            activeSet.questions?.length ||
            0,

        }
      );


      return activeSet;

    }


    console.warn(
      "[startInterview] Active Question Set ID does not exist",
      {

        activeId,

      }
    );

  }


  // ---------------------------------------------------
  // First available project Question Set
  // ---------------------------------------------------

  if (
    questionSets.length > 0
  ) {

    const firstSet =
      questionSets[0];


    console.log(
      "[startInterview] Using FIRST PROJECT Question Set",
      {

        id:
          firstSet?.id,

        name:
          firstSet?.name,

      }
    );


    return firstSet;

  }


  return null;

}


// =====================================================
// RESOLVE QUESTIONS
// =====================================================
//
// This is the key project → Confo bridge.
//
// Project:
//
// interviewConfig.questionSets
//
//       ↓
//
// activeQuestionSetId
//
//       ↓
//
// Question Set
//
//       ↓
//
// Interview snapshot
//
// =====================================================

function resolveQuestions({
  params = {},
  interviewConfig,
  currentInterview,
}) {

  // ===================================================
  // 1. EXPLICIT QUESTIONS
  // ===================================================

  const explicitQuestions =
    normaliseQuestions(
      params?.questions
    );


  if (
    explicitQuestions.length > 0
  ) {

    console.log(
      "[startInterview] Using EXPLICIT QUESTIONS",
      {

        count:
          explicitQuestions.length,

      }
    );


    return {

      questions:
        explicitQuestions,

      questionSource:
        params?.questionSource ||
        "custom",

      questionSetId:
        params?.questionSetId ||
        null,

      questionSetName:
        null,

    };

  }


  // ===================================================
  // 2. PROJECT QUESTION SET
  // ===================================================

  const questionSet =
    resolveQuestionSet(
      interviewConfig,
      params
    );


  if (
    questionSet
  ) {

    const questionSetQuestions =
      normaliseQuestions(
        questionSet?.questions
      );


    if (
      questionSetQuestions.length > 0
    ) {

      return {

        questions:
          questionSetQuestions,

        questionSource:
          questionSet?.source ||
          "project_default",

        questionSetId:
          questionSet?.id ||
          null,

        questionSetName:
          questionSet?.name ||
          null,

      };

    }


    console.warn(
      "[startInterview] Selected Question Set contains no questions",
      {

        questionSetId:
          questionSet?.id,

        questionSetName:
          questionSet?.name,

      }
    );

  }


  // ===================================================
  // 3. EXISTING RUNTIME INTERVIEW
  // ===================================================

  const runtimeQuestions =
    normaliseQuestions(
      currentInterview?.questions
    );


  if (
    runtimeQuestions.length > 0
  ) {

    console.log(
      "[startInterview] Falling back to EXISTING RUNTIME INTERVIEW QUESTIONS"
    );


    return {

      questions:
        runtimeQuestions,

      questionSource:
        currentInterview?.questionSource ||
        "project_default",

      questionSetId:
        currentInterview?.questionSetId ||
        null,

      questionSetName:
        currentInterview?.questionSetName ||
        null,

    };

  }


  // ===================================================
  // 4. TEMPORARY DEFAULT
  // ===================================================

  console.warn(
    "[startInterview] No project Question Set found - using temporary defaults"
  );


  return {

    questions:
      DEFAULT_QUESTIONS,

    questionSource:
      "project_default",

    questionSetId:
      null,

    questionSetName:
      null,

  };

}


// =====================================================
// RESOLVE INTERVIEW ID
// =====================================================

function resolveInterviewId(
  interview
) {

  return (

    normaliseId(
      interview?._id
    ) ||

    normaliseId(
      interview?.id
    ) ||

    normaliseId(
      interview?.interviewId
    ) ||

    normaliseId(
      interview?.interview_id
    ) ||

    null

  );

}


// =====================================================
// VIDEO TARGET
// =====================================================
//
// Standard AI Interviewer target:
//
// interview-video
//
// Can be overridden by a Confo.
//
// =====================================================

function resolveVideoTargetId(
  params = {}
) {

  return (

    params?.videoTargetId ||

    params?.recordingTargetId ||

    params?.videoSourceId ||

    "interview-video"

  );

}


// =====================================================
// BUILD RUNTIME INTERVIEW
// =====================================================

function buildRuntimeInterview({
  interview,
  interviewId,
  projectId,
  questions,
  questionSource,
  questionSetId,
  questionSetName,
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


  const finalProjectId =
    normaliseId(
      interview?.projectId
    ) ||
    projectId;


  const currentQuestion =
    finalQuestions[0] ||
    null;


  return {

    // =================================================
    // IDENTITY
    // =================================================

    id:
      interviewId,

    projectId:
      finalProjectId,


    // =================================================
    // LIFECYCLE
    // =================================================

    status:
      interview?.status ||
      "active",

    started:
      true,

    completed:
      false,


    // =================================================
    // QUESTION SOURCE
    // =================================================

    questionSource:
      interview?.questionSource ||
      questionSource,

    questionSetId:
      interview?.questionSetId ||
      questionSetId ||
      null,

    questionSetName:
      interview?.questionSetName ||
      questionSetName ||
      null,


    // =================================================
    // QUESTIONS
    // =================================================

    questions:
      finalQuestions,

    currentQuestionIndex:
      0,

    currentQuestion:
      currentQuestion,


    // =================================================
    // CURRENT ANSWER
    // =================================================

    answer: {

      text:
        "",

      transcript:
        "",

      startedAt:
        Date.now(),

      completedAt:
        null,

    },


    // =================================================
    // EXISTING ANSWERS
    // =================================================

    answers:

      Array.isArray(
        interview?.answers
      )

        ? interview.answers

        : [],


    // =================================================
    // INTERVIEW CONFIG
    // =================================================

    interviewConfig:
      interview?.interviewConfig ||

      interviewConfig,


    // =================================================
    // EVALUATION
    // =================================================

    result:
      interview?.aiEvaluation ||

      null,


    // =================================================
    // DATES
    // =================================================

    startedAt:
      interview?.startedAt ||

      Date.now(),

    completedAt:
      interview?.completedAt ||

      null,

  };

}


// =====================================================
// START RECORDING
// =====================================================
//
// MediaRecorder remains owned by VideoFeed.
//
// startInterview simply triggers the existing runtime
// recording action after the persistent interview has
// been created and runtime interview state initialised.
//
// =====================================================

async function startInterviewRecording(
  ctx,
  {
    videoTargetId,
    interviewId,
    projectId,
  }
) {

  if (
    typeof ctx?.runAction !==
    "function"
  ) {

    console.warn(
      "[startInterview] Runtime action chaining unavailable"
    );


    return {

      ok:
        false,

      error:
        "RUNTIME_RUN_ACTION_UNAVAILABLE",

    };

  }


  if (
    !videoTargetId
  ) {

    return {

      ok:
        false,

      error:
        "VIDEO_TARGET_REQUIRED",

    };

  }


  console.log(
    "[startInterview] STARTING RECORDING",
    {

      videoTargetId,

      interviewId,

      projectId,

    }
  );


  try {

    const result =
      await ctx.runAction(
        "video.startRecording",
        {

          targetId:
            videoTargetId,

          sourceId:
            videoTargetId,

        }
      );


    console.log(
      "[startInterview] RECORDING RESULT",
      {

        videoTargetId,

        result,

      }
    );


    return result;

  }
  catch (
    error
  ) {

    console.error(
      "[startInterview] Recording action failed",
      error
    );


    return {

      ok:
        false,

      error:
        error?.message ||
        "AUTOMATIC_RECORDING_FAILED",

    };

  }

}


// =====================================================
// START INTERVIEW
// =====================================================
//
// RESPONSIBILITY:
//
// 1. Resolve current project
// 2. Read project Interview configuration
// 3. Resolve selected Question Set
// 4. Create persistent Interview
// 5. Receive persistent Interview ID
// 6. Build canonical runtime Interview
// 7. Patch runtime Interview
// 8. Start recording when enabled
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
    // CURRENT INTERVIEW
    // =================================================

    const currentInterview =
      ctx?.get?.(
        "interview"
      ) ||
      {};


    // =================================================
    // CURRENT PROJECT
    // =================================================

    const runtimeProject =
      ctx?.get?.(
        "project"
      ) ||
      {};


    console.log(
      "[startInterview] CURRENT RUNTIME CONTEXT",
      {

        project:
          runtimeProject,

        interview:
          currentInterview,

      }
    );


    // =================================================
    // ALREADY ACTIVE
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
            currentInterview.projectId,

        }
      );


      const existingConfig =
        normaliseInterviewConfig(
          currentInterview?.interviewConfig
        );


      const recordingEnabled =
        existingConfig?.recordingEnabled !==
        false;


      let recordingResult =
        null;


      // ------------------------------------------------
      // Explicit restart only.
      // ------------------------------------------------

      if (
        recordingEnabled &&
        params?.restartRecording === true
      ) {

        recordingResult =
          await startInterviewRecording(
            ctx,
            {

              videoTargetId:
                resolveVideoTargetId(
                  params
                ),

              interviewId:
                currentInterview.id,

              projectId:
                currentInterview.projectId,

            }
          );

      }


      return {

        ok:
          true,

        result: {

          id:
            currentInterview.id,

          projectId:
            currentInterview.projectId ||

            resolveProjectId(
              ctx,
              params
            ),

          status:
            currentInterview.status,

          currentQuestionIndex:
            currentInterview.currentQuestionIndex,

          currentQuestion:
            currentInterview.currentQuestion,

          questions:
            currentInterview.questions ||
            [],

          questionSetId:
            currentInterview.questionSetId ||
            null,

          questionSetName:
            currentInterview.questionSetName ||
            null,

          questionSource:
            currentInterview.questionSource ||
            "project_default",

          recordingEnabled,

          transcriptionEnabled:
            existingConfig?.transcriptionEnabled !==
            false,

          evaluationEnabled:
            existingConfig?.evaluationEnabled !==
            false,

          recordingResult,

          alreadyActive:
            true,

        },

      };

    }


    // =================================================
    // PROJECT ID
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
    // PROJECT INTERVIEW CONFIG
    // =================================================

    const projectInterviewConfig =
      resolveProjectInterviewConfig(
        ctx,
        params
      );


    // =================================================
    // RESOLVE QUESTIONS
    // =================================================

    const resolved =
      resolveQuestions({

        ctx,

        params,

        interviewConfig:
          projectInterviewConfig,

        currentInterview,

      });


    const questions =
      resolved.questions;


    const questionSource =
      resolved.questionSource;


    const questionSetId =
      resolved.questionSetId ||
      null;


    const questionSetName =
      resolved.questionSetName ||
      null;


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


    console.log(
      "[startInterview] QUESTIONS RESOLVED",
      {

        projectId,

        questionCount:
          questions.length,

        questionSource,

        questionSetId,

        questionSetName,

        questions,

      }
    );


    // =================================================
    // FINAL INTERVIEW CONFIG
    // =================================================

    const finalInterviewConfig =
      normaliseInterviewConfig({

        ...projectInterviewConfig,

        ...(

          params?.interviewConfig &&
          typeof params.interviewConfig ===
            "object"

            ? params.interviewConfig

            : {}

        ),

      });


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
    // VIDEO TARGET
    // =================================================

    const videoTargetId =
      resolveVideoTargetId(
        params
      );


    // =================================================
    // CREATE PERSISTENT INTERVIEW
    // =================================================

    console.log(
      "[startInterview] CREATING INTERVIEW",
      {

        projectId,

        questionSetId,

        questionSetName,

        questionCount:
          questions.length,

        questionSource,

        interviewConfig:
          finalInterviewConfig,

        videoTargetId,

        candidateUserId,

      }
    );


    const response =
      await api.post(

        `/projects/${projectId}/interviews`,

        {

          questions,

          questionSource,

          questionSetId,

          questionSetName,

          interviewConfig:
            finalInterviewConfig,

          candidateUserId,

          candidate,

        }

      );


    // =================================================
    // SERVER RESPONSE
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


    if (
      finalQuestions.length ===
      0
    ) {

      throw new Error(
        "Interview contains no questions."
      );

    }


    // =================================================
    // CANONICAL RUNTIME INTERVIEW
    // =================================================

    const runtimeInterview =
      buildRuntimeInterview({

        interview,

        interviewId,

        projectId,

        questions:
          finalQuestions,

        questionSource,

        questionSetId,

        questionSetName,

        interviewConfig:
          finalInterviewConfig,

      });


    // =================================================
    // IDENTITY VALIDATION
    // =================================================

    if (
      !runtimeInterview?.id
    ) {

      throw new Error(
        "Runtime interview could not be initialised because no interview ID was available."
      );

    }


    if (
      !runtimeInterview?.projectId
    ) {

      throw new Error(
        "Runtime interview could not be initialised because no project ID was available."
      );

    }


    // =================================================
    // RUNTIME INTERVIEW
    // =================================================

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

        questionSetId:
          runtimeInterview.questionSetId,

        questionSetName:
          runtimeInterview.questionSetName,

        firstQuestion:
          runtimeInterview.currentQuestion,

        recordingEnabled:
          runtimeInterview
            ?.interviewConfig
            ?.recordingEnabled,

      }
    );


    // =================================================
    // WRITE RUNTIME INTERVIEW
    // =================================================

    ctx?.patch?.(
      "interview",
      runtimeInterview
    );


    // =================================================
    // AUTOMATIC RECORDING
    // =================================================
    //
    // Recording is a consequence of starting an
    // interview, but VideoFeed still owns MediaRecorder.
    //
    // =================================================

    let recordingResult =
      null;


    const recordingEnabled =
      runtimeInterview
        ?.interviewConfig
        ?.recordingEnabled !== false;


    if (
      recordingEnabled
    ) {

      recordingResult =
        await startInterviewRecording(
          ctx,
          {

            videoTargetId,

            interviewId:
              runtimeInterview.id,

            projectId:
              runtimeInterview.projectId,

          }
        );


      if (
        recordingResult?.ok ===
        false
      ) {

        console.error(
          "[startInterview] Recording failed to start",
          {

            recordingResult,

            interviewId:
              runtimeInterview.id,

            projectId:
              runtimeInterview.projectId,

          }
        );

      }

    }
    else {

      console.log(
        "[startInterview] Recording disabled by project configuration"
      );

    }


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
      "[startInterview] INTERVIEW ACTIVE",
      {

        interviewId:
          runtimeInterview.id,

        projectId:
          runtimeInterview.projectId,

        questionCount:
          runtimeInterview.questions.length,

        questionSetId:
          runtimeInterview.questionSetId,

        questionSetName:
          runtimeInterview.questionSetName,

        questionSource:
          runtimeInterview.questionSource,

        recordingEnabled,

        recordingResult,

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

        questionSource:
          runtimeInterview.questionSource,

        questionSetId:
          runtimeInterview.questionSetId,

        questionSetName:
          runtimeInterview.questionSetName,

        recordingEnabled,

        transcriptionEnabled:
          runtimeInterview
            ?.interviewConfig
            ?.transcriptionEnabled !==
          false,

        evaluationEnabled:
          runtimeInterview
            ?.interviewConfig
            ?.evaluationEnabled !==
          false,

        videoTargetId,

        recordingResult,

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[startInterview] FAILED",
      {

        name:
          error?.name,

        message:
          error?.message,

        stack:
          error?.stack,

        response:
          error?.response?.data ||
          null,

        status:
          error?.response?.status ||
          null,

      }
    );


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||

        error?.response?.data?.message ||

        error?.message ||

        "START_INTERVIEW_FAILED",

    };

  }

}