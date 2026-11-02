import {createTetris,pieceMatrix,PIECE_COLORS,moveTetris,rotateTetris,holdTetris,ghostY,lockTetris,hardDropTetris} from './tetris-model.mjs';
import {GameHost} from './host.mjs';
import {bindGameInput} from './input.mjs';
const $=id=>document.getElementById(id),board=$('board'),ctx=board.getContext('2d');
let state=createTetris(),fall=0,grounded=0,repeat=0,input;
function block(context,x,y,size,type,ghost=false) {
  if(ghost){context.strokeStyle='#c5dcc1';context.setLineDash([3,3]);context.lineWidth=1;context.strokeRect(x+3,y+3,size-6,size-6);context.setLineDash([]);return;}
  context.fillStyle=PIECE_COLORS[type];context.fillRect(x+1,y+1,size-2,size-2);
  context.fillStyle='#ffffff30';context.fillRect(x+2,y+2,size-4,3);
}
function paintPiece(context,piece,size,ghost=false,offsetX=0,offsetY=0) {
  pieceMatrix(piece).forEach((row,y)=>row.forEach((cell,x)=>{if(cell)block(context,(piece.x+x)*size+offsetX,(piece.y+y)*size+offsetY,size,piece.type,ghost);}));
}
function previews(id,types) {
  const canvas=$(id),c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);
  types.forEach((type,index)=>{
    if(!type)return;
    const matrix=pieceMatrix({type,rotation:0}),size=id==='next-preview'?13:16,step=id==='next-preview'?44:70;
    paintPiece(c,{type,rotation:0,x:0,y:0},size,false,(96-matrix.length*size)/2,index*step+4);
  });
}
function draw() {
  const size=24;ctx.fillStyle='#1b302c';ctx.fillRect(0,0,240,480);
  ctx.strokeStyle='#2a433b';ctx.lineWidth=.5;
  for(let y=0;y<20;y++)for(let x=0;x<10;x++){ctx.strokeRect(x*size,y*size,size,size);if(state.board[y][x])block(ctx,x*size,y*size,size,state.board[y][x]);}
  if(state.status==='playing'){paintPiece(ctx,{...state.piece,y:ghostY(state)},size,true);paintPiece(ctx,state.piece,size);}
  previews('hold-preview',[state.hold]);previews('next-preview',state.queue.slice(0,3));
  $('hold-name').value=state.hold || '—';$('next-names').value=state.queue.slice(0,3).join(' · ');
  $('hold-preview').setAttribute('aria-label','Hold：'+(state.hold || '尚未保留'));
  $('next-preview').setAttribute('aria-label','Next：'+state.queue.slice(0,3).join('、'));
  $('hold-button').disabled=state.holdUsed;
  $('hold-hint').textContent=state.holdUsed?'本顆已使用保留':'每顆可保留一次';
  for(const key of ['score','lines','level'])$(key).value=String(state[key]);
  board.setAttribute('aria-label','方塊棋盤，目前 '+state.piece.type+' 方塊，第 '+(state.piece.x+1)+' 欄、第 '+(state.piece.y+1)+' 列，旋轉 '+state.piece.rotation+'；消除 '+state.lines+' 行。');
}
function endIfNeeded(){if(state.status==='lost')host.finish('方塊堆到頂端了！得分 '+state.score+' 分，按「重新開始」再挑戰。');}
function act(action) {
  if(!host.active)return;
  const previous=state;
  if(action==='left')state=moveTetris(state,-1);
  if(action==='right')state=moveTetris(state,1);
  if(action==='down'){state=moveTetris(state,0,1);if(state!==previous)state={...state,score:state.score+1};}
  if(action==='cw')state=rotateTetris(state,1);
  if(action==='ccw')state=rotateTetris(state,-1);
  if(action==='hold')state=holdTetris(state);
  if(action==='drop')state=hardDropTetris(state);
  if((action==='hold' && state!==previous) || action==='drop'){fall=0;grounded=0;}
  if(action==='left' || action==='right')repeat=0;
  draw();endIfNeeded();
}
const host=new GameHost({
  id:'tetris',onFocus:()=>board.focus(),
  onPause:()=>{input?.clear();repeat=0;},
  onReset:()=>{state=createTetris();fall=0;grounded=0;repeat=0;draw();},
  onTick:dt=>{
    if(input.active('left')!==input.active('right')){
      repeat+=dt;
      if(repeat>=180){state=moveTetris(state,input.active('left')?-1:1);repeat-=80;}
    }else repeat=0;
    const interval=input.active('down')?50:Math.max(100,800-(state.level-1)*65);
    fall+=dt;
    while(fall>=interval){
      fall-=interval;
      const next=moveTetris(state,0,1);
      if(next===state)break;
      state=input.active('down')?{...next,score:next.score+1}:next;
    }
    if(moveTetris(state,0,1)===state)grounded+=dt;else grounded=0;
    if(grounded>=350){state=lockTetris(state);grounded=0;fall=0;}
    draw();endIfNeeded();
  }
});
input=bindGameInput(host,{board,keys:{ArrowLeft:'left',ArrowRight:'right',ArrowDown:'down',ArrowUp:'cw',KeyX:'cw',KeyZ:'ccw',Space:'drop',KeyC:'hold',ShiftLeft:'hold',ShiftRight:'hold'},onPress:act});
draw();
