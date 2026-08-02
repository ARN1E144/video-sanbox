export const INITIAL_RUNTIME_STATE = {

 runtime:{
    ready:false
 },


 call:{

    id:null,

    channel:null,

    state:"idle",

    joined:false,

    remoteUsers:[],

    participants:[],

    owner:null

 },


 agora:{

    uid:null,

    connected:false,

    localAudioTrack:false,

    localVideoTrack:false

 },


 media:{

    micEnabled:true,

    videoEnabled:true,

    audioPublished:false,

    videoPublished:false

 },


 calls:{

    available:[],

    loading:false,

    lastUpdated:null

 },


 user:{}

};