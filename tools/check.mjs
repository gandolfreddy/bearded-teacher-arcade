import {readdir, readFile, stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateCatalog} from '../assets/js/core.mjs';
const root = new URL('../',import.meta.url);
async function checkModules(directory) {
  for(const entry of await readdir(new URL(directory,root),{withFileTypes:true})) {
    const name = directory + '/' + entry.name;
    if(entry.isDirectory()) await checkModules(name);
    else if(entry.name.endsWith('.mjs')) {
      const result=spawnSync(process.execPath,['--check',fileURLToPath(new URL(name,root))],{stdio:'inherit'});
      if(result.status!==0) throw new Error('語法檢查失敗：'+name);
    }
  }
}
for(const directory of ['assets','games','tools','tests']) await checkModules(directory);
const raw=JSON.parse(await readFile(new URL('games.json',root),'utf8'));
validateCatalog(raw,'https://example.github.io/bearded-teacher-arcade/');
for(const game of raw.games) {
  if(!(await stat(new URL(game.entry,root))).isFile()) throw new Error('缺少遊戲入口：'+game.entry);
}
console.log('PASS JavaScript syntax, catalog and game entries');
