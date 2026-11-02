import {spawn} from 'node:child_process';
const suites = process.argv.slice(2);
if(!suites.length) suites.push('tests/browser.mjs');
const server=spawn(process.execPath,['tools/serve.mjs'],{stdio:['ignore','pipe','pipe']});
server.stderr.on('data',data=>process.stderr.write(data));
try {
  await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('Preview server did not start')),10000);
    function ready(){clearTimeout(timeout);resolve();}
    server.once('error',error=>{clearTimeout(timeout);reject(error);});
    server.once('exit',code=>{clearTimeout(timeout);reject(new Error('Preview server exited: '+code));});
    server.stdout.on('data',data=>{process.stdout.write(data);if(data.toString().includes('Local:'))ready();});
  });
  for(const suite of suites) {
    const code=await new Promise((resolve,reject)=>{
      const child=spawn(process.execPath,[suite],{stdio:'inherit'});
      child.once('error',reject);child.once('exit',resolve);
    });
    if(code!==0) throw new Error('Browser suite failed: '+suite);
  }
} finally {server.kill();}
