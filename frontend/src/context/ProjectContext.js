import React, { createContext, useState, useMemo } from 'react';
import { makeEmptyProjectSchema } from '../schema/gptSchema';

export const ProjectContext = createContext({
  projectSchema: null,
  setProjectSchema: () => {},
  viewMode: 'preview',
  setViewMode: () => {},
});

export function ProjectProvider({ children }) {
  const [projectSchema, setProjectSchema] = useState(makeEmptyProjectSchema());
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'actions'

  const value = useMemo(
    () => ({
      projectSchema,
      setProjectSchema,
      viewMode,
      setViewMode,
    }),
    [projectSchema, viewMode]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectContext() {
  const ctx = React.useContext(ProjectContext);
  if (!ctx) throw new Error('useProjectContext must be used within a ProjectProvider');
  return ctx;
}
