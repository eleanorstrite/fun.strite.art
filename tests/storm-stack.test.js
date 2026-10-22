import test from 'node:test';
import assert from 'node:assert/strict';
import {createStormState,stormFits,stormMove,stormRotate,tickStorm,drawStorm,STORM_HAZARDS,createStormStack,stormBalance} from '../src/storm-stack.js';
function ready(random=()=>.42){const s=createStormState(random);s.status='playing';return s;}
function advance(s,seconds,fast=false,emit=()=>{}){for(let i=0;i<Math.round(seconds*100);i++)tickStorm(s,.01,fast,emit);}
test('pieces stay inside walls, rotate legally, and cannot overlap settled blocks',()=>{
 const s=ready();for(let i=0;i<12;i++)stormMove(s,-1);assert.equal(stormMove(s,-1),false);
 stormRotate(s);assert.ok(stormFits(s,s.piece.cells,s.piece.x,s.piece.y));
 const [dx,dy]=s.piece.cells[0];s.board[s.piece.y+dy][s.piece.x+dx]=1;assert.equal(stormFits(s,s.piece.cells,s.piece.x,s.piece.y),false);
});
test('holding down falls faster and only settled blocks count toward height',()=>{
 const slow=ready(),fast=ready();advance(slow,.8);advance(fast,.8,true);
 assert.ok(fast.locked>slow.locked);assert.equal(slow.height,0);assert.ok(fast.height>0);
});
test('goal height wins immediately and full rows remain stacked',()=>{
 const s=ready(),events=[];s.board[23].fill(2);s.board[7][4]=1;s.piece={kind:0,x:4,y:3,cells:[[0,0],[0,1],[0,2],[0,3]]};
 tickStorm(s,.04,true,e=>events.push(e));assert.equal(s.status,'ending');assert.equal(s.won,true);assert.equal(s.height,21);assert.deepEqual(s.board[23],Array(10).fill(2));assert.ok(events.includes('win'));assert.ok(!events.includes('bell'));
});
test('timeout rings once, selects any of four hazards, then speaks and finishes once',()=>{
 STORM_HAZARDS.forEach((hazard,index)=>{
  const s=ready(()=>index/4+.01),events=[];s.remaining=.01;tickStorm(s,.01,false,e=>events.push(e));
  assert.equal(s.status,'ending');assert.equal(s.hazard,hazard);assert.equal(s.remaining,0);
  advance(s,10,false,e=>events.push(e));assert.equal(s.status,'finished');assert.equal(events.filter(e=>e==='bell').length,1);assert.equal(events.filter(e=>e==='sayLose').length,1);
  const frozen=JSON.stringify(s);advance(s,1);assert.equal(JSON.stringify(s),frozen);
 });
});
test('win ending speaks once and does not trigger a disaster',()=>{
 const s=ready(),events=[];s.status='ending';s.won=true;advance(s,8,false,e=>events.push(e));assert.equal(s.status,'finished');assert.equal(events.filter(e=>e==='sayWin').length,1);assert.equal(s.hazard,null);
});
test('game and all disaster / superhero scenes render without changing state',()=>{
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const s=ready();s.board[23].fill(1);drawStorm(ctx,s,600,780);
 for(const won of [false,true])for(const hazard of STORM_HAZARDS)for(const clip of [0,1,2.2,3,5,7,9]){
  Object.assign(s,{won,hazard,clip,status:'ending'});const before=JSON.stringify(s);drawStorm(ctx,s,300,390);drawStorm(ctx,s,600,780,true);assert.equal(JSON.stringify(s),before);
 }
});
test('engine pause and hidden tabs freeze time, controls release, rewards settle once',()=>{
 const names=['document','window','requestAnimationFrame','cancelAnimationFrame'];const original=Object.fromEntries(names.map(k=>[k,globalThis[k]]));
 class Element{children=[];listeners={};append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}addEventListener(k,v){this.listeners[k]=v;}}
 const controls=new Element(),handlers={},globalHandlers={};let frame,now=100,hud='',finishes=[];
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const canvas={width:600,height:780,getContext:()=>ctx,addEventListener:(k,v)=>handlers[k]=v,focus(){}};
 globalThis.document={hidden:false,createElement:()=>new Element(),addEventListener:(k,v)=>globalHandlers[k]=v};globalThis.window={addEventListener:(k,v)=>globalHandlers[k]=v};globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
 let engine;const frames=n=>{for(let i=0;i<n;i++){frame(now);now+=100;}};
 try{
  engine=createStormStack({canvas,controls,onHud:v=>hud=v.text,onFinish:coins=>finishes.push(coins)});engine.start();frames(3);engine.pause(true);const before=hud;frames(30);assert.equal(hud,before);
  engine.pause(false);globalThis.document.hidden=true;frames(30);assert.equal(hud,before);globalThis.document.hidden=false;
  handlers.keydown({key:'ArrowDown',preventDefault(){}});handlers.blur();frames(3);
  frames(710);assert.equal(finishes.length,1);assert.ok([5,25].includes(finishes[0]));engine.destroy();assert.equal(finishes.length,1);
  engine=createStormStack({canvas,controls,onHud(){},onFinish:coins=>finishes.push(coins)});engine.start();engine.destroy();assert.equal(finishes.at(-1),0);
 }finally{engine?.destroy();Object.assign(globalThis,original);}
});


test('pieces balance over supports, but overhanging pieces tip in either direction',()=>{
 const s=ready();s.board[23][4]=1;
 const horizontal={kind:0,cells:[[0,0],[1,0],[2,0],[3,0]],x:4,y:22};
 assert.equal(stormBalance(s,horizontal).stable,false);assert.equal(stormBalance(s,horizontal).direction,1);
 assert.equal(stormBalance(s,{...horizontal,x:1}).direction,-1);
 assert.equal(stormBalance(s,{kind:0,cells:[[0,0],[0,1],[0,2],[0,3]],x:4,y:19}).stable,true);
 s.board[23][7]=1;assert.equal(stormBalance(s,horizontal).stable,true);
});
test('an unbalanced goal-height piece falls off instead of winning or adding collision cells',()=>{
 const s=ready(),events=[];s.board[7][4]=2;s.height=17;
 s.piece={kind:0,cells:[[0,0],[1,0],[2,0],[3,0]],x:4,y:6};
 tickStorm(s,.04,true,e=>events.push(e));assert.equal(s.status,'playing');assert.equal(s.height,17);assert.equal(s.locked,0);assert.equal(s.tumbling.length,1);assert.equal(s.tumbling[0].direction,1);assert.ok(s.board[6].every(v=>v===0));assert.ok(events.includes('whoosh'));assert.ok(!events.includes('win'));
 s.piece.x=0;advance(s,3.3);assert.equal(s.tumbling.length,0);
});
test('tipping animation pauses with the game and rendering does not change physics',()=>{
 const s=ready();s.board[23][3]=1;s.piece={kind:0,cells:[[0,0],[1,0],[2,0],[3,0]],x:3,y:22};tickStorm(s,.04,true);
 const c=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 for(const age of [0,.3,.8,2]){s.tumbling[0].age=age;const before=JSON.stringify(s);drawStorm(c,s,600,780);drawStorm(c,s,300,390,true);assert.equal(JSON.stringify(s),before);}
 s.status='ready';const age=s.tumbling[0].age;tickStorm(s,.1);assert.equal(s.tumbling[0].age,age);
});
