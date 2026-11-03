import {WORLD,SPAWN,PORTALS,DEFAULT_APPEARANCE,findPath,nearbyPortal,walkable} from './island-model.mjs';
import {IslandStore,STORAGE_KEY} from './island-store.mjs';
import {IslandRenderer,drawAvatar,loadIslandArt} from './island-renderer.mjs';
const $=id=>document.getElementById(id);
export function initIsland({onLogin,onLogout,onLaunch}){
  let store,profile=null,position={...SPAWN},route=[],target=null,renderer=null,art=null,last=0,raf=0,dirty=false,near=null,conflict=false,visible=true,saveTimer=0,busy=false,tab='login';
  try{store=new IslandStore(localStorage);}catch{}
  const error=message=>{$('account-error').textContent=message;$('account-error').hidden=!message;};
  const notice=message=>{$('island-message').textContent=message;};
  function appearance(){return Object.fromEntries(['hair','gender','expression','clothes'].map(key=>[key,$('avatar-'+key).value]));}
  function preview(){if(!art)return;const c=$('avatar-preview'),ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#dce8ce';ctx.fillRect(0,0,160,160);ctx.fillStyle='#bbcda9';ctx.beginPath();ctx.ellipse(80,133,39,12,0,0,Math.PI*2);ctx.fill();drawAvatar(ctx,art,appearance(),80,137,112);}
  function setTab(next){tab=next;error('');$('login-tab').setAttribute('aria-selected',String(tab==='login'));$('register-tab').setAttribute('aria-selected',String(tab==='register'));$('character-builder').hidden=tab!=='register';$('account-submit').textContent=tab==='register'?'建立角色，登上遊戲島':'登入遊戲島';$('account-heading').textContent=tab==='register'?'你的冒險，由你決定。':'歡迎回到遊戲島。';preview();}
  function updateLocation(){
    $('island-coordinates').textContent=Math.round(position.x)+', '+Math.round(position.y);
    $('island-canvas').setAttribute('aria-label','遊戲島地圖；角色 '+(profile?.account||'尚未登入')+' 位於 '+Math.round(position.x)+', '+Math.round(position.y)+(route.length?'，移動中':'，已停下'));
    near=profile&&!route.length?nearbyPortal(position):null;
    $('portal-prompt').hidden=!near;$('portal-enter').disabled=conflict;if(near){$('portal-name').textContent=near.name;$('portal-enter').textContent='進入遊戲 ↗';}
  }
  function save(){
    clearTimeout(saveTimer);if(!profile)return true;
    if(conflict){notice('角色已在其他分頁更新，請登出後重新登入。');return false;}
    if(!dirty)return true;
    const p={x:Math.round(position.x),y:Math.round(position.y)};
    if(!walkable(p.x,p.y))return false;
    try{profile=store.save({...profile,position:p});dirty=false;$('save-state').textContent='已儲存於此瀏覽器';$('save-retry').hidden=true;return true;}
    catch(e){$('save-state').textContent='尚未儲存';$('save-retry').hidden=false;notice(e.message);return false;}
  }
  function stopped(){updateLocation();if(profile){dirty=true;$('save-state').textContent='儲存中…';clearTimeout(saveTimer);saveTimer=setTimeout(save,700);}notice(near?'已抵達 '+near.name+'，按「進入遊戲」開始。':'點按草地或步道繼續探索。');}
  function go(point){
    if(!profile||!visible||conflict)return;
    const building=PORTALS.find(p=>point.x>=p.x-2&&point.x<p.x+2&&point.y>=p.y-4&&point.y<=p.y);if(building)point={x:building.x,y:building.y};
    if(!walkable(point.x,point.y)){notice('這裡無法通行，請選擇草地、沙灘或步道。');return;}
    const start={x:Math.round(position.x),y:Math.round(position.y)},next=findPath(start,point);
    if(!next.length&&(start.x!==point.x||start.y!==point.y)){notice('目前無法到達這裡，換個位置試試。');return;}
    position=start;route=next;target=point;clearTimeout(saveTimer);notice('正在前往 '+(building?.name||'目的地')+'…');updateLocation();if(!route.length)stopped();
  }
  function frame(time){
    raf=0;const dt=Math.min(60,last?time-last:16)/1000;last=time;
    if(visible&&profile&&!document.hidden&&route.length&&!conflict){
      let distance=dt*5.5;
      while(distance>0&&route.length){const next=route[0],d=Math.hypot(next.x-position.x,next.y-position.y);if(d<=distance){position={...next};route.shift();distance-=d;dirty=true;if(!route.length)stopped();}else{position.x+=(next.x-position.x)/d*distance;position.y+=(next.y-position.y)/d*distance;distance=0;}}
      updateLocation();
    }
    if(visible&&renderer)renderer.draw(position,profile?.appearance,{route,target,name:profile?.account||'',time});
    if(visible&&!document.hidden)raf=requestAnimationFrame(frame);
  }
  function animate(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(frame);}
  function showGate(){profile=null;route=[];target=null;conflict=false;dirty=false;clearTimeout(saveTimer);$('main').inert=true;document.querySelector('.site-header').inert=true;$('account-gate').hidden=false;$('account-form').reset();$('island-account').textContent='旅人';$('save-state').textContent='此瀏覽器限定';$('portal-prompt').hidden=true;setTab('login');$('account-status').textContent='';document.body.dataset.screen='gate';$('account-name').focus({preventScroll:true});visible=true;animate();}
  $('account-gate').addEventListener('keydown',event=>{if(event.key!=='Tab')return;const elements=[...$('account-gate').querySelectorAll('button,input,select')].filter(el=>!el.disabled&&el.getClientRects().length);const first=elements[0],last=elements.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
  document.querySelector('.account-tabs').addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?'login':event.key==='End'?'register':tab==='login'?'register':'login';setTab(next);$(next+'-tab').focus();}});
  $('login-tab').addEventListener('click',()=>setTab('login'));$('register-tab').addEventListener('click',()=>setTab('register'));
  for(const select of document.querySelectorAll('#character-builder select'))select.addEventListener('change',preview);
  $('account-form').addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;busy=true;$('account-submit').disabled=true;error('');
    try{
      if(!art)throw new Error('地圖素材還沒準備好，請稍候或重新載入。');if(!store)throw new Error('瀏覽器禁止儲存，請開啟網站資料儲存權限。');
      const next=tab==='register'?store.register($('account-name').value,appearance()):store.login($('account-name').value);
      profile=next;position={...profile.position};route=[];dirty=false;conflict=false;$('main').inert=false;document.querySelector('.site-header').inert=false;$('account-gate').hidden=true;$('island-account').textContent=profile.account;$('save-state').textContent='已儲存於此瀏覽器';$('save-retry').hidden=true;error('');updateLocation();onLogin();animate();
    }catch(e){error(e.message);}finally{busy=false;$('account-submit').disabled=false;}
  });
  $('island-logout').addEventListener('click',()=>{if(dirty&&!conflict&&!save())return;profile=null;onLogout();showGate();});
  $('save-retry').addEventListener('click',()=>{if(conflict){onLogout();showGate();}else save();});
  $('portal-enter').addEventListener('click',()=>{if(near&&save())onLaunch(near.id);});
  $('island-canvas').addEventListener('click',event=>{if(renderer)go(renderer.point(event.clientX,event.clientY));});
  $('island-minimap').addEventListener('click',event=>{if(renderer)go(renderer.point(event.clientX,event.clientY,$('island-minimap')));});
  $('island-canvas').addEventListener('keydown',event=>{
    const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if(delta){event.preventDefault();const p=route.at(-1)||position;go({x:Math.round(p.x)+delta[0],y:Math.round(p.y)+delta[1]});}
    if(event.key==='Enter'&&near){event.preventDefault();if(save())onLaunch(near.id);}
  });
  $('island-guide-toggle').addEventListener('click',()=>{const open=$('island-guide').hidden;$('island-guide').hidden=!open;$('island-guide-toggle').setAttribute('aria-expanded',String(open));});
  for(const p of PORTALS){const b=document.createElement('button');b.type='button';b.textContent=p.name;b.dataset.portal=p.id;b.addEventListener('click',()=>{go({x:p.x,y:p.y});$('island-guide').hidden=true;$('island-guide-toggle').setAttribute('aria-expanded','false');$('island-canvas').focus({preventScroll:true});});$('island-guide').append(b);}
  window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY&&profile){try{if(store.login(profile.account).revision===profile.revision)return;}catch{}conflict=true;route=[];notice('角色資料已在其他分頁更新，請登出後重新登入。');$('save-state').textContent='請重新登入';$('save-retry').hidden=false;updateLocation();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){save();cancelAnimationFrame(raf);raf=0;last=0;}else animate();});
  window.addEventListener('pagehide',()=>{save();cancelAnimationFrame(raf);raf=0;});
  window.addEventListener('pageshow',event=>{if(event.persisted){onLogout();showGate();}});
  window.addEventListener('resize',()=>{if(renderer&&visible)renderer.draw(position,profile?.appearance,{route,target,name:profile?.account||''});});
  loadIslandArt().then(value=>{art=value;renderer=new IslandRenderer($('island-canvas'),$('island-minimap'),art);renderer.draw(position,null);document.querySelector('.account-welcome').style.backgroundImage='linear-gradient(0deg,#254b4ce8,#365c5188),url('+ $('island-canvas').toDataURL()+')';$('account-status').textContent='地圖準備好了';$('island-loading').hidden=true;preview();animate();}).catch(()=>{$('account-status').textContent='地圖素材載入失敗，請重新載入。';$('island-loading').textContent='地圖素材載入失敗';});
  showGate();
  return {
    get authenticated(){return !!profile;},
    setVisible(value){visible=value;last=0;if(!value){save();cancelAnimationFrame(raf);raf=0;}else animate();},
    showGate,
    stop(){position={x:Math.round(position.x),y:Math.round(position.y)};route=[];save();updateLocation();},
    refreshGames(games){for(const b of $('island-guide').children)b.disabled=!games.some(g=>g.id===b.dataset.portal);},
    get position(){return {...position};}
  };
}
