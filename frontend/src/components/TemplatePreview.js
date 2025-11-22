import React, { useMemo } from 'react';
import RenderFromSchema from '../engine/renderFromSchema';
import { validateSchema } from '../utils/validateSchema';


export default function TemplatePreview({ schema }) {
const { ok, issues } = useMemo(() => validateSchema(schema), [schema]);
if (!schema) return <div style={{ padding: 12 }}>No template selected yet.</div>;
if (!ok) {
return (
<div style={{ color: '#b00020', padding: 12 }}>
<div><strong>Schema validation failed</strong></div>
<ul>{issues.map((i, idx) => <li key={idx}>{i}</li>)}</ul>
</div>
);
}
return (
<div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
<RenderFromSchema schema={schema} />
</div>
);
}