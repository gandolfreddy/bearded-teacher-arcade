import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 5193);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server = http.createServer(async(req,res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405); res.end(); return;}
    let path = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (path.startsWith('/bearded-teacher-arcade/')) path = path.slice('/bearded-teacher-arcade'.length);
    if (path === '/') path = '/index.html';
    const file = resolve(root, '.' + path);
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep) || path.split('/').some(part => part.startsWith('.') || ['node_modules','test-results','.git'].includes(part))) {res.writeHead(403);res.end('Forbidden');return;}
    if (!(await stat(file)).isFile()) throw new Error('Not found');
    const body = await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)] || 'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:' + port + '/bearded-teacher-arcade/'));
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
