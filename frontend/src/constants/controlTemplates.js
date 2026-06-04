export const CONTROL_TEMPLATES = {
  mic: {
    id: "mic",
    label: "Mute",
    icon: "Mic",
    type: "system",
    systemType: "mic",
    action: "agora.toggleMic",
    targetId: "",
    bindId: "",
    config: {},
  },

  camera: {
    id: "camera",
    label: "Camera",
    icon: "Video",
    type: "system",
    systemType: "camera",
    action: "agora.toggleVideo",
    targetId: "",
    bindId: "",
    config: {},
  },

  end: {
    id: "end",
    label: "End Call",
    icon: "PhoneOff",
    type: "system",
    systemType: "endcall",
    action: "agora.leaveCall",
    targetId: "",
    bindId: "",
    config: {},
  },

  start: {
    id: "start",
    label: "Start Call",
    icon: "Phone",
    action: "call.start",
    config: {}
  },

  accept: {
    id: "accept",
    label: "Accept Call",
    icon: "PhoneCall",
    action: "call.accept",
    config: {}
  }
};