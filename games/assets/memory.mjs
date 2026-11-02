import {createMemory,flipMemory,resolveMismatch} from './models.mjs';
import {GameHost} from './host.mjs';
const board=document.getElementById('board');
let state=createMemory(),remaining=0,focused=0;
const cards=state.deck.map((_,index)=>{
  const button=document.createElement('button');
  button.type='button';button.className='memory-card';button.dataset.index=String(index);
  board.append(button);return button;
});
function draw() {
  cards.forEach((button,index)=>{
    const matched=state.matched.includes(index),open=state.flipped.includes(index)||matched;
    button.textContent=open?state.deck[index].symbol:'?';
    button.setAttribute('aria-label','第 '+(index+1)+' 張牌，'+(matched?state.deck[index].name+'，已配對':open?state.deck[index].name+'，已翻開':'尚未翻開'));
    button.classList.toggle('is-open',open);button.classList.toggle('is-matched',matched);
    button.disabled=matched;
    button.tabIndex=index===focused?0:-1;
  });
  document.getElementById('pairs').value=String(state.matched.length/2);
  document.getElementById('moves').value=String(state.moves);
}
function focusCard(index=focused) {
  const available=cards.map((_,i)=>i).filter(i=>!state.matched.includes(i));
  if(!available.length){document.getElementById('reset').focus();return;}
  focused=available.includes(index)?index:available[0];draw();cards[focused].focus();
}
function flip(index) {
  if(!host.active)return;
  const previous=state;state=flipMemory(state,index);
  if(previous===state)return;
  if(state.pending)remaining=750;
  focused=index;draw();
  if(state.status==='won'){host.finish('全部配對成功！用了 '+state.moves+' 次，太棒了。');document.getElementById('reset').focus();}
  else if(state.matched.includes(index))focusCard();
}
const host=new GameHost({
  id:'memory',onFocus:()=>focusCard(),
  onReset:()=>{state=createMemory();remaining=0;focused=0;draw();},
  onTick:dt=>{if(state.pending){remaining-=dt;if(remaining<=0){state=resolveMismatch(state);draw();}}}
});
cards.forEach((button,index)=>{
  button.addEventListener('click',()=>flip(index),{signal:host.controller.signal});
  button.addEventListener('focus',()=>{focused=index;draw();},{signal:host.controller.signal});
});
board.addEventListener('keydown',event=>{
  const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:4,ArrowUp:-4}[event.key];
  if(delta===undefined)return;
  event.preventDefault();
  const candidates=[];
  for(let step=1;step<=cards.length;step++){const index=(focused+delta*step+cards.length*4)%cards.length;if(!state.matched.includes(index))candidates.push(index);}
  if(candidates.length)focusCard(candidates[0]);
},{signal:host.controller.signal});
draw();
