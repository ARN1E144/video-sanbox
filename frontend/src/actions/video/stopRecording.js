// src/actions/video/stopRecording.js

export default async function stopRecording(
  ctx,
  params = {}
) {

  console.log(
    "=============================================="
  );

  console.log(
    "[stopRecording] START"
  );

  console.log(
    "=============================================="
  );


  // =====================================================
  // RESOLVE TARGET
  // =====================================================

  const id =
    params.targetId ||
    params.id;


  if (!id) {

    console.warn(
      "[stopRecording] No VideoFeed target"
    );

    return {
      ok: false,
      error: "VIDEO_TARGET_REQUIRED",
    };

  }


  // =====================================================
  // CURRENT BINDING
  // =====================================================

  const current =
    ctx.bindings?.[id] || {};


  // =====================================================
  // NOT RECORDING
  // =====================================================

  if (
    current.recording !== true
  ) {

    console.log(
      "[stopRecording] No active recording",
      {
        id,
        recordingStatus:
          current.recordingStatus,
      }
    );


    return {

      ok: true,

      result: {

        id,

        recording:
          false,

        recordingStatus:
          current.recordingStatus ||
          "idle",

        alreadyStopped:
          true,

      },

    };

  }


  // =====================================================
  // REQUEST STOP
  // =====================================================
  //
  // VideoFeed observes recording=false.
  //
  // MediaRecorder.stop() then runs asynchronously.
  //
  // The eventual Blob is produced by VideoFeed and the
  // binding changes to:
  //
  // recordingStatus: "ready"
  // recordingBlob: Blob
  //
  // We upload only AFTER that happens.
  // =====================================================

  ctx.updateBinding?.(
    id,
    {

      recording:
        false,

      recordingStatus:
        "stopping",

    }
  );


  console.log(
    "[stopRecording] Recording stop requested",
    {
      id,
    }
  );


  return {

    ok: true,

    result: {

      id,

      recording:
        false,

      recordingStatus:
        "stopping",

      uploadPending:
        true,

    },

  };

}