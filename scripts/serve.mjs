import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('web');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = pathname === '/vendor/ethers.js' ? path.resolve('node_modules/ethers/dist/ethers.min.js') : path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (pathname !== '/vendor/ethers.js' && !file.startsWith(root + path.sep)) throw new Error('Invalid path');
    const content = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(8080, '127.0.0.1', () => console.log('Open http://127.0.0.1:8080'));
