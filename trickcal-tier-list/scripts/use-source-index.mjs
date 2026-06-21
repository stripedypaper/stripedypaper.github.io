import { copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');

await copyFile(
  path.join(projectRoot, 'index.src.html'),
  path.join(projectRoot, 'index.html')
);
