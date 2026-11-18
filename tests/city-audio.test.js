import test from 'node:test';
import assert from 'node:assert/strict';
import {createCityAudio} from '../src/city-audio.js';
test('recorded bed sounds repeat only while needed and stop on leaving, pause, mute, and destruction',async()=>{
  const notes=[],sources=[],lines=[];let cancelled=0,closed=0;
  const param=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  class Context{state='running';currentTime=0;destination={};resume(){return Promise.resolve();}close(){closed++;return Promise.resolve();}decodeAudioData(data){return Promise.resolve({duration:1,kind:new Uint8Array(data)[0]});}createGain(){return {gain:param(),connect(){},disconnect(){}};}createBufferSource(){const source={connect(){},disconnect(){},start(){this.started=true;},stop(){this.stops=(this.stops||0)+1;}};sources.push(source);return source;}createOscillator(){notes.push(1);throw new Error('Pets must not use synthesized tones');}}
  const speech={speak(line){lines.push(line);},cancel(){cancelled++;}},Utterance=class{constructor(text){this.text=text;}},fetchAudio=async url=>({ok:true,arrayBuffer:async()=>Uint8Array.of(url.includes('dog')?1:2).buffer});
  const audio=createCityAudio({Context,speech,Utterance,fetchAudio});audio.unlock();await audio.ready;audio.tick(.1,'dog');assert.equal(sources.length,1);assert.equal(sources[0].buffer.kind,1);audio.tick(3,'dog');assert.equal(sources.length,2);audio.tick(.1,null);assert.equal(sources[1].stops,1);audio.tick(10,null);assert.equal(sources.length,2);
  audio.tick(.1,'cat');assert.equal(sources.length,3);assert.equal(sources[2].buffer.kind,2);audio.stop();assert.equal(sources[2].stops,1);
  audio.tick(.1,'owner');assert.equal(lines[0].text,'Hey, get out of the bed!');lines[0].onend();audio.tick(3,'owner');assert.equal(lines.length,2);audio.tick(.1,null);assert.equal(cancelled,1);
  audio.tick(.1,'owner');audio.setMuted(true);assert.equal(cancelled,2);audio.tick(10,'dog');assert.equal(sources.length,3);audio.setMuted(false);audio.tick(.1,'dog');assert.equal(sources.length,4);audio.destroy();assert.equal(closed,1);audio.tick(10,'cat');assert.equal(sources.length,4);assert.equal(notes.length,0);
});
test('a recording finishing loading after leaving the bed or muting cannot start late',async()=>{
 const sources=[],resolvers=[];class Context{state='running';destination={};resume(){}decodeAudioData(){return Promise.resolve({duration:1});}createGain(){return {gain:{},connect(){},disconnect(){}};}createBufferSource(){const source={connect(){},disconnect(){},start(){sources.push(this);},stop(){}};return source;}}
 const fetchAudio=()=>new Promise(resolve=>resolvers.push(()=>resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}))),audio=createCityAudio({Context,fetchAudio});audio.unlock();audio.tick(.1,'dog');audio.tick(.1,null);audio.setMuted(true);resolvers.forEach(resolve=>resolve());await audio.ready;await Promise.resolve();assert.equal(sources.length,0);audio.setMuted(false);audio.tick(.1,'cat');assert.equal(sources.length,1);audio.destroy();
});
test('unsupported audio still permits all bed interactions',()=>{const audio=createCityAudio({Context:null,speech:null,Utterance:null});audio.unlock();audio.tick(1,'cat');audio.tick(1,'owner');audio.stop();audio.destroy();});
test('each food power has its own magical notes and mute stops them',()=>{
 const melodies=[];let stopped=0;
 const param={setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}};
 class Context{state='running';currentTime=0;destination={};resume(){return Promise.resolve();}createGain(){return {gain:param,connect(){},disconnect(){}};}createOscillator(){return {frequency:{setValueAtTime(hz){melodies.push(hz);},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){stopped++;}};}}
 const audio=createCityAudio({Context});for(const power of ['flight','speed','flowers'])audio.magic(power);assert.equal(melodies.length,15);assert.notDeepEqual(melodies.slice(0,5),melodies.slice(5,10));assert.notDeepEqual(melodies.slice(5,10),melodies.slice(10));audio.setMuted(true);assert.equal(stopped,30);audio.magic('flight');assert.equal(melodies.length,15);audio.destroy();
});
test('victory cheer uses the requested words and obeys mute and stop',()=>{
 const lines=[];let cancelled=0;const audio=createCityAudio({Context:null,speech:{speak(line){lines.push(line);},cancel(){cancelled++;}},Utterance:class{constructor(text){this.text=text;}}});
 audio.cheer();assert.equal(lines[0].text,'Hooray! You saved the town!');audio.stop();assert.equal(cancelled,1);audio.setMuted(true);audio.cheer();assert.equal(lines.length,1);audio.destroy();
});
