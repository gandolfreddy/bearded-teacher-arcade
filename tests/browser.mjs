import {chromium, expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir, writeFile, readFile} from 'node:fs/promises';
const base = process.env.BTA_URL || 'http://127.0.0.1:5193/bearded-teacher-arcade/';
const evidence = new URL('../test-results/',import.meta.url);
await mkdir(evidence,{recursive:true});
const browser = await chromium.launch({...(process.env.BTA_BROWSER === 'chromium' ? {} : {channel:'chrome'}),headless:true});
const demoCatalog=JSON.parse(await readFile(new URL('./fixtures/catalog.json',import.meta.url),'utf8'));
const results = [], errors = [];
async function run(name, fn) {
  try {await fn(); results.push({name,status:'passed'}); console.log('PASS ' + name);}
  catch(error) {results.push({name,status:'failed',message:error.message});console.log('FAIL ' + name + '\n' + error.stack);}
}
const context = await browser.newContext({viewport:{width:1280,height:900},locale:'zh-TW'});
await context.route('**/games.json',route=>route.fulfill({json:demoCatalog}));
const page = await context.newPage();
page.on('pageerror',error=>errors.push(error.message));
let navigation = 0;
async function fresh(url) { const target = new URL(url); target.searchParams.set('_test',String(++navigation)); return page.goto(target.href); }
const frame = () => page.frameLocator('#game-frame');
async function open(id) {await fresh(base+'#game='+id);await expect(page.locator('#stage-status')).toContainText('準備好了');}
async function noOverflow(target) {assert.ok(await target.evaluate(()=>document.documentElement.scrollWidth <= innerWidth + 1),'水平溢出');}
try {
  await run('大廳與搜尋／空結果清除',async()=>{
    await fresh(base); await expect(page.locator('.game-card')).toHaveCount(2);
    await noOverflow(page);
    await page.getByRole('searchbox',{name:'搜尋遊戲'}).fill('方向');
    await expect(page.locator('.game-card')).toHaveCount(1);
    await page.locator('#search').fill('不存在的玩法');
    await expect(page.locator('#empty')).toBeVisible();
    await page.getByRole('button',{name:'清除搜尋'}).click();
    await expect(page.locator('.game-card')).toHaveCount(2);
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({path:new URL('lobby-desktop.png',evidence).pathname.replace(/^\/([A-Z]:)/,'$1'),fullPage:true});
  });
  await run('鍵盤啟動與方向輸入、重玩、返回焦點',async()=>{
    await page.getByRole('link',{name:'開啟方向操控練習'}).click();
    await expect(page.locator('#stage-status')).toContainText('準備好了');
    await frame().getByRole('button',{name:'開始練習'}).click();
    await expect(frame().locator('#status')).toHaveText('練習中');
    await page.keyboard.press('ArrowRight');
    await expect(frame().locator('#count')).toHaveText('1');
    await expect(frame().locator('#position')).toHaveText('位置：4, 3');
    await page.getByRole('button',{name:'重新開始'}).click();
    await expect(page.locator('#stage-status')).toContainText('準備好了');
    await expect(frame().locator('#count')).toHaveText('0');
    await page.locator('#back-lobby').click();
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('#open-direction-lab')).toBeFocused();
  });
  await run('直接連結、重整與上一頁／下一頁',async()=>{
    await open('touch-lab'); await page.reload();
    await expect(page.locator('#player-title')).toHaveText('觸控節奏練習');
    await expect(page.locator('#stage-status')).toContainText('準備好了');
    await page.locator('#back-lobby').click();
    await expect(page.locator('iframe')).toHaveCount(0);
    await page.goBack(); await expect(page.locator('#stage-status')).toContainText('準備好了');
    await page.goForward(); await expect(page.locator('#lobby')).toBeVisible();
    await expect(page.locator('iframe')).toHaveCount(0);
  });
  await run('連續切換 20 次不累積 iframe 或舊執行環境',async()=>{
    let old;
    for (let i=0;i<20;i++) {
      await page.evaluate(id=>{location.hash='game='+id;},i%2?'touch-lab':'direction-lab');
      await expect(page.locator('#stage-status')).toContainText('準備好了');
      await expect(page.locator('iframe')).toHaveCount(1);
      if(old) assert.ok(old.isDetached(),'舊 frame 未卸載');
      old = page.frames().find(item=>item.parentFrame());
    }
    await page.locator('#back-lobby').click(); await expect(page.locator('iframe')).toHaveCount(0); await expect.poll(()=>old.isDetached()).toBe(true);
  });
  await run('無效 id 與非法路由顯示錯誤且不載入 iframe',async()=>{
    for (const hash of ['#game=missing','#game=../outside','#game=direction-lab&other=x']) {
      await fresh(base+hash);
      await expect(page.locator('#play-error')).toBeVisible();
      await expect(page.locator('iframe')).toHaveCount(0);
      await expect(page.locator('#play-retry')).toBeHidden();
    }
  });
  await run('清單網路錯誤可重試',async()=>{
    await page.route('**/games.json',route=>route.fulfill({status:503,body:'unavailable'}));
    await fresh(base); await expect(page.locator('#catalog-error')).toBeVisible();
    await page.unroute('**/games.json');
    await page.getByRole('button',{name:'重新載入清單'}).click();
    await expect(page.locator('.game-card')).toHaveCount(2);
    await expect(page.locator('#catalog-error')).toBeHidden();
  });
  await run('格式錯誤及外部入口清單不能啟動遊戲',async()=>{
    const raw = structuredClone(demoCatalog);
    for (const data of [{schemaVersion:1,games:[raw.games[0],raw.games[0]]},{schemaVersion:1,games:[{...raw.games[0],entry:'https://example.com/evil.html'}]}]) {
      await page.route('**/games.json',route=>route.fulfill({json:data}));
      await fresh(base+'#game=direction-lab');
      await expect(page.locator('#catalog-error')).toBeVisible();
      await expect(page.locator('iframe')).toHaveCount(0);
      await page.unroute('**/games.json');
    }
  });
  await run('沒有 ready 的載入逾時與重試',async()=>{
    await page.clock.install();
    await page.route('**/games/direction-lab.html',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><p>測試沒有 ready</p>'}));
    await fresh(base+'#game=direction-lab');
    await expect(page.locator('iframe')).toHaveCount(1);
    await page.clock.fastForward(11000);
    await expect(page.locator('#play-error')).toBeVisible();
    await expect(page.locator('#play-message')).toContainText('10 秒');
    await expect(page.locator('iframe')).toHaveCount(0);
    await page.unroute('**/games/direction-lab.html');
    await page.getByRole('button',{name:'再試一次'}).click();
    await expect(page.locator('#stage-status')).toContainText('準備好了');
    await page.clock.resume();
  });
  await run('切出 iframe 暫停、按鍵不殘留、回來需手動恢復',async()=>{
    await open('direction-lab');
    await frame().getByRole('button',{name:'開始練習'}).click();
    await page.keyboard.down('ArrowRight');
    await expect(frame().locator('#count')).toHaveText('1');
    await page.locator('#back-lobby').focus();
    await page.keyboard.up('ArrowRight');
    await expect(frame().locator('#status')).toContainText('已暫停');
    const oldSeconds = await frame().locator('#seconds').textContent();
    await page.clock.fastForward(3000);
    await expect(frame().locator('#seconds')).toHaveText(oldSeconds);
    await frame().getByRole('button',{name:'繼續練習'}).click();
    await page.keyboard.press('ArrowRight');
    await expect(frame().locator('#count')).toHaveText('2');
    await page.clock.resume();
  });
  await run('遊戲錯誤回報卸載 frame，外框訊息冒用無效',async()=>{
    await open('direction-lab');
    await page.evaluate(()=>window.postMessage({channel:'bta',version:1,gameId:'direction-lab',type:'error',message:'冒用'},location.origin));
    await expect(page.locator('#play-error')).toBeHidden();
    const child = page.frames().find(item=>item.parentFrame());
    await child.evaluate(()=>parent.postMessage({channel:'bta',version:1,gameId:'direction-lab',type:'error',message:'測試錯誤'},location.origin));
    await expect(page.locator('#play-message')).toHaveText('測試錯誤');
    await expect(page.locator('iframe')).toHaveCount(0);
  });
  await run('獨立遊戲網址可操作且不依賴父頁',async()=>{
    await fresh(base+'games/touch-lab.html');
    await page.getByRole('button',{name:'開始練習'}).click();
    await page.keyboard.press('Enter');
    await expect(page.locator('#count')).toHaveText('1');
  });
  for (const viewport of [{width:1280,height:720},{width:1024,height:768},{width:768,height:1024},{width:390,height:844}]) {
    await run('版面與觸控模擬 '+viewport.width+'×'+viewport.height,async()=>{
      const ctx = await browser.newContext({viewport,hasTouch:true,locale:'zh-TW'});
      await ctx.route('**/games.json',route=>route.fulfill({json:demoCatalog}));
      const p = await ctx.newPage();
      try {
        await p.goto(base); await expect(p.locator('.game-card')).toHaveCount(2); await noOverflow(p);
        if (viewport.width===768) await p.screenshot({path:new URL('lobby-tablet.png',evidence).pathname.replace(/^\/([A-Z]:)/,'$1'),fullPage:true});
        await p.getByRole('link',{name:'開啟方向操控練習'}).tap();
        await expect(p.locator('#stage-status')).toContainText('準備好了');
        const f = p.frameLocator('#game-frame');
        await f.getByRole('button',{name:'開始練習'}).tap();
        await f.getByRole('button',{name:'向上',exact:true}).tap();
        await expect(f.locator('#count')).toHaveText('1');
        await expect(f.locator('#position')).toHaveText('位置：3, 2');
        const child = p.frames().find(item=>item.parentFrame());
        await noOverflow(child);
        for (const button of await f.locator('.dpad button').all()) {
          const box = await button.boundingBox(); assert.ok(box.width>=44 && box.height>=44);
        }
        await p.setViewportSize({width:viewport.height,height:viewport.width});
        await noOverflow(p); await noOverflow(child);
        await f.getByRole('button',{name:'向右',exact:true}).tap();
        await expect(f.locator('#count')).toHaveText('2');
        if(viewport.width===1024) await p.screenshot({path:new URL('player-tablet.png',evidence).pathname.replace(/^\/([A-Z]:)/,'$1'),fullPage:true});
        await p.locator('#back-lobby').tap();
        await p.getByRole('link',{name:'開啟觸控節奏練習'}).tap();
        await expect(p.locator('#stage-status')).toContainText('準備好了');
        await p.frameLocator('#game-frame').getByRole('button',{name:'開始練習'}).tap();
        await p.frameLocator('#game-frame').getByRole('button',{name:'點按練習區'}).tap();
        await expect(p.frameLocator('#game-frame').locator('#count')).toHaveText('1');
      } finally {await ctx.close();}
    });
  }
  await run('嵌入時隱藏獨立返回連結，跳到內容不退出遊戲',async()=>{
    await open('direction-lab');
    await expect(frame().locator('.standalone')).toBeHidden();
    await page.locator('.skip').focus();
    await expect(page.locator('.skip')).toHaveCSS('opacity','1');
    await page.keyboard.press('Enter');
    assert.equal(new URL(page.url()).hash,'#game=direction-lab');
    await expect(page.locator('#main')).toBeFocused();
    await expect(page.locator('iframe')).toHaveCount(1);
  });
  await run('主頁與遊戲 JavaScript 沒有未處理例外',async()=>assert.deepEqual(errors,[]));
} finally {
  await context.close();
  const report = {date:new Date().toISOString(),browser:browser.version(),base,results,errors,limitation:'Chromium/Chrome 模擬尺寸與觸控，並非平板實機或 Safari 驗收。'};
  await writeFile(new URL('browser-report.json',evidence),JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
if(results.some(result=>result.status==='failed')) process.exitCode=1;
