import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMazeAudio, makeIceMouthSound } from '../src/maze-audio.js';
test('audio starts on interaction, schedules distinct cues, honors mute, and releases resources',()=>{
  let created=0,closed=0;const notes=[];
  const param=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  class Context {
    constructor(){created++;this.state='running';this.currentTime=0;this.destination={};}
    createOscillator(){const note={frequency:param(),connect(){},disconnect(){},start(at){this.at=at;},stop(){this.stopped=true;}};notes.push(note);return note;}
    createGain(){return {gain:param(),connect(){},disconnect(){}};}
    close(){closed++;this.state='closed';return Promise.resolve();}
  }
  const audio=createMazeAudio(Context);audio.play('gem');assert.equal(created,0);audio.unlock();assert.equal(created,1);
  audio.play('dragon');assert.equal(notes.length,3);audio.play('eaten');assert.equal(notes.length,7);assert.equal(notes[0].stopped,true);assert.equal(notes[3].type,'sawtooth');assert.equal(notes[6].at>notes[3].at,true);
  audio.setMuted(true);audio.play('gem');assert.equal(notes.length,7);audio.setMuted(false);audio.play('gem');assert.equal(notes.length,8);
  audio.destroy();assert.equal(closed,1);audio.unlock();audio.play('sword');assert.equal(created,1);assert.equal(notes.length,8);
});
test('unsupported audio does not interfere with gameplay',()=>{const audio=createMazeAudio(null);audio.unlock();audio.play('eaten');audio.setMuted(true);audio.destroy();});
test('victory speech uses the requested words, obeys mute, and is cancelled on cleanup',()=>{
  const original={speechSynthesis:globalThis.speechSynthesis,SpeechSynthesisUtterance:globalThis.SpeechSynthesisUtterance};let cancelled=0;const lines=[];
  globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  globalThis.speechSynthesis={speak:line=>lines.push(line.text),cancel:()=>cancelled++};
  try{const audio=createMazeAudio(null);audio.sayWin();assert.deepEqual(lines,['You win!']);audio.setMuted(true);assert.equal(cancelled,1);audio.sayWin();assert.equal(lines.length,1);audio.setMuted(false);audio.sayWin();audio.destroy();assert.equal(cancelled,2);}finally{Object.assign(globalThis,original);}
});
test('dragon says You lose with a lower voice and respects mute',()=>{
  const original={speechSynthesis:globalThis.speechSynthesis,SpeechSynthesisUtterance:globalThis.SpeechSynthesisUtterance};const lines=[];
  globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};globalThis.speechSynthesis={speak:line=>lines.push(line),cancel(){}};
  try{const audio=createMazeAudio(null);audio.sayLose();assert.equal(lines[0].text,'You lose.');assert.equal(lines[0].pitch<1,true);audio.setMuted(true);audio.sayLose();assert.equal(lines.length,1);audio.destroy();}finally{Object.assign(globalThis,original);}
});

test('flight cues are distinct, crash interrupts flaps, and mute suppresses all flight sounds',()=>{
 const notes=[];const param=()=>({setValueAtTime(value){this.value=value;},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 class Context{
  state='running';currentTime=0;destination={};
  createOscillator(){const note={frequency:param(),connect(){},disconnect(){},start(){},stop(){this.stops=(this.stops||0)+1;}};notes.push(note);return note;}
  createGain(){return {gain:param(),connect(){},disconnect(){}};}
  close(){return Promise.resolve();}
 }
 const audio=createMazeAudio(Context);audio.unlock();
 const starts=[];for(const cue of ['flap','chirp','whoosh','jet']){const index=notes.length;audio.play(cue);starts.push(notes[index].frequency.value);}
 assert.equal(new Set(starts).size,4);audio.play('crash');assert.equal(notes[0].stops,2);
 for(const cue of ['bounce','flightEnd','flightCoin'])audio.play(cue);
 const count=notes.length;audio.setMuted(true);
 for(const cue of ['flap','chirp','whoosh','jet','crash','bounce','flightEnd','flightCoin'])audio.play(cue);
 assert.equal(notes.length,count);audio.destroy();
});

test('pumpkin and ice cream effects have distinct cues and obey mute and cleanup',()=>{
  const notes=[],param=()=>({setValueAtTime(value){this.value=value;},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  class Context{
    state='running';currentTime=0;destination={};
    createOscillator(){const note={frequency:param(),connect(){},disconnect(){},start(at){this.startAt=at;},stop(at){this.stopAt=at;}};notes.push(note);return note;}
    createGain(){return {gain:param(),connect(){},disconnect(){}};}
    close(){return Promise.resolve();}
  }
  const audio=createMazeAudio(Context);audio.unlock();
  const cues=['pumpkinScoop','pumpkinCarve','pumpkinScrape','pumpkinSnip','pumpkinPick','pumpkinUndo','pumpkinReady','iceChew','iceSlurp'];
  const signatures=[];
  for(const cue of cues){
    const start=notes.length;audio.play(cue);
    signatures.push(notes.slice(start).map(note=>note.frequency.value).join(','));
    if(cue==='pumpkinCarve'||cue==='pumpkinScrape')assert.equal(notes.at(-1).stopAt<.14,true);
  }
  assert.equal(new Set(signatures).size,cues.length);
  const count=notes.length;audio.setMuted(true);for(const cue of cues)audio.play(cue);
  assert.equal(notes.length,count);audio.destroy();audio.play('pumpkinScoop');assert.equal(notes.length,count);
});

test('mouth samples have distinct audible textures and bounded volume at browser sample rates',()=>{
  for(const rate of [44100,48000])for(const cue of ['iceChew','iceSlurp']){
    const samples=makeIceMouthSound(cue,rate);
    let energy=0,peak=0;for(const value of samples){assert.equal(Number.isFinite(value),true);energy+=value*value;peak=Math.max(peak,Math.abs(value));}
    assert.equal(Math.sqrt(energy/samples.length)>.04,true);assert.equal(peak<1,true);
    assert.equal(samples[0],0);assert.equal(Math.abs(samples.at(-1))<.02,true);
  }
});
test('textured mouth audio uses cached buffers and stops on mute or destruction',()=>{
  let buffers=0;const sources=[];
  class Context{
    state='running';currentTime=0;sampleRate=44100;destination={};
    createBuffer(channels,length){buffers++;return {getChannelData:()=>new Float32Array(length)};}
    createBufferSource(){const source={connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;}};sources.push(source);return source;}
    createGain(){return {gain:{setValueAtTime(){}},connect(){},disconnect(){}};}
    close(){return Promise.resolve();}
  }
  const audio=createMazeAudio(Context);audio.unlock();audio.play('iceChew');audio.play('iceChew');audio.play('iceSlurp');
  assert.equal(buffers,2);assert.equal(sources.length,3);assert.equal(sources.every(s=>s.started),true);
  audio.setMuted(true);assert.equal(sources.every(s=>s.stopped),true);audio.play('iceSlurp');assert.equal(sources.length,3);
  audio.setMuted(false);audio.play('iceSlurp');assert.equal(buffers,2);audio.destroy();assert.equal(sources[3].stopped,true);
});
