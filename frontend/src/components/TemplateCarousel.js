import React, { useContext } from 'react';
import * as templates from '../mockTemplates';
import { ProjectContext } from '../context/ProjectContext';
import TemplateMiniPreview from './TemplateMiniPreview';

export default function TemplateCarousel() {
  const { setProjectSchema } = useContext(ProjectContext);

  const handleSelect = (tpl) => {
    setProjectSchema({
      version: '1.0.0',
      name: tpl.name,
      tree: tpl.tree,
      metadata: { local: true },
    });
  };

  const all = [
    templates.mock_singleVideo,
    templates.mock_singleFeed,
    templates.mock_hostClient,
    templates.mock_multiHost,
  ];

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        display: 'flex',
        gap: 20,
        padding: '16px 12px',
        borderTop: '1px solid #333',
        scrollbarWidth: 'thin',
        scrollbarColor: '#444 #1e1e1e',
      }}
    >
      {all.map((tpl, i) => (
        <div
          key={i}
          onClick={() => handleSelect(tpl)}
          style={{
            flex: '0 0 260px',
            height: 200,
            background: '#1e1e1e',
            border: '1px solid #444',
            borderRadius: 14,
            padding: 12,
            cursor: 'pointer',
            textAlign: 'center',
            color: '#fff',
            transition: 'all 0.25s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.04)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
            e.currentTarget.style.border = '1px solid #666';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.4)';
            e.currentTarget.style.border = '1px solid #444';
          }}
        >
          <div style={{ height: 120, marginBottom: 8 }}>
            <TemplateMiniPreview tree={tpl.tree} />
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 15,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {tpl.name}
          </div>
        </div>
      ))}
    </div>
  );
}
