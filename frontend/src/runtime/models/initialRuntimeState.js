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

interview: {
  id: null,
  projectId: null,

  status: "idle",

  currentQuestionIndex: 0,

  questions: [],

  currentQuestion: "Interview question will appear here",

  answer: {
    text: "",
    startedAt: null,
    completedAt: null,
  },

  answers: [],

  recording: {
    status: "idle",
    startedAt: null,
    stoppedAt: null,
  },

  transcription: {
    status: "idle",
    text: "",
  },

  started: false,
  completed: false,

  result: null,
},

 user:{}

};