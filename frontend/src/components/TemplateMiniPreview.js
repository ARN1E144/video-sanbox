import React from 'react';
import * as UI from '../ui'; // This assumes your components (AppBar, VideoFeed, etc.) are exported here

function renderNode(node, key) {
  if (!node) return null;

  const Component = UI[node.type];
  console.log('rendering:', node.type, '→', Component);

  if (!Component) {
    return (
      <div
        key={key}
        style={{
          border: '1px dashed #555',
          color: '#777',
          fontSize: 10,
          padding: 4,
          margin: 2,
        }}
      >
        {node.type || 'Unknown'}
      </div>
    );
  }

  const children = node.children?.map((child, i) => renderNode(child, i));
  return <Component key={key} {...node.props}>{children}</Component>;
}


export default function TemplateMiniPreview({ tree }) {
  if (!tree) return null;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0f0f0f',
        borderRadius: 8,
        overflow: 'hidden',
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {renderNode(tree)}
    </div>
  );
}
