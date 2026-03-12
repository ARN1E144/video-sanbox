// src/actions/agora/StartStream.js
export default async function StartStream(ctx, { id, localVideoTrack, localAudioTrack, clientRef }) {
  // Update binding
  ctx.updateBinding?.(id, { playing: true });

  // Resume local tracks if available
  if (localVideoTrack?.current) {
    localVideoTrack.current.play(document.querySelector(`#local-${id}`));
  }
  if (localAudioTrack?.current) {
    clientRef?.current?.publish([localAudioTrack.current, localVideoTrack.current]);
  }

  return { success: true };
}