
// backend/services/s3RecordingService.js

import {
  S3Client,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import {
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import {
  getSignedUrl,
} from "@aws-sdk/s3-request-presigner";


// =====================================================
// CONFIGURATION
// =====================================================

const AWS_REGION =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION;

const S3_BUCKET =
  process.env.AWS_S3_BUCKET ||
  process.env.S3_BUCKET;

const PRESIGNED_UPLOAD_SECONDS =
  Number(
    process.env.S3_RECORDING_UPLOAD_EXPIRES_SECONDS ||
    900
  );


// =====================================================
// VALIDATION
// =====================================================

if (
  !AWS_REGION
) {

  console.warn(
    "[S3RecordingService] AWS_REGION is not configured."
  );

}


if (
  !S3_BUCKET
) {

  console.warn(
    "[S3RecordingService] S3 bucket is not configured."
  );

}


// =====================================================
// S3 CLIENT
// =====================================================
//
// The AWS SDK will resolve credentials from the normal
// AWS credential provider chain.
//
// Local development:
// AWS_ACCESS_KEY_ID
// AWS_SECRET_ACCESS_KEY
//
// Production:
// IAM role / task role / instance role is preferred.
// =====================================================

const s3 =
  new S3Client({

    region:
      AWS_REGION,

  });


// =====================================================
// NORMALISE CONTENT TYPE
// =====================================================

export function normaliseRecordingContentType(
  contentType
) {

  if (
    typeof contentType !==
    "string"
  ) {

    return "video/webm";

  }


  const value =
    contentType
      .trim()
      .toLowerCase();


  /*
  -----------------------------------------------------
  V1 currently records WebM.

  Keep this allow-list deliberately small so callers
  cannot turn the endpoint into a generic arbitrary-file
  upload service.
  -----------------------------------------------------
  */

  if (
    value.startsWith(
      "video/webm"
    )
  ) {

    return contentType;

  }


  if (
    value ===
    "video/mp4"
  ) {

    return contentType;

  }


  throw new Error(
    `Unsupported recording content type: ${contentType}`
  );

}


// =====================================================
// BUILD RECORDING KEY
// =====================================================
//
// Example:
//
// tenants/
//   6952.../
// projects/
//   6a8e.../
// interviews/
//   6a8f.../
// recording.webm
//
// This gives us deterministic project/interview
// isolation.
// =====================================================

export function buildInterviewRecordingKey({
  tenantId,
  projectId,
  interviewId,
  contentType = "video/webm",
}) {

  if (
    !tenantId ||
    !projectId ||
    !interviewId
  ) {

    throw new Error(
      "tenantId, projectId and interviewId are required."
    );

  }


  const safeContentType =
    normaliseRecordingContentType(
      contentType
    );


  const extension =
    safeContentType.startsWith(
      "video/mp4"
    )
      ? "mp4"
      : "webm";


  return [
    "tenants",
    String(
      tenantId
    ),
    "projects",
    String(
      projectId
    ),
    "interviews",
    String(
      interviewId
    ),
    `recording.${extension}`,
  ].join("/");

}


// =====================================================
// CREATE PRESIGNED UPLOAD URL
// =====================================================
//
// Returns:
//
// {
//   key,
//   bucket,
//   contentType,
//   uploadUrl,
//   expiresIn
// }
//
// The client PUTs the recording Blob directly to the
// returned URL.
// =====================================================

export async function createInterviewRecordingUploadUrl({
  tenantId,
  projectId,
  interviewId,
  contentType = "video/webm",
  expiresInSeconds =
    PRESIGNED_UPLOAD_SECONDS,
}) {

  if (
    !AWS_REGION
  ) {

    throw new Error(
      "AWS_REGION is not configured."
    );

  }


  if (
    !S3_BUCKET
  ) {

    throw new Error(
      "S3 bucket is not configured."
    );

  }


  const safeContentType =
    normaliseRecordingContentType(
      contentType
    );


  const key =
    buildInterviewRecordingKey({
      tenantId,
      projectId,
      interviewId,
      contentType:
        safeContentType,
    });


  const command =
    new PutObjectCommand({

      Bucket:
        S3_BUCKET,

      Key:
        key,

      ContentType:
        safeContentType,

      /*
      ---------------------------------------------------
      Prevent accidental public access assumptions.

      Bucket policy should remain private.
      ---------------------------------------------------
      */

    });


  const uploadUrl =
    await getSignedUrl(
      s3,
      command,
      {
        expiresIn:
          Number(
            expiresInSeconds
          ),
      }
    );


  return {

    bucket:
      S3_BUCKET,

    key,

    contentType:
      safeContentType,

    uploadUrl,

    expiresIn:
      Number(
        expiresInSeconds
      ),

  };

}


// =====================================================
// VERIFY OBJECT
// =====================================================
//
// Used by the upload-complete endpoint.
//
// We do NOT trust the browser saying "upload succeeded".
// The backend verifies the object exists in S3.
// =====================================================

export async function verifyInterviewRecordingObject({
  key,
}) {

  if (
    !S3_BUCKET
  ) {

    throw new Error(
      "S3 bucket is not configured."
    );

  }


  if (
    !key ||
    typeof key !==
      "string"
  ) {

    throw new Error(
      "S3 recording key is required."
    );

  }


  const result =
    await s3.send(
      new HeadObjectCommand({

        Bucket:
          S3_BUCKET,

        Key:
          key,

      })
    );


  return {

    exists:
      true,

    key,

    contentType:
      result.ContentType ||
      null,

    sizeBytes:
      Number(
        result.ContentLength ||
        0
      ),

    etag:
      result.ETag ||
      null,

    metadata:
      result.Metadata ||
      {},

  };

}


// =====================================================
// DELETE RECORDING
// =====================================================
//
// Used later for retention cleanup or interview deletion.
// =====================================================

export async function deleteInterviewRecording({
  key,
}) {

  if (
    !S3_BUCKET
  ) {

    throw new Error(
      "S3 bucket is not configured."
    );

  }


  if (
    !key
  ) {

    return {

      deleted:
        false,

      reason:
        "NO_KEY",

    };

  }


  await s3.send(
    new DeleteObjectCommand({

      Bucket:
        S3_BUCKET,

      Key:
        key,

    })
  );


  return {

    deleted:
      true,

    key,

  };

}


// =====================================================
// EXPORT
// =====================================================

export default {

  buildInterviewRecordingKey,

  createInterviewRecordingUploadUrl,

  verifyInterviewRecordingObject,

  deleteInterviewRecording,

  normaliseRecordingContentType,

};
