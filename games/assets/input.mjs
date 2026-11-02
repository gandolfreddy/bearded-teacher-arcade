// Track each physical source separately so one finger/key cannot release another.
export function bindGameInput(host,{board,keys,onPress}) {
  const tokens=new Map(),options={signal:host.controller.signal};
  const active=action=>[...tokens.values()].includes(action);
  const press=(token,action)=>{
    if(!host.active || tokens.has(token))return;
    const wasActive=active(action);tokens.set(token,action);
    if(!wasActive)onPress(action);
  };
  const clear=()=>tokens.clear();
  document.addEventListener('keydown',event=>{
    const action=keys[event.code];
    if(!host.active || !action || document.activeElement!==board)return;
    event.preventDefault();if(!event.repeat)press('key:'+event.code,action);
  },options);
  document.addEventListener('keyup',event=>tokens.delete('key:'+event.code),options);
  for(const button of document.querySelectorAll('[data-action]')){
    button.addEventListener('pointerdown',event=>{
      if(!host.active || (event.pointerType==='mouse' && event.button!==0))return;
      event.preventDefault();button.setPointerCapture(event.pointerId);press('pointer:'+event.pointerId,button.dataset.action);
    },options);
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>tokens.delete('pointer:'+event.pointerId),options);
    button.addEventListener('click',event=>{if(host.active && event.detail===0)onPress(button.dataset.action);},options);
  }
  return {active,clear};
}
