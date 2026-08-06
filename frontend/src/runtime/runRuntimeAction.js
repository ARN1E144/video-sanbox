import { getAction } from "../actions/actionsRegistry";

export async function runRuntimeAction(
  actionValue,
  ctx,
  params
) {

  console.log("[RUN ACTION]", actionValue);

  console.log(
  "[ACTION AUTH CHECK]",
  {
    actionValue,
    role:ctx.runtimeAuth.role,
    allowed:ctx.runtimeAuth.allowedActions
  }
);


  /*
  ----------------------------------------
  Runtime Permission Check
  ----------------------------------------
  */

  const allowedActions =
    ctx.runtimeAuth?.allowedActions || [];


  if(
    !allowedActions.includes(actionValue)
  ){

    console.warn(
      "[ACTION BLOCKED]",
      {
        action: actionValue,
        role: ctx.runtimeAuth?.role,
        allowedActions
      }
    );


    return {
      ok:false,
      error:"permission_denied"
    };

  }



  const action = getAction(actionValue);


  console.log(
    "[RESOLVED ACTION]",
    action
  );


  if (!action) {
    return {
      ok:false,
      error:"missing_action"
    };
  }


  return action.run(
    ctx,
    params
  );
}