export default async function toggleMic(ctx) {

    const agora = ctx?.agora;


    if (!agora?.localAudioTrack) {

        return {
            ok:false,
            error:"AUDIO_TRACK_UNAVAILABLE"
        };

    }


    const currentState = agora.localAudioTrack.muted;

    const nextState = !currentState;


    await agora.localAudioTrack.setMuted(nextState);


    console.log(
        "[toggleMic]",
        currentState,
        "=>",
        nextState
    );


    ctx.set("call",{
        ...ctx.get("call"),
        micMuted: nextState
    });


    return {
        ok:true,
        muted:nextState
    };

}