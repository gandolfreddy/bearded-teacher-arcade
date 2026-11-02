const $ = id => document.getElementById(id);
const gameId = document.body.dataset.gameId, mode = document.body.dataset.mode;
if (window.parent !== window) document.querySelector('.standalone').hidden = true;
let active = false, count = 0, seconds = 0, x = 2, y = 2;
const controller = new AbortController(), options = {signal:controller.signal};
const keys = new Set();
function send(type, extra = {}) {if (window.parent !== window) window.parent.postMessage({channel:'bta',version:1,gameId,type,...extra}, location.origin);}
function paint() {
  $('count').value = String(count); $('seconds').value = String(seconds);
  if (mode === 'direction') { $('token').style.left = (x * 20) + '%'; $('token').style.top = (y * 20) + '%'; $('position').textContent = '位置：' + (x + 1) + ', ' + (y + 1); }
}
function pause() {
  keys.clear();
  if (!active) return;
  active = false;
  $('status').textContent = '已暫停，按「繼續練習」再開始。';
  $('start').textContent = '繼續練習'; $('start').disabled = false; $('pause').disabled = true;
  if ($('tap-pad')) $('tap-pad').disabled = true;
}
function move(action) {
  if (!active) return;
  if (action === 'left') x = Math.max(0,x-1);
  if (action === 'right') x = Math.min(4,x+1);
  if (action === 'up') y = Math.max(0,y-1);
  if (action === 'down') y = Math.min(4,y+1);
  count++; paint();
}
$('start').addEventListener('click', () => {
  active = true; $('status').textContent = '練習中'; $('start').disabled = true; $('pause').disabled = false;
  if ($('tap-pad')) $('tap-pad').disabled = false;
  (mode === 'direction' ? $('board') : $('tap-pad')).focus();
}, options);
$('pause').addEventListener('click',pause,options);
const keyActions = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
document.addEventListener('keydown',event => {
  if (!active || mode !== 'direction' || !['board', ''].includes(document.activeElement.id)) return;
  const action = keyActions[event.key] || keyActions[event.key.toLowerCase()];
  if (!action) return;
  event.preventDefault();
  if (keys.has(event.code)) return;
  keys.add(event.code); move(action);
}, options);
document.addEventListener('keyup',event => keys.delete(event.code),options);
for (const button of document.querySelectorAll('[data-action]')) {
  button.addEventListener('pointerdown',event => {
    if (!active || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault(); button.setPointerCapture(event.pointerId); move(button.dataset.action);
  }, options);
  button.addEventListener('click',event => {if (event.detail === 0) move(button.dataset.action);}, options);
  button.addEventListener('pointercancel', () => keys.clear(),options);
}
$('tap-pad')?.addEventListener('click',() => {if (active) {count++;paint();}},options);
window.addEventListener('blur',pause,options);
document.addEventListener('visibilitychange',() => {if (document.hidden) pause();},options);
window.addEventListener('message',event => {
  const data = event.data;
  if (event.source !== window.parent || event.origin !== location.origin || !data || data.channel !== 'bta' || data.version !== 1 || data.gameId !== gameId) return;
  if (data.type === 'pause') pause();
  if (data.type === 'focus') (mode === 'direction' ? $('board') : $('start')).focus();
}, options);
const ticker = setInterval(() => {if (active) {seconds++;paint();}},1000);
window.addEventListener('pagehide',() => {clearInterval(ticker);controller.abort();keys.clear();active=false;},{once:true});
window.addEventListener('pageshow',event => {if (event.persisted) location.reload();});
window.addEventListener('error',() => send('error',{message:'操作示範發生錯誤，請重新開始。'}),options);
paint();send('ready');
