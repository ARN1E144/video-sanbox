import React from 'react';
import registry from '../components/elements/registry';


function makeKey(prefix) {
return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}


export function renderNode(node, key) {
if (!node) return null;
if (node.type === 'App') {
return <React.Fragment key={key || makeKey('app')}>{(node.children || []).map((c, i) => renderNode(c, `${key || 'app'}_${i}`))}</React.Fragment>;
}


const Comp = registry[node.type];
if (!Comp) {
// Fallback rendering for unknown components
return (
<div key={key || makeKey('unknown')} style={{ border: '1px dashed #aaa', padding: 8, color: '#666' }}>
Unknown component: {node.type}
</div>
);
}


const childEls = (node.children || []).map((c, i) => renderNode(c, `${key || makeKey(node.type)}_${i}`));
return <Comp key={key || makeKey(node.type)} {...(node.props || {})}>{childEls}</Comp>;
}


export default function RenderFromSchema({ schema }) {
if (!schema) return null;
return renderNode(schema.tree, 'root');
}