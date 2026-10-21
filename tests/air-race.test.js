import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AIR_COURSE, createAirState, tickAirRace, createAirRace, drawAirRace, drawAirEnding, createAirCourse, insideAirHoop, drawAirScenery, drawAirplane } from '../src/air-race.js';
import { createSystem, freshSave, validateSave, AIR_DIFFICULTIES, airRecordId, AIR_BACKGROUNDS, PLANE_STYLES, PLANE_UNLOCKS, UPGRADES } from '../src/system.js';

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
  assert.equal(Math.round(fast.time*1000),14412);
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
  const system=createSystem({getItem:()=>null,setItem(){}});system.setCharacter({...system.snapshot().character,plane:{style:'jet',color:'#55aabb'}});
  const copy=createSystem({getItem:()=>null,setItem(){}});copy.importSave(system.exportSave());assert.deepEqual(copy.snapshot().character.plane,{color:'#55aabb',style:'jet',difficulty:'sloth',background:'valley'});
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
    for(let now=700;now<11000&&finishes===0;now+=100)frame(now);
    assert.equal(finishes,1);engine.destroy();engine.destroy();assert.equal(finishes,1);
  }finally{engine?.destroy();Object.assign(globalThis,original);}
});
test('air race scenery and airplane variants render without changing the simulation',()=>{
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const s=createAirState(),before=JSON.stringify(s);
  for(const style of ['sport','swept','biplane','jet'])drawAirRace(ctx,s,{style,color:'#5599aa'},900,650,24000);
  assert.equal(JSON.stringify(s),before);
});

test('boost restores canvas focus and preserves both keyboard and drag steering',()=>{
  const original={requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,document:globalThis.document,window:globalThis.window};
  let frame,position,focused=false,boosting=false;const handlers={},windowHandlers={};
  globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
  globalThis.document={hidden:false};globalThis.window={addEventListener:(name,fn)=>windowHandlers[name]=fn};
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),translate(x,y){if(x>100)position={x,y};}},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const canvas={width:900,height:650,getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:900,height:650}),addEventListener:(name,fn)=>handlers[name]=fn,focus(){focused=true;},setPointerCapture(){}};
  let engine;
  try{
    engine=createAirRace({canvas,character:{plane:{style:'jet',color:'#55aabb'}},onHud:value=>boosting=value.raceBoost,onFinish(){}});
    engine.start();frame(100);focused=false;
    handlers.blur();engine.setBoost(true);assert.equal(focused,true);
    handlers.keydown({key:'ArrowRight',preventDefault(){}});frame(200);
    assert.equal(boosting,true);assert.equal(position.x>450,true);
    windowHandlers.keyup({key:'ArrowRight'});
    handlers.pointerdown({pointerId:1,clientX:650,clientY:220,preventDefault(){}});
    const previous={...position};
    handlers.keydown({key:' ',preventDefault(){}});frame(300);
    assert.equal(boosting,true);assert.equal(position.x>previous.x,true);assert.equal(position.y<previous.y,true);
    engine.setBoost(false);windowHandlers.keyup({key:' '});frame(400);assert.equal(boosting,false);
    engine.pause(true);frame(500);assert.equal(boosting,false);
  }finally{engine?.destroy();Object.assign(globalThis,original);}
});

