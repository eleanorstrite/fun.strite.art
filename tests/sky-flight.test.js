import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FLIGHT_BACKGROUNDS, FLIGHT_LEVELS, FLIGHT_DEFAULTS, validateFlightSettings } from '../src/flight-settings.js';
import { drawFlight, createFlightState, flapFlight, tickFlight, createSkyFlight, projectFlightGate } from '../src/sky-flight.js';
import { createSystem, freshSave, validateSave, UPGRADES } from '../src/system.js';
test('five difficulties get faster and tighter with exact rewards',()=>{
  const levels=Object.values(FLIGHT_LEVELS);
  assert.deepEqual(Object.keys(FLIGHT_LEVELS),['sloth','easy','medium','hard','expert']);
  assert.deepEqual(levels.map(l=>l.speed),[105,150,205,275,340]);
  assert.deepEqual(levels.map(l=>l.gap),[260,215,175,135,110]);assert.deepEqual(levels.map(l=>l.reward),[1,2,3,5,10]);
  for(let i=1;i<levels.length;i++){assert.equal(levels[i].speed>levels[i-1].speed,true);assert.equal(levels[i].gap<levels[i-1].gap,true);}
});
test('passing a pipe pair scores exactly once at the selected rate',()=>{
  for(const difficulty of Object.keys(FLIGHT_LEVELS)){
    const s=createFlightState({...FLIGHT_DEFAULTS,difficulty},()=>.5);s.status='playing';s.y=340;s.pipes=[{x:50,width:70,center:340,scored:false}];let events=0;
    tickFlight(s,.01,()=>events++);assert.equal(s.passed,1);assert.equal(s.earned,FLIGHT_LEVELS[difficulty].reward);tickFlight(s,.01,()=>events++);assert.equal(s.passed,1);assert.equal(events,1);
  }
});
test('flapping lifts the flyer and pipes, floor, and ceiling end a run',()=>{
  const s=createFlightState();s.status='playing';flapFlight(s);assert.equal(s.velocity<0,true);tickFlight(s,.03);assert.equal(s.y<330,true);
  for(const y of [1,679,100]){const state=createFlightState();state.status='playing';state.y=y;state.pipes=[{x:145,width:70,center:340,scored:false}];tickFlight(state,.01);assert.equal(state.status,'lost');assert.equal(state.earned,0);}
});
test('flyer and pipe customization validate and persist with game saves',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},system=createSystem(storage);
  for(const animal of ['capybara','cat','dog','hotdog','burger','pizza','taco','duck']){
  const flight={view:'side',background:'classic',animal,color:'#34bf96',pipe:'coral',pipeColor:'#7744cc',difficulty:'expert'};
  system.setCharacter({...system.snapshot().character,flight});assert.deepEqual(createSystem(storage).snapshot().character.flight,flight);
  const restored=createSystem({getItem:()=>null,setItem(){}});restored.importSave(system.exportSave());assert.deepEqual(restored.snapshot().character.flight,flight);
  }
  const sloth=validateFlightSettings({...FLIGHT_DEFAULTS,difficulty:'sloth'});
  system.setCharacter({...system.snapshot().character,flight:sloth});
  assert.equal(createSystem(storage).snapshot().character.flight.difficulty,'sloth');
  for(const invalid of [{animal:'unknown'},{color:'red'},{pipe:'unknown'},{difficulty:'impossible'},null])assert.throws(()=>validateFlightSettings(invalid));
});
test('long flights pay all coins into the shared wallet without a thousand-coin cutoff',()=>{
  const storage={getItem:()=>null,setItem(){}},system=createSystem(storage),session=system.beginSession('sky-flight');
  session.finish(1230);assert.equal(system.snapshot().coins,1230);assert.equal(session.finish(1230),false);assert.equal(system.snapshot().coins,1230);
});
test('flight engine pauses, resumes, closes once, and supports each animal',()=>{
  const original={requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,document:globalThis.document};let frame;
  globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};globalThis.document={hidden:false};
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)}),canvas={width:540,height:720,getContext:()=>ctx,addEventListener(){},focus(){}};
  try{for(const animal of ['dragon','hummingbird','eagle','capybara','cat','dog','hotdog','burger','pizza','taco','duck']){let updates=0,finishes=0;const engine=createSkyFlight({canvas,character:{flight:{...FLIGHT_DEFAULTS,animal}},onHud(){updates++;},onFinish(){finishes++;}});engine.start();frame(100);const count=updates;assert.equal(engine.setView('firstperson'),true);assert.equal(engine.setView('bad'),false);assert.equal(updates,count);assert.equal(finishes,0);engine.pause(true);frame(200);assert.equal(updates,count);assert.equal(engine.setView('side'),true);engine.pause(false);frame(300);assert.equal(updates>count,true);engine.destroy();engine.destroy();assert.equal(finishes,1);}}finally{Object.assign(globalThis,original);}
});

