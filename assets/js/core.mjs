export function validateCatalog(data, baseHref) {
  if (!data || data.schemaVersion !== 1 || !Array.isArray(data.games)) throw new Error('遊戲清單格式不正確。');
  const base = new URL('./', baseHref), gamesRoot = new URL('./games/', base);
  const ids = new Set();
  return data.games.map(game => {
    if (!game || typeof game.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.id) || ids.has(game.id)) throw new Error('遊戲代號無效或重複。');
    ids.add(game.id);
    for (const key of ['title', 'description', 'entry']) if (typeof game[key] !== 'string' || !game[key].trim()) throw new Error('遊戲資料缺少必要文字欄位。');
    if (!Array.isArray(game.inputs) || !game.inputs.length || game.inputs.some(input => !['keyboard', 'touch'].includes(input))) throw new Error('操作方式格式不正確。');
    if (!game.instructions || game.inputs.some(input => typeof game.instructions[input] !== 'string' || !game.instructions[input].trim())) throw new Error('遊戲缺少操作說明。');
    const entry = new URL(game.entry, base);
    if (!/^\.\/games\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\.html$/.test(game.entry) || entry.origin !== base.origin || !entry.pathname.startsWith(gamesRoot.pathname) || entry.search || entry.hash) throw new Error('遊戲入口必須是 games/ 下的 HTML。');
    let thumbnail;
    if (game.thumbnail) {
      const url = new URL(game.thumbnail, base);
      if (url.origin === base.origin && url.pathname.startsWith(new URL('./assets/images/', base).pathname) && /\.(svg|webp|png|jpg)$/.test(url.pathname) && !url.search && !url.hash) thumbnail = url.href;
    }
    return {...game, entry: entry.href, thumbnail};
  });
}
export function parseRoute(hash) {
  if (!hash || hash === '#' || hash === '#collection' || hash === '#island' || hash === '#main') return null;
  const params = new URLSearchParams(hash.slice(1));
  const id = params.get('game');
  if ([...params].length !== 1 || !id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error('這個遊戲網址格式不正確。');
  return id;
}
export function matchesSearch(game, query) {
  return (game.title + ' ' + game.description + ' ' + (game.category || '')).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}
export class GameSession {
  constructor({origin, createFrame, onState, timeout = 10000, schedule = (...args) => globalThis.setTimeout(...args), cancel = timer => globalThis.clearTimeout(timer)}) {
    Object.assign(this, {origin, createFrame, onState, timeout, schedule, cancel});
    this.current = null;
  }
  dispose() {
    if (!this.current) return;
    const old = this.current;
    this.current = null;
    this.cancel(old.timer);
    old.frame.remove();
  }
  open(game) {
    this.dispose();
    const frame = this.createFrame(game);
    const current = {game, frame, phase: 'loading', timer: null};
    this.current = current;
    this.onState('loading', game);
    current.timer = this.schedule(() => {
      if (this.current === current && current.phase === 'loading') this.fail('載入超過 10 秒，請檢查連線或再試一次。');
    }, this.timeout);
    frame.mount();
  }
  fail(message) {
    if (!this.current) return;
    const {game} = this.current;
    this.dispose();
    this.onState('error', game, message);
  }
  receive(event) {
    const current = this.current, data = event.data;
    if (!current || event.origin !== this.origin || event.source !== current.frame.window() || !data || data.channel !== 'bta' || data.version !== 1 || data.gameId !== current.game.id) return false;
    if (data.type === 'ready' && current.phase === 'loading') {
      current.phase = 'ready';
      this.cancel(current.timer);
      this.onState('ready', current.game);
      return true;
    }
    if (data.type === 'error') {
      this.fail(typeof data.message === 'string' ? data.message.slice(0, 250) : '遊戲暫時無法啟動。');
      return true;
    }
    return false;
  }
  send(type) {
    if (this.current?.phase !== 'ready' || !['pause', 'focus'].includes(type)) return;
    this.current.frame.window()?.postMessage({channel:'bta', version:1, gameId:this.current.game.id, type}, this.origin);
  }
}
