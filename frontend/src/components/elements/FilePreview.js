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

function normaliseSource(source) {

  if (
    typeof source === "string"
  ) {

    return {
      url: source,
      type: null,
      name: "",
      local: false,
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
    url: null,
    type: null,
    name: "",
    local: false,
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
    value.endsWith(
      ".pdf"
    )
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
// MEDIA TOOLBAR
// =====================================================
//
// Available for:
//
// - remote image
// - local image
// - PDF
// - video
// - unknown files
//
// Choose image:
//
//   local image becomes active
//
// Remove:
//
//   local image is removed
//   runtime/remote source becomes active again
//
// =====================================================

function MediaToolbar({

  allowUpload,

  inputRef,

  accept,

  capture,

  onSelectFile,

  onRemove,

  hasLocalFile,

}) {

  if (
    !allowUpload
  ) {

    return null;

  }


  return (

    <>

      {/* =============================================
          HIDDEN FILE INPUT
          ============================================= */}

      <input

        ref={
          inputRef
        }

        type="file"

        accept={
          accept
        }

        capture={
          capture
        }

        onChange={
          onSelectFile
        }

        style={{
          display:
            "none",
        }}

      />


      {/* =============================================
          CONTROLS
          ============================================= */}

      <div
        style={{

          position:
            "absolute",

          right:
            10,

          bottom:
            10,

          zIndex:
            50,

          display:
            "flex",

          gap:
            6,

        }}
      >

        <button

          type="button"

          onClick={() => {

            inputRef.current?.click();

          }}

          style={{

            padding:
              "7px 10px",

            border:
              "1px solid rgba(255,255,255,.18)",

            borderRadius:
              6,

            background:
              "rgba(0,0,0,.76)",

            color:
              "#fff",

            fontSize:
              10,

            fontWeight:
              600,

            cursor:
              "pointer",

          }}

        >

          Choose image

        </button>


        {hasLocalFile && (

          <button

            type="button"

            onClick={
              onRemove
            }

            style={{

              padding:
                "7px 10px",

              border:
                "1px solid rgba(255,255,255,.18)",

              borderRadius:
                6,

              background:
                "rgba(0,0,0,.76)",

              color:
                "#fff",

              fontSize:
                10,

              fontWeight:
                600,

              cursor:
                "pointer",

            }}

          >

            Remove

          </button>

        )}

      </div>

    </>

  );

}


// =====================================================
// FILE ERROR / FALLBACK
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

    setLoading(true);

    setFailed(false);

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
            "This PDF cannot be embedded by the remote server. You can open it in a new browser tab."

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

      />

    </div>

  );

}


// =====================================================
// COMPONENT
// =====================================================

export default function FilePreview({

  source =
    null,

  title =
    "File preview",

  objectFit =
    "contain",

  backgroundColor =
    "#111",

  borderRadius =
    8,

  controls =
    true,

  style =
    {},

  allowUpload =
    true,

  accept =
    "image/*",

  capture =
    undefined,

  onFileSelected,

}) {

  // ===================================================
  // LOCAL FILE
  // ===================================================

  const [
    localFile,
    setLocalFile,
  ] =
    useState(
      null
    );


  // ===================================================
  // UPLOAD ERROR
  // ===================================================

  const [
    uploadError,
    setUploadError,
  ] =
    useState(
      null
    );


  // ===================================================
  // FILE INPUT
  // ===================================================

  const inputRef =
    useRef(
      null
    );


  // ===================================================
  // OBJECT URL
  // ===================================================

  const localObjectUrl =
    useMemo(
      () => {

        if (
          !localFile
        ) {

          return null;

        }


        return URL.createObjectURL(
          localFile
        );

      },
      [
        localFile,
      ]
    );


  // ===================================================
  // CLEAN OBJECT URL
  // ===================================================

  useEffect(() => {

    return () => {

      if (
        localObjectUrl
      ) {

        URL.revokeObjectURL(
          localObjectUrl
        );

      }

    };

  }, [
    localObjectUrl,
  ]);


  // ===================================================
  // REMOTE SOURCE
  // ===================================================

  const remoteSource =
    useMemo(
      () =>
        normaliseSource(
          source
        ),
      [
        source,
      ]
    );


  // ===================================================
  // TRACK EXTERNAL SOURCE
  // ===================================================

  const previousRemoteUrlRef =
    useRef(
      remoteSource?.url ||
      null
    );


  // ===================================================
  // SOURCE CHANGED
  // ===================================================
  //
  // If the runtime/remote source changes, that source
  // becomes authoritative and replaces the local file.
  //
  // ===================================================

  useEffect(() => {

    const currentUrl =
      remoteSource?.url ||
      null;


    const previousUrl =
      previousRemoteUrlRef.current;


    if (
      currentUrl !==
        previousUrl
    ) {

      console.log(
        "[FilePreview] External source changed",
        {

          previous:
            previousUrl,

          current:
            currentUrl,

        }
      );


      setLocalFile(
        null
      );


      setUploadError(
        null
      );

    }


    previousRemoteUrlRef.current =
      currentUrl;

  }, [
    remoteSource?.url,
  ]);


  // ===================================================
  // ACTIVE SOURCE
  // ===================================================

  const activeSource =
    localFile

      ? {

          url:
            localObjectUrl,

          type:
            localFile.type,

          name:
            localFile.name,

          local:
            true,

        }

      : remoteSource;


  // ===================================================
  // ACTIVE TYPE
  // ===================================================

  const fileType =
    detectFileType(
      activeSource
    );


  // ===================================================
  // FILE PICKER
  // ===================================================

  const openFilePicker =
    () => {

      if (
        !allowUpload
      ) {

        return;

      }


      inputRef.current?.click();

    };


  // ===================================================
  // REMOVE LOCAL FILE
  // ===================================================

  const removeLocalFile =
    () => {

      console.log(
        "[FilePreview] Removing local file"
      );


      setLocalFile(
        null
      );


      setUploadError(
        null
      );


      onFileSelected?.(
        null
      );

    };


  // ===================================================
  // HANDLE FILE
  // ===================================================

  const handleFileSelected =
    event => {

      const file =
        event.target?.files?.[0] ||
        null;


      // ------------------------------------------------
      // Reset picker value so the same file can be
      // selected again.
      // ------------------------------------------------

      event.target.value =
        "";


      setUploadError(
        null
      );


      if (
        !file
      ) {

        return;

      }


      // ------------------------------------------------
      // V1 local upload supports images.
      // ------------------------------------------------

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        const message =
          "Please select an image file.";


        setUploadError(
          message
        );


        console.warn(
          "[FilePreview] Invalid local file",
          {

            name:
              file.name,

            type:
              file.type,

          }
        );


        return;

      }


      console.log(
        "[FilePreview] Local image selected",
        {

          name:
            file.name,

          type:
            file.type,

          size:
            file.size,

        }
      );


      // ------------------------------------------------
      // Local image becomes authoritative.
      // ------------------------------------------------

      setLocalFile(
        file
      );


      onFileSelected?.(
        file
      );

    };


  // ===================================================
  // COMMON TOOLBAR PROPS
  // ===================================================

  const toolbarProps = {

    allowUpload,

    inputRef,

    accept,

    capture,

    onSelectFile:
      handleFileSelected,

    onRemove:
      removeLocalFile,

    hasLocalFile:
      !!localFile,

  };


  // ===================================================
  // EMPTY STATE
  // ===================================================

  if (
    !activeSource?.url
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

        {uploadError ? (

          <FileErrorView

            title=
              "Unable to select image"

            message={
              uploadError
            }

            onSelectFile={
              allowUpload
                ? openFilePicker
                : undefined
            }

            onRemove={
              localFile
                ? removeLocalFile
                : undefined
            }

            compact

          />

        ) : (

          <FileErrorView

            title=
              "No file selected"

            message=
              "Choose an image from your device or provide a remote file URL."

            onSelectFile={
              allowUpload
                ? openFilePicker
                : undefined
            }

            onRemove={
              localFile
                ? removeLocalFile
                : undefined
            }

            compact

          />

        )}


        <MediaToolbar
          {...toolbarProps}
        />

      </div>

    );

  }


  // ===================================================
  // IMAGE
  // ===================================================

  if (
    fileType ===
      "image"
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

        <ImagePreview

          file={
            activeSource
          }

          title={
            title
          }

          objectFit={
            objectFit
          }

          backgroundColor={
            backgroundColor
          }

          borderRadius={
            borderRadius
          }

        />


        <MediaToolbar
          {...toolbarProps}
        />

      </div>

    );

  }


  // ===================================================
  // PDF
  // ===================================================

  if (
    fileType ===
      "pdf"
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

        <PdfPreview

          file={
            activeSource
          }

          title={
            title
          }

          backgroundColor={
            backgroundColor
          }

          borderRadius={
            borderRadius
          }

        />


        <MediaToolbar
          {...toolbarProps}
        />

      </div>

    );

  }


  // ===================================================
  // VIDEO
  // ===================================================

  if (
    fileType ===
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

        <VideoPreview

          file={
            activeSource
          }

          objectFit={
            objectFit
          }

          backgroundColor={
            backgroundColor
          }

          borderRadius={
            borderRadius
          }

          controls={
            controls
          }

        />


        <MediaToolbar
          {...toolbarProps}
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

      <UnknownPreview

        file={
          activeSource
        }

        title={
          title
        }

        backgroundColor={
          backgroundColor
        }

        borderRadius={
          borderRadius
        }

        style={{
          width:
            "100%",

          height:
            "100%",
        }}

      />


      <MediaToolbar
        {...toolbarProps}
      />

    </div>

  );

}
