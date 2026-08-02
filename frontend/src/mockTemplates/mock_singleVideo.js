const singleVideo = {
  name: 'Single Video Viewer',
  thumbnail: '/thumbnails/singleVideo.png',

  tree: {
    type: 'App',

    children: [

      {
        type: 'AppBar',
        props: {
          title: 'Video Viewer',
          actions: ['EndCall']
        }
      },

      {
        type: 'Container',

        props: {
          layout: 'grid',
          align: 'center',
          justify: 'center'
        },

        children: [

          {
            type: 'VideoFeed',

            props: {
              mode: 'local',
              enabled: true,
              playing: true,
              muted: true,
              mirror: true,
              objectFit: 'cover'
            }

          }

        ]

      }

    ]

  }

};

export default singleVideo;