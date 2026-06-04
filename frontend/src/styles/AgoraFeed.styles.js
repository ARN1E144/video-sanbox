export const agoraFeedStyles = {
  root: {
    width: "100%",
    height: "100%",
    position: "relative",
    background: "#000",
    overflow: "hidden",
  },

  remote: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  pip: {
    position: "absolute",
    bottom: "4%",
    right: "4%",
    width: "25%",
    height: "25%",
    borderRadius: 8,
    overflow: "hidden",
    background: "#000",
    border: "1px solid #333",
  },

  pipInner: (mirror) => ({
    width: "100%",
    height: "100%",
    transform: mirror ? "scaleX(-1)" : "none",
  }),
};