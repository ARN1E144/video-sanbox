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


export default function VideoFeed(props) {

  const {
    id,
    meta = {},
    style = {},

    // ===================================================
    // COMPONENT-ONLY PROPS
    //
    // These are intentionally consumed here so they
    // never get forwarded to a DOM element.
    // ===================================================

    enabled: _enabled,
    playing: _playing,
    muted: _muted,
    mirror: _mirror,
    objectFit: _objectFit,
    mode: _mode,
    src: _src,
    borderRadius: _borderRadius,

    ...restProps

  } = props;


  // =====================================================
  // CONTEXT
  // =====================================================

  const actionCtx =
    useActionContext?.();

  const {
    bindings = {},
  } = actionCtx || {};


  const binding =
    bindings?.[id] || {};


  // =====================================================
  // META DEFAULTS
  // =====================================================

  const defaults =
    meta?.editableProps || {};


  // =====================================================
  // RESOLVED COMPONENT PROPERTIES
  // =====================================================

  const mode =
    binding.mode ??
    defaults.mode?.default ??
    "local";


  const src =
    binding.src ??
    defaults.src?.default ??
    null;


  const enabled =
    binding.enabled ??
    defaults.enabled?.default ??
    true;


  const playing =
    binding.playing ??
    defaults.playing?.default ??
    true;


  const muted =
    binding.muted ??
    defaults.muted?.default ??
    true;


  const mirror =
    binding.mirror ??
    defaults.mirror?.default ??
    true;


  const objectFit =
    binding.objectFit ??
    defaults.objectFit?.default ??
    "cover";


  const borderRadius =
    binding.borderRadius ??
    defaults.borderRadius?.default ??
    12;


  // =====================================================
  // STATE
  // =====================================================

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState(null);


  // =====================================================
  // REFS
  // =====================================================

  const videoRef =
    useRef(null);


  const streamRef =
    useRef(null);


  const hlsRef =
    useRef(null);


  // =====================================================
  // ACTION BINDING
  // =====================================================

  const actionHandlers =
    bindActions(
      meta,
      actionCtx,
      id
    );


  // =====================================================
  // HELPERS
  // =====================================================

  const isHlsUrl = (url) =>
    typeof url === "string" &&
    /\.m3u8(\?.*)?$/i.test(
      url.trim()
    );


  const destroyHls = () => {

    if (!hlsRef.current) {
      return;
    }

    try {
      hlsRef.current.destroy();
    } catch {
      // Ignore cleanup errors.
    }

    hlsRef.current = null;
  };


  const stopLocalStream = () => {

    if (!streamRef.current) {
      return;
    }

    streamRef.current
      .getTracks()
      .forEach(
        (track) => track.stop()
      );

    streamRef.current = null;
  };


  const resetVideoElement = () => {

    const video =
      videoRef.current;


    if (!video) {
      return;
    }


    destroyHls();
    stopLocalStream();


    try {
      video.pause();
    } catch {
      // Ignore.
    }


    video.srcObject = null;

    video.removeAttribute(
      "src"
    );

    video.load();

  };


  // =====================================================
  // LOCAL CAMERA
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


      resetVideoElement();

      setIsLoading(true);

      setError(null);


      try {

        const stream =
          await navigator
            .mediaDevices
            .getUserMedia({
              video: true,
              audio: false,
            });


        streamRef.current =
          stream;


        video.srcObject =
          stream;


        video.muted =
          true;


        await video
          .play()
          ?.catch(() => {});


        setIsLoading(false);

        setError(null);

      } catch (err) {

        console.error(
          "[VideoFeed] local camera error:",
          err
        );


        setError(
          "Camera unavailable"
        );


        setIsLoading(false);

      }

    };


  // =====================================================
  // REMOTE STREAM
  // =====================================================

  const attachRemote =
    async (url) => {

      const video =
        videoRef.current;


      if (
        !video ||
        !url
      ) {
        return;
      }


      resetVideoElement();

      setIsLoading(true);

      setError(null);


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

            setIsLoading(false);

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

              setIsLoading(false);

              setError(null);


              if (playing) {

                video
                  .play()
                  ?.catch(() => {});

              }

            }
          );


          hls.on(
            Hls.Events.ERROR,
            (_event, data) => {

              if (
                data?.fatal
              ) {

                setError(
                  "Stream error"
                );

                setIsLoading(false);

              }

            }
          );

        } catch (err) {

          console.error(
            "[VideoFeed] HLS load error",
            err
          );


          setError(
            "Stream load failed"
          );


          setIsLoading(false);

        }

        return;
      }


      // =================================================
      // NORMAL VIDEO URL
      // =================================================

      video.srcObject =
        null;


      video.src =
        url;


      video.load();


      if (playing) {

        video
          .play()
          ?.catch(() => {});

      }


      setIsLoading(false);

      setError(null);

    };


  // =====================================================
  // ACTION MAPPING
  // =====================================================

  const VIDEO_ACTION_KEY_MAP = {

    startStream:
      "video.startStream",

    stopStream:
      "video.stopStream",

    togglePlay:
      "video.togglePlay",

  };


  const handleAction =
    async (
      actionValue
    ) => {

      if (!actionValue) {
        return;
      }


      const actionName =
        VIDEO_ACTION_KEY_MAP[
          actionValue
        ] ||
        actionValue;


      if (
        !actionCtx?.runRuntimeAction
      ) {

        console.warn(
          "[VideoFeed] runtime action unavailable",
          actionName
        );

        return;

      }


      return actionCtx
        .runRuntimeAction(
          actionName,
          {
            id,

            targetId:
              id,

            videoRef,

            streamRef,
          }
        );

    };


  // =====================================================
  // EFFECTS
  // =====================================================

  useEffect(
    () => {

      if (!enabled) {

        resetVideoElement();

        return;

      }


      if (
        mode === "local"
      ) {

        attachLocalCamera();

      }


      if (
        mode === "remote" &&
        src
      ) {

        attachRemote(
          src
        );

      }


      return () => {

        stopLocalStream();

        destroyHls();

      };

    },
    [
      mode,
      src,
      enabled,
    ]
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

        flex: 1,

        minHeight: 0,

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
        ref={videoRef}

        playsInline

        muted={muted}

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


      {isLoading && (

        <div
          className="absolute inset-0 flex items-center justify-center text-white text-xs bg-black/40"
        >
          Loading…
        </div>

      )}


      {error && (

        <div
          className="absolute inset-0 flex items-center justify-center text-red-400 text-xs bg-black/70"
        >
          {error}
        </div>

      )}

    </div>

  );

}