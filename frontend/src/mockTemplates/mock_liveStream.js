const mock_liveStream = `
() => {
  const [isLive, setIsLive] = React.useState(false);

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
`;

export default mock_liveStream;
