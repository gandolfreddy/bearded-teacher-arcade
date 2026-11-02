export const RACE={width:360,height:480,playerY:388,carHeight:48,obstacleHeight:50,goal:1000};
export const TRAFFIC_PATTERNS=[[0],[2],[0,1],[1,2],[0,2],[1]];
export function createRacer(){return {lane:1,distance:0,elapsed:0,speed:80,scroll:0,spawnIn:.6,wave:0,obstacles:[],passed:0,status:'playing'};}
export function steerRacer(state,delta){
  if(state.status!=='playing')return state;
  const lane=Math.max(0,Math.min(2,state.lane+delta));
  return lane===state.lane?state:{...state,lane};
}
export function stepRacer(state,dt,{brake=false}={},random=Math.random){
  if(state.status!=='playing')return state;
  dt=Math.max(0,Math.min(.05,dt));
  const elapsed=state.elapsed+dt,speed=Math.min(140,80+elapsed*1.7)*(brake ? .55 : 1),roadSpeed=(180+Math.min(120,elapsed*3))*(brake ? .55 : 1);
  let spawnIn=state.spawnIn-dt,wave=state.wave;
  const obstacles=state.obstacles.map(row=>({...row,lanes:[...row.lanes],y:row.y+roadSpeed*dt}));
  if(spawnIn<=0){
    const index=Math.min(TRAFFIC_PATTERNS.length-1,Math.floor(random()*TRAFFIC_PATTERNS.length));
    obstacles.push({id:wave++,lanes:[...TRAFFIC_PATTERNS[index]],y:-60,scored:false});
    spawnIn+=1.35;
  }
  let passed=state.passed;
  for(const row of obstacles)if(!row.scored && row.y>RACE.playerY+RACE.carHeight){row.scored=true;passed++;}
  const collision=obstacles.some(row=>row.lanes.includes(state.lane) && row.y<RACE.playerY+RACE.carHeight && row.y+RACE.obstacleHeight>RACE.playerY);
  const distance=Math.min(RACE.goal,state.distance+speed/3.6*dt);
  return {...state,lane:state.lane,distance,elapsed,speed,scroll:(state.scroll+roadSpeed*dt)%80,spawnIn,wave,passed,obstacles:obstacles.filter(row=>row.y<RACE.height+70),status:collision?'lost':distance>=RACE.goal?'won':'playing'};
}
