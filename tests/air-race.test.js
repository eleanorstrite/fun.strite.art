import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AIR_COURSE, createAirState, tickAirRace, createAirRace, drawAirRace } from '../src/air-race.js';
import { createSystem, freshSave, validateSave } from '../src/system.js';

function flyCourse(boost=false,dt=.02){
  const s=createAirState();s.status='playing';
  for(let frames=0;frames<10000&&s.status==='playing';frames++){
    const gate=AIR_COURSE[s.passed];
    tickAirRace(s,dt,{target:{x:gate.x,y:gate.y},boost});
  }
  return s;
}
test('all twelve hoops are reachable, restore energy, and boost improves the finish time',()=>{
  const cruise=flyCourse(),fast=flyCourse(true),coarse=flyCourse(true,.1);
  for(const state of [cruise,fast,coarse]){assert.equal(state.status,'won');assert.equal(state.passed,12);assert.equal(state.earned,12);assert.equal(state.energy,100);}
  assert.equal(fast.time<cruise.time,true);
  assert.equal(Math.abs(fast.time-coarse.time)<1e-7,true);
  assert.equal(Math.round(fast.time*1000),20417);
});
test('a missed hoop immediately removes energy and ends with a fall without awarding that hoop',()=>{
  const s=createAirState();s.status='playing';s.x=1;s.distance=499;
  const events=[];tickAirRace(s,.02,{},event=>events.push(event));
  assert.equal(s.status,'falling');assert.equal(s.energy,0);assert.equal(s.passed,0);assert.equal(s.earned,0);
  assert.deepEqual(events,['crash']);const time=s.time,distance=s.distance;
  for(let i=0;i<20;i++)tickAirRace(s,.1);
  assert.equal(s.status,'lost');assert.equal(s.time,time);assert.equal(s.distance,distance);
});
test('hoops score once, controls stay in bounds, and only a finished course is a win',()=>{
  const s=createAirState();s.status='playing';s.distance=499;s.energy=30;
  tickAirRace(s,.02);assert.equal(s.passed,1);assert.equal(s.earned,1);assert.equal(s.energy>99,true);
  tickAirRace(s,.02);assert.equal(s.passed,1);
  for(let i=0;i<10;i++)tickAirRace(s,.1,{x:100,y:-100});
  assert.equal(s.x<=1.45,true);assert.equal(s.y>=-.95,true);assert.equal(s.status,'playing');
  const ready=createAirState();tickAirRace(ready,.1,{boost:true});assert.equal(ready.time,0);
});
test('race records keep the fastest finish and survive failed attempts, reloads and exports',()=>{
  const data=new Map(),storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)},system=createSystem(storage);
  const run=system.beginSession('hoop-flight');run.finish(12,32000);assert.equal(run.finish(12,20000),false);
  system.beginSession('hoop-flight').finish(12,35000);
  system.beginSession('hoop-flight').finish(3);
  assert.equal(system.snapshot().stats['hoop-flight'].bestTimeMs,32000);
  system.beginSession('hoop-flight').finish(12,24000);
  const restored=createSystem(storage);assert.equal(restored.snapshot().stats['hoop-flight'].bestTimeMs,24000);
  const copy=createSystem({getItem:()=>null,setItem(){}});copy.importSave(restored.exportSave());
  assert.equal(copy.snapshot().stats['hoop-flight'].bestTimeMs,24000);assert.equal(copy.snapshot().coins,39);
  const previous=copy.snapshot();assert.throws(()=>copy.importSave(JSON.stringify({...previous,stats:{'hoop-flight':{plays:1,best:12,bestTimeMs:-1}}})));assert.deepEqual(copy.snapshot(),previous);
  const bad=system.beginSession('hoop-flight');assert.throws(()=>bad.finish(12,0));assert.equal(bad.finish(12,26000),true);
});
test('airplane customization persists and old saves receive a default airplane',()=>{
  const old=freshSave();delete old.character.plane;assert.equal(validateSave(old).character.plane.style,'sport');
  const system=createSystem({getItem:()=>null,setItem(){}});system.setCharacter({...system.snapshot().character,plane:{style:'biplane',color:'#55aabb'}});
  const copy=createSystem({getItem:()=>null,setItem(){}});copy.importSave(system.exportSave());assert.deepEqual(copy.snapshot().character.plane,{color:'#55aabb',style:'biplane'});
  assert.throws(()=>system.setCharacter({...system.snapshot().character,plane:{style:'unknown',color:'#55aabb'}}));
});
test('air race pauses time and falling, handles drag and boost, and closes only once',()=>{
  const original={requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,document:globalThis.document,window:globalThis.window};
  let frame,hud,finishes=0;const handlers={};
  globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
  globalThis.document={hidden:false};globalThis.window={addEventListener(){}};
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const canvas={width:900,height:650,getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:900,height:650}),addEventListener:(name,fn)=>handlers[name]=fn,focus(){},setPointerCapture(){}};
  let engine;
  try{
    engine=createAirRace({canvas,character:{plane:{color:'#55aabb',style:'swept'}},onHud:value=>hud=value.text,onFinish:(coins,result)=>{assert.equal(result.timeMs,null);finishes++;}});
    engine.start();frame(100);frame(200);const initial=hud;
    engine.pause(true);frame(300);assert.equal(hud,initial);
    engine.pause(false);globalThis.document.hidden=true;frame(400);assert.equal(hud,initial);
    globalThis.document.hidden=false;frame(500);frame(600);assert.equal(hud!==initial,true);
    handlers.pointerdown({pointerId:1,clientX:760,clientY:315,preventDefault(){}});
    engine.setBoost(true);
    for(let now=700;now<5000&&finishes===0;now+=100)frame(now);
    assert.equal(finishes,1);engine.destroy();engine.destroy();assert.equal(finishes,1);
  }finally{engine?.destroy();Object.assign(globalThis,original);}
});
test('air race scenery and airplane variants render without changing the simulation',()=>{
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const s=createAirState(),before=JSON.stringify(s);
  for(const style of ['sport','swept','biplane'])drawAirRace(ctx,s,{style,color:'#5599aa'},900,650,24000);
  assert.equal(JSON.stringify(s),before);
});
