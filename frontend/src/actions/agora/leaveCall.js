run: async (ctx) => {
  const agora = ctx?.agora;

  if (!agora?.leaveCall) {
    ctx?.notify?.("Call engine unavailable");

    return {
      success: false,
      error: "AGORA_NOT_AVAILABLE",
    };
  }

  await agora.leaveCall();

  return {
    success: true,
    set: {
      "call.joined": false,
      "call.state": "disconnected",
    },
  };
}