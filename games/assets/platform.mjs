import {LEVEL,createPlatform,stepPlatform} from './platform-model.mjs';
import {GameHost} from './host.mjs';
import {bindGameInput} from './input.mjs';
const $=id=>document.getElementById(id),board=$('board'),ctx=board.getContext('2d');
let state=createPlatform(),accumulator=0,jumpPulse=false,nudge=null,input;
function rounded(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function star(x,y,size=11) {
  ctx.fillStyle='#d49e35';ctx.beginPath();
  for(let i=0;i<10;i++){const angle=-Math.PI/2+i*Math.PI/5,r=i%2?size*.45:size;const px=x+Math.cos(angle)*r,py=y+Math.sin(angle)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}
  ctx.closePath();ctx.fill();
}
function draw() {
  ctx.fillStyle='#dfedcf';ctx.fillRect(0,0,640,360);
  ctx.fillStyle='#c6dbaf';
  for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(i*220-state.camera*.25+40,306,145,94,0,Math.PI,0);ctx.fill();}
  for(let i=0;i<5;i++){const x=i*200-state.camera*.15;rounded(x,42+(i%2)*25,64,18,10,'#f9fbef');rounded(x+15,32+(i%2)*25,36,22,12,'#f9fbef');}
  ctx.save();ctx.translate(-state.camera,0);
  for(const pit of [{x:440,w:80},{x:900,w:80}]){ctx.fillStyle='#8fafac';ctx.fillRect(pit.x,340,pit.w,20);ctx.strokeStyle='#e5f0df';ctx.beginPath();ctx.moveTo(pit.x,345);ctx.lineTo(pit.x+pit.w,345);ctx.stroke();}
  for(const rect of LEVEL.solids){
    ctx.fillStyle=rect.h===18?'#71935f':'#ac8661';ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
    ctx.fillStyle='#66884f';ctx.fillRect(rect.x,rect.y,rect.w,7);
    ctx.strokeStyle='#9a7451';ctx.lineWidth=1;
    if(rect.y===304){for(let x=rect.x;x<rect.x+rect.w;x+=32){ctx.strokeRect(x,rect.y+9,32,24);ctx.strokeRect(x+16,rect.y+33,32,24);}}
    else if(rect.h>18){ctx.strokeRect(rect.x+5,rect.y+12,rect.w-10,rect.h-18);ctx.beginPath();ctx.moveTo(rect.x+6,rect.y+13);ctx.lineTo(rect.x+rect.w-6,rect.y+rect.h-6);ctx.moveTo(rect.x+rect.w-6,rect.y+13);ctx.lineTo(rect.x+6,rect.y+rect.h-6);ctx.stroke();}
  }
  LEVEL.stars.forEach((item,index)=>{if(!state.collected.includes(index))star(item.x,item.y);});
  for(const enemy of state.enemies){
    if(!enemy.alive){rounded(enemy.x,300,24,4,2,'#b4b49f');continue;}
    rounded(enemy.x,enemy.y,24,22,9,'#9678a4');
    rounded(enemy.x+4,enemy.y+7,5,6,2,'#fffaf0');rounded(enemy.x+15,enemy.y+7,5,6,2,'#fffaf0');
    rounded(enemy.x+5,enemy.y+9,2,3,1,'#213c35');rounded(enemy.x+16,enemy.y+9,2,3,1,'#213c35');
  }
  ctx.fillStyle='#54754b';ctx.fillRect(LEVEL.goal,174,5,130);
  ctx.fillStyle='#a13b46';ctx.beginPath();ctx.moveTo(LEVEL.goal+5,178);ctx.lineTo(LEVEL.goal+55,194);ctx.lineTo(LEVEL.goal+5,209);ctx.closePath();ctx.fill();
  ctx.fillStyle='#486440';ctx.font='11px monospace';ctx.fillText('GOAL',LEVEL.goal-10,164);
  const p=state.player;
  rounded(p.x+3,p.y+16,18,14,4,'#e4b252');
  rounded(p.x+3,p.y+1,18,18,7,'#243e35');
  rounded(p.x+5,p.y+5,14,11,4,'#f4d5ad');
  rounded(p.x+5,p.y+12,14,8,4,'#243e35');
  rounded(p.x+7,p.y+7,3,4,1,'#213c35');rounded(p.x+14,p.y+7,3,4,1,'#213c35');
  rounded(p.x+2,p.y+28,8,4,1,'#213c35');rounded(p.x+14,p.y+28,8,4,1,'#213c35');
  ctx.restore();
  $('score').value=String(state.score);$('stars').value=String(state.collected.length);$('progress').value=String(state.progress);
  board.setAttribute('aria-label','星星小徑，角色位於 '+Math.round(p.x)+', '+Math.round(p.y)+'；'+(p.onGround?'地面':'空中')+'；進度 '+state.progress+'%。');
}
const host=new GameHost({
  id:'star-trail',onFocus:()=>board.focus(),
  onPause:()=>{input?.clear();jumpPulse=false;nudge=null;},
  onReset:()=>{state=createPlatform();accumulator=0;jumpPulse=false;nudge=null;draw();},
  onTick:dt=>{
    accumulator+=dt/1000;
    while(accumulator>=1/120 && state.status==='playing'){
      accumulator-=1/120;
      state=stepPlatform(state,{left:input.active('left')||nudge==='left',right:input.active('right')||nudge==='right',jump:input.active('jump')||jumpPulse},1/120);
      jumpPulse=false;
    }
    nudge=null;draw();
    if(state.status==='lost')host.finish(state.reason==='fall'?'掉進缺口了！按「重新開始」再挑戰。':'碰到小怪了！試著從上方踩下，或跳過牠。');
    if(state.status==='won')host.finish('過關了！收集 '+state.collected.length+' 顆星星，總分 '+state.score+' 分。');
  }
});
input=bindGameInput(host,{board,keys:{ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump'},onPress:action=>{if(action==='jump')jumpPulse=true;else nudge=action;}});
draw();
