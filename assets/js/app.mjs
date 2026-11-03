import {initIsland} from './island.mjs';
import {validateCatalog, parseRoute, matchesSearch, GameSession} from './core.mjs';
const $ = id => document.getElementById(id);
let games = [], selected = null, lastCard = null, catalogRequest = 0;
const session = new GameSession({
  origin: location.origin,
  createFrame(game) {
    const iframe = document.createElement('iframe');
    iframe.title = game.title;
    iframe.id = 'game-frame';
    iframe.hidden = true;
    return {window: () => iframe.contentWindow, remove: () => iframe.remove(), mount() { iframe.src = game.entry; $('stage').replaceChildren(iframe); }};
  },
  onState(state, game, message) {
    $('stage').setAttribute('aria-busy', String(state === 'loading'));
    const gameFrame = $('game-frame');
    if(gameFrame) gameFrame.hidden = state !== 'ready';
    $('play-error').hidden = state !== 'error';
    $('restart').disabled = state !== 'ready';
    $('stage-status').textContent = state === 'loading' ? '正在準備遊戲…' : state === 'ready' ? '準備好了。請在下方開始。' : '載入未完成。';
    if (state === 'error') $('play-message').textContent = message;
  }
});
const island=initIsland({onLogin:()=>{if(!$('catalog-error').hidden){$('lobby').hidden=false;$('player').hidden=true;$('island').hidden=true;document.body.dataset.screen='collection';island.setVisible(false);}else route();},onLogout:()=>{session.dispose();selected=null;location.hash='';},onLaunch:id=>{island.stop();location.hash='game='+id;}});
function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function renderCards() {
  const visible = games.filter(game => matchesSearch(game, $('search').value));
  $('cards').replaceChildren(...visible.map((game, index) => {
    const card = el('article', 'game-card');
    const art = el('div', 'card-art');
    art.setAttribute('aria-hidden', 'true');
    const pattern = el('div', 'art-grid');
    for (const symbol of ['·','↑','·','←','✦','→','·','↓','·']) pattern.append(el('span','',symbol));
    art.append(pattern, el('span','art-label',(game.kind === 'demo' ? 'PLAY LAB / ' : 'LET’S PLAY / ') + String(index + 1).padStart(2,'0')));
    if (game.thumbnail) {
      const img = el('img'); img.src = game.thumbnail; img.alt = ''; img.loading = 'lazy';
      img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
      img.addEventListener('error', () => img.remove(), {once:true}); art.append(img);
    }
    const body = el('div', 'card-body');
    body.append(el('p','card-kicker',game.kind === 'demo' ? '操作示範 · 網站骨架驗證' : (game.category || '小遊戲')), el('h3','',game.title), el('p','card-description',game.description));
    const bottom = el('div','card-bottom'), tags = el('div','tags');
    for (const input of game.inputs) tags.append(el('span','tag',input === 'keyboard' ? '鍵盤' : '觸控'));
    const link = el('a','play-link',game.kind === 'demo' ? '開啟示範　↗' : '開始遊戲　↗');
    link.href = '#game=' + game.id; link.id = 'open-' + game.id; link.setAttribute('aria-label', '開啟' + game.title);
    link.addEventListener('click', () => {lastCard = link.id;});
    bottom.append(tags, link); body.append(bottom); card.append(art, body); return card;
  }));
  $('result-count').textContent = '共 ' + games.length + ' 款遊戲' + (visible.length !== games.length ? '，找到 ' + visible.length + ' 個結果' : '');
  $('empty').hidden = visible.length !== 0 || !$('catalog-error').hidden;
}
function route() {
  session.dispose(); selected = null;
  $('play-retry').hidden = false;
  if(!island.authenticated){$('lobby').hidden=true;$('player').hidden=true;$('island').hidden=false;document.body.dataset.screen='gate';island.setVisible(true);return;}
  $('main').inert=false;
  let id;
  try { id = parseRoute(location.hash); } catch (error) { showRouteError(error.message); return; }
  if (!id) {
    const collection=location.hash==='#collection'||(!location.hash&&new URLSearchParams(location.search).get('view')==='collection');
    $('lobby').hidden=!collection;$('player').hidden=true;$('island').hidden=collection;island.setVisible(!collection);document.body.dataset.screen=collection?'collection':'island';if(!collection)$('island-canvas').focus({preventScroll:true});
    document.title = collection?'大鬍子老師遊戲廣場':'大鬍子遊戲島｜大鬍子老師遊戲廣場';
    if (lastCard) { $(lastCard)?.focus(); lastCard = null; }
    return;
  }
  const game = games.find(game => game.id === id);
  if (!game) { showRouteError('找不到這款遊戲。你可以返回大廳，選擇目前提供的遊戲。'); return; }
  selected = game;
  island.setVisible(false);$('island').hidden=true;document.body.dataset.screen='game';
  $('lobby').hidden = true; $('player').hidden = false;
  $('player-title').textContent = game.title;
  document.querySelector('.demo-caption').hidden = game.kind !== 'demo';
  $('gameplay-hint').textContent = game.kind === 'demo' ? '點選「開始練習」後即可操作。離開視窗會暫停，回來後按「繼續練習」。' : '點選「開始遊戲」後即可操作。離開視窗會暫停，回來後按「繼續遊戲」。';
  $('keyboard-help').textContent = game.instructions.keyboard || '這款遊戲未提供鍵盤操作。';
  $('touch-help').textContent = game.instructions.touch || '這款遊戲未提供觸控操作。';
  document.title = game.title + '｜大鬍子老師遊戲廣場';
  $('player-title').focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'instant'});
  session.open(game);
}
function showRouteError(message) {
  island.setVisible(false);$('island').hidden=true;document.body.dataset.screen='game';
  $('lobby').hidden = true; $('player').hidden = false;
  $('player-title').textContent = '找不到這一站';
  $('player-title').focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'instant'});
  $('play-error').hidden = false; $('play-message').textContent = message;
  $('stage-status').textContent = '請返回大廳選擇遊戲。';
  $('restart').disabled = true; $('play-retry').hidden = true;
  $('keyboard-help').textContent = '返回大廳，選擇其他遊戲。'; $('touch-help').textContent = '點選返回大廳。';
  document.title = '找不到遊戲｜大鬍子老師遊戲廣場';
}
async function loadCatalog() {
  const request = ++catalogRequest;
  session.dispose(); selected = null;
  $('catalog-error').hidden = true; $('catalog-retry').disabled = true;
  $('cards').replaceChildren(); $('empty').hidden = true;
  $('result-count').textContent = '正在整理遊戲清單…';
  try {
    if (!['http:','https:'].includes(location.protocol)) throw new Error('請使用本機 HTTP 預覽網址開啟網站。');
    const response = await fetch('./games.json', {cache:'no-cache'});
    if (!response.ok) throw new Error('無法讀取遊戲清單，請稍後重試。');
    const next = validateCatalog(await response.json(), location.href);
    if (request !== catalogRequest) return;
    games = next; island.refreshGames(games);renderCards(); route();
  } catch (error) {
    if (request !== catalogRequest) return;
    games = []; $('lobby').hidden = false; $('player').hidden = true;
    $('catalog-error').hidden = false; $('catalog-message').textContent = error.message;
    $('result-count').textContent = '清單載入未完成';
  } finally { if (request === catalogRequest) $('catalog-retry').disabled = false; }
}
document.querySelector('.skip').addEventListener('click', event => {event.preventDefault(); $('main').focus(); $('main').scrollIntoView({behavior:'instant'});});
window.addEventListener('message', event => session.receive(event));
window.addEventListener('hashchange', () => { if ($('catalog-error').hidden) route(); });
window.addEventListener('pagehide', () => session.dispose());
window.addEventListener('pageshow', event => { if (event.persisted) loadCatalog(); });
document.addEventListener('visibilitychange', () => {if (document.hidden) session.send('pause');});
$('back-lobby').addEventListener('click',event=>{if(new URLSearchParams(location.search).get('view')==='collection'){event.preventDefault();location.hash='collection';}});
$('search').addEventListener('input', renderCards);
$('clear-search').addEventListener('click', () => { $('search').value = ''; renderCards(); $('search').focus(); });
$('catalog-retry').addEventListener('click', loadCatalog);
function restart() {if (selected) { $('play-retry').hidden = false; session.open(selected); }}
$('restart').addEventListener('click', restart);
$('play-retry').addEventListener('click', restart);
loadCatalog();