test('crash animation delays results, freezes while paused or hidden, and settles once',()=>{
 const original={requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,document:globalThis.document};
 let frame,finished=0,now=100,hud='';
 globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};globalThis.document={hidden:false};
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const canvas={width:540,height:720,getContext:()=>ctx,addEventListener(){},focus(){}};
 let engine;
 const frames=n=>{for(let i=0;i<n;i++){frame(now);now+=50;}};
 try{
  engine=createSkyFlight({canvas,character:{flight:{...FLIGHT_DEFAULTS,animal:'capybara'}},onHud:value=>hud=value.text,onFinish(){finished++;}});
  engine.start();for(let i=0;i<200&&!hud.includes('Bonk');i++)frames(1);
  assert.equal(hud.includes('Bonk'),true);assert.equal(finished,0);
  engine.input();engine.pause(true);frames(60);assert.equal(finished,0);
  engine.pause(false);globalThis.document.hidden=true;frames(60);assert.equal(finished,0);
  globalThis.document.hidden=false;frames(20);assert.equal(finished,0);frames(25);assert.equal(finished,1);
  engine.destroy();assert.equal(finished,1);
  engine=createSkyFlight({canvas,character:{flight:FLIGHT_DEFAULTS},onHud:value=>hud=value.text,onFinish(){finished++;}});
  engine.start();for(let i=0;i<200&&!hud.includes('Bonk');i++)frames(1);
  engine.destroy();engine.destroy();assert.equal(finished,2);
 }finally{engine?.destroy();Object.assign(globalThis,original);}
});

test('flight backgrounds require separate two-hundred-coin purchases and survive reload and export',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},system=createSystem(storage);
 const old=freshSave();delete old.character.flight.background;
 assert.equal(validateSave(old).character.flight.background,'classic');
 assert.throws(()=>validateFlightSettings({background:'unknown'}));
 system.beginSession('test').finish(1000);system.buy('aurora-background');
 for(const [background,scene] of Object.entries(FLIGHT_BACKGROUNDS)){
  if(!scene.upgrade)continue;
  const before=system.snapshot();
  assert.throws(()=>system.setCharacter({...before.character,flight:{...before.character.flight,background}}));
  assert.deepEqual(system.snapshot(),before);
  const item=UPGRADES.find(item=>item.id===scene.upgrade);assert.equal(item.cost,200);
  assert.equal(item.category.includes('FLAPPY BIRD'),true);assert.equal(item.description.includes('not the home screen'),true);
  system.buy(scene.upgrade);assert.equal(system.snapshot().coins,before.coins-200);
  system.setCharacter({...before.character,flight:{...before.character.flight,background}});
  assert.equal(createSystem(storage).snapshot().character.flight.background,background);
  const copy=createSystem({getItem:()=>null,setItem(){}});copy.importSave(system.exportSave());
  assert.equal(copy.snapshot().character.flight.background,background);assert.throws(()=>copy.buy(scene.upgrade));
 }
});
test('each flight scenery renders distinctly while preserving physics and rewards',()=>{
 const signatures=new Set();
 for(const background of Object.keys(FLIGHT_BACKGROUNDS)){
  const calls=[];
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop:(...args)=>calls.push(args)})},{get:(o,k)=>o[k]||((...args)=>calls.push([k,...args])),set:(o,k,v)=>(o[k]=v,true)});
  const s=createFlightState({...FLIGHT_DEFAULTS,background,pipe:background==='underwater'?'coral':'classic'},()=>.5);
  const before=JSON.stringify(s);drawFlight(ctx,s,540,720);assert.equal(JSON.stringify(s),before);
  signatures.add(JSON.stringify(calls));
 }
 assert.equal(signatures.size,Object.keys(FLIGHT_BACKGROUNDS).length);
});

