import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteConfig = path.join(root, 'node_modules', 'vite', 'dist', 'node', 'chunks', 'config.js');

if (!fs.existsSync(viteConfig)) process.exit(0);

let source = fs.readFileSync(viteConfig, 'utf8');
const marker = 'Some managed Windows installations forbid spawning `net use` (EPERM).';

if (source.includes(marker)) process.exit(0);

const start = '\texec("net use", (error$1, stdout) => {';
const end = '\t});\n}\nfunction ensureWatchedFile';

if (!source.includes(start) || !source.includes(end)) {
  console.warn('No se pudo aplicar el ajuste de rutas de Windows para Vite.');
  process.exit(0);
}

source = source
  .replace(start, '\ttry {\n' + start)
  .replace('\t\tif (error$1) return;', '\t\tif (error$1) {\n\t\t\tsafeRealpathSync = fs.realpathSync.native;\n\t\t\treturn;\n\t\t}')
  .replace(
    end,
    '\t});\n\t} catch {\n\t\t// Some managed Windows installations forbid spawning `net use` (EPERM).\n\t\t// Local paths can safely use the native resolver in that case.\n\t\tsafeRealpathSync = fs.realpathSync.native;\n\t}\n}\nfunction ensureWatchedFile',
  );

fs.writeFileSync(viteConfig, source);
