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
test('jump clears barriers, fly crosses gaps, and dodge avoids crates with cooldowns',()=>{
 for(const [type,action] of [['jump','jump'],['gap','fly'],['crate','dodge']]){
  const obstacle=VAN_OBSTACLES.find(o=>o.type===type),s=readyVan();s.z=obstacle.z-42;s.x=vanRoadCenter(obstacle.z)+obstacle.x;s.speed=200;
  assert.equal(vanAction(s,action),true);assert.equal(vanAction(s,action),false);
  if(action==='jump')s.jump=.65;
  tickVan(s,.05,{up:true});assert.equal(s.lives,3);
 }
 const s=readyVan();assert.equal(vanAction(s,'fly'),true);for(let i=0;i<141;i++)tickVan(s,.05);assert.equal(vanAction(s,'fly'),true);
});
test('collisions return to checkpoints, rewards cannot be farmed, and three bumps end a run',()=>{
 const s=readyVan();s.z=999;s.x=vanRoadCenter(1000);s.speed=200;tickVan(s,.05,{up:true});assert.equal(s.earned,5);assert.equal(s.checkpoint,1);
 for(let n=0;n<3;n++){s.z=1090;s.x=vanRoadCenter(1100);s.invincible=0;tickVan(s,.05);assert.equal(s.z,1000);assert.equal(s.earned,5);}
 assert.equal(s.status,'lost');assert.equal(s.lives,0);assert.equal(vanAction(s,'fly'),false);
});
test('the entire course can be completed using steering, jump and fly',()=>{
 const s=readyVan();let steps=0;
 while(s.status==='playing'&&steps++<2000){
  const o=VAN_OBSTACLES.find(o=>o.z>s.z-25),distance=o?o.z-s.z:999;
  if(o?.type==='gap'&&distance<180)vanAction(s,'fly');
  if(o?.type==='jump'&&distance<105)vanAction(s,'jump');
  const target=vanRoadCenter(s.z+50)+(o&&['crate','cones'].includes(o.type)&&distance<240?(o.x>0?-75:75):0);
  tickVan(s,.05,{up:true,left:s.x>target+5,right:s.x<target-5});
 }
 assert.equal(s.status,'won');assert.equal(s.lives,3);assert.equal(s.z,VAN_FINISH);assert.equal(s.earned,45);
 tickVan(s,.05,{up:true});assert.equal(s.earned,45);
});
test('van intro and course render without changing simulation state',()=>{
 const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 for(const status of ['ready','intro','playing','won','lost']){
  const s={...createVanState(),status,intro:3,z:2200,fly:1};const before=JSON.stringify(s);drawVanScene(ctx,s,900,650);assert.equal(JSON.stringify(s),before);
 }
});
test('van engine pauses, freezes hidden tabs, restarts, and settles only once',()=>{
 const original={document:globalThis.document,window:globalThis.window,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
 class Element{children=[];listeners={};append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}addEventListener(name,fn){this.listeners[name]=fn;}}
 let frame,finished=0,hud='';const handlers={},controls=new Element();
 const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const canvas={width:900,height:650,getContext:()=>ctx,focus(){},addEventListener:(name,fn)=>handlers[name]=fn};
 globalThis.document={hidden:false,createElement:()=>new Element(),addEventListener(){}};globalThis.window={addEventListener(){}};
 globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
 try{
  const engine=createVanAdventure({canvas,controls,onHud:v=>hud=v.text,onFinish:()=>finished++});engine.start();controls.children[1].children[7].onclick();
  handlers.keydown({key:'ArrowUp',preventDefault(){}});frame(100);frame(150);
  engine.pause(true);const paused=hud;frame(200);frame(250);assert.equal(hud,paused);
  engine.pause(false);globalThis.document.hidden=true;frame(300);assert.equal(hud,paused);
  globalThis.document.hidden=false;engine.start();assert.equal(hud.includes('All aboard'),true);
  engine.destroy();engine.destroy();assert.equal(finished,1);assert.equal(controls.children.length,0);
 }finally{Object.assign(globalThis,original);}
});
