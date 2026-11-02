const vectors = {up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
export function placeFood(body,size,random=Math.random) {
  const free=[];
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) if(!body.some(cell=>cell.x===x && cell.y===y)) free.push({x,y});
  return free.length ? free[Math.min(free.length-1,Math.floor(random()*free.length))] : null;
}
export function createSnake(random=Math.random) {
  const body=[{x:5,y:6},{x:4,y:6},{x:3,y:6}];
  return {size:12,body,direction:'right',queued:null,food:placeFood(body,12,random),score:0,status:'playing'};
}
export function turnSnake(state,direction) {
  if(state.status!=='playing' || state.queued || !vectors[direction]) return state;
  const old=vectors[state.direction], next=vectors[direction];
  if(old[0]+next[0]===0 && old[1]+next[1]===0) return state;
  return {...state,queued:direction};
}
export function stepSnake(state,random=Math.random) {
  if(state.status!=='playing') return state;
  const direction=state.queued || state.direction, [dx,dy]=vectors[direction];
  const head={x:state.body[0].x+dx,y:state.body[0].y+dy};
  const eating=Boolean(state.food && head.x===state.food.x && head.y===state.food.y);
  const occupied=eating?state.body:state.body.slice(0,-1);
  const wall=head.x<0 || head.x>=state.size || head.y<0 || head.y>=state.size;
  if(wall || occupied.some(cell=>cell.x===head.x && cell.y===head.y)) return {...state,direction,queued:null,status:'lost',reason:wall?'wall':'body'};
  const body=[head,...state.body];
  if(!eating) body.pop();
  const food=eating?placeFood(body,state.size,random):state.food;
  return {...state,body,direction,queued:null,food,score:state.score+(eating?10:0),status:food?'playing':'won'};
}
export const memorySymbols = [
  {symbol:'★',name:'星星'}, {symbol:'●',name:'圓形'}, {symbol:'▲',name:'三角形'},
  {symbol:'◆',name:'菱形'}, {symbol:'☀',name:'太陽'}, {symbol:'♥',name:'愛心'}
];
export function createMemory(random=Math.random) {
  const deck=memorySymbols.flatMap((item,pair)=>[{...item,pair},{...item,pair}]);
  for(let i=deck.length-1;i>0;i--) {const j=Math.min(i,Math.floor(random()*(i+1)));[deck[i],deck[j]]=[deck[j],deck[i]];}
  return {deck,flipped:[],matched:[],moves:0,pending:false,status:'playing'};
}
export function flipMemory(state,index) {
  if(state.status!=='playing' || state.pending || !Number.isInteger(index) || index<0 || index>=state.deck.length || state.flipped.includes(index) || state.matched.includes(index)) return state;
  const flipped=[...state.flipped,index];
  if(flipped.length===1) return {...state,flipped};
  const moves=state.moves+1;
  if(state.deck[flipped[0]].pair!==state.deck[index].pair) return {...state,flipped,moves,pending:true};
  const matched=[...state.matched,...flipped];
  return {...state,flipped:[],matched,moves,pending:false,status:matched.length===state.deck.length?'won':'playing'};
}
export function resolveMismatch(state) {
  return state.pending?{...state,flipped:[],pending:false}:state;
}
