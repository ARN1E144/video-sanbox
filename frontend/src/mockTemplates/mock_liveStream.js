const liveStream = {
name: 'Live Stream',
tree: {
type: 'App',
children: [
{ type: 'AppBar', props: { title: 'Live Stream', actions: ['EndCall'] } },
{
type: 'Container',
props: { layout: 'grid', align: 'center', justify: 'center' },
children: [
{
 type:'VideoFeed',
 props:{
   mode:'local',
   enabled:true,
   playing:true,
   muted:true,
   mirror:true,
   objectFit:'cover'
 }
},
{ type: 'ChatPanel', props: { room: 'default', showAvatars: true } },
],
},
{
type: 'Container',
props: { layout: 'flex', align: 'center', justify: 'space-between' },
children: [
{ type: 'MicButton', props: { state: 'on' } },
{ type: 'TextBox', props: { placeholder: 'Say hello…' } },
{ type: 'ControlButton', props: { label: 'End', action: 'EndCall', target: 'AppBar' } },
],
},
],
},
};


export default liveStream;