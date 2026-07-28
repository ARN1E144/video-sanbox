export default async function endCall(ctx){

    const agora = ctx.agora;

    if(agora){
        await agora.leaveCall();
    }


    ctx.set("call",{

        id:null,

        channel:null,

        joined:false,

        state:"idle",

        micMuted:false,

        videoEnabled:false

    });



    return {
        ok:true,
        ended:true
    };

}