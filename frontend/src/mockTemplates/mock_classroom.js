const classroom = {
name: 'Classroom',
tree: {
type: 'App',
children: [
{ type: 'AppBar', props: { title: 'Classroom', actions: ['EndCall'] } },
{
type: 'Container',
props: { layout: 'grid', align: 'center', justify: 'center' },
children: [
{ type: 'VideoFeed', props: { autoplay: true, muted: true, controls: true } },
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


export default classroom;