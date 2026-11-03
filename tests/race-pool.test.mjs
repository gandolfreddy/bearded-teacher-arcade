import test from 'node:test';
import assert from 'node:assert/strict';
import {createRacer,steerRacer,stepRacer,TRAFFIC_PATTERNS} from '../games/assets/racer-model.mjs';
import {createPool,shootPool,stepPool,respawnCue,aimPool} from '../games/assets/pool-model.mjs';
import {poolRoute,raceRoute} from './fixtures/race-pool-route.mjs';
const settle=s=>{for(let i=0;i<2400&&s.phase==='moving';i++)s=stepPool(s,1/240);return s;};
test('racer steering clamps and does not mutate initial state',()=>{const s=createRacer();assert.equal(steerRacer(steerRacer(s,-1),-1).lane,0);assert.equal(steerRacer(steerRacer(s,1),1).lane,2);assert.equal(s.lane,1);});
test('each traffic wave leaves a lane open',()=>{for(const lanes of TRAFFIC_PATTERNS)assert.ok(lanes.length>0&&lanes.length<3);for(const r of [0,.2,.4,.6,.8,.999]){const s=stepRacer({...createRacer(),spawnIn:0},.05,{},()=>r);assert.ok(s.obstacles[0].lanes.length<3);}});
test('braking lowers road speed and distance',()=>{const a=stepRacer(createRacer(),.05),b=stepRacer(createRacer(),.05,{brake:true});assert.ok(b.speed<a.speed&&b.distance<a.distance&&b.scroll<a.scroll);});
test('racer collision ends play, passed waves count once',()=>{const s={...createRacer(),obstacles:[{id:0,lanes:[1],y:380,scored:false}]};const lost=stepRacer(s,.05);assert.equal(lost.status,'lost');assert.equal(stepRacer(lost,.05),lost);const passed=stepRacer({...s,obstacles:[{id:0,lanes:[0],y:440,scored:false}]},.05);assert.equal(stepRacer(passed,.05).passed,1);});
test('normal steering route reaches 1000m across all wave types',()=>{const route=raceRoute();assert.equal(route.state.status,'won');assert.equal(route.state.distance,1000);assert.ok(route.state.passed>15);});
test('pool rejects second shot while moving and nonfinite inputs',()=>{const s=createPool(),shot=shootPool(s,0,45);assert.equal(shootPool(shot,0,45),shot);assert.equal(shootPool(s,NaN,45),s);assert.equal(s.shots,0);assert.equal(shot.shots,1);});
test('pool collision transfers velocity, cushions bounce and friction settles',()=>{let s=createPool();s.balls=s.balls.map(b=>({...b,potted:b.id>1}));s.balls[0]={...s.balls[0],x:200,y:180};s.balls[1]={...s.balls[1],x:224,y:180};s=shootPool(s,0,45);for(let i=0;i<10;i++)s=stepPool(s,1/240);assert.ok(s.balls[1].vx>100);let wall={...s,balls:s.balls.map(b=>b.id===0?{...b,x:589,y:180,vx:200,vy:0}:b)};wall=stepPool(wall,1/120);assert.ok(wall.balls[0].vx<0);assert.equal(settle(s).phase,'aiming');});
test('cue pocket adds one foul and respawns without overlap',()=>{let s=createPool();s.balls[0]={...s.balls[0],x:320,y:70};s=settle(shootPool(s,-Math.PI/2,45));assert.equal(s.fouls,1);assert.equal(s.balls[0].potted,false);assert.ok(s.balls.slice(1).every(b=>b.potted||Math.hypot(b.x-s.balls[0].x,b.y-s.balls[0].y)>20));assert.equal(s.lastFoul,true);});
test('cue respawn searches alternate free spots',()=>{const balls=createPool().balls;balls[1]={...balls[1],x:320,y:180};assert.notDeepEqual(respawnCue(balls),{x:320,y:180});});
test('aim ray finds object and cushion without NaN',()=>{const s=createPool(),aim=aimPool(s,0);assert.equal(aim.hit.id,1);assert.ok(Number.isFinite(aim.x)&&Number.isFinite(aim.y));const wall=aimPool(s,-Math.PI/2);assert.equal(wall.hit,null);assert.equal(wall.y,50);});
test('triangle rack can be broken and cleared via ordinary shots',()=>{let s=createPool();for(const [a,p] of poolRoute)s=settle(shootPool(s,a*Math.PI/180,p));assert.equal(s.status,'won');assert.equal(s.shots,poolRoute.length);assert.equal(s.balls.filter(b=>b.id&&b.potted).length,6);assert.equal(shootPool(s,0,45),s);});

test('triangle rack has 1-2-3 rows, no overlap, and cue faces apex',()=>{
  const s=createPool(),cue=s.balls[0],balls=s.balls.slice(1),columns=new Map();
  for(const b of balls)columns.set(b.x,(columns.get(b.x)||0)+1);
  assert.deepEqual([...columns.values()],[1,2,3]);assert.equal(cue.y,balls[0].y);assert.ok(cue.x<balls[0].x);
  for(let i=0;i<s.balls.length;i++)for(let j=i+1;j<s.balls.length;j++)assert.ok(Math.hypot(s.balls[i].x-s.balls[j].x,s.balls[i].y-s.balls[j].y)>=20);
  const opened=settle(shootPool(s,0,85));assert.equal(opened.phase,'aiming');assert.ok(opened.balls.slice(1).filter((b,i)=>Math.hypot(b.x-balls[i].x,b.y-balls[i].y)>5).length>=4);
  assert.ok(opened.balls.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)));
});
