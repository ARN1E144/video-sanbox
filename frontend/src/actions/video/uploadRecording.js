// src/actions/video/uploadRecording.js

import api from "../../services/api";


// =====================================================
// UPLOAD RECORDING
// =====================================================
//
// Receives:
//
// recordingBlob
// projectId
// interviewId
//
// directly from VideoFeed whenever available.
//
// Runtime state is used as a fallback.
//
// =====================================================

export default async function uploadRecording(
  ctx,
  params = {}
) {

  console.log(
    "=============================================="
  );

  console.log(
    "[uploadRecording] START"
  );

  console.log(
    "=============================================="
  );


  try {

    // ===================================================
    // TARGET
    // ===================================================

    const id =
      params?.targetId ||
      params?.id ||
      null;


    if (
      !id
    ) {

      console.warn(
        "[uploadRecording] No VideoFeed target"
      );


      return {

        ok:
          false,

        error:
          "VIDEO_TARGET_REQUIRED",

      };

    }


    // ===================================================
    // STABLE SOURCE ID
    // ===================================================

    const sourceId =
      params?.sourceId ||
      null;


    // ===================================================
    // CURRENT BINDINGS
    // ===================================================

    const recordingBinding =
      ctx?.bindings?.[id] ||
      {};


    const sourceBinding =
      sourceId
        ? (
            ctx?.bindings?.[sourceId] ||
            {}
          )
        : {};


    // ===================================================
    // AUTHORITATIVE RECORDING BLOB
    // ===================================================
    //
    // IMPORTANT:
    //
    // Prefer the Blob directly supplied by VideoFeed.
    //
    // The React binding may still contain stale state.
    //
    // ===================================================

    const blob =
      params?.recordingBlob ||
      recordingBinding?.recordingBlob ||
      sourceBinding?.recordingBlob ||
      null;


    console.log(
      "[uploadRecording] Recording source",
      {

        id,

        sourceId,

        hasParamBlob:
          !!params?.recordingBlob,

        hasInstalledBindingBlob:
          !!recordingBinding?.recordingBlob,

        hasSourceBindingBlob:
          !!sourceBinding?.recordingBlob,

        hasBlob:
          !!blob,

        installedBindingStatus:
          recordingBinding?.recordingStatus ||
          null,

        sourceBindingStatus:
          sourceBinding?.recordingStatus ||
          null,

      }
    );


    // ===================================================
    // VALIDATE BLOB
    // ===================================================

    if (
      !blob
    ) {

      console.warn(
        "[uploadRecording] Recording Blob not available",
        {

          id,

          sourceId,

          hasParamBlob:
            !!params?.recordingBlob,

          hasInstalledBindingBlob:
            !!recordingBinding?.recordingBlob,

          hasSourceBindingBlob:
            !!sourceBinding?.recordingBlob,

        }
      );


      return {

        ok:
          false,

        error:
          "RECORDING_BLOB_NOT_READY",

      };

    }


    // ===================================================
    // RUNTIME SNAPSHOT
    // ===================================================

    const runtimeSnapshot =
      ctx?.getAll?.() ||
      {};


    // ===================================================
    // RUNTIME PROJECT
    // ===================================================

    const runtimeProject =
      ctx?.get?.("project") ||
      runtimeSnapshot?.project ||
      {};

    
    // ===================================================
    // RUNTIME INTERVIEW
    // ===================================================

    const runtimeInterview =
      ctx?.get?.("interview") ||
      runtimeSnapshot?.interview ||
      {};


    // ===================================================
    // RESOLVE PROJECT ID
    // ===================================================
    //
    // Priority:
    //
    // 1. Explicit params
    // 2. project.id
    // 3. project._id
    // 4. project.projectId
    // 5. interview.projectId
    // 6. direct runtime paths
    // 7. snapshot projectId
    //
    // ===================================================

    const projectId =
      params?.projectId ||

      runtimeProject?.id ||

      runtimeProject?._id ||

      runtimeProject?.projectId ||

      runtimeInterview?.projectId ||

      ctx?.get?.("project.id") ||

      ctx?.get?.("project._id") ||

      ctx?.get?.("project.projectId") ||

      ctx?.get?.("projectId") ||

      runtimeSnapshot?.projectId ||

      null;


    // ===================================================
    // RESOLVE INTERVIEW ID
    // ===================================================
    //
    // Priority:
    //
    // 1. Explicit params
    // 2. interview.id
    // 3. interview._id
    // 4. interview.interviewId
    // 5. interview.interview_id
    // 6. nested interview/data/state forms
    // 7. direct runtime paths
    // 8. snapshot interviewId
    //
    // ===================================================

    const interviewId =
      params?.interviewId ||

      runtimeInterview?.id ||

      runtimeInterview?._id ||

      runtimeInterview?.interviewId ||

      runtimeInterview?.interview_id ||

      runtimeInterview?.interview?.id ||

      runtimeInterview?.interview?._id ||

      runtimeInterview?.data?.id ||

      runtimeInterview?.data?._id ||

      runtimeInterview?.state?.id ||

      runtimeInterview?.state?._id ||

      ctx?.get?.("interview.id") ||

      ctx?.get?.("interview._id") ||

      ctx?.get?.("interview.interviewId") ||

      ctx?.get?.("interview.interview_id") ||

      ctx?.get?.("interview.data.id") ||

      ctx?.get?.("interview.data._id") ||

      ctx?.get?.("interview.state.id") ||

      ctx?.get?.("interview.state._id") ||

      ctx?.get?.("interviewId") ||

      runtimeSnapshot?.interviewId ||

      null;


    // ===================================================
    // DEFINITIVE IDENTITY DEBUG
    // ===================================================

    console.log(
      "[uploadRecording] IDENTITY DEBUG",
      {

        // Explicit parameters

        paramProjectId:
          params?.projectId ||
          null,

        paramInterviewId:
          params?.interviewId ||
          null,


        // Resolved values

        projectId,

        interviewId,


        // Runtime objects

        runtimeProject,

        runtimeInterview,


        // Snapshot objects

        snapshotProject:
          runtimeSnapshot?.project ||
          null,

        snapshotInterview:
          runtimeSnapshot?.interview ||
          null,


        // Interview candidates

        interviewCandidates: {

          id:
            runtimeInterview?.id ||
            null,

          _id:
            runtimeInterview?._id ||
            null,

          interviewId:
            runtimeInterview?.interviewId ||
            null,

          interview_id:
            runtimeInterview?.interview_id ||
            null,

          nestedId:
            runtimeInterview?.interview?.id ||
            null,

          nestedUnderscoreId:
            runtimeInterview?.interview?._id ||
            null,

          dataId:
            runtimeInterview?.data?.id ||
            null,

          dataUnderscoreId:
            runtimeInterview?.data?._id ||
            null,

          stateId:
            runtimeInterview?.state?.id ||
            null,

          stateUnderscoreId:
            runtimeInterview?.state?._id ||
            null,

        },

      }
    );


    // ===================================================
    // VALIDATE PROJECT
    // ===================================================

    if (
      !projectId
    ) {

      console.warn(
        "[uploadRecording] Missing project ID",
        {

          params,

          runtimeProject,

          runtimeInterview,

        }
      );


      return {

        ok:
          false,

        error:
          "PROJECT_ID_REQUIRED",

      };

    }


    // ===================================================
    // VALIDATE INTERVIEW
    // ===================================================

    if (
      !interviewId
    ) {

      console.warn(
        "[uploadRecording] Missing interview ID",
        {

          params,

          runtimeInterview,

          runtimeSnapshot,

        }
      );


      return {

        ok:
          false,

        error:
          "INTERVIEW_ID_REQUIRED",

      };

    }


    // ===================================================
    // RECORDING METADATA
    // ===================================================

    const contentType =
      params?.recordingMimeType ||

      recordingBinding?.recordingMimeType ||

      sourceBinding?.recordingMimeType ||

      blob?.type ||

      "video/webm";


    const sizeBytes =
      Number(
        params?.recordingSizeBytes ??
        recordingBinding?.recordingSizeBytes ??
        sourceBinding?.recordingSizeBytes ??
        blob?.size ??
        0
      );


    const durationSeconds =
      Number(
        params?.recordingDurationSeconds ??
        recordingBinding?.recordingDurationSeconds ??
        sourceBinding?.recordingDurationSeconds ??
        0
      );


    const completedAt =
      params?.recordingCompletedAt ??

      recordingBinding?.recordingCompletedAt ??

      sourceBinding?.recordingCompletedAt ??

      Date.now();


    console.log(
      "[uploadRecording] Recording metadata",
      {

        projectId,

        interviewId,

        contentType,

        sizeBytes,

        durationSeconds,

        completedAt,

      }
    );


    // ===================================================
    // MARK UPLOADING
    // ===================================================

    const uploadingPatch = {

      recording:
        false,

      recordingStatus:
        "uploading",

    };


    ctx?.updateBinding?.(
      id,
      uploadingPatch
    );


    if (
      sourceId &&
      sourceId !== id
    ) {

      ctx?.updateBinding?.(
        sourceId,
        uploadingPatch
      );

    }


    // ===================================================
    // REQUEST PRESIGNED URL
    // ===================================================

    console.log(
      "[uploadRecording] Requesting presigned URL",
      {

        projectId,

        interviewId,

        contentType,

        sizeBytes,

      }
    );


    const urlResponse =
      await api.post(
        `/projects/${projectId}/interviews/${interviewId}/recording/upload-url`,
        {
          contentType,
          sizeBytes,
        }
      );


    const uploadUrl =
      urlResponse?.data?.uploadUrl ||
      null;


    const s3Key =
      urlResponse?.data?.s3Key ||
      null;


    console.log(
      "[uploadRecording] Upload URL response",
      {

        status:
          urlResponse?.status,

        hasUploadUrl:
          !!uploadUrl,

        hasS3Key:
          !!s3Key,

        s3Key,

      }
    );


    if (
      !uploadUrl
    ) {

      throw new Error(
        "UPLOAD_URL_MISSING"
      );

    }


    if (
      !s3Key
    ) {

      throw new Error(
        "S3_KEY_MISSING"
      );

    }


    // ===================================================
    // UPLOAD DIRECTLY TO S3
    // ===================================================

    console.log(
      "[uploadRecording] Uploading Blob to S3",
      {

        s3Key,

        contentType,

        sizeBytes,

      }
    );


    const uploadResponse =
      await fetch(
        uploadUrl,
        {

          method:
            "PUT",

          headers: {

            "Content-Type":
              contentType,

          },

          body:
            blob,

        }
      );


    if (
      !uploadResponse.ok
    ) {

      const responseText =
        await uploadResponse
          .text()
          .catch(
            () => ""
          );


      console.error(
        "[uploadRecording] S3 upload response",
        {

          status:
            uploadResponse.status,

          statusText:
            uploadResponse.statusText,

          response:
            responseText,

        }
      );


      throw new Error(
        `S3_UPLOAD_FAILED_${uploadResponse.status}`
      );

    }


    console.log(
      "[uploadRecording] S3 upload successful",
      {

        s3Key,

        sizeBytes,

      }
    );


    // ===================================================
    // COMPLETE BACKEND RECORDING
    // ===================================================

    console.log(
      "[uploadRecording] Completing backend recording",
      {

        projectId,

        interviewId,

        s3Key,

      }
    );


    const completeResponse =
      await api.post(
        `/projects/${projectId}/interviews/${interviewId}/recording/complete`,
        {

          s3Key,

          contentType,

          sizeBytes,

          durationSeconds,

          completedAt,

        }
      );


    const completedRecording =
      completeResponse?.data?.recording ||
      null;


    console.log(
      "[uploadRecording] Backend recording completed",
      {

        s3Key,

        recording:
          completedRecording,

      }
    );


    // ===================================================
    // FINAL RUNTIME STATE
    // ===================================================

    const uploadedAt =
      Date.now();


    const uploadedPatch = {

      recording:
        false,

      recordingStatus:
        "uploaded",

      recordingBlob:
        null,

      recordingUrl:
        null,

      recordingS3Key:
        s3Key,

      recordingMimeType:
        contentType,

      recordingSizeBytes:
        sizeBytes,

      recordingDurationSeconds:
        durationSeconds,

      recordingCompletedAt:
        completedAt,

      recordingUploadedAt:
        uploadedAt,

    };


    ctx?.updateBinding?.(
      id,
      uploadedPatch
    );


    if (
      sourceId &&
      sourceId !== id
    ) {

      ctx?.updateBinding?.(
        sourceId,
        uploadedPatch
      );

    }


    // ===================================================
    // SUCCESS
    // ===================================================

    console.log(
      "[uploadRecording] SUCCESS",
      {

        id,

        sourceId,

        projectId,

        interviewId,

        s3Key,

        contentType,

        sizeBytes,

        durationSeconds,

      }
    );


    return {

      ok:
        true,

      result: {

        id,

        sourceId,

        projectId,

        interviewId,

        s3Key,

        contentType,

        sizeBytes,

        durationSeconds,

        completedAt,

        uploadedAt,

        recording:
          completedRecording,

      },

    };

  }
  catch (
    error
  ) {

    console.error(
      "[uploadRecording] FAILED",
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


    const id =
      params?.targetId ||
      params?.id ||
      null;


    const sourceId =
      params?.sourceId ||
      null;


    const failedPatch = {

      recording:
        false,

      recordingStatus:
        "failed",

    };


    if (
      id
    ) {

      ctx?.updateBinding?.(
        id,
        failedPatch
      );

    }


    if (
      sourceId &&
      sourceId !== id
    ) {

      ctx?.updateBinding?.(
        sourceId,
        failedPatch
      );

    }


    return {

      ok:
        false,

      error:
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "RECORDING_UPLOAD_FAILED",

    };

  }

}
