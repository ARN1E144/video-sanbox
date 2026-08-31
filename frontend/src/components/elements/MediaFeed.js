// src/components/elements/MediaFeed.js

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";


// =====================================================
// SAFE TYPE HELPERS
// =====================================================

function isObject(
  value
) {

  return (
    value !== null &&
    typeof value === "object"
  );

}


function safeString(
  value,
  fallback = ""
) {

  if (
    value === null ||
    value === undefined
  ) {

    return fallback;

  }


  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {

    return String(
      value
    );

  }


  if (
    isObject(
      value
    )
  ) {

    return (
      safeString(
        value.value,
        ""
      ) ||
      safeString(
        value.url,
        ""
      ) ||
      safeString(
        value.src,
        ""
      ) ||
      safeString(
        value.source,
        ""
      ) ||
      safeString(
        value.type,
        ""
      ) ||
      fallback
    );

  }


  return fallback;

}


// =====================================================
// SOURCE NORMALISATION
// =====================================================

function normaliseSource(
  source
) {

  // ---------------------------------------------------
  // String
  // ---------------------------------------------------

  if (
    typeof source === "string"
  ) {

    return {

      url:
        source.trim(),

      type:
        null,

      name:
        "",

    };

  }


  // ---------------------------------------------------
  // Object
  // ---------------------------------------------------

  if (
    isObject(
      source
    )
  ) {

    const url =
      safeString(
        source.url ||
        source.uri ||
        source.src ||
        source.source
      );


    const type =
      safeString(
        source.type ||
        source.mimeType
      );


    const name =
      safeString(
        source.name ||
        source.title
      );


    return {

      url,

      type:
        type ||
        null,

      name,

    };

  }


  return {

    url:
      "",

    type:
      null,

    name:
      "",

  };

}


// =====================================================
// YOUTUBE EMBED
// =====================================================

function getYouTubeEmbedUrl(
  value
) {

  const source =
    safeString(
      value
    );


  if (
    !source
  ) {

    return null;

  }


  try {

    const url =
      new URL(
        source
      );


    // -------------------------------------------------
    // youtube.com/watch?v=
    // -------------------------------------------------

    if (
      url.hostname.includes(
        "youtube.com"
      )
    ) {

      const videoId =
        url.searchParams.get(
          "v"
        );


      if (
        videoId
      ) {

        return (
          `https://www.youtube.com/embed/${encodeURIComponent(
            videoId
          )}`
        );

      }

    }


    // -------------------------------------------------
    // youtu.be/...
    // -------------------------------------------------

    if (
      url.hostname ===
      "youtu.be"
    ) {

      const videoId =
        url.pathname
          .replace(
            /^\/+/,
            ""
          )
          .split(
            "/"
          )[0];


      if (
        videoId
      ) {

        return (
          `https://www.youtube.com/embed/${encodeURIComponent(
            videoId
          )}`
        );

      }

    }

  }
  catch (
    error
  ) {

    console.warn(
      "[MediaFeed] Invalid URL",
      {
        value:
          source,

        error,
      }
    );

  }


  return null;

}


// =====================================================
// SOURCE TYPE DETECTION
// =====================================================

function detectSourceType(
  source
) {

  const normalised =
    normaliseSource(
      source
    );


  // ---------------------------------------------------
  // Explicit MIME type
  // ---------------------------------------------------

  if (
    normalised.type
  ) {

    const type =
      normalised.type.toLowerCase();


    if (
      type ===
        "application/vnd.apple.mpegurl" ||
      type ===
        "application/x-mpegurl"
    ) {

      return "hls";

    }


    if (
      type.startsWith(
        "video/"
      )
    ) {

      return "video";

    }

  }


  const url =
    normalised.url;


  if (
    !url
  ) {

    return "unknown";

  }


  // ---------------------------------------------------
  // YouTube
  // ---------------------------------------------------

  if (
    getYouTubeEmbedUrl(
      url
    )
  ) {

    return "youtube";

  }


  // ---------------------------------------------------
  // Extension
  // ---------------------------------------------------

  const cleanUrl =
    url
      .split("?")[0]
      .split("#")[0]
      .toLowerCase();


  if (
    cleanUrl.endsWith(
      ".m3u8"
    )
  ) {

    return "hls";

  }


  if (
    /\.(mp4|webm|ogg|mov|m4v)$/.test(
      cleanUrl
    )
  ) {

    return "video";

  }


  return "url";

}


