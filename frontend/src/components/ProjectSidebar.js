import React, { useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';


export default function ProjectSidebar() {
const { projectSchema } = useContext(ProjectContext);
return (
<aside style={{ width: 260, borderRight: '1px solid #eee', padding: 12 }}>
<div style={{ fontWeight: 700, marginBottom: 8 }}>Project</div>
<div style={{ fontSize: 12, color: '#555' }}>{projectSchema?.name || 'Untitled App'}</div>
</aside>
);
}