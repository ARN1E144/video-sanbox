// src/components/elements/FilePreview.js

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";


// =====================================================
// HELPERS
// =====================================================

function normaliseSource(
  source
) {

  if (
    typeof source === "string"
  ) {

    return {

      url:
        source,

      type:
        null,

      name:
        "",

      local:
        false,

    };

  }


  if (
    source &&
    typeof source === "object"
  ) {

    return {

      url:
        source.url ||
        source.uri ||
        source.src ||
        null,

      type:
        source.type ||
        source.mimeType ||
        null,

      name:
        source.name ||
        source.fileName ||
        "",

      local:
        !!source.local,

    };

  }


  return {

    url:
      null,

    type:
      null,

    name:
      "",

    local:
      false,

  };

}


// =====================================================
// FILE TYPE DETECTION
// =====================================================

function detectFileType({
  url,
  type,
  name,
}) {

  if (
    typeof type === "string"
  ) {

    const normalisedType =
      type.toLowerCase();


    if (
      normalisedType.startsWith(
        "image/"
      )
    ) {

      return "image";

    }


    if (
      normalisedType ===
      "application/pdf"
    ) {

      return "pdf";

    }


    if (
      normalisedType.startsWith(
        "video/"
      )
    ) {

      return "video";

    }

  }


  const value =
    (
      name ||
      url ||
      ""
    )
      .split("?")[0]
      .split("#")[0]
      .toLowerCase();


  if (
    value.endsWith(".pdf")
  ) {

    return "pdf";

  }


  if (
    /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif|heic|heif)$/.test(
      value
    )
  ) {

    return "image";

  }


  if (
    /\.(mp4|webm|ogg|mov|m4v)$/.test(
      value
    )
  ) {

    return "video";

  }


  return "unknown";

}


// =====================================================
// CONTAINER STYLE
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

    boxSizing:
      "border-box",

    background:
      backgroundColor,

    borderRadius,

    ...style,

  };

}


// =====================================================
// FALLBACK VIEW
// =====================================================

function FileErrorView({

  title,

  file,

  message,

  compact =
    false,

  onSelectFile,

  onRemove,

}) {

  return (

    <div
      style={{

        width:
          "100%",

        height:
          "100%",

        minHeight:
          compact
            ? 100
            : 180,

        boxSizing:
          "border-box",

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
          18,

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

        {title}

      </div>


      <div
        style={{

          maxWidth:
            420,

          fontSize:
            11,

          lineHeight:
            1.5,

          color:
            "#888",

        }}
      >

        {message}

      </div>


      <div
        style={{

          display:
            "flex",

          gap:
            8,

          flexWrap:
            "wrap",

          justifyContent:
            "center",

          marginTop:
            4,

        }}
      >

        {onSelectFile && (

          <button

            type="button"

            onClick={
              onSelectFile
            }

            style={{

              padding:
                "7px 11px",

              border:
                "none",

              borderRadius:
                6,

              background:
                "#2563eb",

              color:
                "#fff",

              fontSize:
                11,

              fontWeight:
                600,

              cursor:
                "pointer",

            }}

          >

            Choose image

          </button>

        )}


        {onRemove && (

          <button

            type="button"

            onClick={
              onRemove
            }

            style={{

              padding:
                "7px 11px",

              border:
                "1px solid #444",

              borderRadius:
                6,

              background:
                "#181818",

              color:
                "#aaa",

              fontSize:
                11,

              fontWeight:
                600,

              cursor:
                "pointer",

            }}

          >

            Remove

          </button>

        )}


        {file?.url && (

          <a

            href={
              file.url
            }

            target="_blank"

            rel="noreferrer"

            style={{

              padding:
                "7px 11px",

              borderRadius:
                6,

              background:
                "transparent",

              color:
                "#60a5fa",

              textDecoration:
                "none",

              fontSize:
                11,

              fontWeight:
                600,

            }}

          >

            Open file

          </a>

        )}

      </div>

    </div>

  );

}


// =====================================================
// IMAGE PREVIEW
// =====================================================

function ImagePreview({

  file,

  title,

  objectFit,

  backgroundColor,

  borderRadius,

  style,

}) {

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );


  const [
    failed,
    setFailed,
  ] =
    useState(
      false
    );


  useEffect(() => {

    setLoading(
      true
    );

    setFailed(
      false
    );

  }, [
    file?.url,
  ]);


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

      {loading &&
        !failed && (

        <div
          style={{

            position:
              "absolute",

            inset:
              0,

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            color:
              "#777",

            fontSize:
              11,

            zIndex:
              1,

          }}
        >

          Loading image...

        </div>

      )}


      {failed ? (

        <FileErrorView

          title=
            "Image preview unavailable"

          file={
            file
          }

          message=
            "The image could not be loaded."

        />

      ) : (

        <img

          src={
            file.url
          }

          alt={
            file.name ||
            title ||
            "Image"
          }

          onLoad={() => {

            setLoading(
              false
            );

          }}

          onError={() => {

            console.error(
              "[FilePreview] Image failed",
              {
                url:
                  file.url,
              }
            );


            setLoading(
              false
            );

            setFailed(
              true
            );

          }}

          style={{

            width:
              "100%",

            height:
              "100%",

            objectFit,

            display:
              "block",

            opacity:
              loading
                ? 0
                : 1,

          }}

        />

      )}

    </div>

  );

}