// =====================================================
// CONTAINER
// =====================================================

function createContainerStyle({

  backgroundColor,

  borderRadius,

  style,

}) {

  return {

    width:
      "100%",

    height:
      "100%",

    position:
      "relative",

    overflow:
      "hidden",

    background:
      safeString(
        backgroundColor,
        "#000"
      ),

    borderRadius:
      Number(
        borderRadius
      ) || 0,

    ...(style &&
    typeof style === "object"
      ? style
      : {}),

  };

}


// =====================================================
// ERROR VIEW
// =====================================================

function MediaError({

  title,

  message,

  source,

}) {

  const safeTitle =
    safeString(
      title,
      "Media unavailable"
    );


  const safeMessage =
    safeString(
      message,
      "The media source could not be rendered."
    );


  const safeSource =
    safeString(
      source
    );


  return (

    <div
      style={{

        width:
          "100%",

        height:
          "100%",

        minHeight:
          160,

        display:
          "flex",

        flexDirection:
          "column",

        alignItems:
          "center",

        justifyContent:
          "center",

        gap:
          8,

        padding:
          16,

        boxSizing:
          "border-box",

        background:
          "#111",

        color:
          "#aaa",

        textAlign:
          "center",

      }}
    >

      <div
        style={{

          color:
            "#fff",

          fontSize:
            13,

          fontWeight:
            600,

        }}
      >

        {safeTitle}

      </div>


      <div
        style={{

          maxWidth:
            420,

          fontSize:
            11,

          lineHeight:
            1.5,

        }}
      >

        {safeMessage}

      </div>


      {safeSource && (

        <a

          href={
            safeSource
          }

          target="_blank"

          rel="noreferrer"

          style={{

            color:
              "#60a5fa",

            textDecoration:
              "none",

            fontSize:
              11,

          }}

        >

          Open source

        </a>

      )}

    </div>

  );

}


// =====================================================
// COMPONENT
// =====================================================

