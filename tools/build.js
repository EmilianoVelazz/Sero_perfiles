import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
// Keep the Windows workaround for local machines that restrict Vite processes.
// Linux hosts such as Vercel use Vite's standard production build.
const isWindows = process.platform === 'win32';
const command = isWindows ? 'powershell.exe' : process.execPath;
const args = isWindows
  ? ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', fileURLToPath(new URL('./build-static.ps1', import.meta.url))]
  : [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'build'];

const result = spawnSync(command, args, { cwd: projectRoot, stdio: 'inherit' });
if (result.error) {
  console.error(`No se pudo iniciar la compilacion: ${result.error.message}`);
}
process.exit(result.status ?? 1);
