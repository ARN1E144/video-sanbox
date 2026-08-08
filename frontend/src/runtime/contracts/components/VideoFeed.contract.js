export default {

name:"VideoFeed",

version:"1.0",

category:"media",

icon:"📹",


builder:{

 roles:[
   "owner",
   "admin"
 ],

 visible:true

},


runtime:{

 roles:[
   "owner",
   "host",
   "participant",
   "viewer"
 ]

},



editableProps:{
  // keep your existing editableProps here
},



bindings:{

 src:{
   type:"string"
 },

 playing:{
   type:"boolean"
 },

 currentTime:{
   type:"number"
 },

 duration:{
   type:"number"
 }

},



actions:{

 inputs:[

   "media.load",
   "media.play",
   "media.pause",
   "media.stop",
   "media.seek",
   "media.restart",
   "media.setVolume",
   "media.setSource"

 ],

 outputs:[]

},



events:{

 inputs:[],

 outputs:[

   "media.loaded",
   "media.playing",
   "media.paused",
   "media.ended",
   "media.error",
   "media.timeChanged"

 ]

},



targets:{

 accepts:[

   "VideoSource",
   "Stream",
   "MediaController"

 ],

 rejects:[

   "call.toggleMic",
   "call.joinCall"

 ]

},



validation:{

 required:[

   "mode"

 ]

}


};