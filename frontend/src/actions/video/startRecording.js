// src/actions/video/startRecording.js

export default async function startRecording(
  ctx,
  params = {}
) {

  console.log(
    "=============================================="
  );

  console.log(
    "[startRecording] START"
  );

  console.log(
    "=============================================="
  );


  const id =
    params.targetId ||
    params.id;


  // =====================================================
  // VALIDATE TARGET
  // =====================================================

  if (!id) {

    console.warn(
      "[startRecording] No VideoFeed target"
    );

    return {
      ok: false,
      error: "VIDEO_TARGET_REQUIRED",
    };

  }


  // =====================================================
  // EXISTING BINDING
  // =====================================================

  const current =
    ctx.bindings?.[id] || {};


  // =====================================================
  // ALREADY RECORDING
  // =====================================================

  if (
    current.recording === true
  ) {

    console.log(
      "[startRecording] Already recording",
      {
        id,
      }
    );

    return {
      ok: true,

      result: {
        id,
        recording: true,
        alreadyRecording: true,
      },
    };

  }


  // =====================================================
  // START REQUEST
  //
  // VideoFeed observes recording=true and owns the
  // MediaRecorder lifecycle.
  // =====================================================

  ctx.updateBinding?.(
    id,
    {
      recording: true,

      recordingStatus: "starting",

      recordingBlob: null,

      recordingUrl: null,

      recordingMimeType: null,

      recordingSizeBytes: 0,

      recordingDurationSeconds: 0,

      recordingStartedAt:
        Date.now(),

      recordingCompletedAt: null,
    }
  );


  console.log(
    "[startRecording] Recording requested",
    {
      id,
    }
  );


  return {
    ok: true,

    result: {
      id,

      recording: true,

      recordingStatus:
        "starting",
    },
  };

}