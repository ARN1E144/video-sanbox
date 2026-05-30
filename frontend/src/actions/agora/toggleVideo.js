export default {
  label: "Toggle Video",

  run: async (ctx) => {
    return await ctx.agora.toggleVideo();
  },
};