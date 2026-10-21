import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FLIGHT_LEVELS, FLIGHT_DEFAULTS, validateFlightSettings } from '../src/flight-settings.js';
import { createFlightState, flapFlight, tickFlight, createSkyFlight } from '../src/sky-flight.js';
import { createSystem } from '../src/system.js';
test('four difficulties get faster and tighter with exact rewards',()=>{
  const levels=Object.values(FLIGHT_LEVELS);assert.deepEqual(levels.map(l=>l.reward),[1,3,5,10]);
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
  const flight={animal:'hummingbird',color:'#34bf96',pipe:'crystal',pipeColor:'#7744cc',difficulty:'expert'};
  system.setCharacter({...system.snapshot().character,flight});assert.deepEqual(createSystem(storage).snapshot().character.flight,flight);
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
  try{for(const animal of ['dragon','hummingbird','eagle']){let updates=0,finishes=0;const engine=createSkyFlight({canvas,character:{flight:{...FLIGHT_DEFAULTS,animal}},onHud(){updates++;},onFinish(){finishes++;}});engine.start();frame(100);const count=updates;engine.pause(true);frame(200);assert.equal(updates,count);engine.pause(false);frame(300);assert.equal(updates>count,true);engine.destroy();engine.destroy();assert.equal(finishes,1);}}finally{Object.assign(globalThis,original);}
});