// =====================================================
// VIDEO PREVIEW
// =====================================================

function VideoPreview({

  file,

  objectFit,

  backgroundColor,

  borderRadius,

  controls,

  style,

}) {

  const [
    failed,
    setFailed,
  ] =
    useState(
      false
    );


  useEffect(() => {

    setFailed(
      false
    );

  }, [
    file?.url,
  ]);


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

      {failed ? (

        <FileErrorView

          title=
            "Video preview unavailable"

          file={
            file
          }

          message=
            "The video could not be loaded or played."

        />

      ) : (

        <video

          key={
            file.url
          }

          src={
            file.url
          }

          controls={
            controls
          }

          playsInline

          onError={() => {

            console.error(
              "[FilePreview] Video failed",
              {
                url:
                  file.url,
              }
            );


            setFailed(
              true
            );

          }}

          style={{

            width:
              "100%",

            height:
              "100%",

            objectFit,

            display:
              "block",

          }}

        />

      )}

    </div>

  );

}


// =====================================================
// PDF PREVIEW
// =====================================================

function PdfPreview({

  file,

  title,

  backgroundColor,

  borderRadius,

  style,

}) {

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );


  const [
    timedOut,
    setTimedOut,
  ] =
    useState(
      false
    );


  useEffect(() => {

    setLoading(
      true
    );

    setTimedOut(
      false
    );

  }, [
    file?.url,
  ]);


  useEffect(() => {

    if (
      !file?.url
    ) {

      return undefined;

    }


    const timeout =
      window.setTimeout(
        () => {

          setTimedOut(
            true
          );

          setLoading(
            false
          );

          console.warn(
            "[FilePreview] PDF embed timed out or may be blocked",
            {
              url:
                file.url,
            }
          );

        },
        5000
      );


    return () => {

      window.clearTimeout(
        timeout
      );

    };

  }, [
    file?.url,
  ]);


  if (
    timedOut
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

        <FileErrorView

          title=
            "PDF preview unavailable"

          file={
            file
          }

          message=
            "This PDF cannot be displayed inside the application. You can open it in a new browser tab."

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

      {loading && (

        <div
          style={{

            position:
              "absolute",

            inset:
              0,

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            color:
              "#777",

            fontSize:
              11,

            background:
              backgroundColor,

            zIndex:
              3,

          }}
        >

          Loading PDF...

        </div>

      )}


      <iframe

        key={
          file.url
        }

        src={
          file.url
        }

        title={
          file.name ||
          title ||
          "PDF preview"
        }

        onLoad={() => {

          setLoading(
            false
          );

        }}

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


// =====================================================
// UNKNOWN PREVIEW
// =====================================================

function UnknownPreview({

  file,

  title,

  backgroundColor,

  borderRadius,

  style,

  onSelectFile,

  onRemove,

}) {

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

      <FileErrorView

        title={
          file?.name ||
          title ||
          "File"
        }

        file={
          file
        }

        message=
          "This file type does not have an inline preview yet."

        onSelectFile={
          onSelectFile
        }

        onRemove={
          onRemove
        }

      />

    </div>

  );

}


// =====================================================
// COMPONENT
// =====================================================

export default {

  name:
    "FilePreview",

  version:
    "1.0",

  category:
    "media",

  icon:
    "📄",

  builder: {
    roles: [
      "owner",
      "admin",
    ],
    visible:
      true,
  },

  runtime: {
    roles: [
      "owner",
      "admin",
      "builder",
      "host",
      "participant",
      "viewer",
    ],
  },

  editableProps: {

  source: {

    type:
      "string|object",

    default:
      null,

  },

  title: {

    type:
      "string",

    default:
      "File preview",

  },

  objectFit: {

    type:
      "string",

    default:
      "contain",

  },

  backgroundColor: {

    type:
      "string",

    default:
      "#111",

  },

  borderRadius: {

    type:
      "number|string",

    default:
      8,

  },

  controls: {

    type:
      "boolean",

    default:
      true,

  },

  allowUpload: {

    type:
      "boolean",

    default:
      true,

  },

  accept: {

    type:
      "string",

    default:
      "image/*",

  },

  capture: {

    type:
      "string",

    default:
      "",

  },

},

  bindings: {},

  actions: {
    inputs: [],
    outputs: [],
  },

  events: {
    inputs: [],
    outputs: [],
  },

  targets: {
    accepts: [
      "File",
      "MediaSource",
      "Document",
    ],
    rejects: [],
  },

  validation: {
    required: [],
  },

};