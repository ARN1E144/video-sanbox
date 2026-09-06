// src/actions/interview/completeInterview.js

import api from "../../services/api";

import evaluateInterview
  from "./evaluateInterview";


// =====================================================
// RESOLVE VIDEO TARGET
// =====================================================

function resolveVideoTargetId(
  params = {}
) {

  return (

    params?.videoTargetId ||

    params?.recordingTargetId ||

    "interview-video"

  );

}


// =====================================================
// STOP RECORDING
// =====================================================

async function stopInterviewRecording(
  ctx,
  {
    videoTargetId,
    interviewId,
    projectId,
  }
) {

  console.log(
    "[completeInterview] RECORDING STOP REQUEST",
    {

      videoTargetId,

      interviewId,

      projectId,

      autoUploadRecording:
        true,

    }
  );


  if (
    typeof ctx?.runAction !==
    "function"
  ) {

    return {

      ok:
        false,

      error:
        "RUNTIME_RUN_ACTION_UNAVAILABLE",

    };

  }


  try {

    const result =
      await ctx.runAction(
        "video.stopRecording",
        {

          targetId:
            videoTargetId,

          sourceId:
            videoTargetId,

          projectId,

          interviewId,

          autoUploadRecording:
            true,

        }
      );


    console.log(
      "[completeInterview] RECORDING STOP RESULT",
      result
    );


    return (
      result || {
        ok:
          true,
      }
    );

  }
  catch (
    error
  ) {

    console.error(
      "[completeInterview] RECORDING STOP FAILED",
      error
    );


    return {

      ok:
        false,

      error:
        error?.message ||
        "VIDEO_RECORDING_STOP_FAILED",

    };

  }

}


// =====================================================
// COMPLETE INTERVIEW
// =====================================================
//
// V1 USER WORKFLOW:
//
//   Complete Interview
//        ↓
//   Stop recording
//        ↓
//   Upload recording
//        ↓
//   Complete backend interview
//        ↓
//   Evaluate interview
//
// IMPORTANT:
//
// `interview.evaluate` remains a standalone action for:
//
//   - retries
//   - debugging
//   - admin workflows
//   - future automation
//
// But the normal user workflow no longer requires
// a separate Evaluate button.
// =====================================================

