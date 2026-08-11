
import React, {
  useEffect,
  useState,
} from "react";

import ConfoLoader from "../runtime/confos/ConfoLoader";

import {
  useProjectContext,
} from "../context/ProjectContext";

import {
  installConfo,
} from "../runtime/confos/ConfoProjectInstaller";

import ConfosRegistry from "../configs/confos/ConfosRegistry";

// =====================================================
// AVAILABLE CONFOS
// =====================================================

const AVAILABLE_CONFOS = [
  {
    id: "confo.one_to_one",
    name: "1-to-1 Video Call",
  },

  {
    id: "confo.one_to_many",
    name: "1-to-Many Video Call",
  },

  {
    id: "confo.host_to_many",
    name: "Host-to-Many Video Call",
  },

  {
    id: "confo.remote_training",
    name: "Remote Training",
  },
];

// =====================================================
// CONFO TEST
// =====================================================

export default function ConfoTest() {

  const {
    projectSchema,
    setProjectSchema,
  } = useProjectContext();

  const [
    selected,
    setSelected,
  ] = useState(
    "confo.remote_training"
  );

  const [
    confo,
    setConfo,
  ] = useState(null);

  const [
    errors,
    setErrors,
  ] = useState([]);

  const [
    installing,
    setInstalling,
  ] = useState(false);

  const [
    installResult,
    setInstallResult,
  ] = useState(null);

  // ===================================================
  // LOAD SELECTED CONFO
  // ===================================================

  useEffect(() => {

    try {

      console.log(
        "[ConfoTest] Loading",
        selected
      );

      // -------------------------------------------------
      // Get config from registry
      // -------------------------------------------------

      const config =
        ConfosRegistry[selected];

      if (!config) {

        console.error(
          "[ConfoTest] Confo not found in registry",
          selected
        );

        setConfo(null);

        setErrors([
          `Confo '${selected}' not found in ConfosRegistry.`,
        ]);

        return;
      }

      console.log(
        "[ConfoTest] Registry config",
        config
      );

      // -------------------------------------------------
      // Validate through ConfoLoader
      // -------------------------------------------------

      const loader =
        new ConfoLoader();

      const result =
        loader.load(config);

      console.log(
        "[ConfoTest] LOAD RESULT",
        result
      );

      // -------------------------------------------------
      // Validation failed
      // -------------------------------------------------

      if (!result.valid) {

        console.error(
          "[ConfoTest] Invalid Confo",
          result.errors
        );

        setConfo(null);

        setErrors(
          result.errors || [
            "Unknown Confo validation error.",
          ]
        );

        return;
      }

      // -------------------------------------------------
      // Valid Confo
      // -------------------------------------------------

      setErrors([]);

      setInstallResult(null);

      setConfo(
        result.confo
      );

    }
    catch (error) {

      console.error(
        "[ConfoTest]",
        error
      );

      setConfo(null);

      setErrors([
        error.message,
      ]);

    }

  }, [
    selected,
  ]);

  // ===================================================
  // INSTALL CONFO
  // ===================================================

  const handleInstall = () => {

    if (!confo) {

      setErrors([
        "No valid Confo is loaded.",
      ]);

      return;
    }

    setInstalling(true);

    setErrors([]);

    setInstallResult(null);

    try {

      console.log(
        "[ConfoTest] Installing Confo",
        {
          id:
            confo.id,

          name:
            confo.name,
        }
      );

      // -------------------------------------------------
      // Convert Confo tree → Project tree
      // -------------------------------------------------

      const result =
        installConfo(
          confo,
          projectSchema
        );

      console.log(
        "[ConfoTest] INSTALL RESULT",
        result
      );

      // -------------------------------------------------
      // Installer failure
      // -------------------------------------------------

      if (!result?.success) {

        const installerErrors =
          result?.errors || [
            "Confo installation failed.",
          ];

        console.error(
          "[ConfoTest] Installation failed",
          installerErrors
        );

        setErrors(
          installerErrors
        );

        return;
      }

      // -------------------------------------------------
      // Write installed project tree
      // -------------------------------------------------

      setProjectSchema(
        prev => ({
          ...prev,

          tree:
            result.tree,
        })
      );

      setInstallResult({
        success: true,

        message:
          `${confo.name} installed successfully.`,
      });

      console.log(
        "[ConfoTest] Confo installed into project"
      );

    }
    catch (error) {

      console.error(
        "[ConfoTest] Installation error",
        error
      );

      setErrors([
        error.message,
      ]);

    }
    finally {

      setInstalling(false);

    }

  };

  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#181818",
        color: "#fff",
        padding: 20,
        boxSizing: "border-box",
      }}
    >

      <h2>
        Confo Project Installer
      </h2>

      <p
        style={{
          color: "#aaa",
          marginBottom: 20,
        }}
      >
        Select a Confo, validate it, then install it
        into the current project. The Canvas will render
        the installed project automatically.
      </p>

      {/* ===============================================
          TEMPLATE SELECTOR
      =============================================== */}

      <select
        value={selected}
        onChange={
          e =>
            setSelected(
              e.target.value
            )
        }
        style={{
          marginBottom: 20,
          padding: 8,
          minWidth: 260,
        }}
      >

        {
          AVAILABLE_CONFOS.map(
            item => (

              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>

            )
          )
        }

      </select>

      {/* ===============================================
          CONFO INFORMATION
      =============================================== */}

      {confo && (

        <div
          style={{
            background: "#202020",
            border:
              "1px solid #333",
            padding: 15,
            borderRadius: 8,
            marginBottom: 20,
          }}
        >

          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            {confo.name}
          </div>

          <div
            style={{
              color: "#aaa",
              marginBottom: 12,
            }}
          >
            {confo.description}
          </div>

          <button
            type="button"
            onClick={
              handleInstall
            }
            disabled={
              installing
            }
            style={{
              padding:
                "10px 16px",

              borderRadius: 6,

              border: "none",

              background:
                installing
                  ? "#555"
                  : "#2563eb",

              color: "#fff",

              cursor:
                installing
                  ? "default"
                  : "pointer",

              fontWeight: 600,
            }}
          >

            {
              installing
                ? "Installing..."
                : "Install Confo"
            }

          </button>

        </div>

      )}

      {/* ===============================================
          VALIDATION / INSTALL ERRORS
      =============================================== */}

      {
        errors.length > 0 && (

          <div
            style={{
              background:
                "#3b1515",

              border:
                "1px solid #7f1d1d",

              color:
                "#fca5a5",

              padding: 12,

              borderRadius: 8,

              marginBottom: 20,
            }}
          >

            <strong>
              Confo error
            </strong>

            <ul>

              {
                errors.map(
                  (
                    error,
                    index
                  ) => (

                    <li
                      key={
                        index
                      }
                    >
                      {error}
                    </li>

                  )
                )
              }

            </ul>

          </div>

        )
      }

      {/* ===============================================
          INSTALL SUCCESS
      =============================================== */}

      {
        installResult?.success && (

          <div
            style={{
              background:
                "#12351f",

              border:
                "1px solid #166534",

              color:
                "#86efac",

              padding: 12,

              borderRadius: 8,

              marginBottom: 20,
            }}
          >

            {installResult.message}

            <div
              style={{
                marginTop: 6,
                color: "#aaa",
                fontSize: 13,
              }}
            >
              The project tree has been updated.
              CanvasContext will now hydrate the Canvas
              from the installed template.
            </div>

          </div>

        )
      }

      {/* ===============================================
          DEBUG PROJECT TREE
      =============================================== */}

      <details>

        <summary
          style={{
            cursor: "pointer",
            color: "#aaa",
            marginBottom: 10,
          }}
        >
          Project Tree
        </summary>

        <pre
          style={{
            background:
              "#101010",

            padding: 12,

            borderRadius: 6,

            overflow: "auto",

            fontSize: 12,

            color: "#ccc",
          }}
        >
          {
            JSON.stringify(
              projectSchema?.tree,
              null,
              2
            )
          }
        </pre>

      </details>

    </div>

  );

}