export default function MediaFeed({

  source =
    null,

  sourceType =
    "auto",

  title =
    "",

  autoPlay =
    false,

  muted =
    false,

  controls =
    true,

  loop =
    false,

  playsInline =
    true,

  objectFit =
    "cover",

  borderRadius =
    0,

  backgroundColor =
    "#000",

  style =
    {},

  iframeAllow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",

}) {

  // ===================================================
  // NORMALISE EVERYTHING AT THE BOUNDARY
  // ===================================================

  const normalisedSource =
    useMemo(
      () =>
        normaliseSource(
          source
        ),
      [
        source,
      ]
    );


  const sourceValue =
    normalisedSource.url;


  const safeTitle =
    safeString(
      title,
      "Media"
    );


  const safeIframeAllow =
    safeString(
      iframeAllow,
      ""
    );


  const safeObjectFit =
    safeString(
      objectFit,
      "cover"
    );


  // ===================================================
  // SOURCE TYPE
  // ===================================================

  const requestedSourceType =
    safeString(
      sourceType,
      "auto"
    )
      .toLowerCase();


  const resolvedType =
    requestedSourceType ===
      "auto"

      ? detectSourceType(
          normalisedSource
        )

      : requestedSourceType;


  // ===================================================
  // YOUTUBE
  // ===================================================

  const youtubeUrl =
    resolvedType ===
      "youtube"

      ? getYouTubeEmbedUrl(
          sourceValue
        )

      : null;


  // ===================================================
  // ERROR
  // ===================================================

  const [
    mediaError,
    setMediaError,
  ] =
    useState(
      false
    );


  // ===================================================
  // RESET ERROR
  // ===================================================

  useEffect(() => {

    setMediaError(
      false
    );

  }, [
    sourceValue,
    resolvedType,
  ]);


  // ===================================================
  // DEBUG
  // ===================================================

  console.log(
    "[MediaFeed]",
    {

      source,

      sourceValue,

      sourceType,

      requestedSourceType,

      resolvedType,

      sourceObject:
        normalisedSource,

    }
  );


  // ===================================================
  // EMPTY
  // ===================================================

  if (
    !sourceValue
  ) {

    return (

      <div
        style={{

          ...createContainerStyle({

            backgroundColor,

            borderRadius,

            style,

          }),

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          color:
            "#777",

          fontSize:
            12,

        }}
      >

        {
          safeTitle ||
          "No media source"
        }

      </div>

    );

  }


  // ===================================================
  // YOUTUBE
  // ===================================================

  if (
    resolvedType ===
      "youtube"
  ) {

    if (
      !youtubeUrl
    ) {

      return (

        <div
          style={
            createContainerStyle({
              backgroundColor,
              borderRadius,
              style,
            })
          }
        >

          <MediaError

            title=
              "Invalid YouTube source"

            message=
              "The supplied YouTube URL could not be converted into a valid embed."

            source={
              sourceValue
            }

          />

        </div>

      );

    }


    return (

      <div
        style={
          createContainerStyle({
            backgroundColor,
            borderRadius,
            style,
          })
        }
      >

        <iframe

          src={
            youtubeUrl
          }

          title={
            safeTitle
          }

          allow={
            safeIframeAllow
          }

          allowFullScreen

          style={{

            width:
              "100%",

            height:
              "100%",

            border:
              0,

            display:
              "block",

          }}

        />

      </div>

    );

  }


  // ===================================================
  // ERROR STATE
  // ===================================================

  if (
    mediaError
  ) {

    return (

      <div
        style={
          createContainerStyle({
            backgroundColor,
            borderRadius,
            style,
          })
        }
      >

        <MediaError

          title=
            "Media unavailable"

          message={
            resolvedType ===
              "hls"

              ? "The live stream could not be played by this browser."

              : "The media could not be loaded or played."
          }

          source={
            sourceValue
          }

        />

      </div>

    );

  }


  // ===================================================
  // HLS
  // ===================================================

  if (
    resolvedType ===
      "hls"
  ) {

    return (

      <div
        style={
          createContainerStyle({
            backgroundColor,
            borderRadius,
            style,
          })
        }
      >

        <video

          key={
            sourceValue
          }

          src={
            sourceValue
          }

          autoPlay={
            Boolean(
              autoPlay
            )
          }

          muted={
            Boolean(
              muted
            )
          }

          controls={
            Boolean(
              controls
            )
          }

          loop={
            Boolean(
              loop
            )
          }

          playsInline={
            Boolean(
              playsInline
            )
          }

          onError={() => {

            console.error(
              "[MediaFeed] HLS playback failed",
              {
                source:
                  sourceValue,
              }
            );


            setMediaError(
              true
            );

          }}

          style={{

            width:
              "100%",

            height:
              "100%",

            objectFit:
              safeObjectFit,

            display:
              "block",

          }}

        />

      </div>

    );

  }


  // ===================================================
  // DIRECT VIDEO
  // ===================================================

  if (
    resolvedType ===
      "video"
  ) {

    return (

      <div
        style={
          createContainerStyle({
            backgroundColor,
            borderRadius,
            style,
          })
        }
      >

        <video

          key={
            sourceValue
          }

          src={
            sourceValue
          }

          autoPlay={
            Boolean(
              autoPlay
            )
          }

          muted={
            Boolean(
              muted
            )
          }

          controls={
            Boolean(
              controls
            )
          }

          loop={
            Boolean(
              loop
            )
          }

          playsInline={
            Boolean(
              playsInline
            )
          }

          onError={() => {

            console.error(
              "[MediaFeed] Video playback failed",
              {
                source:
                  sourceValue,
              }
            );


            setMediaError(
              true
            );

          }}

          style={{

            width:
              "100%",

            height:
              "100%",

            objectFit:
              safeObjectFit,

            display:
              "block",

          }}

        />

      </div>

    );

  }


  // ===================================================
  // GENERIC URL
  // ===================================================

  if (
    resolvedType ===
      "url"
  ) {

    return (

      <div
        style={
          createContainerStyle({
            backgroundColor,
            borderRadius,
            style,
          })
        }
      >

        <iframe

          key={
            sourceValue
          }

          src={
            sourceValue
          }

          title={
            safeTitle
          }

          allow={
            safeIframeAllow
          }

          style={{

            width:
              "100%",

            height:
              "100%",

            border:
              0,

            display:
              "block",

          }}

        />

      </div>

    );

  }


  // ===================================================
  // UNKNOWN
  // ===================================================

  return (

    <div
      style={
        createContainerStyle({
          backgroundColor,
          borderRadius,
          style,
        })
      }
    >

      <MediaError

        title=
          "Unsupported media source"

        message=
          "The MediaFeed could not determine how to render this source."

        source={
          sourceValue
        }

      />

    </div>

  );

}