test('ending clips render both outcomes and reduced motion without changing appearance',()=>{
  const captions=[];
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),fillText:text=>captions.push(text)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const look={style:'jet',color:'#55aabb'},before=JSON.stringify(look);
  for(const won of [true,false])for(const reduced of [true,false])for(const t of [0,1.5,2.3,3.5,6])drawAirEnding(ctx,won,t,look,900,650,reduced);
  assert.equal(captions.includes('You win!'),true);assert.equal(captions.includes('You lose.'),true);
  assert.equal(JSON.stringify(look),before);
});
test('loss clip delays settlement and freezes while paused or hidden',()=>{
  const original={requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,document:globalThis.document,window:globalThis.window};
  let frame,finishes=0;const handlers={},captions=[];
  globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
  globalThis.document={hidden:false};globalThis.window={addEventListener(){}};
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),fillText:text=>captions.push(text)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const canvas={width:900,height:650,getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:900,height:650}),addEventListener:(name,fn)=>handlers[name]=fn,focus(){},setPointerCapture(){}};
  let engine,now=100;
  const advance=count=>{for(let i=0;i<count;i++){frame(now);now+=100;}};
  try{
    engine=createAirRace({canvas,character:{plane:{style:'jet',color:'#55aabb'}},onHud(){},onFinish:()=>finishes++});
    engine.start();handlers.keydown({key:'ArrowRight',preventDefault(){}});
    advance(30);assert.equal(finishes,0);
    engine.pause(true);advance(100);assert.equal(finishes,0);
    engine.pause(false);globalThis.document.hidden=true;advance(100);assert.equal(finishes,0);
    globalThis.document.hidden=false;advance(65);assert.equal(finishes,1);
    assert.equal(captions.includes('You lose.'),true);
    engine.destroy();assert.equal(finishes,1);
  }finally{engine?.destroy();Object.assign(globalThis,original);}
});

test('all five difficulties award exact per-hoop coins and randomized courses are flyable',()=>{
  const expected={sloth:1,easy:2,medium:3,hard:5,expert:20};
  let previousSpeed=0;
  for(const [difficulty,coins] of Object.entries(expected)){
    const config=AIR_DIFFICULTIES[difficulty];
    assert.equal(config.coins,coins);assert.equal(config.speed>previousSpeed,true);previousSpeed=config.speed;
    for(let seed=1;seed<=30;seed++){
      let value=seed;const random=()=>((value=(value*1664525+1013904223)>>>0)/4294967296);
      for(const boost of [false,true]){
        const s=createAirState(difficulty);s.course=createAirCourse(difficulty,random);s.status='playing';
        for(let i=0;i<4000&&s.status==='playing';i++)tickAirRace(s,.02,{target:s.course[s.passed],boost});
        assert.equal(s.status,'won');assert.equal(s.earned,12*coins);
      }
    }
  }
});
test('difficulty settings migrate, persist and keep time records and wallet rewards separate',()=>{
  const system=createSystem({getItem:()=>null,setItem(){}});
  assert.equal(system.snapshot().character.plane.difficulty,'sloth');
  system.setCharacter({...system.snapshot().character,plane:{...system.snapshot().character.plane,difficulty:'expert'}});
  const copy=createSystem({getItem:()=>null,setItem(){}});copy.importSave(system.exportSave());
  assert.equal(copy.snapshot().character.plane.difficulty,'expert');
  assert.throws(()=>system.setCharacter({...system.snapshot().character,plane:{...system.snapshot().character.plane,difficulty:'impossible'}}));
  system.beginSession(airRecordId('sloth')).finish(12,22000);
  system.beginSession(airRecordId('expert')).finish(240,11000);
  assert.equal(system.snapshot().coins,252);
  assert.equal(system.snapshot().stats[airRecordId('sloth')].bestTimeMs,22000);
  assert.equal(system.snapshot().stats[airRecordId('expert')].bestTimeMs,11000);
});
test('tilted hoop collision follows the visible elliptical opening and misses earn nothing',()=>{
  const s=createAirState('expert'),gate={x:0,y:0,angle:Math.PI/2,squash:.8};
  s.x=.28;s.y=0;assert.equal(insideAirHoop(s,gate),true);
  s.x=0;s.y=.34;assert.equal(insideAirHoop(s,gate),false);
  s.status='playing';s.x=1;s.distance=499;tickAirRace(s,.02);
  assert.equal(s.status,'falling');assert.equal(s.earned,0);
  assert.equal(JSON.stringify(createAirCourse('sloth',()=>0)),JSON.stringify(createAirCourse('sloth',()=>1)));
  assert.equal(JSON.stringify(createAirCourse('expert',()=>0))!==JSON.stringify(createAirCourse('expert',()=>1)),true);
});

