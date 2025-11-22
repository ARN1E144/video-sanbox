import React from 'react';

const elements = [
  'AppBar',
  'ChatPanel',
  'Container',
  'ControlButton',
  'MicButton',
  'Text',
  'TextBox',
  'TextLabel',
  'VideoFeed',
];

export default function ElementsSidebar() {
  return (
    <div
      style={{
        backgroundColor: '#121212',
        borderRight: '1px solid #333',
        padding: 12,
        overflowY: 'auto',
      }}
    >
      <h4 style={{ marginBottom: 8, color: '#aaa', fontWeight: 600 }}>Elements</h4>
      {elements.map((el) => (
        <div
          key={el}
          style={{
            padding: '6px 10px',
            borderRadius: 4,
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            marginBottom: 6,
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#222')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#1a1a1a')}
        >
          {el}
        </div>
      ))}
    </div>
  );
}
