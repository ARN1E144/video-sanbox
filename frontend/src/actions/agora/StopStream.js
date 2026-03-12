// src/actions/agora/StopStream.js
export default async function StopStream(ctx, { id, localVideoTrack, localAudioTrack, clientRef }) {
  // Update binding
  ctx.updateBinding?.(id, { playing: false });

  // Stop local tracks
  if (localVideoTrack?.current) localVideoTrack.current.stop();
  if (localAudioTrack?.current) clientRef?.current?.unpublish([localAudioTrack.current, localVideoTrack.current]);

  return { success: true };
}