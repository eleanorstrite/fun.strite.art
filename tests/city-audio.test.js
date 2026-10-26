import test from 'node:test';
import assert from 'node:assert/strict';
import {createCityAudio} from '../src/city-audio.js';
test('bed sounds repeat only while needed and stop on leaving, pause, mute, and destruction',()=>{
  const notes=[],lines=[];let cancelled=0,closed=0;
  const param=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  class Context{state='running';currentTime=0;destination={};resume(){return Promise.resolve();}close(){closed++;return Promise.resolve();}createGain(){return {gain:param(),connect(){},disconnect(){}};}createOscillator(){const note={frequency:param(),connect(){},disconnect(){},start(){},stop(){this.stops=(this.stops||0)+1;}};notes.push(note);return note;}}
  const speech={speak(line){lines.push(line);},cancel(){cancelled++;}},Utterance=class{constructor(text){this.text=text;}};
  const audio=createCityAudio({Context,speech,Utterance});audio.unlock();audio.tick(.1,'dog');assert.equal(notes.length,2);audio.tick(3,'dog');assert.equal(notes.length,4);audio.tick(.1,null);assert.equal(notes[3].stops,2);audio.tick(10,null);assert.equal(notes.length,4);
  audio.tick(.1,'cat');assert.equal(notes.length,5);audio.stop();assert.equal(notes[4].stops,2);
  audio.tick(.1,'owner');assert.equal(lines[0].text,'Hey, get out of the bed!');lines[0].onend();audio.tick(3,'owner');assert.equal(lines.length,2);audio.tick(.1,null);assert.equal(cancelled,1);
  audio.tick(.1,'owner');audio.setMuted(true);assert.equal(cancelled,2);audio.tick(10,'dog');assert.equal(notes.length,5);audio.setMuted(false);audio.tick(.1,'dog');assert.equal(notes.length,7);audio.destroy();assert.equal(closed,1);audio.tick(10,'cat');assert.equal(notes.length,7);
});
test('unsupported audio still permits all bed interactions',()=>{const audio=createCityAudio({Context:null,speech:null,Utterance:null});audio.unlock();audio.tick(1,'cat');audio.tick(1,'owner');audio.stop();audio.destroy();});
