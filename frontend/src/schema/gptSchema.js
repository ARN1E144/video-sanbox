export const COMPONENTS_SPEC = {
VideoFeed: {
props: { src: 'url', autoplay: 'boolean', muted: 'boolean', controls: 'boolean' },
canContain: ['Overlay', 'ChatPanel'],
actions: ['StartStream', 'StopStream', 'LoadVideo'],
},
ChatPanel: {
props: { room: 'string', showAvatars: 'boolean' },
actions: ['SendMessage', 'ReceiveMessage'],
},
TextBox: { props: { placeholder: 'string', onSubmit: 'SendMessage' } },
MicButton: { props: { state: 'on|off', onClick: 'ToggleMic' } },
ControlButton: { props: { label: 'string', action: 'string', target: 'componentId' } },
AppBar: { props: { title: 'string', actions: ['EndCall', 'ToggleSettings'] } },
Container: {
props: { layout: 'flex|grid', align: 'string', justify: 'string' },
canContain: ['VideoFeed', 'ChatPanel', 'TextBox', 'ControlButton', 'Text', 'Container'],
},
Text: { props: { content: 'string', style: 'object' } },
};


export const ACTIONS_SPEC = {
StartStream: { api: '/api/startStream', target: 'VideoFeed', returns: ['streamUrl'] },
StopStream: { api: '/api/stopStream', target: 'VideoFeed' },
LoadVideo: { api: '/api/videos/:id', target: 'VideoFeed', returns: ['videoUrl'] },
SendMessage: { api: '/api/chat/send', target: 'ChatPanel', returns: ['message'] },
ReceiveMessage: { api: '/api/chat/receive', target: 'ChatPanel' },
ToggleMic: { type: 'local', target: 'MicButton' },
EndCall: { api: '/api/call/end', target: 'AppBar' },
};


export const SCHEMA_VERSION = '1.0.0';


export const makeEmptyProjectSchema = (name = 'Untitled App') => ({
version: SCHEMA_VERSION,
name,
tree: {
type: 'App',
props: {},
children: [],
},
metadata: { createdAt: new Date().toISOString() },
});