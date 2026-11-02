import {RACE,createRacer,steerRacer,stepRacer} from './racer-model.mjs';
import {GameHost} from './host.mjs';
import {bindGameInput} from './input.mjs';
const $=id=>document.getElementById(id),board=$('board'),ctx=board.getContext('2d');
let state=createRacer(),repeat=0,brakePulse=0,input;
function round(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function car(lane,y,color,player=false){
  const x=90+lane*90-20;round(x,y,40,48,8,color);
  round(x+6,y+9,28,13,4,player?'#254840':'#4c3c49');round(x+6,y+30,28,9,3,'#233a34');
  ctx.fillStyle=player?'#fff6d9':'#f4b9ac';ctx.fillRect(x+3,y+3,8,4);ctx.fillRect(x+29,y+3,8,4);
  ctx.fillStyle='#172a25';ctx.fillRect(x-3,y+9,4,11);ctx.fillRect(x+39,y+9,4,11);ctx.fillRect(x-3,y+30,4,10);ctx.fillRect(x+39,y+30,4,10);
  if(player){ctx.fillStyle='#fff0ba';ctx.fillRect(x+17,y+23,6,18);}
}
function draw(){
  ctx.fillStyle='#94ac75';ctx.fillRect(0,0,360,480);
  ctx.fillStyle='#334841';ctx.fillRect(45,0,270,480);
  ctx.fillStyle='#eceade';ctx.fillRect(49,0,3,480);ctx.fillRect(308,0,3,480);
  ctx.strokeStyle='#d7dece';ctx.lineWidth=3;ctx.setLineDash([20,20]);ctx.lineDashOffset=-state.scroll;
  for(const x of [135,225]){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,480);ctx.stroke();}ctx.setLineDash([]);
  for(let y=state.scroll-80;y<480;y+=80){round(16,y,13,27,6,'#5c7a52');round(331,y+25,13,27,6,'#5c7a52');}
  for(const row of state.obstacles)for(const lane of row.lanes)car(lane,row.y,row.id%2?'#8d7199':'#bb6461');
  if(state.distance>RACE.goal-110){
    const y=RACE.playerY-(RACE.goal-state.distance)*3;
    for(let row=0;row<2;row++)for(let col=0;col<12;col++){ctx.fillStyle=(row+col)%2?'#f7f6e6':'#31473e';ctx.fillRect(45+col*22.5,y+row*12,22.5,12);}
  }
  car(state.lane,RACE.playerY,state.status==='lost'?'#b9675f':'#e7b550',true);
  $('distance').value=String(Math.floor(state.distance));$('speed').value=String(Math.round(state.speed));$('passed').value=String(state.passed);$('lane').value=String(state.lane+1);
  $('distance-progress').value=state.distance;
  board.setAttribute('aria-label','直線賽車，車道 '+(state.lane+1)+'；距離 '+Math.floor(state.distance)+' 公尺；時速 '+Math.round(state.speed)+' 公里。');
}
const host=new GameHost({
  id:'road-racer',onFocus:()=>board.focus(),
  onPause:()=>{input?.clear();repeat=0;brakePulse=0;},
  onReset:()=>{state=createRacer();repeat=0;brakePulse=0;draw();},
  onTick:dt=>{
    if(input.active('left')!==input.active('right')){repeat+=dt;if(repeat>=180){state=steerRacer(state,input.active('left')?-1:1);repeat-=100;}}
    else repeat=0;
    const brake=input.active('brake')||brakePulse>0;brakePulse=Math.max(0,brakePulse-dt);
    state=stepRacer(state,dt/1000,{brake});draw();
    if(state.status==='lost')host.finish('碰到前車了！按「重新開始」再挑戰。');
    if(state.status==='won')host.finish('抵達終點！平安完成 1000 公尺，閃過 '+state.passed+' 波來車。');
  }
});
input=bindGameInput(host,{board,keys:{ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'brake',ArrowDown:'brake',KeyS:'brake'},onPress:action=>{
  if(action==='left'||action==='right'){state=steerRacer(state,action==='left'?-1:1);repeat=0;}
  if(action==='brake'&&!input?.active('brake'))brakePulse=200;
  draw();
}});
draw();
