import StartStream from "./StartStream";
import StopStream from "./StopStream";

// src/actions/agora/TogglePlay.js
export default async function TogglePlay(ctx, { id, localVideoTrack, localAudioTrack, clientRef }) {
  const current = ctx.bindings?.[id]?.playing;

  if (current) {
    // Currently playing → stop
    await StopStream(ctx, { id, localVideoTrack, localAudioTrack, clientRef });
  } else {
    // Currently stopped → start
    await StartStream(ctx, { id, localVideoTrack, localAudioTrack, clientRef });
  }

  return { success: true, playing: !current };
}