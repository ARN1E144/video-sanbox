import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export const generateTemplate = async (prompt) => {
  const res = await axios.post(`${BASE_URL}/ai/generate`, { prompt });
  return res.data;
};

export const getAgoraToken = async (channel) => {
  const res = await axios.get(`${BASE_URL}/agora/token?channel=${channel}`);
  return res.data;
};
