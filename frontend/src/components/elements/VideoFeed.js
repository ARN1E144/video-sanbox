// src/components/elements/VideoFeed.js

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useActionContext,
} from "../../context/ActionContext";

import {
  bindActions,
} from "../../utils/actionBinder";

import {
  useRuntimeValue,
} from "../../hooks/useRuntimeValue";


// =========================================================
// VideoFeed
// =========================================================
//
// Responsibilities:
//
// 1. Render video.
// 2. Manage local camera/microphone.
// 3. Manage remote/HLS media.
// 4. Own MediaRecorder.
// 5. Create recording Blob.
// 6. Preserve recording-session identity.
// 7. Publish recording state through bindings.
// 8. Request video.uploadRecording when required.
//
// NOT responsible for:
//
// - Completing interviews.
// - Persisting interview state.
// - Generating S3 URLs.
// - Uploading directly to S3.
//
// Recording lifecycle:
//
// idle
//   ↓
// recording
//   ↓
// stopping
//   ↓
// ready
//   ↓
// uploading
//   ↓
// uploaded
//
// Any recording stage may transition to:
//
// failed
//
// =========================================================


export default function VideoFeed(
  props
) {

  // =======================================================
  // PROPS
  // =======================================================

  const {
    id,

    meta = {},

    style = {},

    enabled:
      _enabled,

    playing:
      _playing,

    muted:
      _muted,

    mirror:
      _mirror,

    objectFit:
      _objectFit,

    mode:
      _mode,

    src:
      _src,

    borderRadius:
      _borderRadius,

    micEnabled:
      _micEnabled,

    videoEnabled:
      _videoEnabled,

    recording:
      _recording,

    recordingStatus:
      _recordingStatus,

    autoUploadRecording:
      _autoUploadRecording,

    ...restProps

  } = props;


  // =======================================================
  // ACTION CONTEXT
  // =======================================================

  const actionCtx =
    useActionContext() || {};


  const {
    bindings = {},
    updateBinding,
    runAction,
    resolveRecordingCompletion,
    rejectRecordingCompletion,
  } =
    actionCtx;


  // =======================================================
  // RUNTIME VALUES
  // =======================================================

  const runtimeProject =
    useRuntimeValue(
      "project"
    );


  const runtimeInterview =
    useRuntimeValue(
      "interview"
    );


  // =======================================================
  // RUNTIME IDENTITY HELPERS
  // =======================================================

  const getProjectId =
    useCallback(
      (
        project,
        interview
      ) => {

        return (
          project?.id ||
          project?._id ||
          project?.projectId ||
          interview?.projectId ||
          null
        );

      },
      []
    );


  const getInterviewId =
    useCallback(
      interview => {

        return (
          interview?.id ||
          interview?._id ||
          interview?.interviewId ||
          interview?.interview_id ||
          null
        );

      },
      []
    );


  // =======================================================
  // SOURCE ID
  // =======================================================

  const sourceId =
    meta?.sourceId ||
    null;


  // =======================================================
  // LIVE RUNTIME REFS
  // =======================================================

  const runtimeProjectRef =
    useRef(null);


  const runtimeInterviewRef =
    useRef(null);


  useEffect(
    () => {

      runtimeProjectRef.current =
        runtimeProject ||
        null;

    },
    [
      runtimeProject,
    ]
  );


  useEffect(
    () => {

      runtimeInterviewRef.current =
        runtimeInterview ||
        null;

    },
    [
      runtimeInterview,
    ]
  );


  // =======================================================
  // UNSTABLE ACTION REFS
  // =======================================================
  //
  // ActionContext's executeAction can change when bindings
  // change.
  //
  // MediaRecorder callbacks must not capture an obsolete
  // version of the action function.
  //
  // Keeping the latest functions in refs prevents the media
  // lifecycle from depending on the changing ActionContext.
  //
  // =======================================================

  const updateBindingRef =
    useRef(updateBinding);


  const runActionRef =
    useRef(runAction);


  useEffect(
    () => {

      updateBindingRef.current =
        updateBinding;

    },
    [
      updateBinding,
    ]
  );


  useEffect(
    () => {

      runActionRef.current =
        runAction;

    },
    [
      runAction,
    ]
  );


  // =======================================================
  // BINDINGS
  // =======================================================

  const sourceBinding =
    sourceId
      ? (
          bindings?.[sourceId] ||
          {}
        )
      : {};


  const installedBinding =
    id
      ? (
          bindings?.[id] ||
          {}
        )
      : {};


  const binding = {

    ...sourceBinding,

    ...installedBinding,

  };


  // =======================================================
  // DEFAULTS
  // =======================================================

  const defaults =
    meta?.editableProps ||
    {};


  // =======================================================
  // RESOLVED PROPERTIES
  // =======================================================

  const mode =
    binding.mode ??
    _mode ??
    defaults.mode?.default ??
    "local";


  const src =
    binding.src ??
    _src ??
    defaults.src?.default ??
    null;


  const enabled =
    binding.enabled ??
    _enabled ??
    defaults.enabled?.default ??
    true;


  const playing =
    binding.playing ??
    _playing ??
    defaults.playing?.default ??
    true;


  const muted =
    binding.muted ??
    _muted ??
    defaults.muted?.default ??
    true;


  const mirror =
    binding.mirror ??
    _mirror ??
    defaults.mirror?.default ??
    true;


  const objectFit =
    binding.objectFit ??
    _objectFit ??
    defaults.objectFit?.default ??
    "cover";


  const borderRadius =
    binding.borderRadius ??
    _borderRadius ??
    defaults.borderRadius?.default ??
    12;


  // =======================================================
  // MEDIA STATE
  // =======================================================

  const micEnabled =
    binding.micEnabled ??
    _micEnabled ??
    true;


  const videoEnabled =
    binding.videoEnabled ??
    _videoEnabled ??
    true;


  // =======================================================
  // RECORDING STATE
  // =======================================================

  // =======================================================
// RECORDING STATE
// =======================================================
//
// Recording is special because the stable Confo source
// binding can contain an explicit runtime command:
//
//   recording: false
//
// The generated Canvas binding may still contain the
// original design-time value:
//
//   recording: true
//
// For recording state, an explicit source value must
// therefore override the installed Canvas value.
//
// =======================================================

const hasSourceRecording =
  Object.prototype.hasOwnProperty.call(
    sourceBinding,
    "recording"
  );


const hasInstalledRecording =
  Object.prototype.hasOwnProperty.call(
    installedBinding,
    "recording"
  );


const hasRuntimeRecording =
  hasSourceRecording ||
  hasInstalledRecording;

  


const resolvedRecording =
  hasSourceRecording
    ? sourceBinding.recording
    : installedBinding.recording;


const recording =
  hasRuntimeRecording
    ? Boolean(
        resolvedRecording
      )
    : Boolean(
        _recording ??
        false
      );

  const hasSourceRecordingStatus =
    Object.prototype.hasOwnProperty.call(
      sourceBinding,
      "recordingStatus"
    );


  const hasInstalledRecordingStatus =
    Object.prototype.hasOwnProperty.call(
      installedBinding,
      "recordingStatus"
    );


  const hasRuntimeRecordingStatus =
    hasSourceRecordingStatus ||
    hasInstalledRecordingStatus;


  const resolvedRecordingStatus =
    hasSourceRecordingStatus
      ? sourceBinding.recordingStatus
      : installedBinding.recordingStatus;


  const recordingStatus =
    hasRuntimeRecordingStatus
      ? (
          resolvedRecordingStatus ||
          "idle"
        )
      : (
          _recordingStatus ||
          "idle"
        );


  const hasRuntimeAutoUpload =
    Object.prototype.hasOwnProperty.call(
      binding,
      "autoUploadRecording"
    );


  const autoUploadRecording =
    hasRuntimeAutoUpload
      ? Boolean(
          binding.autoUploadRecording
        )
      : Boolean(
          _autoUploadRecording ??
          defaults.autoUploadRecording?.default ??
          false
        );

  // =======================================================
  // EXPLICIT RECORDING UPLOAD REQUEST
  // =======================================================
  //
  // This is a one-shot runtime instruction.
  //
  // It is different from autoUploadRecording.
  //
  // =======================================================

  const recordingUploadRequested =
    binding.recordingUploadRequested === true;


  // =======================================================
  // COMPONENT STATE
  // =======================================================

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState(null);


  const [
    streamReady,
    setStreamReady,
  ] = useState(false);


  // =======================================================
  // MEDIA REFS
  // =======================================================

  const videoRef =
    useRef(null);


  const streamRef =
    useRef(null);


  const hlsRef =
    useRef(null);


  // =======================================================
  // RECORDING REFS
  // =======================================================

  const mediaRecorderRef =
    useRef(null);


  const recordingChunksRef =
    useRef([]);


  const recordingObjectUrlRef =
    useRef(null);


  const recordingStartedAtRef =
    useRef(null);
  
  const recordingStartInProgressRef =
    useRef(false);

  const resolveRecordingCompletionRef =
    useRef(
    resolveRecordingCompletion
    );

    const rejectRecordingCompletionRef =
    useRef(
    rejectRecordingCompletion
    );

  useEffect(
() => {

resolveRecordingCompletionRef.current =
  resolveRecordingCompletion;

},
[
resolveRecordingCompletion,
]
);

useEffect(
() => {

rejectRecordingCompletionRef.current =
  rejectRecordingCompletion;


},
[
rejectRecordingCompletion,
]
);





  // =======================================================
  // AUTOMATIC UPLOAD CONFIGURATION
  // =======================================================
  //
  // This represents the component's normal automatic upload
  // configuration.
  //
  // =======================================================

  const recordingAutoUploadRef =
    useRef(false);


  


  useEffect(
    () => {

      recordingAutoUploadRef.current =
        autoUploadRecording ===
        true;

    },
    [
      autoUploadRecording,
    ]
  );


  // =======================================================
  // EXPLICIT UPLOAD REQUEST
  // =======================================================
  //
  // This is different from autoUploadRecording.
  //
  // Example:
  //
  // Complete Interview
  //      ↓
  // video.stopRecording
  //      ↓
  // requestUpload = true
  //
  // The recorder may have started with:
  //
  // autoUploadRecording = false
  //
  // but this particular recording should still upload.
  //
  // =======================================================

  const recordingUploadRequestedRef =
    useRef(false);


  // =======================================================
  // RECORDING SESSION IDENTITY
  // =======================================================

  const recordingProjectIdRef =
    useRef(null);


  const recordingInterviewIdRef =
    useRef(null);


  // =======================================================
  // ACTION HANDLERS
  // =======================================================

  const actionHandlers =
    bindActions(
      meta,
      actionCtx,
      id
    );


  // =======================================================
  // HLS
  // =======================================================

  const isHlsUrl =
    useCallback(
      url => {

        return (
          typeof url === "string" &&
          /\.m3u8(\?.*)?$/i.test(
            url.trim()
          )
        );

      },
      []
    );


  const destroyHls =
    useCallback(
      () => {

        const hls =
          hlsRef.current;


        if (!hls) {
          return;
        }


        try {

          hls.destroy();

        }
        catch {

          // Ignore cleanup errors.

        }


        hlsRef.current =
          null;

      },
      []
    );


  // =======================================================
  // MIME TYPE
  // =======================================================

  const getRecordingMimeType =
    useCallback(
      () => {

        if (
          typeof MediaRecorder ===
          "undefined"
        ) {

          return null;

        }


        const candidates = [

          "video/webm;codecs=vp9,opus",

          "video/webm;codecs=vp8,opus",

          "video/webm",

        ];


        return (
          candidates.find(
            type =>
              MediaRecorder.isTypeSupported(
                type
              )
          ) ||
          null
        );

      },
      []
    );


  // =======================================================
  // OBJECT URL CLEANUP
  // =======================================================

  const revokeRecordingObjectUrl =
    useCallback(
      () => {

        const objectUrl =
          recordingObjectUrlRef.current;


        if (!objectUrl) {
          return;
        }


        try {

          URL.revokeObjectURL(
            objectUrl
          );

        }
        catch {

          // Ignore.

        }


        recordingObjectUrlRef.current =
          null;

      },
      []
    );


  // =======================================================
  // UPDATE BINDING
  // =======================================================

  const updateFeedBinding =
    useCallback(
      (
        patchData = {}
      ) => {

        const update =
          updateBindingRef.current;


        if (
          typeof update !==
          "function"
        ) {

          console.warn(
            "[VideoFeed] updateBinding unavailable",
            {
              id,
              sourceId,
              patchData,
            }
          );


          return;

        }


        // -------------------------------------------------
        // Stable Confo source ID
        // -------------------------------------------------

        if (
          sourceId
        ) {

          update(
            sourceId,
            patchData
          );

        }


        // -------------------------------------------------
        // Generated Canvas ID
        // -------------------------------------------------

        if (
          id &&
          id !== sourceId
        ) {

          update(
            id,
            patchData
          );

        }

      },
      [
        id,
        sourceId,
      ]
    );


  // =======================================================
  // STOP LOCAL STREAM
  // =======================================================

  const stopLocalStream =
    useCallback(
      () => {

        const stream =
          streamRef.current;


        if (!stream) {

          setStreamReady(
            false
          );

          return;

        }


        stream
          .getTracks()
          .forEach(
            track => {

              try {

                track.stop();

              }
              catch {

                // Ignore individual track errors.

              }

            }
          );


        streamRef.current =
          null;


        setStreamReady(
          false
        );

      },
      []
    );


  // =======================================================
  // DISCARD RECORDING
  // =======================================================

  const discardRecording =
    useCallback(
      () => {

        const recorder =
          mediaRecorderRef.current;


        if (recorder) {

          try {

            recorder.ondataavailable =
              null;

            recorder.onstop =
              null;

            recorder.onerror =
              null;


            if (
              recorder.state !==
              "inactive"
            ) {

              recorder.stop();

            }

          }
          catch {

            // Ignore cleanup errors.

          }

        }


        mediaRecorderRef.current =
          null;


        recordingChunksRef.current =
          [];


        recordingStartedAtRef.current =
          null;


        recordingProjectIdRef.current =
          null;


        recordingInterviewIdRef.current =
          null;


        recordingUploadRequestedRef.current =
          false;


        revokeRecordingObjectUrl();


        updateFeedBinding({

          recording:
            false,

          recordingStatus:
            "idle",

          recordingBlob:
            null,

          recordingUrl:
            null,

          recordingUploadRequested:
            false,

        });

      },
      [
        revokeRecordingObjectUrl,
        updateFeedBinding,
      ]
    );


  // =======================================================
  // STOP RECORDING INTERNAL
  // =======================================================
  //
  // requestUpload is the important addition.
  //
  // It records the intent BEFORE MediaRecorder.stop().
  //
  // MediaRecorder.onstop executes asynchronously and reads
  // this ref later.
  //
  // =======================================================

  const stopRecordingInternal =
    useCallback(
      ({
        discard = false,
        requestUpload = false,
      } = {}) => {

        const recorder =
          mediaRecorderRef.current;


        // -------------------------------------------------
        // DISCARD
        // -------------------------------------------------

        if (
          discard
        ) {

          discardRecording();


          return {

            ok:
              true,

            recording:
              false,

            discarded:
              true,

          };

        }


        // -------------------------------------------------
        // NO ACTIVE RECORDER
        // -------------------------------------------------

        if (!recorder) {

          return {

            ok:
              true,

            recording:
              false,

            hadRecorder:
              false,

          };

        }


        // -------------------------------------------------
        // NORMAL STOP
        // -------------------------------------------------

        if (
          recorder.state ===
          "recording"
        ) {

          // ------------------------------------------------
          // CRITICAL:
          //
          // Capture upload intent BEFORE calling stop().
          //
          // onstop is asynchronous.
          // ------------------------------------------------

          recordingUploadRequestedRef.current =
            requestUpload ===
            true;


          updateFeedBinding({

            recording:
              false,

            recordingStatus:
              "stopping",

            recordingUploadRequested:
              requestUpload ===
              true,

          });


          console.log(
            "[VideoFeed] Stopping MediaRecorder",
            {

              id,

              sourceId,

              requestUpload:
                requestUpload ===
                true,

            }
          );


          try {

            recorder.stop();

          }
          catch (
            error
          ) {

            console.error(
              "[VideoFeed] MediaRecorder.stop failed",
              error
            );


            recordingUploadRequestedRef.current =
              false;


            updateFeedBinding({

              recording:
                false,

              recordingStatus:
                "failed",

              recordingUploadRequested:
                false,

            });


            return {

              ok:
                false,

              error:
                "RECORDING_STOP_FAILED",

            };

          }


          return {

            ok:
              true,

            recording:
              true,

            stopping:
              true,

            uploadPending:
              requestUpload ===
              true,

          };

        }


        // -------------------------------------------------
        // ALREADY STOPPING / INACTIVE
        // -------------------------------------------------

        return {

          ok:
            true,

          recording:
            false,

          alreadyStopping:
            recorder.state !==
            "recording",

        };

      },
      [
        discardRecording,
        id,
        sourceId,
        updateFeedBinding,
      ]
    );


  // =======================================================
  // START RECORDING
  // =======================================================

  const startRecordingInternal =
    useCallback(
      () => {

        // -------------------------------------------------
        // LOCAL MODE
        // -------------------------------------------------

        if (
          mode !==
          "local"
        ) {

          console.warn(
            "[VideoFeed] Recording requires local mode"
          );


          return {

            ok:
              false,

            error:
              "RECORDING_REQUIRES_LOCAL_MODE",

          };

        }


        // -------------------------------------------------
        // STREAM
        // -------------------------------------------------

        const stream =
          streamRef.current;


        if (!stream) {

          return {

            ok:
              false,

            error:
              "NO_LOCAL_MEDIA_STREAM",

          };

        }


        // -------------------------------------------------
        // READY
        // -------------------------------------------------

        if (
          !streamReady
        ) {

          return {

            ok:
              false,

            error:
              "MEDIA_STREAM_NOT_READY",

          };

        }


        // -------------------------------------------------
        // SUPPORT
        // -------------------------------------------------

        if (
          typeof MediaRecorder ===
          "undefined"
        ) {

          return {

            ok:
              false,

            error:
              "MEDIA_RECORDER_UNSUPPORTED",

          };

        }


        // -------------------------------------------------
        // ALREADY RECORDING
        // -------------------------------------------------

        if (
          mediaRecorderRef.current
        ) {

          return {

            ok:
              true,

            recording:
              true,

            alreadyRecording:
              true,

          };

        }


        // -------------------------------------------------
        // MIME
        // -------------------------------------------------

        const mimeType =
          getRecordingMimeType();


        if (!mimeType) {

          return {

            ok:
              false,

            error:
              "NO_SUPPORTED_RECORDING_FORMAT",

          };

        }


        // =================================================
        // CAPTURE RUNTIME IDENTITY
        // =================================================

        const currentProject =
          runtimeProjectRef.current ||
          {};


        const currentInterview =
          runtimeInterviewRef.current ||
          {};


        const projectId =
          getProjectId(
            currentProject,
            currentInterview
          );


        const interviewId =
          getInterviewId(
            currentInterview
          );


        recordingProjectIdRef.current =
          projectId;


        recordingInterviewIdRef.current =
          interviewId;


        recordingAutoUploadRef.current =
          autoUploadRecording ===
          true;


        recordingUploadRequestedRef.current =
          false;


        console.log(
          "[VideoFeed] Recording session captured",
          {

            id,

            sourceId,

            projectId,

            interviewId,

            autoUploadRecording:
              recordingAutoUploadRef.current,

          }
        );


        // =================================================
        // RESET CHUNKS
        // =================================================

        recordingChunksRef.current =
          [];


        revokeRecordingObjectUrl();


        // =================================================
        // CREATE MEDIA RECORDER
        // =================================================
        
        recordingStartInProgressRef.current =
          true;
        
        
        let recorder;


        try {

          recorder =
            new MediaRecorder(
              stream,
              {
                mimeType,
              }
            );

        }
        catch (
          error
        ) {

          console.error(
            "[VideoFeed] MediaRecorder creation failed",
            error
          );


          recordingProjectIdRef.current =
            null;


          recordingInterviewIdRef.current =
            null;


          return {

            ok:
              false,

            error:
              "RECORDING_INITIALISATION_FAILED",

          };

        }


        mediaRecorderRef.current =
          recorder;


        recordingStartedAtRef.current =
          Date.now();


        // =================================================
        // DATA
        // =================================================

        recorder.ondataavailable =
          event => {

            if (
              event?.data?.size >
              0
            ) {

              recordingChunksRef.current.push(
                event.data
              );

            }

          };


        // =================================================
        // ERROR
        // =================================================

        recorder.onerror =
          event => {

            console.error(
              "[VideoFeed] MediaRecorder error",
              {

                id,

                sourceId,

                event,

              }
            );


            updateFeedBinding({

              recording:
                false,

              recordingStatus:
                "failed",

            });

          };


        // =================================================
        // START
        // =================================================

        recorder.onstart =
() => {

// -----------------------------------------------
// The recorder is now genuinely running.
// Allow the recording effect to process a stop.
// -----------------------------------------------

recordingStartInProgressRef.current =
  false;


updateFeedBinding({

  recording:
    true,

  recordingStatus:
    "recording",

  recordingStartedAt:
    recordingStartedAtRef.current,

  recordingMimeType:
    mimeType,

});


console.log(
  "[VideoFeed] Recording started",
  {
    id,
    sourceId,
    projectId,
    interviewId,
    mimeType,

    recordingStartInProgress:
      recordingStartInProgressRef.current,

  }
);

};


        // =================================================
// STOP
// =================================================
//
// MediaRecorder.stop() is asynchronous.
//
// This handler owns:
//
// MediaRecorder.onstop
//      ↓
// Blob creation
//      ↓
// recording state = ready
//      ↓
// optional video.uploadRecording
//      ↓
// recording completion handshake
//
// =================================================

recorder.onstop =
async () => {
console.log(
  "[VideoFeed] MEDIARECORDER ONSTOP FIRED",
  {
    id,
    sourceId,

    recorderState:
      recorder.state,

    chunkCount:
      recordingChunksRef.current.length,

    uploadRequested:
      recordingUploadRequestedRef.current,

    autoUpload:
      recordingAutoUploadRef.current,

  }
);


const stoppedAt =
  Date.now();


const startedAt =
  recordingStartedAtRef.current;


const durationSeconds =
  startedAt
    ? Math.max(
        0,
        (
          stoppedAt -
          startedAt
        ) / 1000
      )
    : 0;


// -------------------------------------------------
// CAPTURE SESSION IDENTITY BEFORE CLEARING REFS
// -------------------------------------------------

const capturedProjectId =
  recordingProjectIdRef.current;


const capturedInterviewId =
  recordingInterviewIdRef.current;


const capturedAutoUpload =
  recordingAutoUploadRef.current;


const capturedUploadRequest =
  recordingUploadRequestedRef.current;


console.log(
  "[VideoFeed] RECORDING STOP CAPTURE",
  {
    id,
    sourceId,

    capturedProjectId,
    capturedInterviewId,

    capturedAutoUpload,
    capturedUploadRequest,

    durationSeconds,

  }
);


try {

  // ===============================================
  // CREATE BLOB
  // ===============================================

  const blob =
    new Blob(
      recordingChunksRef.current,
      {
        type:
          recorder.mimeType ||
          mimeType,
      }
    );


  console.log(
    "[VideoFeed] RECORDING BLOB CREATED",
    {
      id,
      sourceId,

      sizeBytes:
        blob.size,

      mimeType:
        blob.type,

      durationSeconds,

    }
  );


  if (
    !blob.size
  ) {

    throw new Error(
      "RECORDING_BLOB_EMPTY"
    );

  }


  // ===============================================
  // CLEAR ACTIVE RECORDER STATE
  // ===============================================

  recordingChunksRef.current =
    [];

  recordingStartedAtRef.current =
    null;

  mediaRecorderRef.current =
    null;


  recordingStartInProgressRef.current =
    false;


  // ===============================================
  // LOCAL PREVIEW
  // ===============================================

  revokeRecordingObjectUrl();


  const objectUrl =
    URL.createObjectURL(
      blob
    );


  recordingObjectUrlRef.current =
    objectUrl;


  // ===============================================
  // RECORDING READY
  // ===============================================

  updateFeedBinding({

    recording:
      false,

    recordingStatus:
      "ready",

    recordingBlob:
      blob,

    recordingUrl:
      objectUrl,

    recordingMimeType:
      blob.type ||
      mimeType,

    recordingSizeBytes:
      blob.size,

    recordingDurationSeconds:
      durationSeconds,

    recordingCompletedAt:
      stoppedAt,

    recordingProjectId:
      capturedProjectId,

    recordingInterviewId:
      capturedInterviewId,

    recordingUploadRequested:
      capturedUploadRequest,

  });


  console.log(
    "[VideoFeed] Recording ready",
    {
      id,
      sourceId,

      projectId:
        capturedProjectId,

      interviewId:
        capturedInterviewId,

      sizeBytes:
        blob.size,

    }
  );


  // ===============================================
  // SHOULD UPLOAD?
  // ===============================================

  const shouldUpload =
    capturedAutoUpload ||
    capturedUploadRequest;


  console.log(
    "[VideoFeed] RECORDING UPLOAD DECISION",
    {
      id,
      sourceId,

      capturedAutoUpload,
      capturedUploadRequest,

      shouldUpload,

    }
  );


  if (
    !shouldUpload
  ) {

    console.log(
      "[VideoFeed] Recording upload not requested",
      {
        id,
        sourceId,
      }
    );


    return;

  }


  // ===============================================
  // RUNTIME ACTION REQUIRED
  // ===============================================

  const run =
    runActionRef.current;


  if (
    typeof run !==
    "function"
  ) {

    throw new Error(
      "RUNTIME_RUN_ACTION_UNAVAILABLE"
    );

  }


  // ===============================================
  // UPLOADING
  // ===============================================

  updateFeedBinding({

    recording:
      false,

    recordingStatus:
      "uploading",

  });


  console.log(
    "[VideoFeed] Starting recording upload",
    {
      id,
      sourceId,

      projectId:
        capturedProjectId,

      interviewId:
        capturedInterviewId,

    }
  );


  // ===============================================
  // VIDEO UPLOAD ACTION
  // ===============================================

  const uploadResult =
    await run(
      "video.uploadRecording",
      {

        id,

        targetId:
          id,

        sourceId,


        projectId:
          capturedProjectId,

        interviewId:
          capturedInterviewId,


        recordingBlob:
          blob,

        recordingMimeType:
          blob.type ||
          mimeType,

        recordingSizeBytes:
          blob.size,

        recordingDurationSeconds:
          durationSeconds,

        recordingCompletedAt:
          stoppedAt,

      }
    );


  console.log(
    "[VideoFeed] RECORDING UPLOAD RESULT",
    {
      id,
      sourceId,

      uploadResult,

    }
  );


  // ===============================================
  // UPLOAD FAILURE
  // ===============================================

  if (
    uploadResult?.ok !==
    true
  ) {

    updateFeedBinding({

      recording:
        false,

      recordingStatus:
        "failed",

      recordingError:
        uploadResult?.error ||
        "RECORDING_UPLOAD_FAILED",

    });


    rejectRecordingCompletionRef
      .current
      ?.(
        sourceId ||
        id,

        new Error(
          uploadResult?.error ||
          "RECORDING_UPLOAD_FAILED"
        )
      );


    return;

  }


  // ===============================================
  // UPLOADED
  // ===============================================

  updateFeedBinding({

    recording:
      false,

    recordingStatus:
      "uploaded",

    recordingUploadRequested:
      false,

    recordingUploadResult:
      uploadResult,

  });


  console.log(
    "[VideoFeed] RECORDING UPLOAD SUCCESSFUL",
    {
      id,
      sourceId,

      projectId:
        capturedProjectId,

      interviewId:
        capturedInterviewId,

      uploadResult,

    }
  );


  // ===============================================
  // COMPLETE RECORDING HANDSHAKE
  // ===============================================

  const resolve =
    resolveRecordingCompletionRef
      .current;


  console.log(
    "[VideoFeed] HANDSHAKE RESOLUTION ATTEMPT",
    {
      id,
      sourceId,

      hasResolver:
        typeof resolve ===
        "function",

      handshakeId:
        sourceId ||
        id,

    }
  );


  if (
    typeof resolve ===
    "function"
  ) {

    const handshakeId =
      sourceId ||
      id;


    const resolved =
      resolve(
        handshakeId,
        uploadResult
      );


    console.log(
      "[VideoFeed] HANDSHAKE RESOLUTION RESULT",
      {
        handshakeId,
        resolved,
      }
    );

  }
  else {

    console.error(
      "[VideoFeed] RECORDING HANDSHAKE RESOLVER UNAVAILABLE",
      {
        id,
        sourceId,
      }
    );

  }

}
catch (
error
) {

console.error(
"[VideoFeed] MediaRecorder creation failed",
error
);

recordingStartInProgressRef.current =
false;

recordingProjectIdRef.current =
null;

recordingInterviewIdRef.current =
null;

return {

ok:
  false,

error:
  "RECORDING_INITIALISATION_FAILED",

};

}

finally {

  recordingProjectIdRef.current =
    null;


  recordingInterviewIdRef.current =
    null;


  recordingUploadRequestedRef.current =
    false;

}

};




        // =================================================
        // START MEDIA RECORDER
        // =================================================

        try {

          recorder.start(
            1000
          );

        }
        catch (
          error
        ) {

          console.error(
            "[VideoFeed] MediaRecorder.start failed",
            error
          );


          mediaRecorderRef.current =
            null;


          recordingChunksRef.current =
            [];


          recordingStartedAtRef.current =
            null;


          recordingProjectIdRef.current =
            null;


          recordingInterviewIdRef.current =
            null;


          recordingUploadRequestedRef.current =
            false;


          updateFeedBinding({

            recording:
              false,

            recordingStatus:
              "failed",

          });


          return {

            ok:
              false,

            error:
              "RECORDING_START_FAILED",

          };

        }


        return {

          ok:
            true,

          recording:
            true,

        };

      },
      [
        autoUploadRecording,
        getInterviewId,
        getProjectId,
        getRecordingMimeType,
        mode,
        revokeRecordingObjectUrl,
        streamReady,
        updateFeedBinding,
      ]
    );


  // =======================================================
  // LOCAL CAMERA
  // =======================================================

  const attachLocalCamera =
    useCallback(
      async () => {

        const video =
          videoRef.current;


        if (
          !video ||
          streamRef.current
        ) {

          return;

        }


        setIsLoading(
          true
        );


        setError(
          null
        );


        try {

          const stream =
            await navigator.mediaDevices.getUserMedia({

              video:
                true,

              audio:
                true,

            });


          streamRef.current =
            stream;


          stream
            .getVideoTracks()
            .forEach(
              track => {

                track.enabled =
                  videoEnabled;

              }
            );


          stream
            .getAudioTracks()
            .forEach(
              track => {

                track.enabled =
                  micEnabled;

              }
            );


          video.srcObject =
            stream;


          video.muted =
            true;


          await video
            .play()
            ?.catch(
              () => {}
            );


          setStreamReady(
            true
          );


          setIsLoading(
            false
          );


          setError(
            null
          );


          console.log(
            "[VideoFeed] Local media ready",
            {

              id,

              sourceId,

              videoTracks:
                stream
                  .getVideoTracks()
                  .length,

              audioTracks:
                stream
                  .getAudioTracks()
                  .length,

            }
          );

        }
        catch (
          error
        ) {

          console.error(
            "[VideoFeed] Local media error",
            error
          );


          streamRef.current =
            null;


          setStreamReady(
            false
          );


          setIsLoading(
            false
          );


          setError(
            "Camera or microphone unavailable"
          );

        }

      },
      [
        id,
        micEnabled,
        sourceId,
        videoEnabled,
      ]
    );


  // =======================================================
  // REMOTE STREAM
  // =======================================================

  const attachRemote =
    useCallback(
      async url => {

        const video =
          videoRef.current;


        if (
          !video ||
          !url
        ) {

          return;

        }


        setIsLoading(
          true
        );


        setError(
          null
        );


        resetVideoElementForRemote();


        // =================================================
        // HLS
        // =================================================

        if (
          isHlsUrl(url)
        ) {

          try {

            const mod =
              await import(
                "hls.js"
              );


            const Hls =
              mod.default ||
              mod;


            if (
              !Hls.isSupported()
            ) {

              setError(
                "HLS not supported"
              );


              setIsLoading(
                false
              );


              return;

            }


            const hls =
              new Hls();


            hlsRef.current =
              hls;


            hls.attachMedia(
              video
            );


            hls.on(
              Hls.Events.MEDIA_ATTACHED,
              () => {

                hls.loadSource(
                  url
                );

              }
            );


            hls.on(
              Hls.Events.MANIFEST_PARSED,
              () => {

                setIsLoading(
                  false
                );


                setError(
                  null
                );


                if (
                  playing
                ) {

                  video
                    .play()
                    ?.catch(
                      () => {}
                    );

                }

              }
            );


            hls.on(
              Hls.Events.ERROR,
              (
                _event,
                data
              ) => {

                if (
                  data?.fatal
                ) {

                  setError(
                    "Stream error"
                  );


                  setIsLoading(
                    false
                  );

                }

              }
            );

          }
          catch (
            error
          ) {

            console.error(
              "[VideoFeed] HLS load error",
              error
            );


            setError(
              "Stream load failed"
            );


            setIsLoading(
              false
            );

          }


          return;

        }


        // =================================================
        // NORMAL REMOTE VIDEO
        // =================================================

        destroyHls();


        video.srcObject =
          null;


        video.src =
          url;


        video.load();


        if (
          playing
        ) {

          video
            .play()
            ?.catch(
              () => {}
            );

        }


        setIsLoading(
          false
        );


        setError(
          null
        );

      },
      [
        destroyHls,
        isHlsUrl,
        playing,
      ]
    );


  // =======================================================
  // REMOTE RESET HELPER
  // =======================================================

  const resetVideoElementForRemote =
    useCallback(
      () => {

        destroyHls();


        stopLocalStream();


        const video =
          videoRef.current;


        if (!video) {
          return;
        }


        try {

          video.pause();

        }
        catch {

          // Ignore.

        }


        video.srcObject =
          null;


        video.removeAttribute(
          "src"
        );


        video.load();

      },
      [
        destroyHls,
        stopLocalStream,
      ]
    );


  // =======================================================
  // MEDIA LIFECYCLE
  // =======================================================

  useEffect(
    () => {

      let cancelled =
        false;


      const initialise =
        async () => {

          if (
            cancelled
          ) {

            return;

          }


          if (
            !enabled
          ) {

            discardRecording();


            return;

          }


          if (
            mode ===
            "local"
          ) {

            await attachLocalCamera();

            return;

          }


          if (
            mode ===
            "remote" &&
            src
          ) {

            await attachRemote(
              src
            );

          }

        };


      initialise();


      return () => {

        cancelled =
          true;


        // -------------------------------------------------
        // Media/source lifecycle cleanup.
        //
        // An ordinary recording stop does NOT use this
        // path. It uses stopRecordingInternal({discard:false}).
        //
        // -------------------------------------------------

        discardRecording();


        destroyHls();


        stopLocalStream();

      };

    },
    [
      attachLocalCamera,
      attachRemote,
      discardRecording,
      destroyHls,
      enabled,
      mode,
      src,
      stopLocalStream,
    ]
  );


  // =======================================================
  // VIDEO TRACK BINDING
  // =======================================================

  useEffect(
    () => {

      const stream =
        streamRef.current;


      if (!stream) {
        return;
      }


      stream
        .getVideoTracks()
        .forEach(
          track => {

            track.enabled =
              videoEnabled;

          }
        );

    },
    [
      videoEnabled,
    ]
  );


  // =======================================================
  // AUDIO TRACK BINDING
  // =======================================================

  useEffect(
    () => {

      const stream =
        streamRef.current;


      if (!stream) {
        return;
      }


      stream
        .getAudioTracks()
        .forEach(
          track => {

            track.enabled =
              micEnabled;

          }
        );

    },
    [
      micEnabled,
    ]
  );


  // =======================================================
  // RECORDING BINDING
  // =======================================================

   useEffect(
() => {

console.log(
  "%c[VideoFeed] RECORDING EFFECT FIRED%c",
  "color: #D946EF; font-weight: bold;", // Magenta text tag
  "",
  {
    id,
    sourceId,
    recording,
    recordingStatus,
    hasRuntimeRecording,
    sourceRecording: sourceBinding?.recording,
    installedRecording: installedBinding?.recording,
    recordingUploadRequested,
    autoUploadRecording,
    recorderExists: Boolean(mediaRecorderRef.current),
    recorderState: mediaRecorderRef.current?.state || "none",
    recordingStartInProgress: recordingStartInProgressRef.current,
  }
);

if (
  mode !==
  "local"
) {

  console.log(
    "[VideoFeed] RECORDING EFFECT SKIPPED - NOT LOCAL",
    {
      id,
      sourceId,
      mode,
    }
  );

  return;

}


const recorder =
  mediaRecorderRef.current;


const shouldStartRecorder =
  recording &&
  streamReady &&
  !recorder &&
  !recordingStartInProgressRef.current;


const shouldStopRecorder =
  hasRuntimeRecording &&
  recording === false &&
  recorder?.state === "recording" &&
  !recordingStartInProgressRef.current;


console.log(
  "[VideoFeed] RECORDING STOP DECISION",
  {
    id,
    sourceId,

    shouldStopRecorder,

    recording,

    hasRuntimeRecording,

    recorderState:
      recorder?.state ||
      "none",

    recordingStartInProgress:
      recordingStartInProgressRef.current,

    recordingUploadRequested,

    autoUploadRecording,

  }
);


// ===================================================
// START
// ===================================================

if (
  shouldStartRecorder
) {

  console.log(
    "[VideoFeed] Recording effect -> START",
    {
      id,
      sourceId,
    }
  );


  startRecordingInternal();


  return;

}


// ===================================================
// STOP
// ===================================================

if (
  shouldStopRecorder
) {

  const shouldUpload =
    autoUploadRecording === true ||
    recordingUploadRequested === true;


  console.log(
    "[VideoFeed] Recording binding detected - stopping",
    {
      id,
      sourceId,

      shouldUpload,

      automaticUpload:
        autoUploadRecording === true,

      requestUpload:
        recordingUploadRequested === true,

      recorderState:
        recorder?.state,
    }
  );


  stopRecordingInternal({
    requestUpload:
      shouldUpload,
  });

}

},
[
autoUploadRecording,

hasRuntimeRecording,

id,

mode,

recording,

recordingStatus,

recordingUploadRequested,

sourceId,

sourceBinding?.recording,
sourceBinding?.recordingUploadRequested,

installedBinding?.recording,
installedBinding?.recordingUploadRequested,

startRecordingInternal,

stopRecordingInternal,

streamReady,

]
);



  // =======================================================
  // FINAL UNMOUNT CLEANUP
  // =======================================================

  useEffect(
    () => {

      return () => {

        const recorder =
          mediaRecorderRef.current;


        if (recorder) {

          try {

            recorder.ondataavailable =
              null;

            recorder.onstop =
              null;

            recorder.onerror =
              null;


            if (
              recorder.state !==
              "inactive"
            ) {

              recorder.stop();

            }

          }
          catch {

            // Ignore cleanup errors.

          }

        }


        mediaRecorderRef.current =
          null;


        recordingChunksRef.current =
          [];


        recordingStartedAtRef.current =
          null;


        recordingProjectIdRef.current =
          null;


        recordingInterviewIdRef.current =
          null;


        recordingUploadRequestedRef.current =
          false;


        destroyHls();


        stopLocalStream();


        revokeRecordingObjectUrl();

      };

    },
    [
      destroyHls,
      revokeRecordingObjectUrl,
      stopLocalStream,
    ]
  );


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <div
      {...actionHandlers}
      {...restProps}

      style={{

        ...style,

        width:
          "100%",

        flex:
          1,

        minHeight:
          0,

        position:
          "relative",

        overflow:
          "hidden",

        borderRadius,

        backgroundColor:
          "#000",

      }}
    >

      <video
        ref={
          videoRef
        }

        playsInline

        muted={
          muted
        }

        autoPlay

        style={{

          width:
            "100%",

          height:
            "100%",

          objectFit,

          transform:
            mirror &&
            mode === "local"
              ? "scaleX(-1)"
              : "none",

        }}

      />


      {/* ===================================================
          RECORDING
          =================================================== */}

      {(
        recordingStatus ===
        "recording" ||
        recordingStatus ===
        "stopping"
      ) && (

        <div
          style={{

            position:
              "absolute",

            top:
              12,

            left:
              12,

            display:
              "flex",

            alignItems:
              "center",

            gap:
              8,

            padding:
              "6px 10px",

            borderRadius:
              999,

            background:
              "rgba(0,0,0,.65)",

            color:
              "#fff",

            fontSize:
              12,

            fontWeight:
              600,

            zIndex:
              10,

          }}
        >

          <span
            style={{

              width:
                8,

              height:
                8,

              borderRadius:
                "50%",

              background:
                "#ef4444",

            }}
          />

          {
            recordingStatus ===
            "stopping"
              ? "Finishing recording…"
              : "Recording"
          }

        </div>

      )}


      {/* ===================================================
          READY
          =================================================== */}

      {recordingStatus ===
        "ready" && (

        <div
          style={{

            position:
              "absolute",

            top:
              12,

            right:
              12,

            padding:
              "6px 10px",

            borderRadius:
              999,

            background:
              "rgba(0,0,0,.65)",

            color:
              "#86efac",

            fontSize:
              12,

            fontWeight:
              600,

            zIndex:
              10,

          }}
        >

          Recording ready

        </div>

      )}


      {/* ===================================================
          UPLOADING
          =================================================== */}

      {recordingStatus ===
        "uploading" && (

        <div
          style={{

            position:
              "absolute",

            top:
              12,

            right:
              12,

            padding:
              "6px 10px",

            borderRadius:
              999,

            background:
              "rgba(0,0,0,.65)",

            color:
              "#facc15",

            fontSize:
              12,

            fontWeight:
              600,

            zIndex:
              10,

          }}
        >

          Uploading…

        </div>

      )}


      {/* ===================================================
          UPLOADED
          =================================================== */}

      {recordingStatus ===
        "uploaded" && (

        <div
          style={{

            position:
              "absolute",

            top:
              12,

            right:
              12,

            padding:
              "6px 10px",

            borderRadius:
              999,

            background:
              "rgba(0,0,0,.65)",

            color:
              "#86efac",

            fontSize:
              12,

            fontWeight:
              600,

            zIndex:
              10,

          }}
        >

          Recording uploaded

        </div>

      )}


      {/* ===================================================
          FAILED
          =================================================== */}

      {recordingStatus ===
        "failed" && (

        <div
          style={{

            position:
              "absolute",

            top:
              12,

            right:
              12,

            padding:
              "6px 10px",

            borderRadius:
              999,

            background:
              "rgba(0,0,0,.65)",

            color:
              "#fca5a5",

            fontSize:
              12,

            fontWeight:
              600,

            zIndex:
              10,

          }}
        >

          Recording failed

        </div>

      )}


      {/* ===================================================
          LOADING
          =================================================== */}

      {isLoading && (

        <div
          className="
            absolute
            inset-0
            flex
            items-center
            justify-center
            text-white
            text-xs
            bg-black/40
          "

          style={{
            zIndex:
              20,
          }}
        >

          Loading…

        </div>

      )}


      {/* ===================================================
          ERROR
          =================================================== */}

      {error && (

        <div
          className="
            absolute
            inset-0
            flex
            items-center
            justify-center
            text-red-400
            text-xs
            bg-black/70
            text-center
            px-4
          "

          style={{
            zIndex:
              30,
          }}
        >

          {error}

        </div>

      )}

    </div>

  );

}