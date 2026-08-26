// src/components/elements/VideoFeed.js

import React, {
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


export default function VideoFeed(
  props
) {

  // =====================================================
  // PROPS
  // =====================================================

  const {
    id,

    meta = {},

    style = {},

    // ---------------------------------------------------
    // COMPONENT PROPS
    // ---------------------------------------------------

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

    // Everything else is passed to the wrapper.
    ...restProps

  } = props;


  // =====================================================
  // ACTION CONTEXT
  // =====================================================

  const actionCtx =
    useActionContext();


  const {
    bindings = {},
  } =
    actionCtx || {};


  // =====================================================
  // CANONICAL RUNTIME VALUES
  // =====================================================
  //
  // IMPORTANT:
  //
  // These values come from the runtime state hook rather
  // than attempting to reconstruct runtime state through
  // ActionContext later.
  //
  // =====================================================

  const runtimeInterview =
    useRuntimeValue(
      "interview"
    );

    console.log(
    "[VideoFeed] RAW RUNTIME INTERVIEW",
    {
      value: runtimeInterview,

      type:
        typeof runtimeInterview,

      keys:
        runtimeInterview &&
        typeof runtimeInterview === "object"
          ? Object.keys(runtimeInterview)
          : [],

      id:
        runtimeInterview?.id,

      _id:
        runtimeInterview?._id,

      interviewId:
        runtimeInterview?.interviewId,

      interview_id:
        runtimeInterview?.interview_id,

      projectId:
        runtimeInterview?.projectId,

      state:
        runtimeInterview?.state,

      data:
        runtimeInterview?.data,

      interview:
        runtimeInterview?.interview,
    }
  );


  const runtimeProject =
    useRuntimeValue(
      "project"
    );


  // =====================================================
  // RUNTIME IDENTITY VALUES
  // =====================================================

  const runtimeProjectId =
    runtimeProject?.id ||
    runtimeProject?._id ||
    runtimeProject?.projectId ||
    runtimeInterview?.projectId ||
    null;


  const runtimeInterviewId =
    runtimeInterview?.id ||
    runtimeInterview?._id ||
    runtimeInterview?.interviewId ||
    runtimeInterview?.interview_id ||
    null;


  // =====================================================
  // SOURCE ID
  // =====================================================

  const sourceId =
    meta?.sourceId ||
    null;


  // =====================================================
  // LIVE RUNTIME IDENTITY REFS
  // =====================================================
  //
  // MediaRecorder callbacks are asynchronous.
  //
  // A callback can run after React has rendered again.
  // These refs are continuously kept in sync with the
  // latest runtime values so onstop can read the latest
  // known project/interview.
  //
  // =====================================================

  const runtimeProjectRef =
    useRef(null);


  const runtimeInterviewRef =
    useRef(null);


  useEffect(
    () => {

      runtimeProjectRef.current =
        runtimeProject || null;


      runtimeInterviewRef.current =
        runtimeInterview || null;


      console.log(
        "[VideoFeed] LIVE RUNTIME IDENTITY",
        {

          id,

          sourceId,

          runtimeProject,

          runtimeInterview,

          projectId:
            runtimeProject?.id ||
            runtimeProject?._id ||
            runtimeProject?.projectId ||
            runtimeInterview?.projectId ||
            null,

          interviewId:
            runtimeInterview?.id ||
            runtimeInterview?._id ||
            runtimeInterview?.interviewId ||
            runtimeInterview?.interview_id ||
            null,

        }
      );

    },
    [
      id,
      sourceId,
      runtimeProject,
      runtimeInterview,
    ]
  );


  // =====================================================
  // BINDINGS
  // =====================================================

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


  /*
  -------------------------------------------------------
  Both the stable Confo source identity and generated
  Canvas identity can have binding state.

  Installed binding takes precedence.
  -------------------------------------------------------
  */

  const binding = {

    ...sourceBinding,

    ...installedBinding,

  };


  // =====================================================
  // DEFAULTS
  // =====================================================

  const defaults =
    meta?.editableProps ||
    {};


  // =====================================================
  // RESOLVED PROPERTIES
  // =====================================================

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


  // =====================================================
  // MEDIA STATE
  // =====================================================

  const micEnabled =
    binding.micEnabled ??
    _micEnabled ??
    true;


  const videoEnabled =
    binding.videoEnabled ??
    _videoEnabled ??
    true;


  // =====================================================
  // RECORDING STATE
  // =====================================================

  const recording =
    binding.recording ??
    _recording ??
    false;


  const recordingStatus =
    binding.recordingStatus ??
    _recordingStatus ??
    "idle";


  const autoUploadRecording =
    binding.autoUploadRecording ??
    _autoUploadRecording ??
    defaults.autoUploadRecording?.default ??
    false;


  // =====================================================
  // COMPONENT STATE
  // =====================================================

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


  // =====================================================
  // MEDIA REFS
  // =====================================================

  const videoRef =
    useRef(null);


  const streamRef =
    useRef(null);


  const hlsRef =
    useRef(null);


  // =====================================================
  // RECORDING REFS
  // =====================================================

  const mediaRecorderRef =
    useRef(null);


  const recordingChunksRef =
    useRef([]);


  const recordingObjectUrlRef =
    useRef(null);


  const recordingStartedAtRef =
    useRef(null);


  // =====================================================
  // RECORDING SESSION IDENTITY
  // =====================================================
  //
  // These values belong to the specific recording session.
  //
  // They are captured when recording starts.
  //
  // =====================================================

  const recordingProjectIdRef =
    useRef(null);


  const recordingInterviewIdRef =
    useRef(null);


  // =====================================================
  // ACTION HANDLERS
  // =====================================================

  const actionHandlers =
    bindActions(
      meta,
      actionCtx,
      id
    );


  // =====================================================
  // DEBUG CONFIG
  // =====================================================

  useEffect(
    () => {

      console.log(
        "[VideoFeed] CONFIG",
        {

          id,

          sourceId,

          mode,

          enabled,

          recording,

          recordingStatus,

          autoUploadRecording,

        }
      );

    },
    [
      id,
      sourceId,
      mode,
      enabled,
      recording,
      recordingStatus,
      autoUploadRecording,
    ]
  );


  // =====================================================
  // HLS HELPER
  // =====================================================

  const isHlsUrl =
    (
      url
    ) =>
      typeof url === "string" &&
      /\.m3u8(\?.*)?$/i.test(
        url.trim()
      );


  // =====================================================
  // RECORDING MIME TYPE
  // =====================================================

  const getRecordingMimeType =
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

    };


  // =====================================================
  // OBJECT URL CLEANUP
  // =====================================================

  const revokeRecordingObjectUrl =
    () => {

      if (
        recordingObjectUrlRef.current
      ) {

        URL.revokeObjectURL(
          recordingObjectUrlRef.current
        );


        recordingObjectUrlRef.current =
          null;

      }

    };


  // =====================================================
  // HLS CLEANUP
  // =====================================================

  const destroyHls =
    () => {

      if (
        !hlsRef.current
      ) {

        return;

      }


      try {

        hlsRef.current.destroy();

      }
      catch {

        // Ignore cleanup errors.

      }


      hlsRef.current =
        null;

    };


  // =====================================================
  // UPDATE BINDING
  // =====================================================

  const updateFeedBinding =
    (
      patchData = {}
    ) => {

      if (
        typeof actionCtx?.updateBinding !==
        "function"
      ) {

        console.warn(
          "[VideoFeed] updateBinding unavailable",
          {

            id,

            sourceId,

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

        actionCtx.updateBinding(
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

        actionCtx.updateBinding(
          id,
          patchData
        );

      }

    };


  // =====================================================
  // STOP LOCAL STREAM
  // =====================================================

  const stopLocalStream =
    () => {

      const stream =
        streamRef.current;


      if (
        !stream
      ) {

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

    };


  // =====================================================
  // STOP RECORDING INTERNAL
  // =====================================================

  const stopRecordingInternal =
    ({
      discard = false,
    } = {}) => {

      const recorder =
        mediaRecorderRef.current;


      // -------------------------------------------------
      // No recorder
      // -------------------------------------------------

      if (
        !recorder
      ) {

        if (
          discard
        ) {

          recordingChunksRef.current =
            [];

          recordingStartedAtRef.current =
            null;

          recordingProjectIdRef.current =
            null;

          recordingInterviewIdRef.current =
            null;

          revokeRecordingObjectUrl();

        }


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
      // DISCARD
      // -------------------------------------------------

      if (
        discard
      ) {

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

        });


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
      // NORMAL STOP
      // -------------------------------------------------

      if (
        recorder.state ===
        "recording"
      ) {

        console.log(
          "[VideoFeed] Stopping MediaRecorder",
          {

            id,

            sourceId,

          }
        );


        recorder.stop();


        return {

          ok:
            true,

          recording:
            false,

          stopping:
            true,

        };

      }


      return {

        ok:
          true,

        recording:
          false,

      };

    };


  // =====================================================
  // RESET VIDEO ELEMENT
  // =====================================================

  const resetVideoElement =
    ({
      discardRecording =
        false,
    } = {}) => {

      const video =
        videoRef.current;


      if (
        !video
      ) {

        return;

      }


      if (
        discardRecording
      ) {

        stopRecordingInternal({
          discard:
            true,
        });

      }


      destroyHls();


      stopLocalStream();


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

    };


  // =====================================================
  // START RECORDING INTERNAL
  // =====================================================

  const startRecordingInternal =
    () => {

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


      const stream =
        streamRef.current;


      if (
        !stream
      ) {

        console.warn(
          "[VideoFeed] Cannot record without local media"
        );


        return {

          ok:
            false,

          error:
            "NO_LOCAL_MEDIA_STREAM",

        };

      }


      if (
        !streamReady
      ) {

        console.warn(
          "[VideoFeed] Cannot record before stream ready"
        );


        return {

          ok:
            false,

          error:
            "MEDIA_STREAM_NOT_READY",

        };

      }


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


      const mimeType =
        getRecordingMimeType();


      if (
        !mimeType
      ) {

        return {

          ok:
            false,

          error:
            "NO_SUPPORTED_RECORDING_FORMAT",

        };

      }


      // =================================================
      // CURRENT RUNTIME IDENTITY
      // =================================================
      //
      // Read from the LIVE refs, not ActionContext.
      //
      // =================================================

      const currentProject =
        runtimeProjectRef.current ||
        runtimeProject ||
        {};


      const currentInterview =
        runtimeInterviewRef.current ||
        runtimeInterview ||
        {};


      const projectId =
        currentProject?.id ||
        currentProject?._id ||
        currentProject?.projectId ||
        currentInterview?.projectId ||
        null;


      const interviewId =
        currentInterview?.id ||
        currentInterview?._id ||
        currentInterview?.interviewId ||
        currentInterview?.interview_id ||
        null;


      // =================================================
      // STORE SESSION IDENTITY
      // =================================================

      recordingProjectIdRef.current =
        projectId;


      recordingInterviewIdRef.current =
        interviewId;


      console.log(
        "[VideoFeed] RECORDING IDENTITY CAPTURE",
        {

          id,

          sourceId,

          projectId,

          interviewId,

          currentProject,

          currentInterview,

        }
      );


      // =================================================
      // PREPARE RECORDER
      // =================================================

      recordingChunksRef.current =
        [];


      revokeRecordingObjectUrl();


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
        err
      ) {

        console.error(
          "[VideoFeed] MediaRecorder creation failed",
          err
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


      console.log(
        "[VideoFeed] Creating MediaRecorder",
        {

          id,

          sourceId,

          mimeType,

          streamReady,

          projectId,

          interviewId,

          tracks:
            stream
              .getTracks()
              .map(
                track => ({

                  kind:
                    track.kind,

                  enabled:
                    track.enabled,

                  readyState:
                    track.readyState,

                })
              ),

        }
      );


      // =================================================
      // DATA
      // =================================================

      recorder.ondataavailable =
        event => {

          if (
            event?.data?.size > 0
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
            "[VideoFeed] Recording error",
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

          console.log(
            "[VideoFeed] Recording started",
            {

              id,

              sourceId,

              mimeType,

              projectId,

              interviewId,

            }
          );


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

        };


      // =================================================
      // STOP
      // =================================================

      recorder.onstop =
        async () => {

          try {

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


            // -------------------------------------------
            // CREATE BLOB
            // -------------------------------------------

            const blob =
              new Blob(
                recordingChunksRef.current,
                {

                  type:
                    recorder.mimeType ||
                    mimeType,

                }
              );


            // -------------------------------------------
            // SESSION IDENTITY
            // -------------------------------------------

            const capturedProjectId =
              recordingProjectIdRef.current;


            const capturedInterviewId =
              recordingInterviewIdRef.current;


            // -------------------------------------------
            // LIVE RUNTIME FALLBACK
            // -------------------------------------------

            const liveProject =
              runtimeProjectRef.current ||
              {};


            const liveInterview =
              runtimeInterviewRef.current ||
              {};


            const liveProjectId =
              liveProject?.id ||
              liveProject?._id ||
              liveProject?.projectId ||
              liveInterview?.projectId ||
              null;


            const liveInterviewId =
              liveInterview?.id ||
              liveInterview?._id ||
              liveInterview?.interviewId ||
              liveInterview?.interview_id ||
              null;


            // -------------------------------------------
            // FINAL IDENTITY
            // -------------------------------------------

            const finalProjectId =
              capturedProjectId ||
              liveProjectId ||
              null;


            const finalInterviewId =
              capturedInterviewId ||
              liveInterviewId ||
              null;


            console.log(
              "[VideoFeed] FINAL RECORDING IDENTITY",
              {

                id,

                sourceId,

                capturedProjectId,

                capturedInterviewId,

                liveProjectId,

                liveInterviewId,

                finalProjectId,

                finalInterviewId,

              }
            );


            // -------------------------------------------
            // CLEAR RECORDER REFS
            // -------------------------------------------

            recordingChunksRef.current =
              [];


            recordingStartedAtRef.current =
              null;


            mediaRecorderRef.current =
              null;


            // -------------------------------------------
            // LOCAL OBJECT URL
            // -------------------------------------------

            const objectUrl =
              URL.createObjectURL(
                blob
              );


            recordingObjectUrlRef.current =
              objectUrl;


            // -------------------------------------------
            // RECORDING COMPLETE
            // -------------------------------------------

            console.log(
              "[VideoFeed] Recording complete",
              {

                id,

                sourceId,

                sizeBytes:
                  blob.size,

                durationSeconds,

                mimeType:
                  blob.type ||
                  mimeType,

              }
            );


            // -------------------------------------------
            // STORE RECORDING STATE
            // -------------------------------------------

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

            });


            // -------------------------------------------
            // AUTOMATIC UPLOAD DISABLED
            // -------------------------------------------

            if (
              !autoUploadRecording
            ) {

              return;

            }


            // -------------------------------------------
            // AUTOMATIC UPLOAD
            // -------------------------------------------

            console.log(
              "[VideoFeed] Starting automatic recording upload",
              {

                id,

                sourceId,

              }
            );


            if (
              typeof actionCtx?.runAction !==
              "function"
            ) {

              throw new Error(
                "RUNTIME_RUN_ACTION_UNAVAILABLE"
              );

            }


            // -------------------------------------------
            // IMPORTANT
            //
            // Do not reject here because identity might
            // still be recoverable inside uploadRecording.
            // -------------------------------------------

            const uploadResult =
              await actionCtx.runAction(
                "video.uploadRecording",
                {

                  id,

                  targetId:
                    id,

                  sourceId,


                  // -------------------------------------
                  // Explicit recording identity
                  // -------------------------------------

                  projectId:
                    finalProjectId,

                  interviewId:
                    finalInterviewId,


                  // -------------------------------------
                  // Authoritative recording
                  // -------------------------------------

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
              "[VideoFeed] Automatic recording upload result",
              {

                id,

                sourceId,

                uploadResult,

              }
            );


            if (
              uploadResult?.ok ===
              false
            ) {

              console.error(
                "[VideoFeed] Recording upload failed",
                uploadResult
              );

            }

          }
          catch (
            error
          ) {

            console.error(
              "[VideoFeed] Recording completion/upload failed",
              {

                id,

                sourceId,

                error,

              }
            );


            updateFeedBinding({

              recording:
                false,

              recordingStatus:
                "failed",

            });

          }
          finally {

            // ------------------------------------------------
            // Clear identity only after upload attempt.
            // ------------------------------------------------

            recordingProjectIdRef.current =
              null;


            recordingInterviewIdRef.current =
              null;

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
        err
      ) {

        console.error(
          "[VideoFeed] MediaRecorder.start() failed",
          err
        );


        mediaRecorderRef.current =
          null;


        recordingStartedAtRef.current =
          null;


        recordingProjectIdRef.current =
          null;


        recordingInterviewIdRef.current =
          null;


        return {

          ok:
            false,

          error:
            "RECORDING_START_FAILED",

        };

      }


      console.log(
        "[VideoFeed] MediaRecorder.start() called",
        {

          id,

          sourceId,

          state:
            recorder.state,

          projectId:
            recordingProjectIdRef.current,

          interviewId:
            recordingInterviewIdRef.current,

        }
      );


      return {

        ok:
          true,

        recording:
          true,

      };

    };


  // =====================================================
  // LOCAL CAMERA + MICROPHONE
  // =====================================================

  const attachLocalCamera =
    async () => {

      const video =
        videoRef.current;


      if (
        !video ||
        streamRef.current
      ) {

        return;

      }


      resetVideoElement({

        discardRecording:
          false,

      });


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


        // Initial camera state.

        stream
          .getVideoTracks()
          .forEach(
            track => {

              track.enabled =
                videoEnabled;

            }
          );


        // Initial microphone state.

        stream
          .getAudioTracks()
          .forEach(
            track => {

              track.enabled =
                micEnabled;

            }
          );


        // Attach stream.

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
              stream.getVideoTracks()
                .length,

            audioTracks:
              stream.getAudioTracks()
                .length,

          }
        );

      }
      catch (
        err
      ) {

        console.error(
          "[VideoFeed] local media error",
          err
        );


        streamRef.current =
          null;


        setStreamReady(
          false
        );


        setError(
          "Camera or microphone unavailable"
        );


        setIsLoading(
          false
        );

      }

    };


  // =====================================================
  // REMOTE STREAM
  // =====================================================

  const attachRemote =
    async (
      url
    ) => {

      const video =
        videoRef.current;


      if (
        !video ||
        !url
      ) {

        return;

      }


      resetVideoElement({

        discardRecording:
          true,

      });


      setIsLoading(
        true
      );


      setError(
        null
      );


      // =================================================
      // HLS
      // =================================================

      if (
        isHlsUrl(
          url
        )
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
          err
        ) {

          console.error(
            "[VideoFeed] HLS load error",
            err
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

    };


  // =====================================================
  // MEDIA LIFECYCLE
  // =====================================================

  useEffect(
    () => {

      if (
        !enabled
      ) {

        resetVideoElement({

          discardRecording:
            true,

        });


        return;

      }


      if (
        mode ===
        "local"
      ) {

        attachLocalCamera();

      }


      if (
        mode ===
        "remote" &&
        src
      ) {

        attachRemote(
          src
        );

      }


      return () => {

        stopRecordingInternal({

          discard:
            true,

        });


        destroyHls();


        stopLocalStream();

      };

    },
    [
      mode,
      src,
      enabled,
    ]
  );


  // =====================================================
  // VIDEO TRACK BINDING
  // =====================================================

  useEffect(
    () => {

      const stream =
        streamRef.current;


      if (
        !stream
      ) {

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


      console.log(
        "[VideoFeed] Video track binding applied",
        {

          id,

          sourceId,

          videoEnabled,

        }
      );

    },
    [
      videoEnabled,
      id,
      sourceId,
    ]
  );


  // =====================================================
  // AUDIO TRACK BINDING
  // =====================================================

  useEffect(
    () => {

      const stream =
        streamRef.current;


      if (
        !stream
      ) {

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


      console.log(
        "[VideoFeed] Audio track binding applied",
        {

          id,

          sourceId,

          micEnabled,

        }
      );

    },
    [
      micEnabled,
      id,
      sourceId,
    ]
  );


  // =====================================================
  // RECORDING BINDING
  // =====================================================

  useEffect(
    () => {

      if (
        mode !==
        "local"
      ) {

        return;

      }


      // -------------------------------------------------
      // START
      // -------------------------------------------------

      if (
        recording &&
        streamReady &&
        !mediaRecorderRef.current
      ) {

        console.log(
          "[VideoFeed] Recording binding detected - starting",
          {

            id,

            sourceId,

          }
        );


        startRecordingInternal();

        return;

      }


      // -------------------------------------------------
      // STOP
      // -------------------------------------------------

      if (
        !recording &&
        mediaRecorderRef.current
      ) {

        console.log(
          "[VideoFeed] Recording binding detected - stopping",
          {

            id,

            sourceId,

          }
        );


        stopRecordingInternal();

      }

    },
    [
      recording,
      streamReady,
      mode,
      id,
      sourceId,
    ]
  );


  // =====================================================
  // FINAL CLEANUP
  // =====================================================

  useEffect(
    () => {

      return () => {

        stopRecordingInternal({
          discard:
            true,
        });


        destroyHls();


        stopLocalStream();


        revokeRecordingObjectUrl();

      };

    },
    []
  );


  // =====================================================
  // RENDER
  // =====================================================

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


      {/* =================================================
          RECORDING
      ================================================= */}

      {recordingStatus ===
        "recording" && (

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

          Recording

        </div>

      )}


      {/* =================================================
          READY
      ================================================= */}

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


      {/* =================================================
          UPLOADING
      ================================================= */}

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


      {/* =================================================
          UPLOADED
      ================================================= */}

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


      {/* =================================================
          FAILED
      ================================================= */}

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


      {/* =================================================
          LOADING
      ================================================= */}

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


      {/* =================================================
          ERROR
      ================================================= */}

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

          {
            error
          }

        </div>

      )}

    </div>

  );

}