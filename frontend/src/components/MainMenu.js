import React from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';



export default function MainMenu({ currentView, setCurrentView }) {

  const { logout } = useAuth();

  const buttonStyle = {
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 500,
    background: '#1a1a1a',
    color: '#ccc',
    border: '1px solid #333',
    transition: 'all 0.2s ease',
  };

  const activeStyle = {
    background: '#2a2a2a',
    color: '#fff',
    border: '1px solid #666',
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '10px 16px',
        borderBottom: '1px solid #333',
        background: '#0f0f0f',
      }}
    >
      <div
        style={currentView === 'templates' ? { ...buttonStyle, ...activeStyle } : buttonStyle}
        onClick={() => setCurrentView('templates')}
      >
        🏠 Templates
      </div>

      <div
        style={currentView === 'build' ? { ...buttonStyle, ...activeStyle } : buttonStyle}
        onClick={() => setCurrentView('build')}
      >
        🧩 Build Your Own
      </div>

      <div
        style={currentView === 'settings' ? { ...buttonStyle, ...activeStyle } : buttonStyle}
        onClick={() => setCurrentView('settings')}
      >
        ⚙️ Settings
      </div>
      <div
        style={currentView === 'calls' ? { ...buttonStyle, ...activeStyle } : buttonStyle}
        onClick={() => setCurrentView('calls')}
      >
        📞 Calls
      </div>
      <div style={buttonStyle}
      >
        <button onClick={logout}>Logout</button>

      </div>

    </div>
  );
}