export default async function completeInterview(
  ctx,
  params = {}
) {

  console.log(
    "=============================================="
  );

  console.log(
    "[completeInterview] START"
  );

  console.log(
    "=============================================="
  );


  try {

    // =================================================
    // CURRENT INTERVIEW
    // =================================================

    const interview =
      ctx?.get?.(
        "interview"
      ) || {};


    const interviewId =
      interview?.id ||
      interview?._id ||
      interview?.interviewId ||
      null;


    const projectId =
      interview?.projectId ||
      params?.projectId ||
      ctx?.get?.(
        "project.id"
      ) ||
      null;


    console.log(
      "[completeInterview] CURRENT INTERVIEW",
      {

        interviewId,

        projectId,

        status:
          interview?.status,

        questionCount:
          Array.isArray(
            interview?.questions
          )
            ? interview.questions.length
            : 0,

        answerCount:
          Array.isArray(
            interview?.answers
          )
            ? interview.answers.length
            : 0,

      }
    );


    // =================================================
    // VALIDATION
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
    // ALREADY COMPLETED
    // =================================================

    if (
      interview?.status ===
      "completed"
    ) {

      console.log(
        "[completeInterview] INTERVIEW ALREADY COMPLETED"
      );


      // -------------------------------------------------
      // Already completed does NOT mean already evaluated.
      //
      // Run evaluation when a valid evaluation is missing.
      // -------------------------------------------------

      const existingEvaluation =
        interview?.aiEvaluation ||
        null;


      const hasValidEvaluation =
        existingEvaluation &&
        typeof existingEvaluation ===
          "object" &&
        existingEvaluation.overallScore !==
          undefined &&
        existingEvaluation.overallScore !==
          null;


      if (
        hasValidEvaluation
      ) {

        return {

          ok:
            true,

          alreadyCompleted:
            true,

          alreadyEvaluated:
            true,

          result: {

            interviewId,

            projectId,

            status:
              "completed",

            aiEvaluation:
              existingEvaluation,

          },

        };

      }


      console.log(
        "[completeInterview] COMPLETED INTERVIEW HAS NO VALID EVALUATION - RUNNING EVALUATION"
      );


      const evaluationResult =
        await evaluateInterview(
          ctx,
          {

            projectId,

            interviewId,

          }
        );


      console.log(
        "[completeInterview] POST-COMPLETION EVALUATION RESULT",
        evaluationResult
      );


      return {

        ok:
          true,

        alreadyCompleted:
          true,

        alreadyEvaluated:
          evaluationResult?.ok ===
          true,

        evaluationResult,

        result: {

          interviewId,

          projectId,

          status:
            "completed",

          aiEvaluation:
            evaluationResult?.result ||
            interview?.aiEvaluation ||
            null,

        },

      };

    }


    // =================================================
    // ACTIVE CHECK
    // =================================================

    if (
      interview?.status !==
      "active"
    ) {

      console.warn(
        "[completeInterview] INTERVIEW NOT ACTIVE",
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
    // VIDEO TARGET
    // =================================================

    const videoTargetId =
      resolveVideoTargetId(
        params
      );


    const shouldStopRecording =
      params?.stopRecording !==
      false;


    // =================================================
    // RECORDING HANDSHAKE
    // =================================================

    let recordingCompletionPromise =
      null;


    let recordingStopResult =
      null;


    if (
      shouldStopRecording
    ) {

      // -------------------------------------------------
      // Register BEFORE requesting stop.
      // -------------------------------------------------

      if (
        typeof ctx?.waitForRecordingCompletion !==
        "function"
      ) {

        return {

          ok:
            false,

          error:
            "RECORDING_HANDSHAKE_UNAVAILABLE",

        };

      }


      recordingCompletionPromise =
        ctx.waitForRecordingCompletion(
          videoTargetId,
          120000
        );


      // -------------------------------------------------
      // Stop recording and request upload.
      // -------------------------------------------------

      recordingStopResult =
        await stopInterviewRecording(
          ctx,
          {

            videoTargetId,

            interviewId,

            projectId,

          }
        );


      if (
        recordingStopResult?.ok ===
        false
      ) {

        console.error(
          "[completeInterview] RECORDING STOP REQUEST FAILED",
          recordingStopResult
        );


        return {

          ok:
            false,

          error:
            recordingStopResult.error ||
            "VIDEO_RECORDING_STOP_FAILED",

          recordingStopResult,

        };

      }


      console.log(
        "[completeInterview] ABOUT TO WAIT FOR RECORDING COMPLETION",
        {

          videoTargetId,

          recordingStopResult,

        }
      );


      // -------------------------------------------------
      // Handle already-stopped recorder.
      // -------------------------------------------------

      if (
        recordingStopResult?.result?.alreadyStopped
      ) {

        const existingBinding =
          ctx?.bindings?.[
            videoTargetId
          ] || {};


        const existingStatus =
          existingBinding?.recordingStatus;


        if (
          existingStatus ===
          "uploaded"
        ) {

          recordingCompletionPromise =
            Promise.resolve({

              ok:
                true,

              status:
                "uploaded",

              alreadyUploaded:
                true,

            });

        }
        else {

          return {

            ok:
              false,

            error:
              "RECORDING_NOT_ACTIVE",

            recordingStopResult,

            recordingStatus:
              existingStatus ||
              "unknown",

          };

        }

      }


      // -------------------------------------------------
      // WAIT FOR ACTUAL UPLOAD.
      // -------------------------------------------------

      let recordingUploadResult;


      try {

        recordingUploadResult =
          await recordingCompletionPromise;

      }
      catch (
        error
      ) {

        console.error(
          "[completeInterview] RECORDING HANDSHAKE FAILED",
          error
        );


        return {

          ok:
            false,

          error:
            error?.message ||
            "RECORDING_UPLOAD_FAILED",

          recordingStopResult,

        };

      }


      console.log(
        "[completeInterview] RECORDING UPLOAD COMPLETE",
        recordingUploadResult
      );


      if (
        recordingUploadResult?.ok !==
        true
      ) {

        return {

          ok:
            false,

          error:
            "RECORDING_UPLOAD_FAILED",

          recordingStopResult,

          recordingUploadResult,

        };

      }


      recordingStopResult = {

        ...recordingStopResult,

        recordingUploadResult,

      };

    }


    // =================================================
    // FINAL ACTIVE STATE CHECK
    // =================================================

    const latestInterviewBeforeComplete =
      ctx?.get?.(
        "interview"
      ) || {};


    if (
      latestInterviewBeforeComplete?.status !==
      "active"
    ) {

      console.warn(
        "[completeInterview] INTERVIEW NO LONGER ACTIVE",
        {

          interviewId,

          status:
            latestInterviewBeforeComplete?.status,

        }
      );


      return {

        ok:
          false,

        error:
          "INTERVIEW_NOT_ACTIVE",

        recordingStopResult,

      };

    }


    // =================================================
    // COMPLETE BACKEND INTERVIEW
    // =================================================

    console.log(
      "[completeInterview] PERSISTING COMPLETION",
      {

        projectId,

        interviewId,

        recordingCompleted:
          shouldStopRecording,

      }
    );


    const response =
      await api.post(
        `/projects/${projectId}/interviews/${interviewId}/complete`
      );


    console.log(
      "[completeInterview] COMPLETION API RESPONSE",
      {

        status:
          response?.status,

        data:
          response?.data,

      }
    );


    const persistedInterview =
      response?.data?.interview ||
      null;


    if (
      !persistedInterview
    ) {

      throw new Error(
        "Interview completion endpoint did not return an interview."
      );

    }


    // =================================================
    // COMPLETION TIME
    // =================================================

    const completedAt =
      persistedInterview.completedAt ||
      Date.now();


    // =================================================
    // RUNTIME UPDATE
    // =================================================
    //
    // Make the freshly completed interview available
    // immediately for the evaluator.
    //
    // =================================================

    ctx?.patch?.(
      "interview",
      {

        id:
          persistedInterview.id ||
          persistedInterview._id ||
          interviewId,

        projectId,

        status:
          persistedInterview.status ||
          "completed",

        completed:
          true,

        completedAt,

        questions:
          Array.isArray(
            persistedInterview.questions
          )
            ? persistedInterview.questions
            : Array.isArray(
                interview.questions
              )
                ? interview.questions
                : [],

        answers:
          Array.isArray(
            persistedInterview.answers
          )
            ? persistedInterview.answers
            : Array.isArray(
                interview.answers
              )
                ? interview.answers
                : [],

        aiEvaluation:
          persistedInterview.aiEvaluation ||
          null,

        result:
          persistedInterview.result ||
          null,

      }
    );


    console.log(
      "[completeInterview] RUNTIME MARKED COMPLETED",
      {

        interviewId,

        projectId,

        status:
          persistedInterview.status ||
          "completed",

      }
    );


    // =================================================
    // RUN AI EVALUATION
    // =================================================
    //
    // IMPORTANT:
    //
    // Pass the freshly completed interview directly.
    // This avoids depending on React/render timing before
    // evaluation begins.
    //
    // =================================================

    console.log(
      "=============================================="
    );

    console.log(
      "[completeInterview] STARTING AI EVALUATION"
    );

    console.log(
      "=============================================="
    );


    let evaluationResult =
      null;


    try {

      evaluationResult =
        await evaluateInterview(
          ctx,
          {

            projectId,

            interviewId,

            // Fresh authoritative backend object.
            interview:
              persistedInterview,

          }
        );


      console.log(
        "[completeInterview] AI EVALUATION RESULT",
        evaluationResult
      );

    }
    catch (
      evaluationError
    ) {

      console.error(
        "[completeInterview] AI EVALUATION EXCEPTION",
        evaluationError
      );


      evaluationResult = {

        ok:
          false,

        error:
          evaluationError?.message ||
          "INTERVIEW_EVALUATION_FAILED",

      };

    }


    // =================================================
    // EVALUATION FAILURE
    // =================================================
    //
    // The interview itself is already completed.
    //
    // Do NOT report the overall Complete action as a
    // failure simply because the evaluator had a problem.
    //
    // This allows the standalone interview.evaluate
    // action to retry later.
    //
    // =================================================

    if (
      evaluationResult?.ok !==
      true
    ) {

      console.warn(
        "[completeInterview] INTERVIEW COMPLETED BUT EVALUATION FAILED",
        {

          interviewId,

          projectId,

          evaluationResult,

        }
      );


      console.log(
        "=============================================="
      );

      console.log(
        "[completeInterview] SUCCESS - EVALUATION PENDING/FAILED"
      );

      console.log(
        "=============================================="
      );


      return {

        ok:
          true,

        result: {

          interview:
            persistedInterview,

          interviewId,

          projectId,

          status:
            persistedInterview.status ||
            "completed",

          completedAt,

          aiEvaluation:
            null,

          evaluationPending:
            true,

          evaluationResult,

          recordingStopResult,

          videoTargetId,

        },

      };

    }


    // =================================================
    // SUCCESS
    // =================================================

    const finalEvaluation =
      evaluationResult?.result ||
      persistedInterview.aiEvaluation ||
      null;


    console.log(
      "=============================================="
    );

    console.log(
      "[completeInterview] SUCCESS"
    );

    console.log(
      "=============================================="
    );


    console.log(
      "[completeInterview] INTERVIEW COMPLETED + EVALUATED",
      {

        interviewId,

        projectId,

        status:
          persistedInterview.status,

        completedAt,

        hasEvaluation:
          !!finalEvaluation,

        recordingStopResult,

      }
    );


    return {

      ok:
        true,

      result: {

        interview:
          persistedInterview,

        interviewId,

        projectId,

        status:
          persistedInterview.status ||
          "completed",

        completedAt,

        aiEvaluation:
          finalEvaluation,

        evaluationPending:
          false,

        evaluationResult,

        recordingStopResult,

        videoTargetId,

      },

    };

  }
  catch (
    err
  ) {

    console.error(
      "=============================================="
    );

    console.error(
      "[completeInterview] FAILED"
    );

    console.error(
      "=============================================="
    );


    console.error(
      err
    );


    console.error(
      "[completeInterview] RESPONSE",
      err?.response?.data
    );


    return {

      ok:
        false,

      error:
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "INTERVIEW_COMPLETE_FAILED",

    };

  }

}