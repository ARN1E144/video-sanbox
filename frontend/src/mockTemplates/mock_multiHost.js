// src/mockTemplates/mock_singleVideo.js
const multiHost = {
  name: 'Single Video Viewer',
  thumbnail: '/thumbnails/singleVideo.png', // optional preview image
  tree: {
    type: 'App',
    children: [
      { type: 'AppBar', props: { title: 'Video Viewer', actions: ['EndCall'] } },
      {
        type: 'Container',
        props: { layout: 'grid', align: 'center', justify: 'center' },
        children: [
          { type: 'VideoFeed', props: { autoplay: true, muted: false, controls: true } },
        ],
      },
    ],
  },
};
export default multiHost;
