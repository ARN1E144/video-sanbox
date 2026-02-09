// src/components/LazyAgoraFeed.js
import React, { useState, useEffect } from "react";

export default function LazyAgoraFeed({ userId, role }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#1e1e2f",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: 12,
        color: "#aaa",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {isLoaded ? (
        <span>{role ? `${role} Feed` : "Agora Feed"}</span>
      ) : (
        <div className="animate-pulse w-full h-full bg-gray-700" />
      )}
    </div>
  );
}
