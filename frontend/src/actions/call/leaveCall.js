
export default async function leaveCall(ctx){

    const agora = ctx.agora;
    const currentCall = ctx.get("call");


    /*
      Already clean
      Makes leaveCall safe to call multiple times
    */
    if(
        !currentCall?.joined &&
        !currentCall?.channel
    ){

        console.log(
            "[CALL] No active call"
        );

        return {
            ok:true,
            alreadyClean:true
        };

    }


    if(!agora){

        return {
            ok:false,
            error:"AGORA_UNAVAILABLE"
        };

    }


    try {


        await agora.leaveCall();


        ctx.set(
            "call",
            {
                ...currentCall,

                joined:false,

                state:"idle",

                micMuted:false,

                videoEnabled:false,
                
            }
        );


        return {
            ok:true
        };


    } catch(error){


        console.error(
            "[CALL] leave failed",
            error
        );


        return {
            ok:false,
            error:error.message
        };

    }

}