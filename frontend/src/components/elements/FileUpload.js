import React, {
  useRef,
  useState,
} from "react";

import {
  useTheme,
} from "../../context/ThemeContext";

import {
  useActionContext,
} from "../../context/ActionContext";

import {
  useRuntimeState,
} from "../../context/RuntimeStateContext";


export default function FileUpload(props) {

  const {
    label = "Choose file",

    accept = "",

    multiple = false,

    bindTo = "fileUpload",

    action,

    params = {},

    style = {},

    disabled = false,

    ...rest

  } = props;


  const theme = useTheme();

  const actionCtx =
    useActionContext();

  const runtime =
    useRuntimeState();


  const inputRef =
    useRef(null);


  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState([]);


  const [
    busy,
    setBusy,
  ] = useState(false);


  // ===================================================
  // OPEN FILE PICKER
  // ===================================================

  const handleClick = () => {

    if (
      disabled ||
      busy
    ) {
      return;
    }

    inputRef.current?.click();

  };


  // ===================================================
  // FILE SELECTED
  // ===================================================

  const handleChange = async (
    event
  ) => {

    const files =
      Array.from(
        event.target.files || []
      );


    if (!files.length) {
      return;
    }


    // -----------------------------------------------
    // Metadata only
    //
    // Do NOT put browser File objects into runtime
    // state. Runtime state should remain serialisable.
    // -----------------------------------------------

    const fileMetadata =
      files.map((file) => ({

        name:
          file.name,

        fileName:
          file.name,

        type:
          file.type,

        size:
          file.size,

        lastModified:
          file.lastModified,

      }));


    setSelectedFiles(
      fileMetadata
    );


    const runtimeValue =
      multiple
        ? fileMetadata
        : fileMetadata[0];


    // -----------------------------------------------
    // Runtime state
    // -----------------------------------------------

    runtime.set(
      bindTo,
      runtimeValue
    );


    console.log(
      "[FileUpload] RUNTIME WRITE",
      {
        stateKey: bindTo,
        value: runtimeValue,
      }
    );


    // -----------------------------------------------
    // Optional runtime action
    // -----------------------------------------------

    if (action) {

      setBusy(true);


      try {

        const selectedFile =
          files[0];


        const actionParams = {

          ...(params &&
          typeof params === "object"
            ? params
            : {}),

          file:
            selectedFile,

          fileName:
            selectedFile.name,

          fileType:
            selectedFile.type,

          fileSize:
            selectedFile.size,

          fileMetadata,

          runtimeValue,

        };


        console.log(
          "[FileUpload] RUN ACTION",
          {
            action,
            actionParams,
          }
        );


        const result =
          await actionCtx.runAction(
            action,
            actionParams
          );


        console.log(
          "[FileUpload] ACTION RESULT",
          {
            action,
            result,
          }
        );


        return result;


      } catch (error) {

        console.error(
          "[FileUpload] Action failed",
          {
            action,
            error,
          }
        );


      } finally {

        setBusy(false);

      }

    }


    // Allow selecting the same file again.
    event.target.value = "";

  };


  // ===================================================
  // DISPLAY
  // ===================================================

  const displayName =
    selectedFiles.length === 1

      ? selectedFiles[0].name

      : selectedFiles.length > 1

        ? `${selectedFiles.length} files selected`

        : null;


  return (

    <div
      className="
        w-full
        h-full
        flex
        flex-col
        justify-center
        gap-2
      "
      style={style}
    >

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={
          disabled ||
          busy
        }
        onChange={handleChange}
        className="hidden"
        {...rest}
      />


      <button
        type="button"
        onClick={handleClick}
        disabled={
          disabled ||
          busy
        }
        className="
          w-full
          px-4
          py-2
          rounded
          text-sm
        "
        style={{

          backgroundColor:
            style?.backgroundColor ||
            theme.colors.surface ||
            "#2C2C2E",

          color:
            style?.color ||
            theme.colors.textPrimary ||
            "#FFFFFF",

          borderRadius:
            style?.borderRadius ||
            8,

          border:
            style?.border ||
            "1px solid #333",

          opacity:
            disabled || busy
              ? 0.6
              : 1,

        }}
      >

        {busy
          ? "Processing..."
          : displayName ||
            label}

      </button>


      {displayName && !busy && (

        <div
          className="
            text-xs
            truncate
          "
          style={{
            color:
              theme.colors.textSecondary ||
              "#A1A1AA",
          }}
        >

          {displayName}

        </div>

      )}

    </div>

  );

}