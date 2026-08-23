// src/actions/call/joinCall.js

export default async function joinCall(ctx) {

  const FORCE_JOIN_FAILURE =
    window.__FORCE_AGORA_JOIN_FAILURE__ === true;

  console.log(
    "================================================="
  );

  console.log(
    "[joinCall ACTION] START"
  );

  console.log(
    "================================================="
  );

  console.log(
    "[joinCall ACTION] START"
  );

  console.log(
    "================================================="
  );

  console.log(
    "[joinCall ACTION] ctx.agora:",
    ctx.agora
  );

  console.log(
    "[joinCall ACTION] ctx.call:",
    ctx.get?.("call")
  );

  const agora = ctx.agora;

  if (!agora?.joinCall) {

    console.error(
      "[joinCall ACTION] AGORA UNAVAILABLE",
      {
        agora,
        hasJoinCall:
          !!agora?.joinCall
      }
    );

    return {
      ok: false,
      error: "AGORA_UNAVAILABLE"
    };

  }

  const call =
    ctx.get("call");

  console.log(
    "[joinCall ACTION] CALL BEFORE JOIN:",
    {
      id: call?.id,
      channel: call?.channel,
      state: call?.state,
      joined: call?.joined,
    }
  );

  if (!call?.channel) {

    console.error(
      "[joinCall ACTION] MISSING CHANNEL",
      {
        call
      }
    );

    return {
      ok: false,
      error: "MISSING_CHANNEL"
    };

  }

  console.log(
    "[joinCall ACTION] CALLING AGORA:",
    {
      channel: call.channel
    }
  );

 


  // transition state first
  ctx.patch?.("call", {

    state:"joining"

  });


  if (FORCE_JOIN_FAILURE) {

  console.warn(
    "[DEV] FORCING AGORA JOIN FAILURE"
  );

  ctx.patch?.("call", {

    state: "accepted",

    joined: false

  });

  return {

    ok: false,

    error: "DEV_FORCED_AGORA_JOIN_FAILURE"

  };

}


  const joined =
    await agora.joinCall({
      channel:call.channel,
    });



  if (!joined) {

    ctx.patch?.("call", {

      state:"accepted",

      joined:false

    });


    return {
      ok:false,
      error:"AGORA_JOIN_FAILED"
    };

  }



  ctx.patch?.("call", {

    joined:true,

    state:"joined"

});


ctx.patch?.("agora", {

    uid:agora.uid,

    connected:true

});



  return {

    ok:true,

    result:{

      channel:call.channel,

      uid:agora.uid,

      state:"joined"

    }

  };

}