// src/actions/call/endCall.js

import { CALL_IDLE_STATE } from "../../runtime/models/callIdleState";



export default async function endCall(ctx){

    const agora = ctx.agora;

    const currentCall =
        ctx.get("call");


    try {


        if(agora && currentCall?.joined){

            await agora.leaveCall();

        }


        ctx.patch?.(
            "call",
            {

                ...CALL_IDLE_STATE,

                endedAt:Date.now(),

            }
        );


        return {

            ok:true,

            result:{
                state:"idle"
            },

            ended:true

        };


    } catch(error){


        console.error(
            "[CALL] end failed",
            error
        );


        return {

            ok:false,

            error:error.message

        };

    }

}