import {createSnake,turnSnake,stepSnake} from './models.mjs';
import {GameHost} from './host.mjs';
const board=document.getElementById('board'),ctx=board.getContext('2d');
let state=createSnake(),accumulator=0;
function draw() {
  const cell=board.width/state.size;
  ctx.fillStyle='#dfe9d8';ctx.fillRect(0,0,board.width,board.height);
  ctx.strokeStyle='#cedec5';ctx.lineWidth=1;
  for(let i=0;i<=state.size;i++){ctx.beginPath();ctx.moveTo(i*cell,0);ctx.lineTo(i*cell,board.height);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*cell);ctx.lineTo(board.width,i*cell);ctx.stroke();}
  if(state.food){ctx.fillStyle='#a13b46';ctx.font='24px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('★',(state.food.x+.5)*cell,(state.food.y+.5)*cell);}
  state.body.forEach((part,index)=>{ctx.fillStyle=index===0?'#213c35':'#6b8b63';ctx.beginPath();ctx.roundRect(part.x*cell+2,part.y*cell+2,cell-4,cell-4,6);ctx.fill();});
  const head=state.body[0];ctx.fillStyle='#fffaf0';ctx.fillRect(head.x*cell+8,head.y*cell+8,4,4);ctx.fillRect(head.x*cell+18,head.y*cell+8,4,4);
  document.getElementById('score').value=String(state.score);
  board.setAttribute('aria-label','貪食蛇棋盤，目前得分 '+state.score+' 分；蛇頭在第 '+(head.x+1)+' 欄、第 '+(head.y+1)+' 列；方向鍵或 WASD 移動。');
}
const host=new GameHost({
  id:'snake',onFocus:()=>board.focus(),
  onReset:()=>{state=createSnake();accumulator=0;draw();},
  onTick:dt=>{
    accumulator+=dt;
    while(accumulator>=180 && state.status==='playing'){
      accumulator-=180;state=stepSnake(state);draw();
      if(state.status==='lost')host.finish((state.reason==='wall'?'碰到邊界了':'碰到自己了')+'！得分 '+state.score+' 分，按「重新開始」再挑戰。');
      if(state.status==='won')host.finish('滿格成功！你收集了所有星星。');
    }
  }
});
const actions={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
document.addEventListener('keydown',event=>{
  const direction=actions[event.key] || actions[event.key.toLowerCase()];
  if(!host.active || !direction || event.repeat || document.activeElement!==board)return;
  event.preventDefault();state=turnSnake(state,direction);
},{signal:host.controller.signal});
for(const button of document.querySelectorAll('[data-direction]')){
  button.addEventListener('pointerdown',event=>{
    if(!host.active || (event.pointerType==='mouse' && event.button!==0))return;
    event.preventDefault();button.setPointerCapture(event.pointerId);state=turnSnake(state,button.dataset.direction);
  },{signal:host.controller.signal});
  button.addEventListener('click',event=>{if(host.active && event.detail===0)state=turnSnake(state,button.dataset.direction);},{signal:host.controller.signal});
}
draw();
