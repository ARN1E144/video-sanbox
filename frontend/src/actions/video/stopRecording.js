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


  // ===================================================
  // TARGET
  // ===================================================

  const id =
    params?.targetId ||
    params?.id ||
    null;


  if (!id) {

    console.warn(
      "[stopRecording] No VideoFeed target"
    );


    return {

      ok:
        false,

      error:
        "VIDEO_TARGET_REQUIRED",

    };

  }


  // ===================================================
  // EXPLICIT UPLOAD REQUEST
  // ===================================================

  const requestUpload =
    params?.autoUploadRecording === true;


  // ===================================================
  // CURRENT BINDING
  // ===================================================

  const current =
    ctx?.bindings?.[id] ||
    {};


  console.log(
    "[stopRecording] CURRENT BINDING",
    {

      id,

      recording:
        current.recording,

      recordingStatus:
        current.recordingStatus,

      requestUpload,

    }
  );


  // ===================================================
  // NOT RECORDING
  // ===================================================

  if (
    current.recording !==
    true
  ) {

    console.log(
      "[stopRecording] No active recording",
      {

        id,

        recordingStatus:
          current.recordingStatus,

        requestUpload,

      }
    );


    return {

      ok:
        true,

      result: {

        id,

        recording:
          false,

        recordingStatus:
          current.recordingStatus ||
          "idle",

        alreadyStopped:
          true,

        uploadRequested:
          requestUpload,

      },

    };

  }


  // ===================================================
  // REQUEST STOP
  // ===================================================
  //
  // VideoFeed will detect recording=false.
  //
  // The explicit upload request is stored alongside
  // the stop request.
  //
  // ===================================================

  ctx?.updateBinding?.(
    id,
    {

      recording:
        false,

      recordingStatus:
        "stopping",

      recordingUploadRequested:
        requestUpload,

    }
  );

  console.log(
  "%c 🛑 [stopRecording] BINDING UPDATE REQUESTED %c",
  "background-color: #E0E7FF; color: #3730A3; font-weight: bold; padding: 3px 8px; border-radius: 4px; font-size: 11px;",
  "",
  {
    id,
    recording: false,
    recordingStatus: "stopping",
    currentBinding: ctx?.bindings?.[id] || null,
  }
);


  // ===================================================
  // SUCCESS
  // ===================================================

  return {

    ok:
      true,

    result: {

      id,

      recording:
        false,

      recordingStatus:
        "stopping",

      uploadPending:
        requestUpload,

      recordingUploadRequested:
        requestUpload,

    },

  };

}