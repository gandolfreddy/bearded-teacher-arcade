// The host owns all recurring work; games only receive active foreground time.
export class GameHost {
  constructor({id,onTick,onReset,onFocus,onPause=()=>{}}) {
    Object.assign(this,{id,onTick,onReset,onFocus,onPause});
    this.active=false;this.ended=false;this.elapsed=0;
    this.controller=new AbortController();
    const options={signal:this.controller.signal}, $=id=>document.getElementById(id);
    this.start=$('start');this.pauseButton=$('pause');this.resetButton=$('reset');this.status=$('status');
    if(window.parent!==window) document.querySelector('.standalone').hidden=true;
    this.start.addEventListener('click',()=>this.play(),options);
    this.pauseButton.addEventListener('click',()=>this.pause(),options);
    this.resetButton.addEventListener('click',()=>this.reset(),options);
    window.addEventListener('blur',()=>this.pause(),options);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.pause();},options);
    window.addEventListener('message',event=>{
      const data=event.data;
      if(event.origin!==location.origin || event.source!==parent || !data || data.channel!=='bta' || data.version!==1 || data.gameId!==id) return;
      if(data.type==='pause') this.pause();
      if(data.type==='focus') this.onFocus();
    },options);
    const report=()=>this.send('error',{message:'遊戲發生錯誤，請重新開始。'});
    window.addEventListener('error',report,options);
    window.addEventListener('unhandledrejection',report,options);
    let last=performance.now();
    this.timer=setInterval(()=>{
      const now=performance.now(),dt=Math.min(250,Math.max(0,now-last));last=now;
      if(!this.active)return;
      this.elapsed+=dt;
      $('seconds').value=String(Math.floor(this.elapsed/1000));
      try{this.onTick(dt);}catch{this.pause();report();}
    },50);
    window.addEventListener('pagehide',()=>this.dispose(),{once:true});
    window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
    this.start.disabled=false;
    this.status.textContent='準備好了，按「開始遊戲」。';
    document.body.dataset.phase='ready';
    this.send('ready');
  }
  send(type,extra={}) {if(parent!==window)parent.postMessage({channel:'bta',version:1,gameId:this.id,type,...extra},location.origin);}
  play() {
    if(this.ended)return;
    this.active=true;this.start.disabled=true;this.pauseButton.disabled=false;
    this.status.textContent='遊戲中';document.body.dataset.phase='playing';this.onFocus();
  }
  pause() {
    if(!this.active)return;
    this.onPause();
    this.active=false;this.start.disabled=false;this.start.textContent='繼續遊戲';this.pauseButton.disabled=true;
    this.status.textContent='已暫停，按「繼續遊戲」再出發。';document.body.dataset.phase='paused';
  }
  finish(message) {
    this.onPause();
    this.active=false;this.ended=true;this.start.disabled=true;this.pauseButton.disabled=true;
    this.status.textContent=message;document.body.dataset.phase='finished';
  }
  reset() {
    this.onPause();
    this.active=false;this.ended=false;this.elapsed=0;
    this.start.disabled=false;this.start.textContent='開始遊戲';this.pauseButton.disabled=true;
    this.status.textContent='準備好了，按「開始遊戲」。';document.body.dataset.phase='ready';
    document.getElementById('seconds').value='0';this.onReset();this.start.focus();
  }
  dispose() {this.onPause();this.active=false;clearInterval(this.timer);this.controller.abort();}
}
