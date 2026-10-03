import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const [metadata, license] = await Promise.all([
  readFile(path.join(root, 'package.json'), 'utf8').then(JSON.parse),
  readFile(path.join(root, 'LICENSE'), 'utf8'),
]);
const banner = `/*! Dot Line v${metadata.version}\n${license.trim()}\n*/\n`;
await mkdir(dist, { recursive: true });
const modules = await Promise.all(['alphabet.mjs', 'physics.mjs', 'dot-line.mjs'].map(name => readFile(path.join(root, name), 'utf8')));
// These local modules use named declarations, without external dependencies.
const combined = modules.map(source => source.replace(/^import\s+[^;]+;\s*/gm, '')).join('\n\n');
const plain = combined
  .replace(/^export\s*\{[^}]*\};?\s*$/gm, '')
  .replace(/\bexport\s+(?=(?:class|function|const|let)\b)/g, '');
const browserScript = `${banner}(() => {\n${plain}\n})();\n`;
await writeFile(path.join(dist, 'dot-line.js'), browserScript);
await writeFile(path.join(dist, 'dot-line.mjs'), `${banner}${combined}`);
const page = await readFile(path.join(root, 'index.html'), 'utf8');
await writeFile(path.join(dist, 'demo.html'), page.replace('<script type="module" src="./dot-line.mjs"></script>', `<script>\n${browserScript}\n</script>`).replace('href="./README.md"', 'href="../README.md"'));

console.log('Built dist/dot-line.js, dist/dot-line.mjs and dist/demo.html.');
