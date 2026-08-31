// src/components/inspectorPanel/InspectorContent.js

import React, {
  useMemo,
  forwardRef,
} from "react";

import {
  X,
} from "lucide-react";

import {
  useActionContext,
} from "../../context/ActionContext";

import componentRegistry
  from "../../actions/componentRegistry";

import InspectorSchemaPanel
  from "./InspectorSchemaPanel";

import InspectorActionPanel
  from "./InspectorActionPanel";

import InspectorControlPanelEditor
  from "./InspectorControlPanelEditor";

import "../../css/InspectorContent.css";


const InspectorContent =
  forwardRef(
    function InspectorContent(
      {
        selectedId,

        elements = [],

        updateElement,

        layout =
          "right",

        toggleOpen,

        position,
      },

      ref
    ) {

      const {
        bindings,
        updateBinding,
      } =
        useActionContext();


      // =================================================
      // SELECTED ELEMENT
      // =================================================

      const selectedElement =
        useMemo(
          () =>
            elements.find(
              element =>
                element.id ===
                selectedId
            ),

          [
            elements,
            selectedId,
          ]
        );


      // =================================================
      // CONTRACT
      // =================================================

      const meta =
        useMemo(
          () => {

            if (
              !selectedElement
            ) {

              return null;

            }


            return (

              componentRegistry?.[
                selectedElement.type
              ]?.contract ||

              selectedElement.contract ||

              null

            );

          },

          [
            selectedElement,
          ]
        );


      // =================================================
      // RAW SCHEMA
      // =================================================

      const rawSchema =
        meta?.editableProps ||
        {};


      // =================================================
      // NORMAL COMPONENT SCHEMA
      // =================================================
      //
      // Action configuration is handled exclusively by
      // InspectorActionPanel.
      //
      // This prevents:
      //
      //   action
      //   targetId
      //   nextActions
      //
      // from appearing twice.
      //
      // =================================================

      const schema =
        meta?.editableProps ||
        {};


      // =================================================
      // PROPS
      // =================================================

      const props =
        selectedElement?.props ||
        {};


      // =================================================
      // UPDATE PROP
      // =================================================

      const updateProp =
        (
          key,
          value
        ) => {

          if (
            !selectedElement
          ) {

            return;

          }


          updateElement(
            selectedElement.id,
            {

              props: {

                ...props,

                [key]:
                  value,

              },

            }
          );

        };


      // =================================================
      // EARLY STATES
      // =================================================

      if (
        !selectedElement
      ) {

        return (

          <div
            className="
              p-3
              text-xs
              text-gray-400
            "
          >

            No element selected

          </div>

        );

      }


      if (
        !meta
      ) {

        return (

          <div
            className="
              p-3
              text-xs
              text-red-400
            "
          >

            No contract found for{" "}
            {selectedElement.type}

          </div>

        );

      }


      // =================================================
      // UI
      // =================================================

      console.log(
        "[INSPECTOR]",
        {

          selectedElement,

          type:
            selectedElement.type,

          action:
            props.action ||
            "",

          targetId:
            props.targetId ||
            "",

          nextActions:
            props.nextActions ||
            [],

        }
      );


      return (

        <div

          ref={
            ref
          }

          className="
            bg-panel
            border
            flex
            flex-col
            h-full
            w-[340px]
          "

          style={{

            position:
              layout ===
                "floating"
                ? "absolute"
                : "relative",

            left:
              position?.x,

            top:
              position?.y,

            zIndex:
              2000,

          }}

        >

          {/* =========================================
              HEADER
          ========================================= */}

          <div
            className="
              flex
              justify-between
              p-3
              border-b
            "
          >

            <h3
              className="
                text-sm
                font-semibold
              "
            >

              {
                selectedElement.type
              }

            </h3>


            <button
              type="button"

              onClick={
                toggleOpen
              }
            >

              <X
                size={14}
              />

            </button>

          </div>


          {/* =========================================
              BODY
          ========================================= */}

          <div
            className="
              p-3
              space-y-3
              overflow-y-auto
            "
          >

            {/* =======================================
                NORMAL PROPERTIES
            ======================================= */}

            {Object.keys(
              schema
            ).length >
            0 && (

              <InspectorSchemaPanel

                schema={
                  schema
                }

                props={
                  props
                }

                onChange={
                  updateProp
                }

                elements={
                  elements
                }

                selectedElement={
                  selectedElement
                }

              />

            )}


            {/* =======================================
                ACTIONS
            ======================================= */}

            <InspectorActionPanel

              selectedElement={
                selectedElement
              }

              elements={
                elements
              }

              updateElement={
                updateElement
              }

            />


            {/* =======================================
                CONTROL PANEL
            ======================================= */}

            {selectedElement.type ===
              "ControlPanel" && (

              <InspectorControlPanelEditor

                selectedElement={
                  selectedElement
                }

                elements={
                  elements
                }

                updateElement={
                  updateElement
                }

              />

            )}

          </div>

        </div>

      );

    }
  );


export default InspectorContent;