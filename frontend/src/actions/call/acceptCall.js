// src/actions/call/acceptCall.js

import api from "../../services/api";

export default async function acceptCall(ctx, params = {}) {

  try {

    const { callId } = params;


    if (!callId) {

      return {
        ok:false,
        error:"MISSING_CALL_ID",
      };

    }


    const { data } =
      await api.post(
        `/calls/${callId}/accept`
      );


    const call = data.call;


    const channel =
      call.channelName;



    ctx.patch?.("call", {

      id: callId,

      channel,

      state:"accepted",

      joined:false,

      remoteUsers:[],

      participants:[],

      acceptedAt:Date.now(),

    });



    console.log(
      "%c[CALL ACCEPTED]%c",
      "background-color:#10B981;color:white;font-weight:bold;padding:2px 6px;",
      "",
      ctx.get?.("call")
    );


    return {

      ok:true,

      result:{

        id:callId,

        channel,

        state:"accepted"

      }

    };


  } catch(err) {

    console.error(
      "[acceptCall]",
      err
    );


    return {

      ok:false,

      error:err.message

    };

  }

}