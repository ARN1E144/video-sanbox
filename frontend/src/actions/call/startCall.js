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
      "%c[CALL AFTER PATCH]%c",
      "background-color:#3B82F6;color:white;font-weight:bold;padding:2px 6px;border-radius:3px;",
      "",
      ctx.get("call")
    );


    return {

      ok:true,

      result:{

        id:call._id,

        channel:call.channelName,

        state:"ringing"

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