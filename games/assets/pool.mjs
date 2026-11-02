import {TABLE,POCKETS,BALL_COLORS,createPool,shootPool,stepPool,aimPool} from './pool-model.mjs';
import {GameHost} from './host.mjs';
import {bindGameInput} from './input.mjs';
const $=id=>document.getElementById(id),board=$('board'),ctx=board.getContext('2d');
let state=createPool(),angle=270,power=45,accumulator=0,repeat=0,drag=null,input;
const radians=()=>angle*Math.PI/180;
function enableControls(enabled){for(const id of ['aim-angle','power','shoot'])$(id).disabled=!enabled;}
function draw(){
  ctx.fillStyle='#e5eadb';ctx.fillRect(0,0,640,360);
  ctx.fillStyle='#9c7958';ctx.beginPath();ctx.roundRect(18,18,604,324,22);ctx.fill();
  ctx.fillStyle='#254d42';ctx.fillRect(32,32,576,296);ctx.fillStyle='#53846b';ctx.fillRect(40,40,560,280);
  ctx.strokeStyle='#69947b';ctx.lineWidth=1;ctx.strokeRect(46,46,548,268);
  for(const pocket of POCKETS){ctx.fillStyle='#1c3029';ctx.beginPath();ctx.arc(pocket.x,pocket.y,20,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#bd9970';ctx.lineWidth=2;ctx.stroke();}
  const cue=state.balls.find(ball=>ball.id===0);
  if(state.phase==='aiming' && state.status==='playing' && !cue.potted){
    const aim=aimPool(state,radians()),dx=Math.cos(radians()),dy=Math.sin(radians());
    ctx.save();ctx.beginPath();ctx.rect(40,40,560,280);ctx.clip();
    ctx.setLineDash([6,6]);ctx.strokeStyle='#f4f3d5aa';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cue.x,cue.y);ctx.lineTo(aim.x,aim.y);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle='#f4f3d5aa';ctx.beginPath();ctx.arc(aim.x,aim.y,10,0,Math.PI*2);ctx.stroke();
    if(aim.hit){const nx=(aim.hit.x-aim.x)/20,ny=(aim.hit.y-aim.y)/20;ctx.strokeStyle='#ead391';ctx.beginPath();ctx.moveTo(aim.hit.x,aim.hit.y);ctx.lineTo(aim.hit.x+nx*65,aim.hit.y+ny*65);ctx.stroke();}
    ctx.restore();ctx.strokeStyle='#e5ca93';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(cue.x-dx*18,cue.y-dy*18);ctx.lineTo(cue.x-dx*70,cue.y-dy*70);ctx.stroke();
  }
  for(const ball of state.balls){
    if(ball.potted)continue;
    ctx.fillStyle='#26463460';ctx.beginPath();ctx.ellipse(ball.x+2,ball.y+4,11,9,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=BALL_COLORS[ball.id];ctx.beginPath();ctx.arc(ball.x,ball.y,10,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffffff85';ctx.beginPath();ctx.arc(ball.x-3,ball.y-3,2.5,0,Math.PI*2);ctx.fill();
    if(ball.id){ctx.fillStyle='#fffaf1';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(ball.id),ball.x,ball.y+1);}
  }
  const count=state.balls.filter(ball=>ball.id && ball.potted).length;
  $('potted').value=String(count);$('shots').value=String(state.shots);$('fouls').value=String(state.fouls);
  if(document.activeElement!==$('aim-angle'))$('aim-angle').value=String(angle);$('power').value=String(power);$('power-value').value=String(power);
  enableControls(host.active && state.phase==='aiming' && state.status==='playing');
  board.setAttribute('aria-label','迷你撞球，白球位於 '+Math.round(cue.x)+', '+Math.round(cue.y)+'；已入 '+count+' 球；'+(state.phase==='moving'?'球滾動中':'可瞄準')+'；方向 '+angle+' 度。');
}
function cancelDrag(restore=true){
  if(!drag)return;
  const previous=drag;drag=null;if(restore)angle=previous.angle;
  if(board.hasPointerCapture(previous.id))board.releasePointerCapture(previous.id);
}
function act(action){
  if(!host.active || state.phase!=='aiming' || state.status!=='playing')return;
  if(action==='left')angle=(angle+358)%360;
  if(action==='right')angle=(angle+2)%360;
  if(action==='up')power=Math.min(100,power+5);
  if(action==='down')power=Math.max(10,power-5);
  if(action==='shoot'){
    cancelDrag(false);input?.clear();state=shootPool(state,radians(),power);repeat=0;
    host.status.textContent='球正在滾動，等球停下再擊下一桿。';
  }
  draw();
}
const host=new GameHost({
  id:'mini-pool',onFocus:()=>{draw();board.focus();},
  onPause:()=>{input?.clear();cancelDrag();repeat=0;enableControls(false);},
  onReset:()=>{state=createPool();angle=270;power=45;accumulator=0;repeat=0;draw();},
  onTick:dt=>{
    if(state.phase==='aiming'){
      const held=['left','right','up','down'].filter(action=>input.active(action));
      if(held.length){repeat+=dt;if(repeat>=180){for(const action of held)act(action);repeat-=100;}}else repeat=0;
    }else repeat=0;
    const previousPhase=state.phase;accumulator+=dt/1000;
    while(accumulator>=1/240){accumulator-=1/240;state=stepPool(state,1/240);}
    if(previousPhase==='moving' && state.phase==='aiming'){
      input.clear();host.status.textContent=state.lastFoul?'白球落袋，已回到空位，可再擊球。':'球停好了，調整方向與力道再出手。';
    }
    draw();if(state.status==='won')host.finish('清台成功！用了 '+state.shots+' 桿，白球犯規 '+state.fouls+' 次。');
  }
});
input=bindGameInput(host,{board,keys:{ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Space:'shoot',Enter:'shoot'},onPress:action=>{repeat=0;act(action);}});
function point(event){
  const rect=board.getBoundingClientRect(),cue=state.balls[0],x=(event.clientX-rect.left)*640/rect.width,y=(event.clientY-rect.top)*360/rect.height;
  if(Math.hypot(x-cue.x,y-cue.y)>5)angle=(Math.round(Math.atan2(y-cue.y,x-cue.x)*180/Math.PI)+360)%360;
  draw();
}
board.addEventListener('pointerdown',event=>{
  if(!host.active || state.phase!=='aiming' || drag || (event.pointerType==='mouse' && event.button!==0))return;
  event.preventDefault();board.focus({preventScroll:true});drag={id:event.pointerId,angle};board.setPointerCapture(event.pointerId);point(event);
},{signal:host.controller.signal});
board.addEventListener('pointermove',event=>{if(drag?.id===event.pointerId && host.active)point(event);},{signal:host.controller.signal});
board.addEventListener('pointerup',event=>{if(drag?.id===event.pointerId){drag=null;draw();}},{signal:host.controller.signal});
for(const type of ['pointercancel','lostpointercapture'])board.addEventListener(type,event=>{if(drag?.id===event.pointerId){cancelDrag();draw();}},{signal:host.controller.signal});
$('aim-angle').addEventListener('input',()=>{
  if(!host.active || state.phase!=='aiming')return;
  const number=Number($('aim-angle').value);if(Number.isFinite(number))angle=((Math.round(number)%360)+360)%360;
  draw();
},{signal:host.controller.signal});
$('power').addEventListener('input',()=>{if(host.active && state.phase==='aiming'){power=Math.max(10,Math.min(100,Number($('power').value)));draw();}},{signal:host.controller.signal});
draw();
