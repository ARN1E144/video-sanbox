const mock_classroom = `
() => {
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
`;

export default mock_classroom;
