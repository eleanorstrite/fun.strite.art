import test from 'node:test';
import assert from 'node:assert/strict';
import {createStormState,stormFits,stormMove,stormRotate,tickStorm,drawStorm,createStormStack,stormBalance} from '../src/storm-stack.js';
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
test('timeout finishes once with a wizard ending and no disaster state',()=>{
 for(let index=0;index<8;index++){
  const s=createStormState(()=>.42,index),events=[];s.status='playing';s.remaining=.01;tickStorm(s,.01,false,e=>events.push(e));
  assert.equal(s.status,'ending');assert.equal(s.background,index);assert.equal(s.hazard,undefined);assert.equal(s.remaining,0);
  advance(s,5,false,e=>events.push(e));assert.equal(s.status,'finished');assert.equal(events.filter(e=>e==='bell').length,1);assert.equal(events.filter(e=>e==='sayLose').length,1);
  const frozen=JSON.stringify(s);advance(s,1);assert.equal(JSON.stringify(s),frozen);
 }
});
test('win ending speaks once and does not trigger a disaster',()=>{
 const s=ready(),events=[];s.status='ending';s.won=true;advance(s,8,false,e=>events.push(e));assert.equal(s.status,'finished');assert.equal(events.filter(e=>e==='sayWin').length,1);assert.equal(s.hazard,undefined);
});
test('all eight worlds, six block finishes and wizard endings render without changing state',()=>{
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const s=ready();s.board[23].fill(1);drawStorm(ctx,s,600,780);
 for(const won of [false,true])for(let background=0;background<8;background++)for(const blockStyle of ['galaxy','gold','lightning','rainbow','crystal','jewel'])for(const clip of [0,1,3.5]){
  Object.assign(s,{won,background,blockStyle,clip,status:'ending'});const before=JSON.stringify(s);drawStorm(ctx,s,300,390);drawStorm(ctx,s,600,780,true);assert.equal(JSON.stringify(s),before);
 }
});
test('engine pause and hidden tabs freeze time, controls release, rewards settle once',()=>{
 const names=['document','window','requestAnimationFrame','cancelAnimationFrame','localStorage'];const original=Object.fromEntries(names.map(k=>[k,globalThis[k]]));
 class Element{children=[];listeners={};append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}addEventListener(k,v){this.listeners[k]=v;}}
 const controls=new Element(),handlers={},globalHandlers={};let frame,now=100,hud='',finishes=[];
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const canvas={width:600,height:780,getContext:()=>ctx,addEventListener:(k,v)=>handlers[k]=v,focus(){}};
 globalThis.document={hidden:false,createElement:()=>new Element(),addEventListener:(k,v)=>globalHandlers[k]=v};globalThis.window={addEventListener:(k,v)=>globalHandlers[k]=v};globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
 const hazardSaves=[];globalThis.localStorage={getItem:()=>hazardSaves.at(-1)??null,setItem:(key,value)=>hazardSaves.push(value)};
 let engine;const frames=n=>{for(let i=0;i<n;i++){frame(now);now+=100;}};
 try{
  engine=createStormStack({canvas,controls,onHud:v=>hud=v.text,onFinish:coins=>finishes.push(coins)});engine.start();frames(3);engine.pause(true);const before=hud;frames(30);assert.equal(hud,before);
  engine.pause(false);globalThis.document.hidden=true;frames(30);assert.equal(hud,before);globalThis.document.hidden=false;
  handlers.keydown({key:'ArrowDown',preventDefault(){}});handlers.blur();frames(3);
  frames(710);assert.equal(finishes.length,1);assert.ok([5,25].includes(finishes[0]));engine.destroy();assert.equal(finishes.length,1);
  engine=createStormStack({canvas,controls,onHud(){},onFinish:coins=>finishes.push(coins)});engine.start();engine.destroy();assert.equal(finishes.at(-1),0);
  for(let i=0;i<6;i++){engine=createStormStack({canvas,controls,onHud(){},onFinish(){}});engine.start();engine.destroy();}
  assert.deepEqual(hazardSaves,['1','2','3','4','5','6','7','0']);
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


test('a selected world remains fixed throughout its round',()=>{
 for(let index=0;index<8;index++){const s=createStormState(()=>.4,index);s.status='playing';advance(s,1);assert.equal(s.background,index);s.remaining=.01;tickStorm(s,.01);assert.equal(s.background,index);}
});

test('magic anchor rescues one overhang, consumes a charge, then expires',async()=>{
 const {stormSpell,stormHardDrop}=await import('../src/storm-stack.js');
 const s=ready();s.board[23][4]=1;s.piece={kind:0,cells:[[0,0],[1,0],[2,0],[3,0]],x:4,y:22};
 assert.equal(stormSpell(s),true);assert.equal(stormSpell(s),false);assert.equal(s.spells,2);
 stormHardDrop(s);assert.equal(s.locked,1);assert.equal(s.ward,false);assert.equal(s.misses,0);s.spells=0;assert.equal(stormSpell(s),false);
});
test('three balanced instant drops earn a spell without dropping the following piece',async()=>{
 const {stormHardDrop}=await import('../src/storm-stack.js');const s=ready();
 for(let i=0;i<3;i++){s.piece={kind:1,cells:[[0,0],[1,0],[0,1],[1,1]],x:i*2,y:0};stormHardDrop(s);assert.equal(s.locked,i+1);assert.equal(s.piece.y,0);}
 assert.equal(s.combo,3);assert.equal(s.spells,4);
});
test('survival has three chances and wins by lasting through the timer',async()=>{
 const {stormHardDrop}=await import('../src/storm-stack.js');
 const s=createStormState(()=>.42,0,'survival');s.status='playing';
 for(let i=0;i<3;i++){s.board[23][4]=1;s.piece={kind:0,cells:[[0,0],[1,0],[2,0],[3,0]],x:4,y:22};stormHardDrop(s);assert.equal(s.misses,i+1);}
 assert.equal(s.status,'ending');assert.equal(s.won,false);
 const win=createStormState(()=>.42,0,'survival');win.status='playing';win.remaining=.01;tickStorm(win,.02);assert.equal(win.won,true);
});
test('practice has no deadline and survival does not move your piece automatically',()=>{
 const practice=createStormState(()=>.42,0,'practice');practice.status='playing';advance(practice,1);assert.equal(practice.remaining,Infinity);
 const s=createStormState(()=>.42,0,'survival');s.status='playing';s.elapsed=6.99;const x=s.piece.x;tickStorm(s,.02);assert.equal(s.piece.x,x);
});
