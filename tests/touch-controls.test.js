import test from 'node:test';
import assert from 'node:assert/strict';
import {bindTagSwipes,bindMazeSwipes} from '../src/touch-controls.js';
import {createTagState,defaultTagSettings,tickTag} from '../src/tag.js';
function canvasMock(){const handlers={};return {handlers,canvas:{addEventListener:(k,v)=>handlers[k]=v,focus(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,width:400})},send(type,x,y,id=1){handlers[type]({clientX:x,clientY:y,pointerId:id,button:0,preventDefault(){}});}};}
test('Tag diagonal swipes run and jump, steer in midair, then release without stuck movement',()=>{
 const t=canvasMock(),g=bindTagSwipes(t.canvas,{enabled:()=>true,local:()=>false});
 t.send('pointerdown',100,200);t.send('pointermove',140,160);assert.deepEqual(g.input(0),{left:false,right:true,jump:true});
 t.send('pointermove',100,160);assert.equal(g.input(0).left,true);
 t.send('pointerup',100,160);g.advance(.2);assert.deepEqual(g.input(0),{left:false,right:false,jump:false});
 t.send('pointerdown',100,200);t.send('pointerup',150,150);assert.equal(g.input(0).right,true);assert.equal(g.input(0).jump,true);g.advance(.2);assert.equal(g.input(0).right,false);
});
test('Tag assigns each screen half independently and clears cancelled touches',()=>{
 const t=canvasMock(),g=bindTagSwipes(t.canvas,{enabled:()=>true,local:()=>true});
 t.send('pointerdown',50,150,1);t.send('pointerdown',300,150,2);t.send('pointermove',90,150,1);t.send('pointermove',260,110,2);
 assert.equal(g.input(0).right,true);assert.equal(g.input(1).left,true);assert.equal(g.input(1).jump,true);
 t.send('pointercancel',90,150,1);assert.equal(g.input(0).right,false);assert.equal(g.input(1).left,true);g.clear();assert.equal(g.input(1).jump,false);
});
test('maze swipes queue a single clear direction, ignore jitter, and accept quick releases',()=>{
 const t=canvasMock(),turns=[];let enabled=true;const g=bindMazeSwipes(t.canvas,{enabled:()=>enabled,turn:d=>turns.push(d)});
 t.send('pointerdown',100,100);t.send('pointermove',103,106);assert.equal(turns.length,0);
 t.send('pointermove',140,102);t.send('pointermove',140,180);t.send('pointerup',140,180);assert.deepEqual(turns,['right']);
 t.send('pointerdown',100,100);t.send('pointerup',100,60);assert.deepEqual(turns,['right','up']);
 t.send('pointerdown',100,100);t.send('pointercancel',100,100);t.send('pointermove',50,100);assert.equal(turns.length,2);
 t.send('pointerdown',100,100);g.clear();t.send('pointerup',40,100);assert.equal(turns.length,2);
 enabled=false;t.send('pointerdown',100,100);t.send('pointerup',40,100);assert.equal(turns.length,2);
});
test('touch assistance slows airborne motion without losing jump reach or altering round time',()=>{
 const run=assist=>{const s=createTagState({...defaultTagSettings(),mode:'local'});s.status='playing';s.players[0].x=30;let apex=540,atPoint;
 for(let i=0;i<200;i++){tickTag(s,.01,[{jump:i===0,touchAssist:assist},{}]);apex=Math.min(apex,s.players[0].y);if(i===19)atPoint=s.players[0].y;}
 return {apex,atPoint,time:s.time};};
 const keyboard=run(false),touch=run(true);assert.ok(touch.atPoint>keyboard.atPoint);assert.ok(Math.abs(touch.apex-keyboard.apex)<5);assert.equal(touch.time,keyboard.time);
});
