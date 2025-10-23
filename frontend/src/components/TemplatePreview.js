import React, { useState } from "react";
import MockLiveStream from "../mockTemplates/mock_liveStream";
import MockVideoCall from "../mockTemplates/mock_videoCall";
import MockTikTokFeed from "../mockTemplates/mock_tiktokFeed";
import MockClassroom from "../mockTemplates/mock_classroom";

const templates = {
  live: <MockLiveStream />,
  call: <MockVideoCall />,
  tiktok: <MockTikTokFeed />,
  classroom: <MockClassroom />,
};

export default function TemplatePreview() {
  const [selected, setSelected] = useState("live");

  return (
    <div style={{ padding: 20 }}>
      <h2>🎬 Select Mock Template</h2>
      <select
        onChange={(e) => setSelected(e.target.value)}
        value={selected}
        style={{ marginBottom: 20 }}
      >
        <option value="live">Live Stream</option>
        <option value="call">Video Call</option>
        <option value="tiktok">TikTok Feed</option>
        <option value="classroom">Classroom</option>
      </select>
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 10,
          padding: 20,
          minHeight: 400,
        }}
      >
        {templates[selected]}
      </div>
    </div>
  );
}
