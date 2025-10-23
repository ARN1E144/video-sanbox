#!/usr/bin/env node
import fs from "fs";
import path from "path";

const baseDir = path.join(process.cwd(), "frontend/src");

// Define directories
const mockDir = path.join(baseDir, "mockTemplates");
const componentsDir = path.join(baseDir, "components");

// Ensure folders exist
fs.mkdirSync(mockDir, { recursive: true });
fs.mkdirSync(componentsDir, { recursive: true });

// ---------- Mock Templates ---------- //
const templates = {
  mock_liveStream: `
import React, { useState } from "react";

export default function MockLiveStream() {
  const [isLive, setIsLive] = useState(false);

  return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <h1>🎥 Mock Live Stream</h1>
      <p>Simulated environment for live streaming UI.</p>
      {!isLive ? (
        <button
          onClick={() => setIsLive(true)}
          style={{ padding: 10, fontSize: 16 }}
        >
          Go Live
        </button>
      ) : (
        <div>
          <p>🔴 Live Now</p>
          <video
            width="400"
            controls
            autoPlay
            muted
            loop
            src="https://www.w3schools.com/html/mov_bbb.mp4"
          />
        </div>
      )}
    </div>
  );
}
`,

  mock_videoCall: `
import React, { useState } from "react";

export default function MockVideoCall() {
  const [inCall, setInCall] = useState(false);

  return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <h1>📞 Mock 1:1 Video Call</h1>
      <p>Simulates a peer-to-peer video call interface.</p>
      {!inCall ? (
        <button
          onClick={() => setInCall(true)}
          style={{ padding: 10, fontSize: 16 }}
        >
          Start Call
        </button>
      ) : (
        <div>
          <p>Connected to peer...</p>
          <video
            width="300"
            autoPlay
            muted
            loop
            src="https://www.w3schools.com/html/mov_bbb.mp4"
          />
          <p>Remote stream simulated</p>
        </div>
      )}
    </div>
  );
}
`,

  mock_tiktokFeed: `
import React from "react";

const videos = [
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://www.w3schools.com/html/movie.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4",
];

export default function MockTikTokFeed() {
  return (
    <div style={{ overflowY: "scroll", height: "90vh" }}>
      {videos.map((src, i) => (
        <div key={i} style={{ marginBottom: 30, textAlign: "center" }}>
          <video
            width="300"
            autoPlay
            muted
            loop
            src={src}
            style={{ borderRadius: 10 }}
          />
          <p>🎬 Video #{i + 1}</p>
        </div>
      ))}
    </div>
  );
}
`,

  mock_classroom: `
import React from "react";

export default function MockClassroom() {
  return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <h1>🏫 Mock Video Classroom</h1>
      <p>Instructor with student view layout.</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          marginTop: 20,
        }}
      >
        <video
          width="100%"
          autoPlay
          muted
          loop
          src="https://www.w3schools.com/html/mov_bbb.mp4"
        />
        <div style={{ display: "grid", gap: 10 }}>
          {[1, 2, 3, 4].map((n) => (
            <video
              key={n}
              width="100%"
              autoPlay
              muted
              loop
              src="https://www.w3schools.com/html/movie.mp4"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
`,
};

// Write template files
Object.entries(templates).forEach(([name, code]) => {
  fs.writeFileSync(path.join(mockDir, `${name}.js`), code.trim() + "\n");
});

// ---------- TemplatePreview component ---------- //
const templatePreview = `
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
`;

// Write TemplatePreview.js
fs.writeFileSync(path.join(componentsDir, "TemplatePreview.js"), templatePreview.trim() + "\n");

console.log("✅ Mock video app templates and preview component created successfully!");
