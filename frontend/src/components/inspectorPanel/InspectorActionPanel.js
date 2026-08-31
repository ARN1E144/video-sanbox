// src/components/inspectorPanel/InspectorActionPanel.js

import React, {
  useMemo,
} from "react";

import InspectorSection
  from "./InspectorSection";

import {
  getActionOptions,
} from "../../actions/getActionsOptions";

import {
  getActionByValue,
} from "../../actions/getActionByValue";


// =====================================================
// TYPE-AWARE OPERATORS
// =====================================================

const OPERATORS_BY_TYPE = {

  boolean: [

    {
      value:
        "equals",

      label:
        "equals",
    },

    {
      value:
        "notEquals",

      label:
        "not equals",
    },

    {
      value:
        "truthy",

      label:
        "is truthy",
    },

    {
      value:
        "falsy",

      label:
        "is falsy",
    },

  ],


  number: [

    {
      value:
        "equals",

      label:
        "equals",
    },

    {
      value:
        "notEquals",

      label:
        "not equals",
    },

    {
      value:
        "greaterThan",

      label:
        "greater than",
    },

    {
      value:
        "greaterThanOrEqual",

      label:
        "greater than or equal",
    },

    {
      value:
        "lessThan",

      label:
        "less than",
    },

    {
      value:
        "lessThanOrEqual",

      label:
        "less than or equal",
    },

  ],


  string: [

    {
      value:
        "equals",

      label:
        "equals",
    },

    {
      value:
        "notEquals",

      label:
        "not equals",
    },

    {
      value:
        "contains",

      label:
        "contains",
    },

    {
      value:
        "notContains",

      label:
        "does not contain",
    },

  ],

};


// =====================================================
// HELPERS
// =====================================================

function normaliseActions(
  value
) {

  if (
    !Array.isArray(
      value
    )
  ) {

    return [];

  }


  return value.filter(
    action =>
      action &&
      typeof action ===
        "object"
  );

}


function createEmptyAction() {

  return {

    type:
      "",

    targetId:
      "",

    params:
      {},

    condition:
      null,

  };

}


function safeParamsObject(
  value
) {

  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ) {

    return value;

  }


  return {};

}


function formatTargetLabel(
  element
) {

  if (
    !element
  ) {

    return "";

  }


  const friendlyLabel =
    element?.props?.label;


  if (
    typeof friendlyLabel ===
      "string" &&
    friendlyLabel.trim()
  ) {

    return `${element.type} — ${friendlyLabel}`;

  }


  return `${element.type} — ${String(
    element.id
  ).slice(
    0,
    8
  )}`;

}


function getActionDefinition(
  value
) {

  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {

    return null;

  }


  return getActionByValue(
    value
  );

}


function getActionValue(
  action
) {

  if (
    typeof action ===
      "string"
  ) {

    return action;

  }


  return action?.value ||
    "";

}


function getConditionPathValue(
  definition
) {

  if (
    typeof definition ===
      "string"
  ) {

    return definition;

  }


  return definition?.path ||
    "";

}


function getConditionPathLabel(
  definition
) {

  if (
    typeof definition ===
      "string"
  ) {

    return definition;

  }


  return (
    definition?.label ||
    definition?.path ||
    ""
  );

}


function getConditionPathType(
  definition,
  condition
) {

  if (
    definition &&
    typeof definition ===
      "object" &&
    definition.type
  ) {

    return definition.type;

  }


  // Backwards compatibility for old stored conditions.

  if (
    typeof condition?.value ===
      "boolean"
  ) {

    return "boolean";

  }


  if (
    typeof condition?.value ===
      "number"
  ) {

    return "number";

  }


  return "string";

}


function getConditionPathOptions(
  definition
) {

  if (
    !definition ||
    typeof definition !==
      "object"
  ) {

    return [];

  }


  return Array.isArray(
    definition.options
  )
    ? definition.options
    : [];

}


function getOperatorsForType(
  type
) {

  return (
    OPERATORS_BY_TYPE[type] ||
    OPERATORS_BY_TYPE.string
  );

}


function coerceValue(
  value,
  type
) {

  if (
    type ===
      "boolean"
  ) {

    return (
      value ===
        true ||
      value ===
        "true"
    );

  }


  if (
    type ===
      "number"
  ) {

    if (
      value ===
        ""
    ) {

      return "";

    }


    const numeric =
      Number(
        value
      );


    return Number.isFinite(
      numeric
    )
      ? numeric
      : "";

  }


  return String(
    value ??
      ""
  );

}


