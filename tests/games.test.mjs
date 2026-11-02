import test from 'node:test';
import assert from 'node:assert/strict';
import {createSnake,turnSnake,stepSnake,placeFood,createMemory,flipMemory,resolveMismatch} from '../games/assets/models.mjs';

test('貪食蛇吃食物增加分數與長度，不在身體產生食物',()=>{
  const state=createSnake(()=>0);state.food={x:6,y:6};
  const next=stepSnake(state,()=>0);
  assert.equal(next.score,10);assert.equal(next.body.length,4);assert.equal(state.body.length,3);
  assert.ok(!next.body.some(cell=>cell.x===next.food.x && cell.y===next.food.y));
});
test('轉向不能反向或在一個 tick 內連轉兩次',()=>{
  const state=createSnake();
  assert.equal(turnSnake(state,'left'),state);
  const turned=turnSnake(state,'up');
  assert.equal(turnSnake(turned,'left'),turned);
  assert.equal(stepSnake(turned).direction,'up');
});
test('牆與身體碰撞會結束，結束後不可移動',()=>{
  const state=createSnake();state.body=[{x:11,y:6},{x:10,y:6},{x:9,y:6}];
  const lost=stepSnake(state);assert.equal(lost.reason,'wall');assert.equal(stepSnake(lost),lost);
  const body={...createSnake(),body:[{x:1,y:1},{x:2,y:1},{x:2,y:2},{x:1,y:2}],direction:'right'};
  assert.equal(stepSnake(body).reason,'body');
});
test('可進入同一 tick 即將離開的尾格，滿格時勝利',()=>{
  const state={...createSnake(),body:[{x:1,y:1},{x:1,y:2},{x:2,y:2},{x:2,y:1}],food:{x:5,y:5}};
  assert.equal(stepSnake(state).status,'playing');
  const tiny={...createSnake(),size:2,body:[{x:0,y:0},{x:0,y:1},{x:1,y:1}],food:{x:1,y:0}};
  const won=stepSnake(tiny);assert.equal(won.status,'won');assert.equal(won.food,null);
  assert.equal(placeFood(won.body,2),null);
});
test('翻牌有 6 組完整配對，洗牌不丟牌',()=>{
  for(const random of [()=>0,()=>.999,Math.random]){
    const state=createMemory(random);
    assert.equal(state.deck.length,12);
    for(let pair=0;pair<6;pair++)assert.equal(state.deck.filter(card=>card.pair===pair).length,2);
  }
});
test('同一張、無效索引及等待中的翻牌不計步',()=>{
  const state=createMemory(()=>0),one=flipMemory(state,0);
  assert.equal(flipMemory(one,0),one);assert.equal(flipMemory(state,-1),state);
  const different=one.deck.findIndex(card=>card.pair!==one.deck[0].pair);
  const pending=flipMemory(one,different);assert.equal(pending.moves,1);assert.ok(pending.pending);
  assert.equal(flipMemory(pending,2),pending);
  const reset=resolveMismatch(pending);assert.equal(reset.flipped.length,0);assert.equal(reset.moves,1);
});
test('成功配對鎖定，完成 6 組後勝利且不再接受輸入',()=>{
  let state=createMemory(()=>.5);
  for(let pair=0;pair<6;pair++){
    const indices=state.deck.flatMap((card,index)=>card.pair===pair?[index]:[]);
    state=flipMemory(flipMemory(state,indices[0]),indices[1]);
    assert.equal(flipMemory(state,indices[0]),state);
  }
  assert.equal(state.status,'won');assert.equal(state.moves,6);assert.equal(state.matched.length,12);
  assert.equal(flipMemory(state,0),state);
});
