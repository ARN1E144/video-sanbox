// src/actions/call/joinCall.js

export default async function joinCall(ctx) {

  const agora = ctx.agora;


  if (!agora?.joinCall) {

    return {
      ok:false,
      error:"AGORA_UNAVAILABLE"
    };

  }


  const call =
    ctx.get("call");


  if (!call?.channel) {

    return {
      ok:false,
      error:"MISSING_CHANNEL"
    };

  }


  // transition state first
  ctx.patch?.("call", {

    state:"joining"

  });


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

    state:"joined",

    uid:agora.uid,

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