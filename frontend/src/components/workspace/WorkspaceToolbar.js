import React from 'react';

export default function WorkspaceToolbar({ zoom, setZoom }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: '#111',
        borderBottom: '1px solid #333',
      }}
    >
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ fontWeight: 600 }}>Editor Mode</div>
        <select
          style={{
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: 4,
            padding: '4px 8px',
          }}
        >
          <option>Host / Client Split</option>
          <option>Single View (Host)</option>
          <option>Single View (Client)</option>
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, color: '#aaa' }}>Zoom:</span>
        <input
          type="range"
          min="50"
          max="150"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ accentColor: '#666' }}
        />
        <span style={{ width: 40, textAlign: 'right' }}>{zoom}%</span>
      </div>
    </div>
  );
}
