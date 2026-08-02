import api from "../../services/api";

export default async function startCall(ctx, params = {}) {

  try {

    const { data } = await api.post("/calls", {
      recipientId: params.recipientId,
    });


    const call = data.call;


    ctx.patch?.("call", {

      id: call._id,

      channel: call.channelName,

      state:"ringing",

      joined:false,

      remoteUsers:[],

      participants:[],

      createdAt:Date.now(),

    });

    console.log(
  "[startCall ctx]",
    Object.keys(ctx)
  );

  console.log(
    "[startCall runAction]",
    ctx.runAction
  );

    const joinResult =
      await ctx.runAction?.(
        "call.joinCall"
      );


    if(!joinResult?.ok){

      return {
        ok:false,
        error:"CALL_CREATED_BUT_JOIN_FAILED"
      };

    }


    return {

      ok:true,

      result:{

        id:call._id,

        channel:call.channelName,

        state:"joined"

      }

    };


  } catch(err) {

    console.error("[startCall]",err);

    return {
      ok:false,
      error:err.message
    };

  }

}