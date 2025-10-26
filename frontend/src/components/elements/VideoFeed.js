import React, { useEffect, useRef } from "react";

export default function VideoFeed({ label, style, streamUrl }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!streamUrl) return;

    const video = videoRef.current;
    video.srcObject = null;

    if (streamUrl === "camera") {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          video.srcObject = stream;
        })
        .catch((err) => console.error("🎥 Camera error:", err));
    } else {
      video.src = streamUrl;
    }
  }, [streamUrl]);

  return (
    <div className="w-full h-full relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls={false}
        muted
        className="w-full h-full object-cover"
      />
      {label && (
        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {label}
        </div>
      )}
    </div>
  );
}
