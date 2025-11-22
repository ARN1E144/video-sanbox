import api from '../services/api';


export async function runAction(name, ctx, params = {}) {
switch (name) {
case 'StartStream': {
const { data } = await api.post('/startStream');
// write to ctx (e.g., Project/Preview context) so VideoFeed gets src
ctx.updateBinding('VideoFeed', { src: data.streamUrl });
return data;
}
case 'StopStream': {
await api.post('/stopStream');
ctx.updateBinding('VideoFeed', { src: null });
return true;
}
case 'LoadVideo': {
const { id } = params;
const { data } = await api.get(`/videos/${id}`);
ctx.updateBinding('VideoFeed', { src: data.videoUrl });
return data;
}
case 'SendMessage': {
const { text } = params;
const { data } = await api.post('/chat/send', { text });
ctx.appendFeed('ChatPanel', data.message);
return data;
}
case 'ToggleMic': {
// local toggle – example only
const current = ctx.get('micState') || 'on';
const next = current === 'on' ? 'off' : 'on';
ctx.set('micState', next);
return next;
}
case 'EndCall': {
await api.post('/call/end');
ctx.notify('Call ended');
return true;
}
default:
console.warn('Unknown action', name);
return null;
}
}