test('most flight scenes are free and only two appear in the shop',()=>{
 const system=createSystem({getItem:()=>null,setItem(){}});
 const free=Object.entries(FLIGHT_BACKGROUNDS).filter(([,scene])=>!scene.upgrade);
 assert.equal(free.length,7);
 assert.equal(Object.values(FLIGHT_BACKGROUNDS).filter(scene=>scene.upgrade).length,2);
 for(const [background] of free){
  system.setCharacter({...system.snapshot().character,flight:{...system.snapshot().character.flight,background}});
  assert.equal(system.snapshot().character.flight.background,background);
 }
 assert.equal(system.snapshot().coins,0);assert.equal(system.snapshot().upgrades.length,0);
 assert.equal(UPGRADES.some(item=>item.id==='flight-sunset'),false);
 assert.throws(()=>system.buy('flight-sunset'));
});
test('existing Sunset Peaks owners retain their scene and receive one refund',()=>{
 const old=freshSave();old.coins=35;old.upgrades=['flight-sunset','flight-city'];
 old.character.flight.background='sunset';
 const migrated=validateSave(old);
 assert.equal(migrated.coins,235);assert.equal(migrated.character.flight.background,'sunset');
 assert.deepEqual(migrated.upgrades,['flight-city']);
 assert.deepEqual(validateSave(migrated),migrated);
});

test('first-person view persists, migrates old saves, and rejects invalid cameras',()=>{
  const old=freshSave();delete old.character.flight.view;assert.equal(validateSave(old).character.flight.view,'side');
  const data=new Map(),storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)},system=createSystem(storage);
  system.setCharacter({...system.snapshot().character,flight:{...system.snapshot().character.flight,view:'firstperson'}});
  const restored=createSystem(storage);assert.equal(restored.snapshot().character.flight.view,'firstperson');
  const copy=createSystem({getItem:()=>null,setItem(){}});copy.importSave(restored.exportSave());assert.equal(copy.snapshot().character.flight.view,'firstperson');
  assert.throws(()=>validateFlightSettings({...FLIGHT_DEFAULTS,view:'invalid'}));
});
test('both camera modes have identical flight physics, collisions, and rewards',()=>{
  for(const difficulty of Object.keys(FLIGHT_LEVELS)){
    const side=createFlightState({...FLIGHT_DEFAULTS,difficulty,view:'side'},()=>.5);
    const first=createFlightState({...FLIGHT_DEFAULTS,difficulty,view:'firstperson'},()=>.5);
    for(const state of [side,first]){state.status='playing';state.y=340;state.pipes=[{x:50,width:70,center:340,scored:false},{x:2000,width:70,center:340,scored:false},{x:2300,width:70,center:340,scored:false}];}
    for(let i=0;i<120;i++){
      if(i%20===0){flapFlight(side);flapFlight(first);}
      tickFlight(side,.02);tickFlight(first,.02);
      for(const key of ['y','velocity','passed','earned','status','distance'])assert.equal(side[key],first[key]);
    }
    assert.equal(first.earned,FLIGHT_LEVELS[difficulty].reward);
  }
});
test('first-person projection follows the gap, grows toward the camera, and skips passed poles',()=>{
  const s=createFlightState({...FLIGHT_DEFAULTS,view:'firstperson'}),p={x:500,width:70,center:330};
  const far=projectFlightGate(s,p);p.x=157;const near=projectFlightGate(s,p);
  assert.equal(near.front.scale>far.front.scale,true);
  assert.equal(near.front.top,360-s.level.gap/2);assert.equal(near.front.bottom,360+s.level.gap/2);
  s.y+=50;assert.equal(projectFlightGate(s,p).front.top,near.front.top-50);
  p.x=0;assert.equal(projectFlightGate(s,p).behind,true);
});
test('first-person scenery, poles and animal perspectives render without changing gameplay state',()=>{
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  for(const animal of ['cat','dog','dragon','eagle','duck','hummingbird','capybara','hotdog','pizza','burger','taco']){
    for(const pipe of ['classic','stone','vines','crystal','coral']){
      const state=createFlightState({...FLIGHT_DEFAULTS,animal,pipe,view:'firstperson'},()=>.5);
      for(const background of Object.keys(FLIGHT_BACKGROUNDS)){
        state.settings.background=background;const before=JSON.stringify(state);
        drawFlight(ctx,state,540,720);drawFlight(ctx,state,270,360,true);
        assert.equal(JSON.stringify(state),before);
      }
      state.status='lost';drawFlight(ctx,state,540,720);
    }
  }
});
