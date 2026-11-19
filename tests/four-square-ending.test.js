import test from 'node:test';
import assert from 'node:assert/strict';
import {newFourSquare,callFourSquare,tickFourSquare,sendFourSquare,hitFourSquare,moveFourSquare,eliminateFourSquare} from '../src/four-square-rules.js';
import {startFourSquarePopcorn,clapFourSquarePopcorn} from '../src/four-square-popcorn.js';
import {submitFourSquareStoryWord} from '../src/four-square-story.js';
import {SCHOOL_DOOR,startFourSquareEnding} from '../src/four-square-ending.js';
const step=(s,time)=>{for(let t=0;t<time;t+=.02)tickFourSquare(s,.02);};
for(const activity of ['serve','rally','Cherry Bomb','Queen square','popcorn-choice','popcorn','Story Time','reset'])test(`recess bell interrupts ${activity} and stops all game actions`,()=>{
 const s=newFourSquare(()=>.5);if(activity==='rally')sendFourSquare(s,0,1);else if(activity==='popcorn-choice'||activity==='popcorn'){callFourSquare(s,'Popcorn');if(activity==='popcorn')startFourSquarePopcorn(s,true);}else if(activity==='reset')eliminateFourSquare(s,2,'Test');else if(activity!=='serve')callFourSquare(s,activity);
 s.remaining=.01;tickFourSquare(s,.02);assert.equal(s.phase,'ending');assert.equal(s.ending.stage,'bell');assert.equal(s.notice,'Recess bell');assert.equal(s.ball,null);assert.equal(s.command,null);assert.equal(s.story,null);assert.equal(s.popcorn,null);
 const positions=s.kids.map(k=>[k.x,k.z]),score=s.score;assert.equal(hitFourSquare(s),false);assert.equal(sendFourSquare(s,0,1),false);assert.equal(callFourSquare(s,'Popcorn'),false);assert.equal(clapFourSquarePopcorn(s),false);assert.equal(submitFourSquareStoryWord(s,'hello'),false);assert.equal(eliminateFourSquare(s,0,'late'),false);moveFourSquare(s,1,0,1);assert.deepEqual(s.kids.map(k=>[k.x,k.z]),positions);assert.equal(s.score,score);
});
test('bell close-up, look-up pause, and sprint precede the final result; all kids go inside once',()=>{
 const s=newFourSquare(()=>.5);s.score=23;startFourSquareEnding(s);step(s,2.5);assert.equal(s.ending.stage,'bell');const positions=s.kids.map(k=>[k.x,k.z]);step(s,.2);assert.equal(s.ending.stage,'look');assert.deepEqual(s.kids.map(k=>[k.x,k.z]),positions);step(s,1.7);assert.equal(s.ending.stage,'run');assert.ok(s.kids.every(k=>k.z<positions[k.id][1]));step(s,5.2);assert.equal(s.phase,'over');assert.ok(s.kids.every(k=>k.insideSchool&&k.x===SCHOOL_DOOR.x&&k.z===SCHOOL_DOOR.z));assert.equal(s.score,23);assert.equal(startFourSquareEnding(s),false);const ending=s.ending.elapsed;step(s,4);assert.equal(s.ending.elapsed,ending);
});

test('the ringing gong plays once, pauses, resumes from its current moment and respects mute and cleanup',async()=>{
 const {createFourSquareBellSound}=await import('../src/four-square-ending-ui.js');let started=0,stopped=0,closed=0;
 class Audio{constructor(){this.currentTime=0;this.destination={};}resume(){return Promise.resolve();}close(){closed++;return Promise.resolve();}createOscillator(){return {frequency:{value:0},connect(){},disconnect(){},start(){started++;},stop(){stopped++;}};}createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}}
 const sound=createFourSquareBellSound({Audio}),s=newFourSquare();startFourSquareEnding(s);sound.unlock();sound.sync(s);assert.equal(started,36);sound.sync(s);assert.equal(started,36);sound.sync(s,false);assert.ok(stopped>=72);s.ending.elapsed=1;sound.sync(s);assert.equal(started,56);sound.setMuted(true);sound.sync(s);assert.equal(started,56);sound.setMuted(false);s.ending.stage='look';sound.sync(s);assert.equal(started,56);sound.destroy();assert.equal(closed,1);
});
