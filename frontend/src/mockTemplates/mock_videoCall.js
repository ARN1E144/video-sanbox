const mock_videoCall = `
() => {
  const [inCall, setInCall] = React.useState(false);

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
`;

export default mock_videoCall;