test('forgiving hoop edges award close passes once but still reject clear misses in every mode',()=>{
  for(const difficulty of Object.keys(AIR_DIFFICULTIES)){
    const config=AIR_DIFFICULTIES[difficulty];
    for(const angle of [0,.7,Math.PI/2]){
      const gate={x:0,y:0,z:500,angle,squash:.8};
      const close=createAirState(difficulty);close.status='playing';close.course[0]=gate;
      // Just beyond the drawn edge: the rim clips the plane, but the pass counts.
      const offset=config.radius*.8+.045;
      close.x=Math.cos(angle)*offset;close.y=Math.sin(angle)*offset;close.distance=499;close.energy=20;
      assert.equal(insideAirHoop(close,gate),true);
      tickAirRace(close,.02);
      assert.equal(close.passed,1);assert.equal(close.earned,config.coins);assert.equal(close.energy>99,true);
      tickAirRace(close,.02);assert.equal(close.earned,config.coins);
      const miss=createAirState(difficulty);miss.status='playing';miss.course[0]=gate;
      const wide=config.radius*.8+.13;
      miss.x=Math.cos(angle)*wide;miss.y=Math.sin(angle)*wide;miss.distance=499;
      assert.equal(insideAirHoop(miss,gate),false);
      tickAirRace(miss,.02);assert.equal(miss.status,'falling');assert.equal(miss.earned,0);
    }
  }
});

test('most Hoop Flight looks are free and paid cosmetics require a permanent purchase',()=>{
  assert.equal(Object.keys(PLANE_STYLES).length,8);assert.equal(Object.keys(PLANE_UNLOCKS).length,2);
  assert.equal(Object.values(AIR_BACKGROUNDS).filter(scene=>!scene.upgrade).length,6);
  const system=createSystem({getItem:()=>null,setItem(){}});
  const setPlane=patch=>system.setCharacter({...system.snapshot().character,plane:{...system.snapshot().character.plane,...patch}});
  for(const style of ['glider','seaplane'])setPlane({style});
  for(const background of ['sunset','ocean','desert','snow','meadow'])setPlane({background});
  assert.throws(()=>setPlane({style:'stealth'}));assert.throws(()=>setPlane({background:'aurora'}));
  assert.throws(()=>system.buy('air-city'));
  system.beginSession('hoop-flight').finish(1000);
  for(const id of ['air-stealth','air-rocket','air-aurora','air-city']){
    const item=UPGRADES.find(item=>item.id===id);
    assert.equal(item.cost,200);assert.equal(item.group,'appearance');
    system.buy(id);assert.throws(()=>system.buy(id));
  }
  setPlane({style:'rocket',background:'city'});
  assert.equal(system.snapshot().coins,200);
  const copy=createSystem({getItem:()=>null,setItem(){}});copy.importSave(system.exportSave());
  assert.equal(copy.snapshot().character.plane.background,'city');assert.equal(copy.snapshot().character.plane.style,'rocket');
  const old=freshSave();delete old.character.plane.background;assert.equal(validateSave(old).character.plane.background,'valley');
  assert.throws(()=>setPlane({background:'missing'}));
});
test('all airplane designs and scenic backgrounds draw distinctly without affecting gameplay',()=>{
  let marks=[];
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop:(...args)=>marks.push(['color',...args])})},{get:(o,k)=>o[k]||((...args)=>marks.push([k,...args])),set:(o,k,v)=>(o[k]=v,true)});
  const scenes=new Set(),planes=new Set(),state=createAirState(),before=JSON.stringify(state);
  for(const background of Object.keys(AIR_BACKGROUNDS)){
    marks=[];drawAirScenery(ctx,background,300);scenes.add(JSON.stringify(marks));
    drawAirRace(ctx,state,{style:'jet',color:'#5599aa',background},900,650);
    drawAirEnding(ctx,true,4,{color:'#5599aa',background},900,650);
  }
  for(const style of Object.keys(PLANE_STYLES)){
    marks=[];drawAirplane(ctx,450,315,90,{style,color:'#5599aa'});planes.add(JSON.stringify(marks));
  }
  assert.equal(scenes.size,8);assert.equal(planes.size,8);assert.equal(JSON.stringify(state),before);
});
