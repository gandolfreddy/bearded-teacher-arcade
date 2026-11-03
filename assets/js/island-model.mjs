export const WORLD={cols:48,rows:30,tile:24,width:1152,height:720};
export const SPAWN={x:24,y:15};
export const APPEARANCE={hair:['short','long','curly','cap'],gender:['unspecified','male','female'],expression:['smile','calm','happy'],clothes:['ocean','berry','sun','forest']};
export const DEFAULT_APPEARANCE={hair:'short',gender:'unspecified',expression:'smile',clothes:'ocean'};
export const PORTALS=[
  {id:'snake',name:'星星貪食蛇',x:12,y:11,color:'#94b859',roof:'red',mark:'S'},
  {id:'memory',name:'翻牌配對',x:24,y:8,color:'#ecb977',roof:'blue',mark:'M'},
  {id:'tetris',name:'俄羅斯方塊',x:35,y:11,color:'#be9bc9',roof:'red',mark:'T'},
  {id:'star-trail',name:'星星小徑',x:12,y:21,color:'#e8bb60',roof:'blue',mark:'★'},
  {id:'road-racer',name:'直線賽車',x:25,y:23,color:'#dc8d75',roof:'red',mark:'R'},
  {id:'mini-pool',name:'迷你撞球',x:36,y:21,color:'#72aca0',roof:'blue',mark:'8'}
];
export function land(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<48&&y<30&&((x-23.5)/22.8)**2+((y-14.3)/13.6)**2<1;}
const key=(x,y)=>x+','+y;
export const pathTiles=new Set();
for(const p of PORTALS){
  for(let x=Math.min(p.x,24);x<=Math.max(p.x,24);x++)pathTiles.add(key(x,15));
  for(let y=Math.min(p.y,15);y<=Math.max(p.y,15);y++)pathTiles.add(key(p.x,y));
}
for(let x=21;x<=27;x++)for(let y=13;y<=17;y++)pathTiles.add(key(x,y));
const buildings=new Set();
for(const p of PORTALS)for(let x=p.x-2;x<=p.x+1;x++)for(let y=p.y-4;y<p.y;y++)buildings.add(key(x,y));
export const TREES=[];
for(let y=3;y<28;y++)for(let x=3;x<45;x++){
  if((y>24&&Math.abs(x-24)<3)||!land(x,y)||pathTiles.has(key(x,y))||buildings.has(key(x,y)))continue;
  if(PORTALS.some(p=>Math.abs(p.x-x)<4&&Math.abs(p.y-2-y)<5)||Math.hypot(x-SPAWN.x,y-SPAWN.y)<5)continue;
  if((x*37+y*53)%31===0)TREES.push({x,y,type:(x+y)%3});
}
const treeTiles=new Set(TREES.map(t=>key(t.x,t.y)));
export function walkable(x,y){return land(x,y)&&!buildings.has(key(x,y))&&!treeTiles.has(key(x,y));}
export function findPath(from,to){
  if(!walkable(from.x,from.y)||!walkable(to.x,to.y))return [];
  const queue=[from],previous=new Map([[key(from.x,from.y),null]]);
  for(let head=0;head<queue.length;head++){
    const p=queue[head];if(p.x===to.x&&p.y===to.y){const route=[];let k=key(p.x,p.y);while(previous.get(k)!==null){const [x,y]=k.split(',').map(Number);route.push({x,y});k=previous.get(k);}return route.reverse();}
    for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,k=key(x,y);if(walkable(x,y)&&!previous.has(k)){previous.set(k,key(p.x,p.y));queue.push({x,y});}}
  }return [];
}
export function nearbyPortal(position){return PORTALS.find(p=>Math.hypot(position.x-p.x,position.y-p.y)<1.6)||null;}
export function normalizeAccount(value){const account=String(value).normalize('NFKC').trim().toLowerCase();if(!/^[a-z0-9_\-\u4e00-\u9fff]{2,24}$/u.test(account))throw new Error('帳號需為 2～24 個中文字、英文字母、數字、底線或連字號。');return account;}
export function validateAppearance(value){if(!value||Object.keys(value).length!==4||Object.entries(APPEARANCE).some(([key,values])=>!values.includes(value[key])))throw new Error('角色外觀資料不完整，請重新選擇。');return {...value};}
export function validPosition(value){return value&&Number.isInteger(value.x)&&Number.isInteger(value.y)&&walkable(value.x,value.y);}
export function profileFor(account,appearance,now=new Date().toISOString()){return {account:normalizeAccount(account),appearance:validateAppearance(appearance),position:{...SPAWN},createdAt:now,updatedAt:now,revision:0};}
