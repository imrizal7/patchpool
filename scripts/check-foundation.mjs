import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const requiredFiles = [
  'AGENTS.md',
  'docs/SPEC.md',
  'docs/DECISIONS.md',
  'docs/THREAT_MODEL.md',
  'docker-compose.yml',
  'pnpm-workspace.yaml',
  'contracts/foundry.toml',
];

for (const file of requiredFiles) {
  await access(join(root, file));
}

const spec = await readFile(join(root, 'docs/SPEC.md'), 'utf8');
if (!spec.includes('| State | Caller | Preconditions | Effects | Events |')) {
  throw new Error('The state-machine table is missing from docs/SPEC.md');
}

console.log(`Foundation check passed (${requiredFiles.length} required files).`);
