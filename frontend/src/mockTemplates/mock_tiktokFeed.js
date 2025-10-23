const mock_tiktokFeed = `
() => {
  const videos = [
    "https://www.w3schools.com/html/mov_bbb.mp4",
    "https://www.w3schools.com/html/movie.mp4",
    "https://www.w3schools.com/html/mov_bbb.mp4",
  ];

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
`;

export default mock_tiktokFeed;
