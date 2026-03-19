import api from "./api";

export const sendPitch = async (pitchData) => {
  const { data } = await api.post("/script-pitches/send", pitchData);
  return data;
};

export const getInvestorPitches = async () => {
  const { data } = await api.get("/script-pitches/investor");
  return data;
};

export const updatePitchStatus = async (pitchId, status) => {
  const { data } = await api.put(`/script-pitches/${pitchId}/status`, { status });
  return data;
};
