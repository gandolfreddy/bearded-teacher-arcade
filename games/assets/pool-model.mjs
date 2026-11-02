export const TABLE={width:640,height:360,left:40,right:600,top:40,bottom:320,radius:10,pocketRadius:22};
export const POCKETS=[{x:40,y:40},{x:320,y:40},{x:600,y:40},{x:40,y:320},{x:320,y:320},{x:600,y:320}];
export const BALL_COLORS=['#fcfaf0','#c45c58','#e2ad42','#4d84ae','#8e6eaa','#d48642','#5a9a79'];
export function createPool(){
  const positions=[[320,180],[116,78],[320,78],[524,78],[116,282],[320,282],[524,282]];
  return {balls:positions.map(([x,y],id)=>({id,x,y,vx:0,vy:0,potted:false})),shots:0,fouls:0,phase:'aiming',status:'playing',lastFoul:false};
}
export function shootPool(state,angle,power){
  if(state.status!=='playing' || state.phase!=='aiming' || !Number.isFinite(angle) || !Number.isFinite(power))return state;
  const speed=220+Math.max(10,Math.min(100,power))*6;
  return {...state,shots:state.shots+1,phase:'moving',lastFoul:false,balls:state.balls.map(ball=>ball.id===0?{...ball,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed}:{...ball})};
}
export function respawnCue(balls){
  const spots=[{x:320,y:180},{x:200,y:180},{x:440,y:180},{x:320,y:240},{x:320,y:120}];
  for(let y=80;y<300;y+=30)for(let x=80;x<580;x+=30)spots.push({x,y});
  return spots.find(spot=>balls.every(ball=>ball.id===0 || ball.potted || Math.hypot(ball.x-spot.x,ball.y-spot.y)>TABLE.radius*2+2));
}
export function stepPool(state,dt){
  if(state.status!=='playing' || state.phase!=='moving')return state;
  dt=Math.max(0,Math.min(1/120,dt));
  const balls=state.balls.map(ball=>({...ball}));
  let fouls=state.fouls,lastFoul=state.lastFoul;
  for(const ball of balls){
    if(ball.potted)continue;
    ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
    if(POCKETS.some(pocket=>Math.hypot(ball.x-pocket.x,ball.y-pocket.y)<TABLE.pocketRadius)){
      ball.potted=true;ball.vx=0;ball.vy=0;
      if(ball.id===0){fouls++;lastFoul=true;}
      continue;
    }
    const r=TABLE.radius;
    if(ball.x<TABLE.left+r){ball.x=TABLE.left+r;ball.vx=Math.abs(ball.vx)*.9;}
    if(ball.x>TABLE.right-r){ball.x=TABLE.right-r;ball.vx=-Math.abs(ball.vx)*.9;}
    if(ball.y<TABLE.top+r){ball.y=TABLE.top+r;ball.vy=Math.abs(ball.vy)*.9;}
    if(ball.y>TABLE.bottom-r){ball.y=TABLE.bottom-r;ball.vy=-Math.abs(ball.vy)*.9;}
  }
  for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){
    const a=balls[i],b=balls[j];if(a.potted || b.potted)continue;
    const dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy);
    if(distance>=TABLE.radius*2)continue;
    const nx=distance>1e-8?dx/distance:1,ny=distance>1e-8?dy/distance:0;
    const correction=(TABLE.radius*2-distance)/2+.001;
    a.x-=nx*correction;a.y-=ny*correction;b.x+=nx*correction;b.y+=ny*correction;
    const closing=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
    if(closing<0){const impulse=-(1+.98)*closing/2;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;}
  }
  for(const ball of balls){
    if(ball.potted)continue;
    const damping=Math.exp(-1.6*dt);ball.vx*=damping;ball.vy*=damping;
    if(Math.hypot(ball.vx,ball.vy)<4){ball.vx=0;ball.vy=0;}
  }
  let phase='moving';
  if(balls.every(ball=>ball.potted || (ball.vx===0 && ball.vy===0))){
    const cue=balls.find(ball=>ball.id===0);
    if(cue.potted){const spot=respawnCue(balls);if(spot)Object.assign(cue,spot,{potted:false,vx:0,vy:0});}
    phase='aiming';
  }
  const won=phase==='aiming' && balls.filter(ball=>ball.id!==0).every(ball=>ball.potted);
  return {...state,balls,phase,fouls,lastFoul,status:won?'won':'playing'};
}
export function aimPool(state,angle){
  const cue=state.balls.find(ball=>ball.id===0),dx=Math.cos(angle),dy=Math.sin(angle);
  let distance=1000,hit=null;
  for(const ball of state.balls){
    if(ball.id===0 || ball.potted)continue;
    const x=ball.x-cue.x,y=ball.y-cue.y,projection=x*dx+y*dy;
    const perpendicular2=x*x+y*y-projection*projection;
    if(projection<=0 || perpendicular2>4*TABLE.radius*TABLE.radius)continue;
    const contact=projection-Math.sqrt(Math.max(0,4*TABLE.radius*TABLE.radius-perpendicular2));
    if(contact>=0 && contact<distance){distance=contact;hit=ball;}
  }
  for(const t of [(TABLE.left+10-cue.x)/dx,(TABLE.right-10-cue.x)/dx,(TABLE.top+10-cue.y)/dy,(TABLE.bottom-10-cue.y)/dy]){
    if(t>=0 && t<distance){distance=t;hit=null;}
  }
  return {x:cue.x+dx*distance,y:cue.y+dy*distance,hit};
}
