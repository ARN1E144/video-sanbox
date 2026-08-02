export const INITIAL_RUNTIME_STATE = {

    runtime: {
        ready: false,
    },

    call: {

        id: null,

        channel: null,

        state: "idle",

        joined: false,

        remoteUsers: [],

        participants: [],

        owner: null,

    },

    media: {

        // User intent
        micEnabled: true,

        videoEnabled: true,


        // Actual Agora state
        audioPublished: false,

        videoPublished: false,


        // Device availability
        microphoneAvailable: false,

        cameraAvailable: false,


        screenSharing: false,

    },

    calls: {

        available: [],

        loading: false,

        lastUpdated: null,

    },

    user: {},

    agora: {
         uid: null,

        connected: false,

        localAudioTrack: false,

        localVideoTrack: false,
    },

};