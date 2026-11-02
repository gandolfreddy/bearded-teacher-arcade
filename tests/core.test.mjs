import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {validateCatalog, parseRoute, matchesSearch, GameSession} from '../assets/js/core.mjs';

const base = 'https://example.github.io/bearded-teacher-arcade/';
const game = {id:'sample',title:'方向練習',description:'星星移動',entry:'./games/sample.html',inputs:['keyboard','touch'],instructions:{keyboard:'方向鍵',touch:'按鈕'}};
const catalog = entry => ({schemaVersion:1,games:[{...game,entry}]});
test('目錄正規化保留 GitHub Pages 子路徑', () => {
  assert.equal(validateCatalog(catalog(game.entry), base)[0].entry, base + 'games/sample.html');
});
test('拒絕外部、穿越、編碼穿越、根路徑、非 HTML 與查詢參數', () => {
  for (const entry of ['https://evil.test/x.html','./games/../index.html','./games/%2e%2e/index.html','/games/a.html','./games/a.js','./games/a.html?x=1','./games/a.html#x','./games\\a.html']) {
    assert.throws(()=>validateCatalog(catalog(entry),base), undefined,entry);
  }
});
test('重複 id、缺說明、不支援的格式及未知輸入方式會拒絕', () => {
  for (const data of [{schemaVersion:2,games:[]},{schemaVersion:1,games:[game,game]},{schemaVersion:1,games:[{...game,instructions:{}}]},{schemaVersion:1,games:[{...game,inputs:['controller']}]}]) {
    assert.throws(()=>validateCatalog(data,base));
  }
});
test('可選縮圖僅接受站內素材目錄，其餘回退為預設圖', () => {
  const data = {schemaVersion:1,games:[{...game,thumbnail:'https://elsewhere.test/a.png'}]};
  assert.equal(validateCatalog(data,base)[0].thumbnail,undefined);
});
test('網址、頁內錨點與格式錯誤處理', () => {
  for (const hash of ['', '#', '#main', '#collection']) assert.equal(parseRoute(hash),null);
  assert.equal(parseRoute('#game=direction-lab'),'direction-lab');
  for (const hash of ['#game=../x','#game=a&game=b','#other=a','#game=']) assert.throws(()=>parseRoute(hash));
});
test('搜尋涵蓋名稱及玩法並忽略前後空白', () => {
  assert.ok(matchesSearch(game,' 星星 ')); assert.ok(matchesSearch(game,'方向'));
  assert.equal(matchesSearch(game,'找不到'),false);
});
function harness() {
  const frames = [], states = [], timers = new Set();
  const session = new GameSession({
    origin:'https://example.github.io',
    createFrame(game) {
      const source = {postMessage:(...args)=>frame.messages.push(args)};
      const frame = {game,messages:[],removed:false,mounted:false,window:()=>source,remove:()=>{frame.removed=true;},mount:()=>{frame.mounted=true;}};
      frames.push(frame); return frame;
    },
    onState:(...args)=>states.push(args),
    schedule:callback=>{timers.add(callback);return callback;},
    cancel:callback=>timers.delete(callback)
  });
  const ready = (frame = frames.at(-1), extra = {}) => ({origin:'https://example.github.io',source:frame.window(),data:{channel:'bta',version:1,gameId:frame.game.id,type:'ready'},...extra});
  return {session,frames,states,timers,ready};
}
test('切換先移除舊 frame 並忽略舊來源或錯誤版本訊息', () => {
  const h = harness(); h.session.open(game); const old = h.frames[0];
  h.session.open({...game,id:'second'}); assert.ok(old.removed); assert.equal(h.timers.size,1);
  assert.equal(h.session.receive(h.ready(old)),false);
  assert.equal(h.session.receive(h.ready(undefined,{origin:'https://evil.test'})),false);
  assert.equal(h.session.receive(h.ready(undefined,{data:{channel:'bta',version:2,gameId:'second',type:'ready'}})),false);
  assert.equal(h.session.receive(h.ready()),true); assert.equal(h.timers.size,0);
});
test('就緒後才可暫停，dispose 取消所有計時器並移除 frame', () => {
  const h = harness(); h.session.open(game); h.session.send('pause'); assert.equal(h.frames[0].messages.length,0);
  h.session.receive(h.ready()); h.session.send('pause'); assert.equal(h.frames[0].messages[0][0].type,'pause');
  h.session.dispose(); assert.ok(h.frames[0].removed); assert.equal(h.session.current,null); assert.equal(h.timers.size,0);
});
test('逾時移除頁面、晚到 ready 無效、重試可重新就緒', () => {
  const h = harness(); h.session.open(game); [...h.timers][0]();
  assert.equal(h.states.at(-1)[0],'error'); assert.ok(h.frames[0].removed);
  assert.equal(h.session.receive(h.ready()),false);
  h.session.open(game); assert.equal(h.session.receive(h.ready()),true);
});
test('遊戲回報錯誤也卸載，不保留背景工作', () => {
  const h = harness(); h.session.open(game);
  const event = h.ready(); event.data.type = 'error'; event.data.message = '測試失敗';
  assert.equal(h.session.receive(event),true); assert.equal(h.states.at(-1)[2],'測試失敗'); assert.ok(h.frames[0].removed);
});
test('實際清單的入口檔存在且都位於 games/', async () => {
  const raw = JSON.parse(await readFile(new URL('../games.json',import.meta.url),'utf8'));
  const parsed = validateCatalog(raw,base);
  assert.equal(parsed.length,2);
  for (const item of raw.games) assert.ok((await stat(new URL('../' + item.entry,import.meta.url))).isFile());
});
