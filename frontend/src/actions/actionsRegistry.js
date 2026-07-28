// src/actions/actionsRegistry.js

import startStream from "./video/startStream";
import stopStream from "./video/stopStream";
import loadVideo from "./video/loadVideo";
import loadRemote from "./video/loadRemote";
import togglePlay from "./video/togglePlay";

import startCall from "./call/startCall";
import acceptCall from "./call/acceptCall";
import leaveCall from "./call/leaveCall";
import endCall from "./call/endCall";
import fetchAvailableCalls from "./call/fetchAvailableCalls";
import spotlightUser from "./call/spotlightUser";

import toggleMic from "./call/toggleMic";

import {
  setColor,
  applyThemeAction,
} from "../runtime/actions/themeActions";



/* =========================================================
   ACTION CONSTANTS
========================================================= */

export const ACTIONS = {

  // CALL LIFECYCLE
  CALL_START: "call.startCall",
  CALL_ACCEPT: "call.acceptCall",
  CALL_JOIN: "call.joinCall",
  CALL_LEAVE: "call.leaveCall",
  CALL_END: "call.endCall",
  CALL_FETCH: "call.fetchAvailableCalls",
  CALL_SPOTLIGHT: "call.spotlightUser",

  // CALL MEDIA
  CALL_TOGGLE_MIC: "call.toggleMic",
  CALL_TOGGLE_VIDEO: "call.toggleVideo",

  // VIDEO
  VIDEO_START_STREAM: "video.startStream",
  VIDEO_STOP_STREAM: "video.stopStream",
  VIDEO_LOAD_VIDEO: "video.loadVideo",
  VIDEO_LOAD_REMOTE: "video.loadRemote",
  VIDEO_TOGGLE_PLAY: "video.togglePlay",

  // THEME
  THEME_SET_COLOR: "theme.setColor",
  THEME_APPLY: "theme.apply",

};

export const actionAliases = {

  "agora.toggleMic":
    "call.toggleMic",

  "agora.toggleVideo":
    "call.toggleVideo",

};

/* =========================================================
   HELPERS
========================================================= */


const createAction = ({
  value,
  label,
  category,
  run,
  targets = [],
}) => ({
  value,
  label,
  category,
  run,
  targets,
});



const requireCallJoined = (ctx, label) => {

  if (!ctx?.get?.("call.joined")) {

    ctx?.notify?.(
      `${label} requires active call`
    );

    return false;
  }

  return true;
};



const safeAgora = (ctx) => {

  if (!ctx?.agora) {

    ctx?.notify?.(
      "Agora engine unavailable"
    );

    return null;
  }

  return ctx.agora;

};




/* =========================================================
   ACTION REGISTRY
========================================================= */


export const actionRegistry = {

  call: {

    startCall: createAction({
      value: ACTIONS.CALL_START,
      label:"Start Call",
      category:"call",
      run:startCall,
      targets:["CallPanel","AgoraFeed"],
    }),


    acceptCall:createAction({
      value:ACTIONS.CALL_ACCEPT,
      label:"Accept Call",
      category:"call",
      run:acceptCall,
      targets:["CallPanel","AgoraFeed"],
    }),


    joinCall:createAction({

      value:ACTIONS.CALL_JOIN,
      label:"Join Call",
      category:"call",

      run: async(ctx,params)=>{

        const agora = ctx?.agora;


        if(!agora?.joinCall){
          return {
            ok:false,
            error:"AGORA_UNAVAILABLE"
          };
        }


        const call = ctx.get("call");


        if(!call?.channel){
          return {
            ok:false,
            error:"MISSING_CHANNEL"
          };
        }


        const joined = await agora.joinCall({
          channel:call.channel,
          token:params?.token || null,
          uid:ctx.get("user.id") || null
        });


        if(!joined){
          return {
            ok:false,
            error:"AGORA_JOIN_FAILED"
          };
        }


        ctx.set("call",{
          ...call,
          joined:true,
          state:"connected"
        });


        return {
          ok:true,
          channel:call.channel
        };

        
      },

      targets:["AgoraFeed"]

    }),


    toggleMic:createAction({
      value:ACTIONS.CALL_TOGGLE_MIC,
      label:"Toggle Mic",
      category:"call",
      run:toggleMic,
      targets:["AgoraFeed"]
    }),



    toggleVideo:createAction({
      value:ACTIONS.CALL_TOGGLE_VIDEO,
      label:"Toggle Video",
      category:"call",
      run:async(ctx)=>{

        const agora=ctx.agora;

        if(!agora?.toggleVideo){
          return {
            ok:false,
            error:"AGORA_UNAVAILABLE"
          };
        }


        await agora.toggleVideo();


        return {
          ok:true
        };

      },
      targets:["AgoraFeed"]
    }),



    leaveCall:createAction({
      value:ACTIONS.CALL_LEAVE,
      label:"Leave Call",
      category:"call",
      run:leaveCall,
      targets:["AgoraFeed"]
    }),


    endCall:createAction({
      value:ACTIONS.CALL_END,
      label:"End Call",
      category:"call",
      run:endCall,
      targets:["CallPanel"]
    }),

  },




/* =========================================================
   VIDEO SYSTEM
========================================================= */


video:{


  startStream:createAction({

    value:ACTIONS.VIDEO_START_STREAM,

    label:"Start Stream",

    category:"video",

    run:startStream,

    targets:[
      "VideoFeed",
    ],

  }),



  stopStream:createAction({

    value:ACTIONS.VIDEO_STOP_STREAM,

    label:"Stop Stream",

    category:"video",

    run:stopStream,

    targets:[
      "VideoFeed",
    ],

  }),



  loadVideo:createAction({

    value:ACTIONS.VIDEO_LOAD_VIDEO,

    label:"Load Video",

    category:"video",

    run:loadVideo,

    targets:[
      "VideoFeed",
    ],

  }),



  loadRemote:createAction({

    value:ACTIONS.VIDEO_LOAD_REMOTE,

    label:"Load Remote",

    category:"video",

    run:loadRemote,

    targets:[
      "VideoFeed",
    ],

  }),



  togglePlay:createAction({

    value:ACTIONS.VIDEO_TOGGLE_PLAY,

    label:"Toggle Play",

    category:"video",

    run:togglePlay,

    targets:[
      "VideoFeed",
    ],

  }),


},




/* =========================================================
   THEME SYSTEM
========================================================= */


theme:{


  setColor:createAction({

    value:ACTIONS.THEME_SET_COLOR,

    label:"Set Theme Color",

    category:"theme",

    run:setColor,

  }),



  apply:createAction({

    value:ACTIONS.THEME_APPLY,

    label:"Apply Theme",

    category:"theme",

    run:applyThemeAction,

  }),


},



};





/* =========================================================
   LOOKUP HELPERS
========================================================= */


export const getAction = (value)=>{

  const resolved =
    actionAliases[value] || value;


  const [
    category,
    name
  ] = resolved.split(".");


  return (
    actionRegistry?.[category]?.[name]
    ||
    null
  );

};



export const getAllActions = ()=>{

  return Object.values(
    actionRegistry
  )
  .flatMap(
    category =>
      Object.values(category)
  );

};