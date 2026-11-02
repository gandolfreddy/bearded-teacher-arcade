export const SHAPES={
  I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O:[[1,1],[1,1]],
  T:[[0,1,0],[1,1,1],[0,0,0]],
  S:[[0,1,1],[1,1,0],[0,0,0]],
  Z:[[1,1,0],[0,1,1],[0,0,0]],
  J:[[1,0,0],[1,1,1],[0,0,0]],
  L:[[0,0,1],[1,1,1],[0,0,0]]
};
export const PIECE_COLORS={I:'#4097a1',O:'#e6b345',T:'#9264ac',S:'#64935d',Z:'#c76b6c',J:'#547eae',L:'#d68e49'};
export function pieceMatrix(piece) {
  let matrix=SHAPES[piece.type].map(row=>[...row]);
  for(let i=0;i<piece.rotation;i++)matrix=matrix[0].map((_,x)=>matrix.map(row=>row[x]).reverse());
  return matrix;
}
export function fits(state,piece) {
  return pieceMatrix(piece).every((row,y)=>row.every((cell,x)=>!cell || (piece.x+x>=0 && piece.x+x<10 && piece.y+y<20 && (piece.y+y<0 || !state.board[piece.y+y][piece.x+x]))));
}
function bag(random) {
  const pieces=Object.keys(SHAPES);
  for(let i=pieces.length-1;i>0;i--){const j=Math.min(i,Math.floor(random()*(i+1)));[pieces[i],pieces[j]]=[pieces[j],pieces[i]];}
  return pieces;
}
function spawn(state,type) {
  const piece={type,x:Math.floor((10-SHAPES[type].length)/2),y:0,rotation:0};
  return {...state,piece,status:fits(state,piece)?'playing':'lost'};
}
function next(state,random) {
  const queue=[...state.queue];
  while(queue.length<6)queue.push(...bag(random));
  const type=queue.shift();
  return spawn({...state,queue},type);
}
export function createTetris(random=Math.random) {
  return next({board:Array.from({length:20},()=>Array(10).fill(null)),piece:null,queue:[],hold:null,holdUsed:false,score:0,lines:0,level:1,status:'playing'},random);
}
export function moveTetris(state,dx,dy=0) {
  if(state.status!=='playing')return state;
  const piece={...state.piece,x:state.piece.x+dx,y:state.piece.y+dy};
  return fits(state,piece)?{...state,piece}:state;
}
export function rotateTetris(state,delta=1) {
  if(state.status!=='playing')return state;
  const rotation=(state.piece.rotation+delta+4)%4;
  for(const [dx,dy] of [[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1]]){
    const piece={...state.piece,rotation,x:state.piece.x+dx,y:state.piece.y+dy};
    if(fits(state,piece))return {...state,piece};
  }
  return state;
}
export function holdTetris(state,random=Math.random) {
  if(state.status!=='playing' || state.holdUsed)return state;
  const type=state.piece.type;
  const swapped=state.hold?spawn(state,state.hold):next(state,random);
  return {...swapped,hold:type,holdUsed:true};
}
export function ghostY(state) {
  let y=state.piece.y;
  while(fits(state,{...state.piece,y:y+1}))y++;
  return y;
}
export function lockTetris(state,random=Math.random) {
  if(state.status!=='playing')return state;
  const board=state.board.map(row=>[...row]);
  let topOut=false;
  pieceMatrix(state.piece).forEach((row,y)=>row.forEach((cell,x)=>{
    if(!cell)return;
    const by=state.piece.y+y,bx=state.piece.x+x;
    if(by<0)topOut=true;else board[by][bx]=state.piece.type;
  }));
  if(topOut)return {...state,status:'lost'};
  const remaining=board.filter(row=>row.some(cell=>!cell)),cleared=20-remaining.length;
  while(remaining.length<20)remaining.unshift(Array(10).fill(null));
  const lines=state.lines+cleared;
  return next({...state,board:remaining,lines,score:state.score+[0,100,300,500,800][cleared]*state.level,level:1+Math.floor(lines/10),holdUsed:false},random);
}
export function hardDropTetris(state,random=Math.random) {
  if(state.status!=='playing')return state;
  const y=ghostY(state),distance=y-state.piece.y;
  return lockTetris({...state,piece:{...state.piece,y},score:state.score+distance*2},random);
}
