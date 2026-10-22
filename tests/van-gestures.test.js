import test from 'node:test';
import assert from 'node:assert/strict';
import {bindVanGestures} from '../src/van-adventure.js';
function setup(){
  const handlers={},actions=[],holds=[];let active=true;
  const gestures=bindVanGestures({addEventListener:(k,v)=>handlers[k]=v,focus(){},setPointerCapture(){}},{enabled:()=>active,action:v=>actions.push(v),hold:(k,v)=>holds.push(v)});
  const send=(type,x=100,y=100,id=1)=>handlers[type]({pointerId:id,clientX:x,clientY:y,button:0,preventDefault(){}});
  return {gestures,actions,holds,send,disable:()=>active=false};
}
test('Raven taps jump, swipes dodge once, and neither becomes flight',()=>{
  const t=setup();t.send('pointerdown');t.gestures.advance(.1);t.send('pointerup');
  t.send('pointerdown');t.send('pointermove',50);t.send('pointermove',0);t.gestures.advance(.5);t.send('pointerup',0);
  t.send('pointerdown');t.send('pointerup',160);
  assert.deepEqual(t.actions,['jump','left','right']);assert.ok(!t.holds.includes(true));
});
test('Raven holds fly without jumping and release stops flight',()=>{
  const t=setup();t.send('pointerdown');t.gestures.advance(.23);assert.equal(t.holds.at(-1),true);
  t.send('pointerup');assert.equal(t.holds.at(-1),false);assert.deepEqual(t.actions,[]);
});
test('Raven cancels gestures on interrupted touches, pause, or cleanup',()=>{
  for(const event of ['pointercancel','lostpointercapture']){
    const t=setup();t.send('pointerdown');t.gestures.advance(.23);t.send(event);t.send('pointerup');assert.equal(t.holds.at(-1),false);assert.deepEqual(t.actions,[]);
  }
  const t=setup();t.send('pointerdown');t.disable();t.gestures.advance(.3);t.send('pointerup');assert.deepEqual(t.actions,[]);assert.ok(!t.holds.includes(true));
  const u=setup();u.send('pointerdown');u.gestures.clear();u.gestures.advance(1);u.send('pointerup');assert.deepEqual(u.actions,[]);
});
test('Raven ignores second fingers and vertical drags',()=>{
  const t=setup();t.send('pointerdown');t.send('pointerdown',100,100,2);t.send('pointerup',100,100,2);assert.deepEqual(t.actions,[]);
  t.send('pointermove',100,150);t.gestures.advance(.5);t.send('pointerup',100,150);assert.deepEqual(t.actions,[]);assert.ok(!t.holds.includes(true));
});
