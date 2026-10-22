import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVanState, tickVan, vanAction, vanRoadCenter, VAN_OBSTACLES, VAN_FINISH, drawVanScene, createVanAdventure } from '../src/van-adventure.js';
const readyVan=()=>({...createVanState(),status:'playing'});
test('family boards before driving and actions only work during the course',()=>{
 const s=createVanState();assert.equal(vanAction(s,'fly'),false);s.status='intro';
 for(let i=0;i<141;i++)tickVan(s,.05,{up:true});assert.equal(s.status,'playing');assert.equal(s.z,0);
 tickVan(s,.05,{up:true,right:true});assert.equal(s.z>0,true);assert.equal(s.x>vanRoadCenter(0),true);
 const speed=s.speed;tickVan(s,.05,{down:true});assert.equal(s.speed<speed,true);
});
test('jump clears barriers, held flight crosses gaps and release lands, arrows dodge lanes',()=>{
 const s=readyVan();assert.equal(vanAction(s,'left'),true);assert.equal(vanAction(s,'right'),false);
 tickVan(s,.05);assert.equal(s.x<vanRoadCenter(s.z),true);assert.equal(s.lane,-1);
 const barrier=VAN_OBSTACLES.find(o=>o.type==='jump');s.z=barrier.z-42;s.speed=200;
 assert.equal(vanAction(s,'jump'),true);s.jump=.65;tickVan(s,.05);assert.equal(s.lives,3);
 const gap=VAN_OBSTACLES.find(o=>o.type==='gap');s.z=gap.z-42;s.speed=200;
 tickVan(s,.05,{fly:true});assert.equal(s.fly,1);assert.equal(s.lives,3);
 s.z=gap.z+gap.length+100;tickVan(s,.05);assert.equal(s.fly,0);
});
test('collisions return to checkpoints, rewards cannot be farmed, and three bumps end a run',()=>{
 const s=readyVan();s.z=999;s.x=vanRoadCenter(1000);s.speed=200;tickVan(s,.05,{up:true});assert.equal(s.earned,5);assert.equal(s.checkpoint,1);
 for(let n=0;n<3;n++){s.z=1090;s.x=vanRoadCenter(1100);s.invincible=0;tickVan(s,.05);assert.equal(s.z,1000);assert.equal(s.earned,5);}
 assert.equal(s.status,'lost');assert.equal(s.lives,0);assert.equal(vanAction(s,'fly'),false);
});
test('the entire course can be completed with lane dodges, jumping and held flight',()=>{
 const s=readyVan();let steps=0;
 while(s.status==='playing'&&steps++<2000){
  const o=VAN_OBSTACLES.find(o=>o.z+(o.length||35)>s.z-10),distance=o?o.z-s.z:999;
  if(o?.type==='jump'&&distance<105&&distance>0)vanAction(s,'jump');
  const target=o&&['crate','cones'].includes(o.type)&&distance<260?(o.x>0?-1:1):0;
  if(s.lane>target)vanAction(s,'left');if(s.lane<target)vanAction(s,'right');
  tickVan(s,.05,{fly:o?.type==='gap'&&distance<180});
 }
 assert.equal(s.status,'won');assert.equal(s.lives,3);assert.equal(s.earned,45);
 tickVan(s,.05);assert.equal(s.earned,45);
});
test('van intro and course render without changing simulation state',()=>{
 const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 for(const status of ['ready','intro','playing','won','lost']){
  const s={...createVanState(),status,intro:3,z:2200,fly:1};const before=JSON.stringify(s);drawVanScene(ctx,s,900,650);assert.equal(JSON.stringify(s),before);
 }
});
test('van engine pauses, freezes hidden tabs, restarts, and settles only once',()=>{
 const original={document:globalThis.document,window:globalThis.window,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
 class Element{children=[];listeners={};append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}addEventListener(name,fn){this.listeners[name]=fn;}setAttribute(){}}
 let frame,finished=0,hud='',snackSeconds=0,used=0;const handlers={},controls=new Element();
 const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const canvas={width:900,height:650,getContext:()=>ctx,focus(){},addEventListener:(name,fn)=>handlers[name]=fn};
 globalThis.document={hidden:false,createElement:()=>new Element(),addEventListener(){}};globalThis.window={addEventListener(){}};
 globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
 try{
  const engine=createVanAdventure({canvas,controls,consumeBoost:id=>{assert.equal(id,'snack');used++;return true;},onHud:v=>{hud=v.text;snackSeconds=v.ravenSnack.seconds;},onFinish:()=>finished++});assert.equal(engine.activateSnack(),false);engine.start();controls.children[1].children[5].onclick();
  assert.equal(engine.activateSnack(),true);assert.equal(engine.activateSnack(),false);assert.equal(used,1);assert.equal(snackSeconds,15);
  handlers.keydown({key:'ArrowUp',preventDefault(){}});frame(100);frame(150);
  engine.pause(true);const paused=hud,pausedSnack=snackSeconds;assert.equal(engine.activateSnack(),false);frame(200);frame(250);assert.equal(hud,paused);assert.equal(snackSeconds,pausedSnack);
  engine.pause(false);globalThis.document.hidden=true;frame(300);assert.equal(hud,paused);
  globalThis.document.hidden=false;engine.start();assert.equal(hud.includes('All aboard'),true);
  engine.destroy();engine.destroy();assert.equal(finished,1);assert.equal(controls.children.length,0);
 }finally{Object.assign(globalThis,original);}
});

test('Snack Attack hides all hazard types for fifteen seconds then restores collision',()=>{
 const s=readyVan();s.snack=15;
 for(const o of VAN_OBSTACLES){s.z=o.z-20;s.x=vanRoadCenter(o.z)+o.x;s.lane=0;tickVan(s,.05);assert.equal(s.lives,3);}
 s.z=0;s.speed=0;for(let i=0;i<1000;i++)tickVan(s,.05,{down:true});assert.equal(s.snack,0);
 s.z=VAN_OBSTACLES.find(o=>o.type==='gap').z;tickVan(s,.05);assert.equal(s.lives,2);
});

test('holding Space only flies over gaps and lands after the rear clears each one',()=>{
 for(const gap of VAN_OBSTACLES.filter(o=>o.type==='gap')){
  const s=readyVan();s.z=gap.z-190;s.speed=0;
  tickVan(s,.05,{fly:true,down:true});assert.equal(s.fly,0);
  s.z=gap.z-175;tickVan(s,.05,{fly:true,down:true});assert.equal(s.fly,1);
  s.z=gap.z+gap.length+40;tickVan(s,.05,{fly:true,down:true});assert.equal(s.fly,1);
  s.z=gap.z+gap.length+61;tickVan(s,.05,{fly:true,down:true});assert.equal(s.fly,0);
  s.z=gap.z+gap.length+100;tickVan(s,.05,{fly:true,down:true});assert.equal(s.fly,0);
 }
 const s=readyVan();const barrier=VAN_OBSTACLES.find(o=>o.type==='jump');s.z=barrier.z;
 tickVan(s,.05,{fly:true});assert.equal(s.fly,0);assert.equal(s.lives,2);
});
test('Snack Attack lasts fifteen seconds of gameplay, not fifty',()=>{
 const s=readyVan();s.snack=15;
 for(let i=0;i<290;i++)tickVan(s,.05,{down:true});
 assert.equal(s.snack>.49&&s.snack<.51,true);
 for(let i=0;i<11;i++)tickVan(s,.05,{down:true});assert.equal(s.snack,0);
});
