import test from 'node:test';
import assert from 'node:assert/strict';
import {createTetris,holdTetris,hardDropTetris,rotateTetris,moveTetris,lockTetris,ghostY,fits} from '../games/assets/tetris-model.mjs';
import {createPlatform,stepPlatform,LEVEL} from '../games/assets/platform-model.mjs';
import {trailRoute} from './fixtures/trail-route.mjs';
const random=()=>.37;
test('方塊七袋有完整七種，Next 順序依鎖定推進',()=>{
  let state=createTetris(random);const first=[state.piece.type,...state.queue.slice(0,6)];
  assert.equal(new Set(first).size,7);
  const next=state.queue[0];state=hardDropTetris(state,random);assert.equal(state.piece.type,next);
  assert.ok(state.queue.length>=3);assert.ok(ghostY(state)>=state.piece.y);
});
test('第一次 Hold 消耗 Next，一顆只能一次，鎖定後才解鎖',()=>{
  const first=createTetris(random),type=first.piece.type,next=first.queue[0];
  let state=holdTetris(first,random);
  assert.equal(state.hold,type);assert.equal(state.piece.type,next);assert.ok(state.holdUsed);
  assert.equal(holdTetris(state,random),state);
  state=hardDropTetris(state,random);assert.equal(state.holdUsed,false);
  const queue=[...state.queue],outgoing=state.piece.type;
  state=holdTetris(rotateTetris(moveTetris(state,-1)),random);
  assert.equal(state.piece.type,type);assert.equal(state.hold,outgoing);assert.equal(state.piece.rotation,0);
  assert.deepEqual(state.queue,queue);
});
test('左右邊界不穿牆，旋轉後仍合法且可逆轉',()=>{
  let state=createTetris(random);
  for(let i=0;i<20;i++)state=moveTetris(state,-1);
  assert.equal(moveTetris(state,-1),state);
  state=rotateTetris(state);assert.ok(fits(state,state.piece));
  const rotation=state.piece.rotation;state=rotateTetris(state,-1);assert.equal(state.piece.rotation,(rotation+3)%4);
});
test('一次消四行分數、空行補齊、等級更新正確',()=>{
  let state=createTetris(random);
  state={...state,lines:9,piece:{type:'I',x:2,y:16,rotation:1}};
  for(let y=16;y<20;y++)state.board[y]=Array.from({length:10},(_,x)=>x===4?null:'J');
  const next=lockTetris(state,random);
  assert.equal(next.lines,13);assert.equal(next.level,2);assert.equal(next.score,800);
  assert.equal(next.board.length,20);assert.ok(next.board.every(row=>row.every(cell=>cell===null)));
});
test('落點預覽等於硬降位置，堆頂後不能再 Hold 或移動',()=>{
  let state=createTetris(random);const y=ghostY(state);assert.ok(fits(state,{...state.piece,y}));
  assert.equal(fits(state,{...state.piece,y:y+1}),false);
  for(let i=0;i<30 && state.status==='playing';i++)state=hardDropTetris(state,random);
  assert.equal(state.status,'lost');assert.equal(holdTetris(state),state);assert.equal(moveTetris(state,1),state);
});
test('Hold 交換的出生點被阻擋時會頂出',()=>{
  let state=createTetris(random);state=holdTetris(state,random);state=hardDropTetris(state,random);
  state={...state,board:state.board.map((row,y)=>y<4?Array(10).fill('J'):[...row])};
  assert.equal(holdTetris(state,random).status,'lost');
});
test('闖關起跳、重力、落地與空中不能二段跳',()=>{
  let state=createPlatform();state=stepPlatform(state,{jump:true},1/120);assert.ok(state.player.vy<0);
  for(let i=0;i<5;i++)state=stepPlatform(state,{},1/120);
  const before=state.player.vy;state=stepPlatform(state,{jump:true},1/120);assert.ok(state.player.vy>before);
  for(let i=0;i<150;i++)state=stepPlatform(state,{},1/120);
  assert.equal(state.player.y,272);assert.ok(state.player.onGround);
});
test('闖關水平障礙擋路、缺口下落失敗',()=>{
  let state=createPlatform();state.player={...state.player,x:194,y:272};
  for(let i=0;i<30;i++)state=stepPlatform(state,{right:true},1/120);
  assert.equal(state.player.x,196);
  state=createPlatform();state.player={...state.player,x:470,y:330,onGround:false};
  for(let i=0;i<120;i++)state=stepPlatform(state,{},1/120);
  assert.equal(state.status,'lost');assert.equal(state.reason,'fall');
});
test('從上方踩掉小怪，側面碰撞失敗',()=>{
  let state=createPlatform();state.enemies=[{...state.enemies[0],x:720,vx:0}];
  state.player={...state.player,x:720,y:249,vy:180,onGround:false};state.coyote=0;
  const stomp=stepPlatform(state,{},1/120);assert.equal(stomp.enemies[0].alive,false);assert.ok(stomp.player.vy<0);assert.equal(stomp.status,'playing');
  state.player={...state.player,x:720,y:272,vy:0};assert.equal(stepPlatform(state,{},1/120).reason,'enemy');
});
test('星星只計分一次，完成終點只獎勵一次',()=>{
  let state=createPlatform();state.player.x=LEVEL.stars[0].x;
  state=stepPlatform(state,{},1/120);assert.equal(state.collected.length,1);const score=state.score;
  state=stepPlatform(state,{},1/120);assert.equal(state.score,score);
  state.player.x=LEVEL.goal-20;state=stepPlatform(state,{},1/120);
  assert.equal(state.status,'won');assert.equal(state.progress,100);assert.equal(stepPlatform(state,{},1/120),state);
});
test('小關卡可用連續右走與正常跳躍完整過關，不需集滿星星',()=>{
  const {actions,state}=trailRoute();assert.equal(state.status,'won');assert.ok(actions.length<200);
  assert.ok(state.collected.length<LEVEL.stars.length);assert.equal(state.progress,100);
});
