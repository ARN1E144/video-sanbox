import React, { useState, useContext } from 'react';
import { generateTemplateSchema, refineTemplateSchema } from '../engine/templateEngine';
import { ProjectContext } from '../context/ProjectContext';

export default function PromptForm() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const { projectSchema, setProjectSchema } = useContext(ProjectContext);

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

  return (
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
      <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
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
        }}
      >
        Refine
      </button>
    </form>
  );
}
