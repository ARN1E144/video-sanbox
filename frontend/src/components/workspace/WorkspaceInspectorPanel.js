import React from 'react';

export default function WorkspaceInspectorPanel() {
  return (
    <div
      style={{
        backgroundColor: '#121212',
        borderLeft: '1px solid #333',
        padding: 12,
        overflowY: 'auto',
      }}
    >
      <h4 style={{ marginBottom: 8, color: '#aaa', fontWeight: 600 }}>Inspector</h4>
      <p style={{ color: '#777', fontSize: 14 }}>
        Select an element in the canvas to edit its properties.
      </p>
    </div>
  );
}
