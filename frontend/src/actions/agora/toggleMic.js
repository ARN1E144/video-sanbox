export default {
  label: "Toggle Mic",

  run: async (ctx) => {
    return await ctx.agora.toggleMic();
  },
};