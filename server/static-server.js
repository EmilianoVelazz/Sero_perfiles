import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(projectRoot, 'dist');
const port = Number(process.argv[2] || 5173);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendFile(response, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('No se pudo cargar el archivo solicitado.');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  const requestedFile = path.resolve(publicRoot, `.${pathname}`);
  const isInsidePublicRoot = requestedFile === publicRoot || requestedFile.startsWith(`${publicRoot}${path.sep}`);

  if (isInsidePublicRoot && fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile()) {
    sendFile(response, requestedFile);
    return;
  }

  // Una SPA debe volver a index.html para que React resuelva la ruta.
  sendFile(response, path.join(publicRoot, 'index.html'));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Seroperfiles disponible en http://127.0.0.1:${port}/`);
});
