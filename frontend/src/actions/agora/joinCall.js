export default {
  label: "Join Call",

  run: async (ctx, params) => {
    const { agora } = ctx;

    return await agora.joinCall({
      channel: params.channel,
      tokenEndpoint: params.tokenEndpoint,
    });
  },
};