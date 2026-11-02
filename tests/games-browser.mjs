import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const base=process.env.BTA_URL || 'http://127.0.0.1:5193/bearded-teacher-arcade/';
const evidence=new URL('../test-results/',import.meta.url);
await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({...(process.env.BTA_BROWSER==='chromium'?{}:{channel:'chrome'}),headless:true});
const results=[],errors=[];
async function run(name,fn,options={}) {
  const context=await browser.newContext({viewport:{width:1280,height:900},locale:'zh-TW',...options});
  const page=await context.newPage();page.on('pageerror',error=>errors.push({name,message:error.message}));
  try{await fn(page);results.push({name,status:'passed'});console.log('PASS '+name);}
  catch(error){results.push({name,status:'failed',message:error.message});console.log('FAIL '+name+'\n'+error.stack);}
  finally{await context.close();}
}
async function open(page,id) {
  await page.goto(base+'#game='+id);
  await expect(page.locator('#game-frame')).toHaveAttribute('src',new RegExp('/'+id+'\\.html$'));
  await expect(page.locator('#stage-status')).toContainText('準備好了');
  return page.frameLocator('#game-frame');
}
async function noOverflow(frame) {assert.ok(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
async function shot(page,name) {await page.screenshot({path:fileURLToPath(new URL(name,evidence)),fullPage:true});}
try{
  await run('正式大廳列出四款遊戲與對應說明',async page=>{
    await page.goto(base);await expect(page.locator('.game-card')).toHaveCount(4);
    await expect(page.getByRole('heading',{name:'星星貪食蛇'})).toBeVisible();
    await expect(page.getByRole('heading',{name:'翻牌配對'})).toBeVisible();
    await expect(page.locator('.card-kicker')).not.toContainText(['操作示範','操作示範']);
    await page.locator('#search').fill('配對');await expect(page.locator('.game-card')).toHaveCount(1);
    await page.locator('#search').fill('');await noOverflow(page);await shot(page,'games-lobby-desktop.png');
  });
  await run('貪食蛇反向無效、鍵盤轉向、碰牆與重新開始',async page=>{
    await page.clock.install({time:new Date('2026-11-03T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-03T00:00:00Z'));const f=await open(page,'snake');
    await f.getByRole('button',{name:'開始遊戲'}).click();
    await page.keyboard.press('ArrowLeft');await page.clock.runFor(200);
    await expect(f.locator('#board')).toHaveAttribute('aria-label',/第 7 欄、第 7 列/);
    await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowLeft');await page.clock.runFor(200);
    await expect(f.locator('#board')).toHaveAttribute('aria-label',/第 7 欄、第 6 列/);
    await page.clock.runFor(1500);await expect(f.locator('#status')).toContainText('碰到邊界');
    await f.getByRole('button',{name:'重新開始'}).click();
    await expect(f.locator('#score')).toHaveText('0');await expect(f.locator('#seconds')).toHaveText('0');
    await expect(f.getByRole('button',{name:'開始遊戲'})).toBeEnabled();
    await shot(page,'snake-desktop.png');
  });
  await run('貪食蛇失焦暫停後不移動或計時，恢復需手動',async page=>{
    await page.clock.install({time:new Date('2026-11-03T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-03T00:00:00Z'));const f=await open(page,'snake');
    await f.getByRole('button',{name:'開始遊戲'}).click();await page.clock.runFor(200);
    await page.locator('#back-lobby').focus();await expect(f.locator('#status')).toContainText('已暫停');
    const label=await f.locator('#board').getAttribute('aria-label'),seconds=await f.locator('#seconds').textContent();
    await page.clock.runFor(5000);
    await expect(f.locator('#board')).toHaveAttribute('aria-label',label);await expect(f.locator('#seconds')).toHaveText(seconds);
    await f.getByRole('button',{name:'繼續遊戲'}).click();await page.keyboard.press('ArrowUp');await page.clock.runFor(200);
    assert.notEqual(await f.locator('#board').getAttribute('aria-label'),label);
  });
  await run('翻牌可用方向鍵及 Enter，重複同一張不計步',async page=>{
    const f=await open(page,'memory');await f.getByRole('button',{name:'開始遊戲'}).click();
    await expect(f.locator('.memory-card').nth(0)).toBeFocused();
    await page.keyboard.press('Enter');await page.keyboard.press('Enter');await expect(f.locator('#moves')).toHaveText('0');
    await page.keyboard.press('ArrowRight');await expect(f.locator('.memory-card').nth(1)).toBeFocused();
    await page.keyboard.press('Space');await expect(f.locator('#moves')).toHaveText('1');
  });
  await run('翻牌不配對期間鎖定第三張，暫停保留翻面與剩餘時間',async page=>{
    await page.addInitScript(()=>{Math.random=()=>0;});await page.clock.install({time:new Date('2026-11-03T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-03T00:00:00Z'));
    const f=await open(page,'memory');await f.getByRole('button',{name:'開始遊戲'}).click();
    await f.locator('.memory-card').nth(0).click();await f.locator('.memory-card').nth(1).click();
    await f.locator('.memory-card').nth(2).click();
    await expect(f.locator('.is-open')).toHaveCount(2);await expect(f.locator('#moves')).toHaveText('1');
    await f.getByRole('button',{name:'暫停',exact:true}).click();await page.clock.runFor(2000);
    await expect(f.locator('.is-open')).toHaveCount(2);await expect(f.locator('#seconds')).toHaveText('0');
    await f.getByRole('button',{name:'繼續遊戲'}).click();await page.clock.runFor(800);
    await expect(f.locator('.is-open')).toHaveCount(0);
  });
  await run('翻牌完整遊玩六組成功，再重新開始歸零',async page=>{
    await page.addInitScript(()=>{Math.random=()=>0;});await page.clock.install({time:new Date('2026-11-03T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-03T00:00:00Z'));
    const f=await open(page,'memory');await f.getByRole('button',{name:'開始遊戲'}).click();
    const seen=new Map(),cards=f.locator('.memory-card');
    // Discover symbols through the rendered cards; no private game-state hook.
    for(let i=0;i<12;i+=2){
      await cards.nth(i).click();const a=await cards.nth(i).textContent();
      await cards.nth(i+1).click();const b=await cards.nth(i+1).textContent();
      for(const [symbol,index] of [[a,i],[b,i+1]]){if(!seen.has(symbol))seen.set(symbol,[]);seen.get(symbol).push(index);}
      await page.clock.runFor(800);
    }
    for(const indices of seen.values()){
      assert.equal(indices.length,2);
      if(await cards.nth(indices[0]).isDisabled())continue;
      await cards.nth(indices[0]).click();await cards.nth(indices[1]).click();
    }
    await expect(f.locator('#pairs')).toHaveText('6');await expect(f.locator('#status')).toContainText('全部配對成功');
    await expect(f.locator('.is-matched')).toHaveCount(12);
    await shot(page,'memory-complete.png');
    await f.getByRole('button',{name:'重新開始'}).click();await expect(f.locator('#pairs')).toHaveText('0');await expect(f.locator('#moves')).toHaveText('0');
  });
  for(const viewport of [{width:1280,height:720},{width:1024,height:768},{width:768,height:1024},{width:390,height:844}]){
    await run('正式遊戲觸控與轉向尺寸 '+viewport.width+'×'+viewport.height,async page=>{
      await page.clock.install({time:new Date('2026-11-03T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-03T00:00:00Z'));let f=await open(page,'snake');
      await f.getByRole('button',{name:'開始遊戲'}).tap();await f.getByRole('button',{name:'向上',exact:true}).tap();await page.clock.runFor(200);
      await expect(f.locator('#board')).toHaveAttribute('aria-label',/第 6 欄、第 6 列/);
      let child=page.frames().find(item=>item.parentFrame());await noOverflow(page);await noOverflow(child);
      for(const button of await f.locator('.dpad button').all()){const box=await button.boundingBox();assert.ok(box.width>=44&&box.height>=44);}
      await page.setViewportSize({width:viewport.height,height:viewport.width});await noOverflow(page);await noOverflow(child);
      await f.getByRole('button',{name:'向右',exact:true}).tap();await page.clock.runFor(200);
      await expect(f.locator('#board')).toHaveAttribute('aria-label',/第 7 欄、第 6 列/);
      f=await open(page,'memory');await f.getByRole('button',{name:'開始遊戲'}).tap();
      await f.locator('.memory-card').nth(0).tap();await f.locator('.memory-card').nth(1).tap();
      await expect(f.locator('#moves')).toHaveText('1');
      child=page.frames().find(item=>item.parentFrame());await noOverflow(page);await noOverflow(child);
      for(const button of await f.locator('.memory-card').all()){const box=await button.boundingBox();assert.ok(box.width>=44&&box.height>=44);}
      if(viewport.width===1024)await shot(page,'memory-tablet.png');
      await page.locator('#back-lobby').tap();await expect(page.locator('iframe')).toHaveCount(0);
    },{viewport,hasTouch:true});
  }
  await run('兩款正式遊戲獨立開啟與前後頁恢復可操作',async page=>{
    for(const id of ['snake','memory']){
      await page.goto(base+'games/'+id+'.html');await expect(page.locator('.standalone')).toBeVisible();
      await page.getByRole('button',{name:'開始遊戲'}).click();await expect(page.locator('#status')).toHaveText('遊戲中');
      await page.locator('.standalone').click();await expect(page.locator('.game-card')).toHaveCount(4);
      await page.goBack();await expect(page.getByRole('button',{name:/開始遊戲|繼續遊戲/})).toBeEnabled();
      await page.getByRole('button',{name:/開始遊戲|繼續遊戲/}).click();await expect(page.locator('#status')).toHaveText('遊戲中');
    }
  });
  await run('模組慢載入時嵌入操作區不顯示，ready 後才能開始',async page=>{
    let release;const gate=new Promise(resolve=>{release=resolve;});
    await page.route('**/games/assets/memory.mjs',async route=>{await gate;await route.continue();});
    const requested=page.waitForRequest('**/games/assets/memory.mjs');
    try{
      await page.goto(base+'#game=memory',{waitUntil:'domcontentloaded'});await requested;
      await expect(page.locator('#stage')).toHaveAttribute('aria-busy','true');
      await expect(page.locator('#game-frame')).toBeHidden();
      await expect(page.frameLocator('#game-frame').locator('#start')).toBeDisabled();
      release();await expect(page.locator('#stage-status')).toContainText('準備好了');
      await expect(page.locator('#game-frame')).toBeVisible();
      await page.frameLocator('#game-frame').getByRole('button',{name:'開始遊戲'}).click();
      await expect(page.frameLocator('#game-frame').locator('#status')).toHaveText('遊戲中');
    }finally{release();}
  });
  await run('獨立遊戲模組慢載入時開始鈕停用',async page=>{
    let release;const gate=new Promise(resolve=>{release=resolve;});
    await page.route('**/games/assets/snake.mjs',async route=>{await gate;await route.continue();});
    const requested=page.waitForRequest('**/games/assets/snake.mjs');
    try{
      await page.goto(base+'games/snake.html',{waitUntil:'commit'});await requested;
      await expect(page.locator('#start')).toBeDisabled();await expect(page.locator('#status')).toHaveText('正在準備遊戲…');
      release();await expect(page.locator('#status')).toContainText('準備好了');
      await page.getByRole('button',{name:'開始遊戲'}).click();await expect(page.locator('#status')).toHaveText('遊戲中');
    }finally{release();}
  });
  results.push({name:'正式遊戲無未處理 JavaScript 例外',status:errors.length?'failed':'passed'});
}finally{
  await writeFile(new URL('games-browser-report.json',evidence),JSON.stringify({date:new Date().toISOString(),browser:browser.version(),base,results,errors,limitation:'獨立瀏覽器與觸控模擬，非平板實機驗收。'},null,2)+'\n');
  await browser.close();
}
if(results.some(result=>result.status==='failed'))process.exitCode=1;
