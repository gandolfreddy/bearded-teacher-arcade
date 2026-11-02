import {cp, mkdir, rm, writeFile, lstat, readFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root = resolve(fileURLToPath(new URL('../',import.meta.url)));
const output = resolve(root,'dist');
if(dirname(output)!==root || output===root) throw new Error('輸出目錄不在預期專案內');
await rm(output,{recursive:true,force:true});
await mkdir(output);
for(const name of ['index.html','games.json','.nojekyll','assets','games']) {
  await cp(resolve(root,name),resolve(output,name),{recursive:true,filter:async source=>{
    if((await lstat(source)).isSymbolicLink()) throw new Error('發布來源不得含符號連結');
    return true;
  }});
}
const {version}=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
let commit=process.env.GITHUB_SHA || '';
if(!commit) {
  try {commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();} catch {}
}
await writeFile(resolve(output,'site-version.json'),JSON.stringify({version,commit},null,2)+'\n');
console.log('Built dist/; developer documents, tests and dependencies are excluded.');
