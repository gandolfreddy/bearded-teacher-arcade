import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {trailRoute} from './fixtures/trail-route.mjs';
const base=process.env.BTA_URL || 'http://127.0.0.1:5193/bearded-teacher-arcade/';
const evidence=new URL('../test-results/',import.meta.url);
await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({...(process.env.BTA_BROWSER==='chromium'?{}:{channel:'chrome'}),headless:true});
const results=[],errors=[];
async function run(name,fn,options={}) {
  const context=await browser.newContext({viewport:{width:1280,height:900},locale:'zh-TW',...options});
  const page=await context.newPage();page.on('pageerror',error=>errors.push({name,message:error.message}));
  try{
    await page.clock.install({time:new Date('2026-11-03T00:00:00Z')});
    await page.clock.pauseAt(new Date('2026-11-03T00:00:00Z'));
    await fn(page);results.push({name,status:'passed'});console.log('PASS '+name);
  }catch(error){results.push({name,status:'failed',message:error.message});console.log('FAIL '+name+'\n'+error.stack);}
  finally{await context.close();}
}
async function open(page,id) {
  await page.goto(base+'#game='+id);
  await expect(page.locator('#game-frame')).toHaveAttribute('src',new RegExp('/'+id+'\\.html$'));
  await expect(page.locator('#stage-status')).toContainText('準備好了');
  const f=page.frameLocator('#game-frame');await f.getByRole('button',{name:'開始遊戲'}).click();
  await expect(f.locator('#status')).toHaveText('遊戲中');return f;
}
async function pose(f) {
  const label=await f.locator('#board').getAttribute('aria-label');
  const match=label.match(/第 (\d+) 欄、第 (\d+) 列，旋轉 (\d+)/);
  return {label,x:Number(match[1]),y:Number(match[2]),rotation:Number(match[3])};
}
async function player(f) {
  const label=await f.locator('#board').getAttribute('aria-label'),match=label.match(/位於 (-?\d+), (-?\d+)/);
  return {x:Number(match[1]),y:Number(match[2]),label};
}
async function shot(page,name){await page.screenshot({path:fileURLToPath(new URL(name,evidence)),fullPage:true});}
async function noOverflow(frame){assert.ok(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
try{
  await run('方塊 Hold／Next 可見，第一次保留後本顆鎖定',async page=>{
    const f=await open(page,'tetris');
    await expect(f.getByRole('heading',{name:/HOLD/})).toBeVisible();await expect(f.getByRole('heading',{name:/NEXT/})).toBeVisible();
    const first=(await pose(f)).label.match(/目前 (\w) 方塊/)[1],next=(await f.locator('#next-names').textContent()).split(' · ');
    assert.equal(next.length,3);
    await page.keyboard.press('c');await expect(f.locator('#hold-name')).toHaveText(first);
    assert.equal((await pose(f)).label.match(/目前 (\w) 方塊/)[1],next[0]);
    const held=await pose(f);await page.keyboard.press('Shift');
    assert.equal((await pose(f)).label,held.label);
    await expect(f.locator('#hold-button')).toBeDisabled();await shot(page,'tetris-hold-next.png');
  });
  await run('方塊旋轉、硬降推進 Next 並解鎖 Hold，重玩歸零',async page=>{
    const f=await open(page,'tetris');
    await page.keyboard.press('x');assert.equal((await pose(f)).rotation,1);
    await page.keyboard.press('z');assert.equal((await pose(f)).rotation,0);
    await page.keyboard.press('c');const next=(await f.locator('#next-names').textContent()).split(' · ')[0];
    await page.keyboard.press('Space');assert.equal((await pose(f)).label.match(/目前 (\w) 方塊/)[1],next);
    await expect(f.locator('#hold-button')).toBeEnabled();
    await f.getByRole('button',{name:'重新開始'}).click();await expect(f.locator('#hold-name')).toHaveText('—');
    await expect(f.locator('#score')).toHaveText('0');await expect(f.locator('#lines')).toHaveText('0');
  });
  await run('方塊長按會連移，失焦暫停清除按鍵與計時',async page=>{
    const f=await open(page,'tetris');const initial=await pose(f);
    await page.keyboard.down('ArrowLeft');await page.clock.runFor(350);assert.ok((await pose(f)).x<initial.x-1);
    await page.locator('#back-lobby').focus();await page.keyboard.up('ArrowLeft');await expect(f.locator('#status')).toContainText('已暫停');
    const paused=await pose(f),seconds=await f.locator('#seconds').textContent();await page.clock.runFor(3000);
    assert.equal((await pose(f)).label,paused.label);await expect(f.locator('#seconds')).toHaveText(seconds);
    await f.getByRole('button',{name:'繼續遊戲'}).click();await page.clock.runFor(200);assert.equal((await pose(f)).x,paused.x);
  });
  await run('方塊觸控軟降的取消事件不留下長按',async page=>{
    const f=await open(page,'tetris'),down=f.getByRole('button',{name:'向下',exact:true});
    await down.scrollIntoViewIfNeeded();const box=await down.boundingBox(),client=await page.context().newCDPSession(page);
    const point={x:box.x+box.width/2,y:box.y+box.height/2,id:1};
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
    await page.clock.runFor(200);const dropped=await pose(f);assert.ok(dropped.y>2);
    await client.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    await page.clock.runFor(300);assert.equal((await pose(f)).y,dropped.y);await client.detach();
  },{hasTouch:true});
  await run('方塊連續硬降堆頂結束，重玩清空保留與分數',async page=>{
    const f=await open(page,'tetris');await page.keyboard.press('c');
    for(let i=0;i<30;i++){
      if(await f.locator('body').getAttribute('data-phase')==='finished')break;
      await page.keyboard.press('Space');
    }
    await expect(f.locator('#status')).toContainText('頂端');
    await expect(f.getByRole('button',{name:'開始遊戲'})).toBeDisabled();
    await f.getByRole('button',{name:'重新開始'}).click();
    await expect(f.locator('#score')).toHaveText('0');await expect(f.locator('#hold-name')).toHaveText('—');
    await expect(f.getByRole('button',{name:'開始遊戲'})).toBeEnabled();
  });
  await run('小關卡鍵盤移動與跳躍、按鍵來源分開釋放',async page=>{
    const f=await open(page,'star-trail');
    await page.keyboard.down('ArrowRight');await page.keyboard.down('d');await page.clock.runFor(200);
    const a=await player(f);assert.ok(a.x>44);
    await page.keyboard.up('ArrowRight');await page.clock.runFor(200);const b=await player(f);assert.ok(b.x>a.x);
    await page.keyboard.up('d');await page.clock.runFor(200);assert.equal((await player(f)).x,b.x);
    await page.keyboard.press('Space');await page.clock.runFor(150);assert.ok((await player(f)).y<272);
  });
  await run('小關卡以真實鍵盤輸入完整過關，重玩後回起點',async page=>{
    const f=await open(page,'star-trail'),{actions}=trailRoute();
    await page.keyboard.down('ArrowRight');let jumping=false;
    for(const action of actions){
      if(action.jump!==jumping){jumping=action.jump;if(jumping)await page.keyboard.down('Space');else await page.keyboard.up('Space');}
      await page.clock.runFor(50);
    }
    await page.keyboard.up('ArrowRight');if(jumping)await page.keyboard.up('Space');
    await expect(f.locator('#status')).toContainText('過關了');await expect(f.locator('#progress')).toHaveText('100');
    await shot(page,'star-trail-complete.png');
    await f.getByRole('button',{name:'重新開始'}).click();await expect(f.locator('#progress')).toHaveText('0');assert.equal((await player(f)).x,44);
  });
  await run('小關卡雙指同時移動與跳躍，單指放開不解除另一指',async page=>{
    const f=await open(page,'star-trail'),right=f.getByRole('button',{name:'向右',exact:true}),jump=f.getByRole('button',{name:/跳躍 ↑/});
    await jump.scrollIntoViewIfNeeded();const a=await right.boundingBox(),b=await jump.boundingBox(),client=await page.context().newCDPSession(page);
    const p1={x:a.x+a.width/2,y:a.y+a.height/2,id:1},p2={x:b.x+b.width/2,y:b.y+b.height/2,id:2};
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p1]});
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p1,p2]});
    await page.clock.runFor(150);const airborne=await player(f);assert.ok(airborne.x>44 && airborne.y<272);
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[p2]});
    await page.clock.runFor(150);const continued=await player(f);assert.ok(continued.x>airborne.x);
    await client.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    await page.clock.runFor(200);assert.equal((await player(f)).x,continued.x);await client.detach();
  },{hasTouch:true,viewport:{width:768,height:1024}});
  for(const viewport of [{width:1280,height:720},{width:1024,height:768},{width:768,height:1024},{width:390,height:844}]){
    await run('新增遊戲觸控、Hold／Next 與尺寸 '+viewport.width+'×'+viewport.height,async page=>{
      let f=await open(page,'tetris');
      await f.getByRole('button',{name:'保留 C',exact:true}).tap();await expect(f.locator('#hold-name')).not.toHaveText('—');
      await f.getByRole('button',{name:'落到底',exact:true}).tap();await expect(f.locator('#hold-button')).toBeEnabled();
      const child=page.frames().find(frame=>frame.parentFrame());await noOverflow(page);await noOverflow(child);
      for(const button of await f.locator('[data-action]').all()){const box=await button.boundingBox();assert.ok(box.width>=44 && box.height>=44);}
      await page.setViewportSize({width:viewport.height,height:viewport.width});await noOverflow(page);await noOverflow(child);
      await expect(f.getByRole('heading',{name:/HOLD/})).toBeVisible();await expect(f.getByRole('heading',{name:/NEXT/})).toBeVisible();
      assert.ok(await child.evaluate(()=>{scrollTo({top:0,behavior:'instant'});return [...document.querySelectorAll('[data-action]')].every(button=>button.getBoundingClientRect().bottom<=innerHeight+1);}), '方塊觸控操作需在遊戲視窗內完整顯示');
      f=await open(page,'star-trail');await f.getByRole('button',{name:/跳躍 ↑/}).tap();await page.clock.runFor(150);
      assert.ok((await player(f)).y<272);await noOverflow(page);await noOverflow(page.frames().find(frame=>frame.parentFrame()));
      for(const button of await f.locator('[data-action]').all()){const box=await button.boundingBox();assert.ok(box.width>=44 && box.height>=44);}
      if(viewport.width===1024)await shot(page,'star-trail-tablet.png');
      await page.locator('#back-lobby').tap();await expect(page.locator('iframe')).toHaveCount(0);
    },{viewport,hasTouch:true});
  }
  await run('兩款新增遊戲獨立入口可開始，返回後不留下 iframe',async page=>{
    for(const id of ['tetris','star-trail']){
      await page.goto(base+'games/'+id+'.html');await page.getByRole('button',{name:'開始遊戲'}).click();
      await expect(page.locator('#status')).toHaveText('遊戲中');await expect(page.locator('.standalone')).toBeVisible();
      await page.locator('.standalone').click();await expect(page.locator('.game-card')).toHaveCount(6);
    }
  });
  results.push({name:'新增遊戲無未處理 JavaScript 例外',status:errors.length?'failed':'passed'});
}finally{
  await writeFile(new URL('arcade-browser-report.json',evidence),JSON.stringify({date:new Date().toISOString(),browser:browser.version(),base,results,errors,limitation:'獨立 Chromium／Chrome 的鍵盤與多指事件模擬，不是平板實機。'},null,2)+'\n');
  await browser.close();
}
if(results.some(result=>result.status==='failed'))process.exitCode=1;
