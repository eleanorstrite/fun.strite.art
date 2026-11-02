import test from 'node:test';
import assert from 'node:assert/strict';
import {createJumpMusic} from '../src/platform-jump-music.js';
function setup(){let context;class AudioContext{constructor(){context=this;this.currentTime=0;this.state='running';this.voices=[];}createGain(){return {gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}createOscillator(){const voice={frequency:{},connect(){},disconnect(){},start(){voice.started=true;},stop(at){if(at===undefined)voice.silenced=true;}};this.voices.push(voice);return voice;}close(){this.state='closed';return Promise.resolve();}resume(){this.state='running';return Promise.resolve();}}return {music:createJumpMusic({AudioContext}),context:()=>context};}
test('music starts only after unlock and active gameplay; mute/unmute and win stop voices',()=>{const {music,context}=setup();music.update(true);assert.equal(context(),undefined);music.unlock();music.update(false);assert.equal(context().voices.length,0);music.update(true);assert.ok(context().voices.length>0);music.setMuted(true);assert.ok(context().voices.every(v=>v.silenced));const count=context().voices.length;context().currentTime=2;music.update(true);assert.equal(context().voices.length,count);music.setMuted(false);music.update(true);assert.ok(context().voices.length>count);music.update(false);assert.ok(context().voices.every(v=>v.silenced));music.destroy();assert.equal(context().state,'closed');music.update(true);});
test('music schedules a continuing tune without duplicating notes each frame',()=>{const {music,context}=setup();music.unlock();music.update(true);const count=context().voices.length;music.update(true);assert.equal(context().voices.length,count);context().currentTime=.3;music.update(true);assert.ok(context().voices.length>count);music.destroy();});
test('browsers without Web Audio can still play',()=>{const music=createJumpMusic({AudioContext:null});music.unlock();music.update(true);music.coin();music.setMuted(true);music.coin();music.destroy();music.coin();});

test('coin pickup plays a soft bell, follows mute, and survives the win transition',()=>{
 const {music,context}=setup();music.coin();assert.equal(context(),undefined);
 music.unlock();music.update(true);const before=context().voices.length;
 music.coin();const bell=context().voices.slice(before);assert.equal(bell.length,2);assert.ok(bell.every(v=>v.started&&v.type==='sine'));
 music.update(false);assert.ok(bell.every(v=>!v.silenced),'Final pickup should finish ringing during the win transition');
 music.setMuted(true);assert.ok(bell.every(v=>v.silenced));const mutedCount=context().voices.length;music.coin();assert.equal(context().voices.length,mutedCount);
 music.setMuted(false);music.coin();assert.equal(context().voices.length,mutedCount+2);
 music.destroy();const count=context().voices.length;music.coin();assert.equal(context().voices.length,count);assert.ok(context().voices.every(v=>v.silenced));
});
