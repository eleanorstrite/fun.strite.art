import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVictorySequence, drawVictory, VICTORY_SECONDS } from '../src/maze-victory.js';
test('victory cues play once in chest-then-speech order before ending',()=>{
  const cues=[],scene=createVictorySequence({play:name=>cues.push(name),sayWin:()=>cues.push('speech')});
  scene.advance(.7);assert.deepEqual(cues,[]);scene.advance(.2);assert.deepEqual(cues,['sword']);scene.advance(2.8);assert.deepEqual(cues,['sword','speech']);assert.equal(scene.complete,false);
  scene.advance(10);scene.advance(10);assert.equal(scene.time,VICTORY_SECONDS);assert.equal(scene.complete,true);assert.deepEqual(cues,['sword','speech']);
});
test('ending shows the chest before the knight and captions the victory in normal and reduced motion',()=>{
  for(const reduced of [false,true]){
    let knights=0;const words=[];const ctx=new Proxy({fillText:text=>words.push(text)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
    drawVictory(ctx,1,760,760,()=>knights++,reduced);assert.equal(knights,0);assert.equal(words.includes('You win!'),false);
    drawVictory(ctx,4,760,760,()=>knights++,reduced);assert.equal(knights,1);assert.equal(words.includes('You win!'),true);
  }
});
