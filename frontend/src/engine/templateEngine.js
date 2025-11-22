import api from '../services/api';
import { makeEmptyProjectSchema } from '../schema/gptSchema';
import * as templates from '../mockTemplates';

function pickKeywordTemplate(prompt = '') {
  const p = prompt.toLowerCase();
  if (p.includes('class') || p.includes('teacher')) return templates.mock_classroom;
  if (p.includes('tiktok') || p.includes('short')) return templates.mock_tiktokFeed;
  if (p.includes('debate') || p.includes('panel') || p.includes('multi')) return templates.mock_videoCall;
  if (p.includes('live') || p.includes('stream')) return templates.mock_liveStream;
  return templates.mock_fallback;
}

export async function generateTemplateSchema(prompt, opts = {}) {
  // 1) Try your backend (which can call GPT with few-shots using the schema)
  try {
    console.log('Generating template schema from backend AI...');
    const { data } = await api.post('/ai/generateTemplate', { prompt, opts });
    if (data && data.schema?.tree) return data.schema;
  } catch (e) {
    // ignore and fallback
  }

  // 2) Fallback: map prompt → one of your mock templates and wrap in schema
  const picked = pickKeywordTemplate(prompt);
  const schema = makeEmptyProjectSchema(picked.name || 'Generated App');
  schema.tree = picked.tree; // assume your mock templates export { name, tree }
  schema.metadata.fallback = true;
  return schema;
}

// ✅ Place this OUTSIDE the above function
export async function refineTemplateSchema(currentSchema, instruction, opts = {}) {
  try {
    const { data } = await api.post('/ai/refineTemplate', { schema: currentSchema, instruction, opts });
    if (data && data.schema?.tree) return data.schema;
  } catch (e) {
    console.error('Refinement error:', e);
  }

  // fallback – no change
  return currentSchema;
}
