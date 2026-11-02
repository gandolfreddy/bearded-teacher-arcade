import {createPlatform,stepPlatform,LEVEL} from '../../games/assets/platform-model.mjs';
// Plan a reproducible route using only the normal controls, never teleportation.
export function trailRoute() {
  let state=createPlatform();const actions=[];
  for(let frame=0;frame<600 && state.status==='playing';frame++){
    const p=state.player;
    const gaps=[440,900].some(x=>x-p.x-p.w<85 && x>p.x);
    const boxes=LEVEL.solids.some(r=>r.y<304 && r.h>18 && r.x-p.x-p.w<80 && r.x>p.x);
    const enemies=state.enemies.some(e=>e.alive && e.x-p.x-p.w<95 && e.x+e.w>p.x);
    const jump=p.onGround && (gaps||boxes||enemies);
    actions.push({right:true,jump});
    for(let i=0;i<6;i++)state=stepPlatform(state,{right:true,jump},1/120);
  }
  if(state.status!=='won')throw new Error('The level has no passing reference route');
  return {actions,state};
}
