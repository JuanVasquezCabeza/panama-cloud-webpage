// Local preview of the static site: node tools/serve.mjs [port]  ->  http://localhost:8080
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { root } from './lib.mjs';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' };
createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try {
    const data = await readFile(join(root, p)); // read first, so a missing file can still become a 404
    res.writeHead(200, { 'Content-Type': types[extname(p)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(Number(process.argv[2]) || 8080, () => console.log('Preview on http://localhost:' + (Number(process.argv[2]) || 8080)));
