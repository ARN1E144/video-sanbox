export default async function toggleMic(ctx) {

    const agora = ctx?.agora;


    if (!agora?.localAudioTrack) {

        return {
            ok:false,
            error:"AUDIO_TRACK_UNAVAILABLE"
        };

    }


    const enabled =
        !agora.localAudioTrack.enabled;


    await agora.localAudioTrack.setEnabled(
        enabled
    );


    ctx.patch(
        "media",
        {
            ...ctx.get("media"),
            micEnabled: enabled
        }
    );


    console.log(
        "[toggleMic]",
        {
            micEnabled: enabled
        }
    );


    return {
        ok:true,
        micEnabled: enabled
    };

}