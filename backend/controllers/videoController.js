// controllers/videoController.js

// Start a test stream (returns a fixed HLS URL)
export async function startStream(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Video ID required" });

  try {
    console.log(`Starting stream for video ${id}`);

    // Hardcoded test HLS stream
    const streamUrl = `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`;

    // Return the URL directly to frontend
    return res.json({ status: "started", videoUrl: streamUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to start stream" });
  }
}

// Stop the test stream (frontend clears the src)
export async function stopStream(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Video ID required" });

  try {
    console.log(`Stopping stream for video ${id}`);
    // No actual backend stream to stop for the test URL
    return res.json({ status: "stopped" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to stop stream" });
  }
}

// Toggle play/pause (optional placeholder)
export async function togglePlay(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Video ID required" });

  try {
    console.log(`Toggling play/pause for video ${id}`);
    return res.json({ status: "toggled" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to toggle" });
  }
}