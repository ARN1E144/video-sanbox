// src/actions/interview/completeInterview.js

import api from "../../services/api";


// =====================================================
// COMPLETE INTERVIEW
// =====================================================
//
// Responsibility:
//
// 1. Resolve current active interview.
// 2. Register recording completion waiter.
// 3. Request VideoFeed to stop recording.
// 4. Wait for recording upload to complete.
// 5. Complete interview on backend.
// 6. Update runtime interview.
//
// IMPORTANT:
//
// The interview remains ACTIVE until the recording has:
//
//    MediaRecorder.stop()
//          ↓
//       Blob created
//          ↓
//    video.uploadRecording
//          ↓
//       S3 upload
//          ↓
// recording backend complete
//
// Only then do we call:
//
// /projects/:projectId/interviews/:interviewId/complete
//
// =====================================================


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
      interview.status ===
      "completed"
    ) {

      console.log(
        "[completeInterview] INTERVIEW ALREADY COMPLETED"
      );


      return {

        ok:
          true,

        alreadyCompleted:
          true,

        result: {

          interviewId,

          projectId,

          status:
            "completed",

        },

      };

    }


    // =================================================
    // ACTIVE CHECK
    // =================================================

    if (
      interview.status !==
      "active"
    ) {

      console.warn(
        "[completeInterview] INTERVIEW NOT ACTIVE",
        {

          interviewId,

          status:
            interview.status,

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
      // IMPORTANT:
      //
      // Register the waiter BEFORE requesting the stop.
      //
      // This prevents a fast recording from completing
      // before the waiter exists.
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
      // Request the VideoFeed to stop and upload.
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
        "%c ⏳ [completeInterview] ABOUT TO WAIT FOR RECORDING COMPLETION %c",
        "background-color: #FFEDD5; color: #C2410C; font-weight: bold; padding: 3px 8px; border-radius: 4px; font-size: 11px;",
        "",
        {
            videoTargetId,
            recordingStopResult,
        }
        );
            // -------------------------------------------------
      // If there wasn't an active recorder when the stop
      // action ran, there will be no onstop callback to
      // resolve the waiter.
      //
      // Treat an already-uploaded recording as complete.
      // Otherwise fail safely rather than completing the
      // interview without confirming the recording.
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

      console.log(
        "%c[completeInterview] AWAITING RECORDING COMPLETION PROMISE%c",
        "color: #D97706; font-weight: bold;", // Amber text tag
        "",
        {
            videoTargetId,
        }
        );


      // -------------------------------------------------
      // WAIT FOR ACTUAL RECORDING UPLOAD.
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


      // -------------------------------------------------
      // Defensive verification.
      // -------------------------------------------------

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


      // -------------------------------------------------
      // Store for final result.
      // -------------------------------------------------

      recordingStopResult = {

        ...recordingStopResult,

        recordingUploadResult,

      };

    }


    // =================================================
    // FINAL ACTIVE STATE CHECK
    // =================================================
    //
    // The runtime interview should still be active.
    //
    // =================================================

    const latestInterview =
      ctx?.get?.(
        "interview"
      ) || {};


    if (
      latestInterview?.status !==
      "active"
    ) {

      console.warn(
        "[completeInterview] INTERVIEW NO LONGER ACTIVE",
        {

          interviewId,

          status:
            latestInterview?.status,

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

    ctx?.patch?.(
      "interview",
      {

        status:
          persistedInterview.status ||
          "completed",

        completed:
          true,

        completedAt,

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
          interview.aiEvaluation ||
          null,

      }
    );


    // =================================================
    // SUCCESS
    // =================================================

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
      "[completeInterview] INTERVIEW COMPLETED",
      {

        interviewId,

        projectId,

        status:
          persistedInterview.status,

        completedAt,

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
          persistedInterview.aiEvaluation ||
          null,

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