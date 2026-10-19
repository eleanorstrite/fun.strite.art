import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDefeatSequence, defeatPose, drawDefeat, DEFEAT_SECONDS } from '../src/maze-defeat.js';
test('defeat clip gulps before speaking and each audio cue runs once',()=>{
  const cues=[],scene=createDefeatSequence({play:name=>cues.push(name),sayLose:()=>cues.push('You lose.')});
  scene.advance(3);assert.deepEqual(cues,[]);scene.advance(.3);assert.deepEqual(cues,['gulp']);scene.advance(2.2);assert.deepEqual(cues,['gulp','You lose.']);assert.equal(scene.complete,false);
  scene.advance(20);scene.advance(20);assert.equal(scene.time,DEFEAT_SECONDS);assert.equal(scene.complete,true);assert.equal(cues.length,2);
});
test('knight is swallowed before the lump travels down the throat and the dragon speaks',()=>{
  assert.equal(defeatPose(.5).knightVisible,true);assert.equal(defeatPose(.5).enter,0);
  assert.equal(defeatPose(3.3).knightVisible,false);assert.equal(defeatPose(3.3).lumpVisible,true);
  assert.equal(defeatPose(4.4).swallow>defeatPose(3.3).swallow,true);assert.equal(defeatPose(4.8).lumpVisible,false);assert.equal(defeatPose(5.5).talking,true);
});
test('defeat renderer shows knight first and captions loss with reduced motion supported',()=>{
  for(const reduced of [false,true]){
    let knights=0;const words=[];const ctx=new Proxy({fillText:text=>words.push(text)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
    drawDefeat(ctx,.5,760,760,()=>knights++,reduced);assert.equal(knights,1);
    drawDefeat(ctx,3.8,760,760,()=>knights++,reduced);assert.equal(knights,1);
    drawDefeat(ctx,6,760,760,()=>knights++,reduced);assert.equal(words.includes('You lose.'),true);
  }
});
