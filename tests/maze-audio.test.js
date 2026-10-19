import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMazeAudio } from '../src/maze-audio.js';
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
