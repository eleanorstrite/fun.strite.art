import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTagState,tickTag,defaultTagSettings,validateTagSettings,TAG_LAYOUTS,TAG_BACKGROUNDS,TAG_ANIMALS,drawTagScene,createTagGame} from '../src/tag.js';
const ready=()=>{const s=createTagState({...defaultTagSettings(),mode:'local'});s.status='playing';return s;};
test('countdown freezes the players and starts a sixty-second round',()=>{
 const s=createTagState();s.status='countdown';const before=JSON.stringify(s.players);
 for(let i=0;i<60;i++)tickTag(s,.05,[{right:true},{}]);assert.equal(JSON.stringify(s.players),before);assert.equal(s.time,0);
 tickTag(s,.05);assert.equal(s.status,'playing');tickTag(s,.05);assert.ok(s.time>0);
});
test('players jump, steer in air, land on platforms and bounce higher on trampolines',()=>{
 const s=ready(),p=s.players[0];tickTag(s,.05,[{jump:true},{}]);assert.ok(p.vy<0);assert.equal(p.grounded,false);
 const x=p.x;for(let i=0;i<10;i++)tickTag(s,.05,[{right:true},{}]);assert.ok(p.x>x+30);
 p.x=180;p.y=420;p.vy=200;tickTag(s,.05);assert.equal(p.y,430);assert.equal(p.grounded,true);
 p.x=360;p.y=530;p.vy=250;tickTag(s,.05);assert.equal(p.grounded,false);assert.equal(p.vy,-860);
 for(let i=0;i<10;i++)tickTag(s,.05,[{left:true},{}]);assert.ok(p.y<300);assert.ok(p.x<360);
});
test('tag changes on contact, protects against instant tag-back, and picks a winner once',()=>{
 const s=ready();s.players[1].x=s.players[0].x;tickTag(s,.05);assert.equal(s.tagger,1);
 for(let i=0;i<20;i++)tickTag(s,.05);assert.equal(s.tagger,1);
 for(let i=0;i<12;i++)tickTag(s,.05);assert.equal(s.tagger,0);
 s.time=59.99;tickTag(s,.05);assert.equal(s.status,'finished');assert.equal(s.winner,1);
 const before=JSON.stringify(s);tickTag(s,1);assert.equal(JSON.stringify(s),before);
});
test('computer actively chases, flees and jumps in every layout',()=>{
 for(const layout of Object.keys(TAG_LAYOUTS)){
  const s=createTagState({...defaultTagSettings(),layout},1);s.status='playing';const start=s.players[1].x;
  for(let i=0;i<10;i++)tickTag(s,.05);assert.ok(s.players[1].x<start);
  let airborne=false;for(let i=0;i<1200;i++){tickTag(s,.05);airborne ||= !s.players[1].grounded;for(const p of s.players){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(p.x>=24&&p.x<=876);assert.ok(p.y<=540);}}
  assert.equal(airborne,true);assert.equal(s.status,'finished');
 }
});
test('appearance settings reject invalid saved choices and all themes render',()=>{
 assert.deepEqual(validateTagSettings({mode:'online',layout:'missing',players:[{color:'bad',animal:'missing'}]}),defaultTagSettings());
 const c=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 for(const background of Object.keys(TAG_BACKGROUNDS))for(const layout of Object.keys(TAG_LAYOUTS))for(const animal of Object.keys(TAG_ANIMALS)){
  const settings=defaultTagSettings();settings.background=background;settings.layout=layout;settings.players[0].animal=animal;
  const s=createTagState(settings),before=JSON.stringify(s);drawTagScene(c,s,900,600);assert.equal(JSON.stringify(s),before);
 }
});
test('Tag engine supports both keyboards, mode choices, pause, hidden tabs, replay and disposal',()=>{
 const original=Object.fromEntries(['document','window','requestAnimationFrame','cancelAnimationFrame','localStorage'].map(k=>[k,globalThis[k]]));
 class Element{children=[];listeners={};attributes={};append(...v){this.children.push(...v);}replaceChildren(...v){this.children=v;}setAttribute(k,v){this.attributes[k]=v;}addEventListener(k,v){this.listeners[k]=v;}focus(){}}
 const canvas=new Element(),controls=new Element(),modeControls=new Element();canvas.width=900;canvas.height=600;
 const c=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});canvas.getContext=()=>c;
 const window=new Element(),document=new Element();document.createElement=()=>new Element();document.hidden=false;
 let frame,now=1,hud='',finishes=0;const saved=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},requestAnimationFrame:fn=>(frame=fn,1),cancelAnimationFrame(){}});
 const advance=n=>{for(let i=0;i<n;i++){frame(now);now+=50;}};let engine;
 try{
  engine=createTagGame({canvas,controls,modeControls,onHud:v=>hud=v.text,onFinish:coins=>{assert.equal(coins,5);finishes++;}});
  modeControls.children[2].onclick();assert.equal(modeControls.children[2].attributes['aria-pressed'],'true');assert.equal(controls.children[1].children[1].hidden,false);
  engine.start();assert.equal(modeControls.children[1].disabled,true);assert.equal(controls.children[2].disabled,true);
  advance(70);canvas.listeners.keydown({code:'KeyD',preventDefault(){}});canvas.listeners.keydown({code:'ArrowLeft',preventDefault(){}});advance(5);
  engine.pause(true);advance(1);const before=hud;advance(100);assert.equal(hud,before);assert.equal(finishes,0);
  engine.pause(false);document.hidden=true;advance(100);assert.equal(hud,before);document.hidden=false;advance(1220);assert.equal(finishes,1);
  advance(100);assert.equal(finishes,1);assert.equal(controls.children[2].disabled,false);
  engine.start();advance(10);engine.destroy();engine.destroy();assert.equal(finishes,1);assert.equal(controls.children.length,0);assert.equal(modeControls.children.length,0);
 }finally{engine?.destroy();Object.assign(globalThis,original);}
});

test('computer can catch a stationary player on the ground in every arena',()=>{
 for(const layout of Object.keys(TAG_LAYOUTS)){
  const s=createTagState({...defaultTagSettings(),layout},1);s.status='playing';
  for(let i=0;i<600&&s.tagger===1;i++)tickTag(s,.05);
  assert.equal(s.tagger,0,layout);
 }
});

test('computer can chase onto a raised platform',()=>{
 const s=createTagState(defaultTagSettings(),1);s.status='playing';s.players[0].x=450;s.players[0].y=335;
 for(let i=0;i<600&&s.tagger===1;i++)tickTag(s,.05);assert.equal(s.tagger,0);
});

test('computer reacts more slowly and runs slower than human players',()=>{
 const s=createTagState(defaultTagSettings(),1);s.status='playing';
 tickTag(s,.05,[{right:true},{}]);assert.equal(s.players[1].vx,0);assert.ok(s.players[0].vx>0);
 for(let i=0;i<10;i++)tickTag(s,.05,[{right:true},{}]);
 assert.ok(Math.abs(s.players[1].vx)<=230);assert.ok(s.players[0].vx>260);
 const local=ready();for(let i=0;i<10;i++)tickTag(local,.05,[{right:true},{right:true}]);
 assert.equal(local.players[0].vx,local.players[1].vx);
});
