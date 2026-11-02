export const LEVEL={
  width:1840,height:360,goal:1740,
  solids:[
    {x:0,y:304,w:440,h:56},{x:520,y:304,w:380,h:56},{x:980,y:304,w:860,h:56},
    {x:220,y:248,w:64,h:56},{x:600,y:232,w:88,h:18},{x:760,y:206,w:76,h:18},
    {x:1120,y:248,w:80,h:56},{x:1280,y:224,w:80,h:18},{x:1440,y:248,w:80,h:56}
  ],
  stars:[{x:155,y:274},{x:250,y:218},{x:475,y:230},{x:636,y:202},{x:792,y:176},{x:940,y:230},{x:1150,y:218},{x:1315,y:194},{x:1470,y:218},{x:1650,y:274}],
  enemies:[{x:720,min:690,max:850,vx:35},{x:1320,min:1220,max:1390,vx:-38}]
};
export function createPlatform() {
  return {player:{x:44,y:272,w:24,h:32,vx:0,vy:0,onGround:true},enemies:LEVEL.enemies.map(enemy=>({...enemy,y:282,w:24,h:22,alive:true})),collected:[],score:0,status:'playing',reason:null,camera:0,jumpHeld:false,coyote:.1,progress:0};
}
export function overlaps(a,b){return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;}
export function stepPlatform(state,input,dt) {
  if(state.status!=='playing')return state;
  dt=Math.max(0,Math.min(dt,1/60));
  const p={...state.player},previousBottom=p.y+p.h,previousTop=p.y;
  let coyote=p.onGround ? .1 :Math.max(0,state.coyote-dt);
  const jump=Boolean(input.jump);
  if(jump && !state.jumpHeld && coyote>0){p.vy=-580;p.onGround=false;coyote=0;}
  p.vx=((input.right?1:0)-(input.left?1:0))*250;
  p.x=Math.max(0,Math.min(LEVEL.width-p.w,p.x+p.vx*dt));
  for(const rect of LEVEL.solids)if(overlaps(p,rect)){if(p.vx>0)p.x=rect.x-p.w;else if(p.vx<0)p.x=rect.x+rect.w;}
  p.vy=Math.min(850,p.vy+1500*dt);p.y+=p.vy*dt;p.onGround=false;
  for(const rect of LEVEL.solids)if(overlaps(p,rect)){
    if(p.vy>=0 && previousBottom<=rect.y+1){p.y=rect.y-p.h;p.vy=0;p.onGround=true;}
    else if(p.vy<0 && previousTop>=rect.y+rect.h-1){p.y=rect.y+rect.h;p.vy=0;}
  }
  const enemies=state.enemies.map(enemy=>{
    if(!enemy.alive)return {...enemy};
    let x=enemy.x+enemy.vx*dt,vx=enemy.vx;
    if(x<enemy.min){x=enemy.min;vx=Math.abs(vx);}if(x>enemy.max){x=enemy.max;vx=-Math.abs(vx);}
    return {...enemy,x,vx};
  });
  let score=state.score,status='playing',reason=null;
  for(const enemy of enemies)if(enemy.alive && overlaps(p,enemy)){
    if(previousBottom<=enemy.y+8 && p.vy>0){enemy.alive=false;p.vy=-350;score+=100;}
    else{status='lost';reason='enemy';}
  }
  const collected=[...state.collected];
  LEVEL.stars.forEach((star,index)=>{
    if(!collected.includes(index) && overlaps(p,{x:star.x-10,y:star.y-10,w:20,h:20})){collected.push(index);score+=25;}
  });
  if(p.y>LEVEL.height+60){status='lost';reason='fall';}
  if(status==='playing' && p.x+p.w>=LEVEL.goal){status='won';score+=300;}
  return {...state,player:p,enemies,collected,score,status,reason,coyote,jumpHeld:jump,camera:Math.max(0,Math.min(LEVEL.width-640,p.x-180)),progress:status==='won'?100:Math.max(0,Math.min(100,Math.round((p.x-44)/(LEVEL.goal-44)*100)))};
}
