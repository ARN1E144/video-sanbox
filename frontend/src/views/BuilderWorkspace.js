import React, { useState } from 'react';
import ElementSidebar from '../components/workspace/ElementSidebar';
import PreviewCanvas from '../components/workspace/PreviewCanvas';
import WorkspaceInspectorPanel from '../components/workspace/WorkspaceInspectorPanel';
import WorkspaceToolbar from '../components/workspace/WorkspaceToolbar';

export default function BuilderWorkspace() {

console.log('ElementSidebar:', ElementSidebar);
console.log('PreviewCanvas:', PreviewCanvas);
console.log('InspectorPanel:', WorkspaceInspectorPanel);
console.log('WorkspaceToolbar:', WorkspaceToolbar);


  const [zoom, setZoom] = useState(100);

    console.log({
    ElementSidebar,
    PreviewCanvas,
    WorkspaceInspectorPanel,
    WorkspaceToolbar,
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        height: '100%',
        backgroundColor: '#0e0e0e',
        color: '#fff',
      }}
    >
      {/* 🔹 Top Toolbar */}
      <WorkspaceToolbar zoom={zoom} setZoom={setZoom} />

      {/* 🔹 Main Editor Area */}
      <div style={{ backgroundColor: '#111', color: '#fff', height: '100vh' }}>
      <h3>Testing Workspace Imports</h3>
      {/* Uncomment these one by one */}
      {/* <WorkspaceToolbar zoom={zoom} setZoom={setZoom} /> */}
      <ElementSidebar />
      <PreviewCanvas zoom={zoom} />
      <WorkspaceInspectorPanel />
    </div>
    </div>
  );
}
