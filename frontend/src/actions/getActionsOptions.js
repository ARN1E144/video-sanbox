// src/actions/getActionsOptions.js

import {
  actionRegistry,
} from "./actionsRegistry";


// =====================================================
// GET ACTION OPTIONS
// =====================================================
//
// Returns the action metadata required by the builder.
//
// The inspector can now use:
//
//   targets
//   requires
//   produces
//   conditionPaths
//   nextActions
//   params
//
// This keeps actionsRegistry.js as the single source
// of truth for action relationships.
//
// =====================================================

export function getActionOptions() {

  const options = [];


  Object.entries(
    actionRegistry
  ).forEach(
    (
      [
        category,
        actions,
      ]
    ) => {

      Object.entries(
        actions
      ).forEach(
        (
          [
            name,
            action,
          ]
        ) => {

          if (
            !action ||
            typeof action !==
              "object"
          ) {

            return;

          }


          options.push({

            // -------------------------------------------
            // Identity
            // -------------------------------------------

            value:
              action.value ||
              `${category}.${name}`,

            label:
              action.label ||
              name,

            category:
              action.category ||
              category,


            // -------------------------------------------
            // Relationship metadata
            // -------------------------------------------

            targets:
              Array.isArray(
                action.targets
              )
                ? [
                    ...action.targets,
                  ]
                : [],

            requires:
              Array.isArray(
                action.requires
              )
                ? [
                    ...action.requires,
                  ]
                : [],

            produces:
              Array.isArray(
                action.produces
              )
                ? [
                    ...action.produces,
                  ]
                : [],

            conditionPaths:
              Array.isArray(
                action.conditionPaths
              )
                ? [
                    ...action.conditionPaths,
                  ]
                : [],

            nextActions:
              Array.isArray(
                action.nextActions
              )
                ? [
                    ...action.nextActions,
                  ]
                : [],


            // -------------------------------------------
            // Parameter metadata
            // -------------------------------------------

            params:
              action.params &&
              typeof action.params ===
                "object" &&
              !Array.isArray(
                action.params
              )
                ? {
                    ...action.params,
                  }
                : {},


            // -------------------------------------------
            // Runtime runner
            //
            // Kept available because some existing
            // consumers may inspect it.
            // -------------------------------------------

            run:
              action.run,

          });

        }
      );

    }
  );


  // ===================================================
  // DEBUG
  // ===================================================

  console.log(
    "[ACTION OPTIONS]",
    options.map(
      action => ({

        value:
          action.value,

        label:
          action.label,

        category:
          action.category,

        targets:
          action.targets,

        requires:
          action.requires,

        produces:
          action.produces,

        conditionPaths:
          action.conditionPaths,

        nextActions:
          action.nextActions,

      })
    )
  );


  return options;

}
