import { COMPONENTS_SPEC } from '../schema/gptSchema';


export function validateSchema(schema) {
const issues = [];
if (!schema || typeof schema !== 'object') issues.push('Schema missing or not an object');
if (!schema?.tree) issues.push('Schema.tree is required');


function walk(node, path = 'tree') {
if (!node || typeof node !== 'object') return issues.push(`${path}: node is invalid`);
if (!node.type) return issues.push(`${path}: missing type`);


// Allow App as a virtual root; others must exist in spec
if (node.type !== 'App' && !COMPONENTS_SPEC[node.type]) {
issues.push(`${path}: unknown type "${node.type}"`);
}


if (node.props && typeof node.props !== 'object') {
issues.push(`${path}: props must be an object`);
}


if (Array.isArray(node.children)) {
node.children.forEach((child, i) => walk(child, `${path}.children[${i}]`));
}
}


walk(schema.tree);
return { ok: issues.length === 0, issues };
}