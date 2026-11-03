import {WORLD,PORTALS,TREES,pathTiles,land} from './island-model.mjs';
const CLOTHES={ocean:'#4b88b1',berry:'#b45e78',sun:'#e0ac48',forest:'#4e8c68'};
export async function loadIslandArt(){
  async function image(path){const img=new Image();img.src=new URL('../images/island/'+path,import.meta.url);await img.decode();return img;}
  const [town,people]=await Promise.all([image('town.png'),image('people.png')]);return {town,people};
}
function tile(ctx,image,index,x,y,size=24){ctx.drawImage(image,(index%12)*17,Math.floor(index/12)*17,16,16,x,y,size,size);}
export function drawAvatar(ctx,art,appearance,x,y,size=42,step=0){
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x-size/2),Math.round(y-size));ctx.scale(size/16,size/16);
  const base=appearance.gender==='female'?99:appearance.gender==='male'?98:85;
  tile(ctx,art.people,base,0,step,16);
  // CC0 Kenney base character with project-created clothing, hair and expression overlays.
  ctx.fillStyle=CLOTHES[appearance.clothes];ctx.fillRect(5,11+step,6,3);ctx.fillRect(4,12+step,8,2);
  ctx.fillStyle='#513c3f';
  if(appearance.hair==='short'){ctx.fillRect(5,3+step,6,2);ctx.fillRect(4,4+step,2,3);}
  if(appearance.hair==='long'){ctx.fillRect(4,3+step,8,2);ctx.fillRect(3,5+step,2,6);ctx.fillRect(11,5+step,2,6);}
  if(appearance.hair==='curly'){for(const [hx,hy]of [[4,3],[6,2],[8,2],[10,3],[3,5],[11,5]])ctx.fillRect(hx,hy+step,3,3);}
  if(appearance.hair==='cap'){ctx.fillStyle='#e7bc58';ctx.fillRect(4,3+step,8,3);ctx.fillRect(3,5+step,10,1);}
  ctx.fillStyle='#3d3034';
  if(appearance.expression==='happy'){ctx.fillRect(6,7+step,1,1);ctx.fillRect(9,7+step,1,1);ctx.fillRect(7,9+step,2,1);}
  if(appearance.expression==='calm'){ctx.fillRect(5,7+step,2,1);ctx.fillRect(9,7+step,2,1);ctx.fillRect(7,9+step,2,1);}
  if(appearance.expression==='smile'){ctx.fillRect(6,7+step,1,1);ctx.fillRect(9,7+step,1,1);ctx.fillRect(6,9+step,1,1);ctx.fillRect(9,9+step,1,1);ctx.fillRect(7,10+step,2,1);}
  ctx.restore();
}
export class IslandRenderer{
  constructor(canvas,minimap,art){this.canvas=canvas;this.mini=minimap;this.art=art;this.background=document.createElement('canvas');this.background.width=WORLD.width;this.background.height=WORLD.height;this.prepare();}
  building(ctx,p){
    const left=(p.x-2)*24,top=(p.y-4)*24,red=p.roof==='red';
    ctx.fillStyle='#39545233';ctx.fillRect(left+5,top+10,101,98);
    for(let row=0;row<2;row++)for(let col=0;col<4;col++){const i=(red?52:48)+(row?12:0)+(col===0?0:col===3?2:1);tile(ctx,this.art.town,i,left+col*24,top+row*24);}
    for(let col=0;col<4;col++){tile(ctx,this.art.town,red?73:77,left+col*24,top+48);tile(ctx,this.art.town,red?73:77,left+col*24,top+72);}
    tile(ctx,this.art.town,red?84:88,left+24,top+48);tile(ctx,this.art.town,red?85:89,left+48,top+72);
    ctx.fillStyle=p.color;ctx.fillRect(left+5,top+64,18,24);ctx.fillStyle='#fff6d7';ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText(p.mark,left+14,top+81);
  }
  prepare(){
    const ctx=this.background.getContext('2d');ctx.imageSmoothingEnabled=false;
    for(let y=0;y<30;y++)for(let x=0;x<48;x++){
      if(!land(x,y))continue;
      const edge=!land(x+1,y)||!land(x-1,y)||!land(x,y+1)||!land(x,y-1);
      if(edge){ctx.fillStyle='#d9b976';ctx.fillRect(x*24,y*24+8,24,24);ctx.fillStyle='#f2d695';ctx.fillRect(x*24,y*24,24,24);}
      else tile(ctx,this.art.town,(x*17+y*31)%19===0?2:(x+y)%4===0?1:0,x*24,y*24);
      if(pathTiles.has(x+','+y)){ctx.fillStyle='#d8bf88';ctx.fillRect(x*24,y*24,24,24);if((x+y)%3===0){ctx.fillStyle='#c5aa76';ctx.fillRect(x*24+5,y*24+12,8,2);}}
    }
    // Boardwalk and arrival pier.
    for(let row=26;row<30;row++){ctx.fillStyle='#77574b';ctx.fillRect(23*24,row*24,72,24);ctx.fillStyle='#b98a61';ctx.fillRect(23*24+3,row*24+2,66,18);ctx.strokeStyle='#dfb980';ctx.strokeRect(23*24+4,row*24+3,64,16);}
    ctx.fillStyle='#b6a17a';ctx.beginPath();ctx.ellipse(24.5*24,15.5*24,70,43,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e9d7a1';ctx.beginPath();ctx.ellipse(24.5*24,15.5*24,63,36,0,0,Math.PI*2);ctx.fill();
    tile(ctx,this.art.town,104,25*24,13*24,36);
    for(const p of PORTALS){ctx.fillStyle='#65785a';ctx.fillRect(p.x*24+8,p.y*24+19,8,5);tile(ctx,this.art.town,83,(p.x+2)*24,p.y*24,24);}
  }
  size(){const r=this.canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);const width=Math.round(r.width*ratio),height=Math.round(r.height*ratio);if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;}const scale=Math.min(width/WORLD.width,height/WORLD.height);this.transform={scale,x:(width-WORLD.width*scale)/2,y:(height-WORLD.height*scale)/2};return this.transform;}
  point(clientX,clientY,canvas=this.canvas){const r=canvas.getBoundingClientRect();if(canvas===this.mini)return {x:Math.floor((clientX-r.left)/r.width*48),y:Math.floor((clientY-r.top)/r.height*30)};const t=this.size();return {x:Math.floor(((clientX-r.left)*this.canvas.width/r.width-t.x)/t.scale/24),y:Math.floor(((clientY-r.top)*this.canvas.height/r.height-t.y)/t.scale/24)};}
  draw(player,appearance,{route=[],target=null,name='',time=0}={}){
    const ctx=this.canvas.getContext('2d'),t=this.size();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#76b7be';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.save();ctx.translate(t.x,t.y);ctx.scale(t.scale,t.scale);
    ctx.fillStyle='#b5d8cf80';for(let i=0;i<55;i++){const x=(i*193+Math.sin(time/3000+i)*7)%1152,y=(i*127)%720;if(!land(Math.floor(x/24),Math.floor(y/24)))ctx.fillRect(Math.round(x),y,12,2);}
    ctx.drawImage(this.background,0,0);
    if(route.length){ctx.strokeStyle='#fff4c18a';ctx.lineWidth=3;ctx.setLineDash([3,7]);ctx.beginPath();ctx.moveTo((player.x+.5)*24,(player.y+.5)*24);for(const p of route)ctx.lineTo((p.x+.5)*24,(p.y+.5)*24);ctx.stroke();ctx.setLineDash([]);}
    if(target){ctx.strokeStyle='#fff8d5';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse((target.x+.5)*24,(target.y+.5)*24,10,6,0,0,Math.PI*2);ctx.stroke();}
    const objects=PORTALS.map(p=>({y:p.y,draw:()=>this.building(ctx,p)}));
    for(const tree of TREES)objects.push({y:tree.y+.3,draw:()=>{const x=tree.x*24,y=tree.y*24;ctx.fillStyle='#284b4133';ctx.beginPath();ctx.ellipse(x+12,y+22,18,7,0,0,Math.PI*2);ctx.fill();if(tree.type===0){tile(ctx,this.art.town,4,x-5,y-15,34);tile(ctx,this.art.town,16,x-5,y+19,34);}else tile(ctx,this.art.town,tree.type===1?5:28,x-4,y-7,32);}});
    if(player&&appearance)objects.push({y:player.y+.5,draw:()=>{const x=(player.x+.5)*24,y=(player.y+.8)*24;ctx.fillStyle='#30483b55';ctx.beginPath();ctx.ellipse(x,y,12,5,0,0,Math.PI*2);ctx.fill();drawAvatar(ctx,this.art,appearance,x,y,36,route.length?Math.floor(time/150)%2:0);ctx.font='bold 12px system-ui';ctx.textAlign='center';const width=ctx.measureText(name).width+16;ctx.fillStyle='#243f40e8';ctx.fillRect(x-width/2,y-58,width,20);ctx.fillStyle='#fff8dd';ctx.fillText(name,x,y-44);}});
    objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
    for(const p of PORTALS){const x=(p.x+.1)*24,y=(p.y-4.3)*24;const fontSize=Math.max(12,11*Math.min(devicePixelRatio||1,2)/t.scale);ctx.font='bold '+fontSize+'px system-ui';ctx.textAlign='center';ctx.fillStyle='#fdf4d9';const w=ctx.measureText(p.name).width+20;ctx.fillRect(x-w/2,y-fontSize*1.25,w,fontSize*1.8);ctx.fillStyle='#385052';ctx.fillText(p.name,x,y+1);}
    ctx.restore();
    const m=this.mini.getContext('2d');m.imageSmoothingEnabled=false;m.fillStyle='#6aa7b0';m.fillRect(0,0,192,120);m.drawImage(this.background,0,0,192,120);for(const p of PORTALS){m.fillStyle=p.color;m.fillRect(p.x*4-3,p.y*4-6,6,6);}if(player){m.fillStyle='#fff7c6';m.fillRect(player.x*4,player.y*4,4,4);m.strokeStyle='#32514a';m.strokeRect(player.x*4-1,player.y*4-1,6,6);}
  }
}
