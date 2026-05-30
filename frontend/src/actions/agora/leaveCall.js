export default {
  label: "Leave Call",

  run: async (ctx) => {
    return await ctx.agora.leaveCall();
  },
};