// =====================================================
// COMPONENT
// =====================================================

export default function InspectorActionPanel({

  selectedElement,

  elements = [],

  updateElement,

}) {

  // ===================================================
  // SAFE PROPS
  // ===================================================

  const props =
    selectedElement?.props ||
    {};


  const actionValue =
    typeof props.action ===
      "string"
      ? props.action
      : "";


  const targetId =
    typeof props.targetId ===
      "string"
      ? props.targetId
      : "";


  const actionParams =
    safeParamsObject(
      props.params
    );


  const nextActions =
    useMemo(
      () =>
        normaliseActions(
          props.nextActions
        ),
      [
        props.nextActions,
      ]
    );


  // ===================================================
  // ALL ACTION OPTIONS
  // ===================================================

  const allActionOptions =
    useMemo(
      () =>
        getActionOptions() ||
        [],
      []
    );


  // ===================================================
  // PRIMARY ACTION
  // ===================================================

  const primaryActionDefinition =
    useMemo(
      () =>
        getActionDefinition(
          actionValue
        ),
      [
        actionValue,
      ]
    );


  // ===================================================
  // PRIMARY TARGETS
  // ===================================================

  const getTargetsForAction =
    actionName => {

      const action =
        getActionDefinition(
          actionName
        );


      const targetTypes =
        Array.isArray(
          action?.targets
        )
          ? action.targets
          : [];


      if (
        targetTypes.length ===
          0
      ) {

        return elements.map(
          element => ({

            id:
              element.id,

            label:
              formatTargetLabel(
                element
              ),

          })
        );

      }


      return elements
        .filter(
          element =>
            targetTypes.includes(
              element.type
            )
        )
        .map(
          element => ({

            id:
              element.id,

            label:
              formatTargetLabel(
                element
              ),

          })
        );

    };


  const primaryTargets =
    useMemo(
      () =>
        actionValue
          ? getTargetsForAction(
              actionValue
            )
          : [],
      [
        actionValue,
        elements,
      ]
    );


  // ===================================================
  // VALID PRIMARY NEXT ACTIONS
  // ===================================================

  const primaryNextActionOptions =
    useMemo(
      () => {

        const declared =
          Array.isArray(
            primaryActionDefinition
              ?.nextActions
          )
            ? primaryActionDefinition.nextActions
            : [];


        if (
          declared.length ===
            0
        ) {

          return [];

        }


        const allowed =
          new Set(
            declared
              .map(
                getActionValue
              )
              .filter(Boolean)
          );


        return allActionOptions.filter(
          action =>
            allowed.has(
              action.value
            )
        );

      },
      [
        primaryActionDefinition,
        allActionOptions,
      ]
    );


  // ===================================================
  // UPDATE PROPS
  // ===================================================

  const updateProps =
    patch => {

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

            ...patch,

          },

        }
      );

    };


  // ===================================================
  // PRIMARY ACTION CHANGE
  // ===================================================

  const handlePrimaryActionChange =
    event => {

      const value =
        event.target.value;


      const targets =
        getTargetsForAction(
          value
        );


      updateProps(
        {

          action:
            value,

          targetId:
            targets[0]?.id ||
            "",

          params:
            {},

          nextActions:
            [],

        }
      );

    };


  // ===================================================
  // PRIMARY PARAMETERS
  // ===================================================

  const updatePrimaryParams =
    value => {

      try {

        const parsed =
          value.trim()
            ? JSON.parse(
                value
              )
            : {};


        if (
          parsed === null ||
          typeof parsed !==
            "object" ||
          Array.isArray(
            parsed
          )
        ) {

          throw new Error(
            "Parameters must be a JSON object."
          );

        }


        updateProps(
          {

            params:
              parsed,

          }
        );

      }
      catch (
        error
      ) {

        console.warn(
          "[InspectorActionPanel] Invalid primary parameters",
          error
        );

      }

    };


  // ===================================================
  // ADD NEXT ACTION
  // ===================================================

  const addNextAction =
    () => {

      if (
        primaryNextActionOptions.length ===
          0
      ) {

        return;

      }


      updateProps(
        {

          nextActions: [

            ...nextActions,

            createEmptyAction(),

          ],

        }
      );

    };


  // ===================================================
  // REMOVE NEXT ACTION
  // ===================================================

  const removeNextAction =
    index => {

      updateProps(
        {

          nextActions:
            nextActions.filter(
              (
                _,
                actionIndex
              ) =>
                actionIndex !==
                index
            ),

        }
      );

    };


  // ===================================================
  // UPDATE NEXT ACTION
  // ===================================================

  const updateNextAction =
    (
      index,
      patch
    ) => {

      const updated =
        nextActions.map(
          (
            action,
            actionIndex
          ) => {

            if (
              actionIndex !==
                index
            ) {

              return action;

            }


            return {

              ...action,

              ...patch,

            };

          }
        );


      updateProps(
        {

          nextActions:
            updated,

        }
      );

    };


  // ===================================================
  // CHANGE NEXT ACTION
  // ===================================================

  const handleNextActionChange =
    (
      index,
      value
    ) => {

      const targets =
        getTargetsForAction(
          value
        );


      updateNextAction(
        index,
        {

          type:
            value,

          targetId:
            targets[0]?.id ||
            "",

          params:
            {},

          condition:
            null,

        }
      );

    };


  // ===================================================
  // PARAMETERS
  // ===================================================

  const getActionParamsText =
    action => {

      try {

        return JSON.stringify(
          safeParamsObject(
            action?.params
          ),
          null,
          2
        );

      }
      catch {

        return "{}";

      }

    };


  const updateNextActionParams =
    (
      index,
      value
    ) => {

      try {

        const parsed =
          value.trim()
            ? JSON.parse(
                value
              )
            : {};


        if (
          parsed === null ||
          typeof parsed !==
            "object" ||
          Array.isArray(
            parsed
          )
        ) {

          throw new Error(
            "Parameters must be a JSON object."
          );

        }


        updateNextAction(
          index,
          {

            params:
              parsed,

          }
        );

      }
      catch (
        error
      ) {

        console.warn(
          "[InspectorActionPanel] Invalid chained parameters",
          error
        );

      }

    };


  // ===================================================
  // CONDITION
  // ===================================================

  const addCondition =
    index => {

      const action =
        nextActions[
          index
        ];


      const definition =
        getActionDefinition(
          action?.type
        );


      const paths =
        Array.isArray(
          definition?.conditionPaths
        )
          ? definition.conditionPaths
          : [];


      if (
        paths.length ===
          0
      ) {

        return;

      }


      const firstPathDefinition =
        paths[0];


      const firstPath =
        getConditionPathValue(
          firstPathDefinition
        );


      const firstType =
        getConditionPathType(
          firstPathDefinition,
          null
        );


      let defaultValue =
        "";


      if (
        firstType ===
          "boolean"
      ) {

        defaultValue =
          true;

      }
      else if (
        firstType ===
          "number"
      ) {

        defaultValue =
          0;

      }
      else {

        const options =
          getConditionPathOptions(
            firstPathDefinition
          );


        defaultValue =
          options[0] ||
          "";

      }


      updateNextAction(
        index,
        {

          condition: {

            path:
              firstPath,

            operator:
              getOperatorsForType(
                firstType
              )[0]?.value ||
              "equals",

            value:
              defaultValue,

          },

        }
      );

    };


  const removeCondition =
    index => {

      updateNextAction(
        index,
        {

          condition:
            null,

        }
      );

    };


  const updateCondition =
    (
      index,
      patch
    ) => {

      const current =
        nextActions[
          index
        ]?.condition || {

          path:
            "",

          operator:
            "equals",

          value:
            true,

        };


      updateNextAction(
        index,
        {

          condition: {

            ...current,

            ...patch,

          },

        }
      );

    };


  // ===================================================
  // CONDITION PATH CHANGE
  // ===================================================

  const handleConditionPathChange =
    (
      index,
      path
    ) => {

      const action =
        nextActions[
          index
        ];


      const definition =
        getActionDefinition(
          action?.type
        );


      const paths =
        Array.isArray(
          definition?.conditionPaths
        )
          ? definition.conditionPaths
          : [];


      const pathDefinition =
        paths.find(
          item =>
            getConditionPathValue(
              item
            ) === path
        );


      if (
        !pathDefinition
      ) {

        updateCondition(
          index,
          {

            path,

            value:
              "",

            operator:
              "equals",

          }
        );


        return;

      }


      const type =
        getConditionPathType(
          pathDefinition,
          null
        );


      const operators =
        getOperatorsForType(
          type
        );


      let defaultValue =
        "";


      const options =
        getConditionPathOptions(
          pathDefinition
        );


      if (
        type ===
          "boolean"
      ) {

        defaultValue =
          true;

      }
      else if (
        type ===
          "number"
      ) {

        defaultValue =
          0;

      }
      else if (
        options.length
      ) {

        defaultValue =
          options[0];

      }


      updateCondition(
        index,
        {

          path,

          operator:
            operators[0]?.value ||
            "equals",

          value:
            defaultValue,

        }
      );

    };


  // ===================================================
  // CONDITION METADATA
  // ===================================================

  const getConditionMetadata =
    (
      index
    ) => {

      const action =
        nextActions[
          index
        ];


      const condition =
        action?.condition;


      const definition =
        getActionDefinition(
          action?.type
        );


      const paths =
        Array.isArray(
          definition?.conditionPaths
        )
          ? definition.conditionPaths
          : [];


      const pathDefinition =
        paths.find(
          item =>
            getConditionPathValue(
              item
            ) ===
            condition?.path
        ) ||
        null;


      const type =
        getConditionPathType(
          pathDefinition,
          condition
        );


      return {

        condition,

        paths,

        pathDefinition,

        type,

        operators:
          getOperatorsForType(
            type
          ),

        options:
          getConditionPathOptions(
            pathDefinition
          ),

      };

    };


  // ===================================================
  // CONDITION VALUE CHANGE
  // ===================================================

  const handleConditionValueChange =
    (
      index,
      rawValue,
      type
    ) => {

      updateCondition(
        index,
        {

          value:
            coerceValue(
              rawValue,
              type
            ),

        }
      );

    };


  // ===================================================
  // NO SELECTION
  // ===================================================

  if (
    !selectedElement
  ) {

    return null;

  }


  // ===================================================
  // DEBUG
  // ===================================================

  console.log(
    "[INSPECTOR ACTION PANEL]",
    {

      elementId:
        selectedElement.id,

      elementType:
        selectedElement.type,

      action:
        actionValue,

      targetId,

      nextActions,

      allowedNextActions:
        primaryActionDefinition
          ?.nextActions ||
        [],

      conditionPaths:
        primaryActionDefinition
          ?.conditionPaths ||
        [],

    }
  );


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <InspectorSection
      title="Actions"
    >

      {/* =================================================
          PRIMARY ACTION
      ================================================= */}

      <div
        className="
          space-y-2
        "
      >

        <div
          className="
            text-xs
            font-semibold
            text-gray-300
          "
        >

          Action

        </div>


        <select

          value={
            actionValue
          }

          onChange={
            handlePrimaryActionChange
          }

          className="
            w-full
            px-2
            py-2
            rounded
            bg-surface
            border
            border-border
            text-xs
          "
        >

          <option value="">
            Select Action
          </option>


          {allActionOptions.map(
            action => {

              return (

                <option
                  key={
                    action.value
                  }
                  value={
                    action.value
                  }
                >

                  {
                    action.label
                  }

                </option>

              );

            }
          )}

        </select>


        {/* =================================================
            PRIMARY TARGET
        ================================================= */}

        {actionValue && (

          <>

            <div
              className="
                text-xs
                font-semibold
                text-gray-300
                mt-2
              "
            >

              Target

            </div>


            <select

              value={
                targetId
              }

              onChange={
                event =>
                  updateProps(
                    {
                      targetId:
                        event.target.value,
                    }
                  )
              }

              className="
                w-full
                px-2
                py-2
                rounded
                bg-surface
                border
                border-border
                text-xs
              "
            >

              <option value="">
                Select Target
              </option>


              {primaryTargets.map(
                target => (

                  <option
                    key={
                      target.id
                    }
                    value={
                      target.id
                    }
                  >

                    {
                      target.label
                    }

                  </option>

                )
              )}

            </select>


            {/* =================================================
                PRIMARY PARAMETERS
            ================================================= */}

            <div
              className="
                text-xs
                font-semibold
                text-gray-300
                mt-2
              "
            >

              Parameters

            </div>


            <textarea

              value={
                JSON.stringify(
                  actionParams,
                  null,
                  2
                )
              }

              onChange={
                event =>
                  updatePrimaryParams(
                    event.target.value
                  )
              }

              placeholder={`{
  "key": "value"
}`}

              spellCheck={
                false
              }

              className="
                w-full
                min-h-[90px]
                px-2
                py-2
                rounded
                bg-surface
                border
                border-border
                text-xs
                font-mono
                resize-y
              "

            />

          </>

        )}

      </div>


      {/* =================================================
          NEXT ACTIONS
      ================================================= */}

      <div
        className="
          mt-4
          pt-3
          border-t
          border-border
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
            mb-2
          "
        >

          <div
            className="
              text-xs
              font-semibold
              text-gray-300
            "
          >

            Next Actions

          </div>


          <button

            type="button"

            onClick={
              addNextAction
            }

            disabled={
              primaryNextActionOptions.length ===
                0
            }

            className="
              px-2
              py-1
              rounded
              text-xs
              bg-accent/10
              hover:bg-accent/20
              disabled:opacity-40
              disabled:cursor-not-allowed
            "
          >

            + Add

          </button>

        </div>


        {nextActions.length ===
        0 ? (

          <div
            className="
              text-[11px]
              text-gray-500
              p-2
              rounded
              bg-surface
              border
              border-border
            "
          >

            {actionValue
              ? primaryNextActionOptions.length
                ? "No chained actions configured."
                : "This action has no declared next actions."
              : "Select an action first."}

          </div>

        ) : (

          <div
            className="
              space-y-3
            "
          >

            {nextActions.map(
              (
                chainAction,
                index
              ) => {

                const chainDefinition =
                  getActionDefinition(
                    chainAction.type
                  );


                const chainTargets =
                  chainAction.type
                    ? getTargetsForAction(
                        chainAction.type
                      )
                    : [];


                const condition =
                  chainAction.condition;


                const conditionMetadata =
                  getConditionMetadata(
                    index
                  );


                const {
                  paths:
                    conditionPaths,

                  pathDefinition,

                  type:
                    conditionType,

                  operators:
                    conditionOperators,

                  options:
                    conditionValueOptions,

                } =
                  conditionMetadata;


                return (

                  <div

                    key={
                      index
                    }

                    className="
                      p-3
                      rounded
                      bg-surface
                      border
                      border-border
                    "
                  >

                    {/* =================================
                        HEADER
                    ================================= */}

                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        mb-2
                      "
                    >

                      <div
                        className="
                          text-[11px]
                          font-semibold
                          text-gray-300
                        "
                      >

                        Action{" "}
                        {index + 1}

                      </div>


                      <button

                        type="button"

                        onClick={() =>
                          removeNextAction(
                            index
                          )
                        }

                        className="
                          text-[10px]
                          text-red-400
                        "
                      >

                        Remove

                      </button>

                    </div>


                    {/* =================================
                        ACTION
                    ================================= */}

                    <div
                      className="
                        text-[10px]
                        font-semibold
                        text-gray-400
                        mb-1
                      "
                    >

                      Action

                    </div>


                    <select

                      value={
                        chainAction.type ||
                        ""
                      }

                      onChange={
                        event =>
                          handleNextActionChange(
                            index,
                            event.target.value
                          )
                      }

                      className="
                        w-full
                        px-2
                        py-2
                        rounded
                        bg-panel
                        border
                        border-border
                        text-xs
                        mb-2
                      "
                    >

                      <option value="">
                        Select Action
                      </option>


                      {primaryNextActionOptions.map(
                        action => (

                          <option
                            key={
                              action.value
                            }
                            value={
                              action.value
                            }
                          >

                            {
                              action.label
                            }

                          </option>

                        )
                      )}

                    </select>


                    {/* =================================
                        TARGET
                    ================================= */}

                    {chainAction.type && (

                      <>

                        <div
                          className="
                            text-[10px]
                            font-semibold
                            text-gray-400
                            mb-1
                          "
                        >

                          Target

                        </div>


                        <select

                          value={
                            chainAction.targetId ||
                            ""
                          }

                          onChange={
                            event =>
                              updateNextAction(
                                index,
                                {
                                  targetId:
                                    event.target.value,
                                }
                              )
                          }

                          className="
                            w-full
                            px-2
                            py-2
                            rounded
                            bg-panel
                            border
                            border-border
                            text-xs
                            mb-2
                          "
                        >

                          <option value="">
                            Select Target
                          </option>


                          {chainTargets.map(
                            target => (

                              <option
                                key={
                                  target.id
                                }
                                value={
                                  target.id
                                }
                              >

                                {
                                  target.label
                                }

                              </option>

                            )
                          )}

                        </select>


                        {/* =================================
                            PARAMETERS
                        ================================= */}

                        <div
                          className="
                            text-[10px]
                            font-semibold
                            text-gray-400
                            mb-1
                          "
                        >

                          Parameters

                        </div>


                        <textarea

                          value={
                            getActionParamsText(
                              chainAction
                            )
                          }

                          onChange={
                            event =>
                              updateNextActionParams(
                                index,
                                event.target.value
                              )
                          }

                          placeholder={`{
  "key": "value"
}`}

                          spellCheck={
                            false
                          }

                          className="
                            w-full
                            min-h-[80px]
                            px-2
                            py-2
                            rounded
                            bg-panel
                            border
                            border-border
                            text-xs
                            font-mono
                            resize-y
                            mb-2
                          "

                        />

                      </>

                    )}


                    {/* =================================
                        CONDITION
                    ================================= */}

                    {chainAction.type && (

                      conditionPaths.length >
                        0 ? (

                        !condition ? (

                          <button

                            type="button"

                            onClick={() =>
                              addCondition(
                                index
                              )
                            }

                            className="
                              text-[11px]
                              text-accent
                            "
                          >

                            + Add condition

                          </button>

                        ) : (

                          <div
                            className="
                              mt-3
                              pt-3
                              border-t
                              border-border
                              space-y-2
                            "
                          >

                            {/* =================================
                                HEADER
                            ================================= */}

                            <div
                              className="
                                flex
                                items-center
                                justify-between
                              "
                            >

                              <div
                                className="
                                  text-[10px]
                                  font-semibold
                                  text-gray-300
                                "
                              >

                                Run when

                              </div>


                              <button

                                type="button"

                                onClick={() =>
                                  removeCondition(
                                    index
                                  )
                                }

                                className="
                                  text-[10px]
                                  text-red-400
                                "
                              >

                                Remove

                              </button>

                            </div>


                            {/* =================================
                                RUNTIME PATH
                            ================================= */}

                            <div>

                              <div
                                className="
                                  text-[10px]
                                  font-semibold
                                  text-gray-400
                                  mb-1
                                "
                              >

                                Runtime path

                              </div>


                              <select

                                value={
                                  condition.path ||
                                  ""
                                }

                                onChange={
                                  event =>
                                    handleConditionPathChange(
                                      index,
                                      event.target.value
                                    )
                                }

                                className="
                                  w-full
                                  px-2
                                  py-2
                                  rounded
                                  bg-panel
                                  border
                                  border-border
                                  text-xs
                                "
                              >

                                <option value="">
                                  Select runtime value
                                </option>


                                {conditionPaths.map(
                                  (
                                    pathDefinition,
                                    pathIndex
                                  ) => (

                                    <option

                                      key={
                                        `${getConditionPathValue(
                                          pathDefinition
                                        )}-${pathIndex}`
                                      }

                                      value={
                                        getConditionPathValue(
                                          pathDefinition
                                        )
                                      }

                                    >

                                      {
                                        getConditionPathLabel(
                                          pathDefinition
                                        )
                                      }

                                    </option>

                                  )
                                )}

                              </select>

                            </div>


                            {/* =================================
                                OPERATOR
                            ================================= */}

                            <div>

                              <div
                                className="
                                  text-[10px]
                                  font-semibold
                                  text-gray-400
                                  mb-1
                                "
                              >

                                Operator

                              </div>


                              <select

                                value={
                                  condition.operator ||
                                  conditionOperators[0]
                                    ?.value ||
                                  "equals"
                                }

                                onChange={
                                  event =>
                                    updateCondition(
                                      index,
                                      {
                                        operator:
                                          event.target.value,
                                      }
                                    )
                                }

                                className="
                                  w-full
                                  px-2
                                  py-2
                                  rounded
                                  bg-panel
                                  border
                                  border-border
                                  text-xs
                                "
                              >

                                {conditionOperators.map(
                                  operator => (

                                    <option

                                      key={
                                        operator.value
                                      }

                                      value={
                                        operator.value
                                      }

                                    >

                                      {
                                        operator.label
                                      }

                                    </option>

                                  )
                                )}

                              </select>

                            </div>


                            {/* =================================
                                VALUE
                            ================================= */}

                            {(
                              condition.operator ===
                                "equals" ||
                              condition.operator ===
                                "notEquals" ||
                              condition.operator ===
                                "contains" ||
                              condition.operator ===
                                "notContains" ||
                              condition.operator ===
                                "greaterThan" ||
                              condition.operator ===
                                "greaterThanOrEqual" ||
                              condition.operator ===
                                "lessThan" ||
                              condition.operator ===
                                "lessThanOrEqual"
                            ) && (

                              <div>

                                <div
                                  className="
                                    text-[10px]
                                    font-semibold
                                    text-gray-400
                                    mb-1
                                  "
                                >

                                  Value

                                </div>


                                {/* =================================
                                    ENUM / OPTIONS
                                ================================= */}

                                {conditionValueOptions.length >
                                  0 ? (

                                  <select

                                    value={
                                      condition.value ??
                                      ""
                                    }

                                    onChange={
                                      event =>
                                        handleConditionValueChange(
                                          index,
                                          event.target.value,
                                          conditionType
                                        )
                                    }

                                    className="
                                      w-full
                                      px-2
                                      py-2
                                      rounded
                                      bg-panel
                                      border
                                      border-border
                                      text-xs
                                    "
                                  >

                                    <option value="">
                                      Select value
                                    </option>


                                    {conditionValueOptions.map(
                                      option => (

                                        <option

                                          key={
                                            String(
                                              option
                                            )
                                          }

                                          value={
                                            option
                                          }

                                        >

                                          {
                                            option
                                          }

                                        </option>

                                      )
                                    )}

                                  </select>

                                ) : conditionType ===
                                    "boolean" ? (

                                  /* =================================
                                      BOOLEAN
                                  ================================= */

                                  <select

                                    value={
                                      condition.value ===
                                        true
                                        ? "true"
                                        : "false"
                                    }

                                    onChange={
                                      event =>
                                        handleConditionValueChange(
                                          index,
                                          event.target.value,
                                          "boolean"
                                        )
                                    }

                                    className="
                                      w-full
                                      px-2
                                      py-2
                                      rounded
                                      bg-panel
                                      border
                                      border-border
                                      text-xs
                                    "
                                  >

                                    <option value="true">
                                      True
                                    </option>

                                    <option value="false">
                                      False
                                    </option>

                                  </select>

                                ) : conditionType ===
                                    "number" ? (

                                  /* =================================
                                      NUMBER
                                  ================================= */

                                  <input

                                    type="number"

                                    value={
                                      condition.value ===
                                        undefined ||
                                      condition.value ===
                                        null
                                        ? ""
                                        : condition.value
                                    }

                                    onChange={
                                      event =>
                                        handleConditionValueChange(
                                          index,
                                          event.target.value,
                                          "number"
                                        )
                                    }

                                    className="
                                      w-full
                                      px-2
                                      py-2
                                      rounded
                                      bg-panel
                                      border
                                      border-border
                                      text-xs
                                    "

                                  />

                                ) : (

                                  /* =================================
                                      STRING
                                  ================================= */

                                  <input

                                    type="text"

                                    value={
                                      condition.value ===
                                        undefined ||
                                      condition.value ===
                                        null
                                        ? ""
                                        : String(
                                            condition.value
                                          )
                                    }

                                    placeholder="Enter value"

                                    onChange={
                                      event =>
                                        handleConditionValueChange(
                                          index,
                                          event.target.value,
                                          "string"
                                        )
                                    }

                                    className="
                                      w-full
                                      px-2
                                      py-2
                                      rounded
                                      bg-panel
                                      border
                                      border-border
                                      text-xs
                                    "

                                  />

                                )}

                              </div>

                            )}

                          </div>

                        )

                      ) : (

                        <div
                          className="
                            mt-2
                            text-[10px]
                            text-gray-500
                          "
                        >

                          No conditions are defined for
                          this action.

                        </div>

                      )

                    )}

                  </div>

                );

              }
            )}

          </div>

        )}

      </div>

    </InspectorSection>

  );

}
