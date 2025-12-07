import React, { useContext, useState } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { usePreviewMode } from "../context/PreviewContext";

export default function ModeMenu() {
  const { viewMode, setViewMode } = useContext(ProjectContext);
 const { previewView, setPreviewView } = usePreviewMode();

  const activeStyle = {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    border: '1px solid #555',
  };

  const buttonStyle = {
    flex: 1,
    padding: '8px 0',
    cursor: 'pointer',
    background: '#1a1a1a',
    color: '#888',
    border: '1px solid #333',
    borderRadius: '6px',
    fontWeight: 500,
    transition: 'all 0.25s ease',
  };

  const smallButtonStyle = {
    padding: '6px 8px',
    background: '#1a1a1a',
    color: '#888',
    border: '1px solid #333',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    transition: 'all 0.25s ease',
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderBottom: '1px solid #333',
        background: '#0f0f0f',
      }}
    >
      {/* Left: Preview / Actions */}
      <div style={{ display: 'flex', gap: 8, flex: 1 }}>
        <div
          style={viewMode === 'preview' ? { ...buttonStyle, ...activeStyle } : buttonStyle}
          onClick={() => setViewMode('preview')}
        >
          Preview
        </div>
        <div
          style={viewMode === 'actions' ? { ...buttonStyle, ...activeStyle } : buttonStyle}
          onClick={() => setViewMode('actions')}
        >
          Actions
        </div>
      </div>

      {/* Right: Client / Host / Split toggle */}
      {viewMode === 'preview' && (
        <div style={{ display: 'flex', gap: 6 }}>
          {['client', 'host', 'split'].map((mode) => (
            <div
              key={mode}
              style={
                previewView === mode
                  ? { ...smallButtonStyle, background: '#333', color: '#fff' }
                  : smallButtonStyle
              }
              onClick={() => setPreviewView(mode)}
            >
              {mode === 'split' ? 'Client / Host' : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
