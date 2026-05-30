

export const CONTROL_TEMPLATES = {
mic: {
    id: "mic",

    label: "Mute",

    icon: "Mic",

    type: "system",

    systemType: "mic",

    action: "system.toggleMic",

    // 🔥 REQUIRED FOR RUNTIME
    targetId: "",

    bindId: "",

    config: {},
  },
  camera: {
    id: "camera",
    icon: "Video",
    label: "Camera",
    type: "system",
    systemType: "camera",
    action: "agora.toggleVideo",
    targetId: "",

    bindId: "",

    config: {},
  },
  end: {
    id: "end",
    icon: "PhoneOff",
    label: "End Call",
    type: "system",
    systemType: "endcall",
    action: "agora.leaveCall",
    targetId: "",

    bindId: "",

    config: {},
  },
};