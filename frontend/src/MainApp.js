import React, { useState, useContext } from 'react';
import PromptForm from './components/PromptForm';
import TemplatePreview from './components/TemplatePreview';
import ProjectSidebar from './components/ProjectSidebar';
import TemplateCarousel from './components/TemplateCarousel';
import ModeMenu from './components/ModeMenu';
import MainMenu from './components/MainMenu';
import BuilderWorkspace from './views/BuilderWorkspace'; // ⬅️ new workspace view
import { ProjectContext } from './context/ProjectContext';
import Canvas from './components/Canvas';
import { usePreviewMode } from './context/PreviewContext';

export default function MainApp() {
  const { projectSchema, viewMode } = useContext(ProjectContext);
  const { previewView } = usePreviewMode();
  const [currentView, setCurrentView] = useState('templates'); // 'templates' | 'build' | 'settings'

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        height: '100vh',
        backgroundColor: '#0f0f0f',
        color: '#fff',
      }}
    >
      {/* 🔹 Sidebar */}
      <ProjectSidebar />

      {/* 🔹 Main content area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* 🔹 Top navigation menu */}
        <MainMenu currentView={currentView} setCurrentView={setCurrentView} />

        {/* 🔹 Templates view */}
        {currentView === 'templates' && (
          <div
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <h3 style={{ marginBottom: 12, color: '#aaa' }}>Select a template to get started</h3>
            <TemplateCarousel />
          </div>
        )}

        {/* 🔹 Build Your Own view (full workspace) */}
        {currentView === 'build' && (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0f0f0f',
    }}
  >
    {/* 🔹 Top input + toggle bar */}
    <div style={{ flexShrink: 0, padding: '12px 16px', borderBottom: '1px solid #222' }}>
      <PromptForm />
      <ModeMenu />
    </div>

    {/* 🔹 Canvas Area */}
    <div
      style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0a0a',
        borderTop: '1px solid #222',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden',
      }}
    >
      {viewMode === 'preview' ? (
        previewView === 'split' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              flexGrow: 1,
              overflow: 'hidden',
            }}
          >
            <Canvas role="host" />
            <Canvas role="client" />
          </div>
        ) : (
          <div style={{ flexGrow: 1 }}>
            <Canvas role={previewView} />
          </div>
        )
      ) : (
        <div style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 10, color: '#fff' }}>Actions Panel</h3>
          <p style={{ color: '#aaa' }}>
            Here you’ll be able to edit and connect actions between components.
          </p>
        </div>
      )}
    </div>
  </div>
)}

        {/* {currentView === 'build' && (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <BuilderWorkspace />
          </div>
        )} */}



        {/* 🔹 Settings view */}
        {currentView === 'settings' && (
          <div
            style={{
              padding: 16,
              color: '#aaa',
            }}
          >
            <h3>Settings</h3>
            <p>Coming soon – configuration options for your app builder.</p>
          </div>
        )}
      </div>
    </div>
  );
}
