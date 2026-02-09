// src/components/PromptForm.js
import React, { useState, useContext } from 'react';
import { generateTemplateSchema, refineTemplateSchema } from '../engine/templateEngine';
import { ProjectContext } from '../context/ProjectContext';
import { usePreviewMode } from '../context/PreviewContext';

export default function PromptForm() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const { projectSchema, setProjectSchema } = useContext(ProjectContext);
  const { isPreviewMode, setIsPreviewMode } = usePreviewMode();

  async function onGenerate(e) {
    e.preventDefault();
    setLoading(true);
    const schema = await generateTemplateSchema(prompt);
    setProjectSchema(schema);
    setLoading(false);
  }

  async function onRefine(e) {
    e.preventDefault();
    if (!projectSchema) return alert('Generate a base app first!');
    setLoading(true);
    const updated = await refineTemplateSchema(projectSchema, prompt);
    setProjectSchema(updated);
    setLoading(false);
  }

  const toggleButtonBase = {
    padding: '6px 10px',
    borderRadius: 999,
    border: '1px solid #444',
    fontSize: 12,
    cursor: 'pointer',
    background: 'transparent',
    color: '#aaa',
    transition: 'all 0.2s ease',
  };

  const activeStyle = {
    background: '#fff',
    color: '#000',
    borderColor: '#fff',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* 🔁 Build / Preview toggle row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 12, color: '#888' }}>Mode:</span>
        <div
          style={{
            display: 'inline-flex',
            padding: 2,
            borderRadius: 999,
            backgroundColor: '#141414',
            border: '1px solid #333',
          }}
        >
          <button
            type="button"
            onClick={() => setIsPreviewMode(false)}
            style={{
              ...toggleButtonBase,
              ...(isPreviewMode ? {} : activeStyle),
            }}
          >
            Build
          </button>
          <button
            type="button"
            onClick={() => setIsPreviewMode(true)}
            style={{
              ...toggleButtonBase,
              ...(isPreviewMode ? activeStyle : {}),
            }}
          >
            Preview
          </button>
        </div>
      </div>
        {/* 💬 Prompt + Generate / Refine */}
      <form onSubmit={onGenerate} style={{ display: 'flex', gap: 8 }}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe or modify your app..."
          style={{
            flex: 1,
            padding: 8,
            border: '1px solid #444',
            borderRadius: 6,
            backgroundColor: '#1e1e1e',
            color: '#fff',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: '#ffffff',
            color: '#000',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          {loading ? '...' : 'Generate'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onRefine}
          style={{
            padding: '8px 12px',
            background: '#444',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Refine
        </button>
      </form>
    </div>
  );
}
