import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createExplorerDance } from '../src/explorer-dance.js';
test('save celebration waits for visibility, pauses offscreen, and repeats only on another save',()=>{
  let observe,ended,plays=0;const classes=new Set();
  const explorer={style:{},offsetWidth:95,classList:{add(name){classes.add(name);plays++;},remove:name=>classes.delete(name)},addEventListener(name,fn){ended=fn;}};
  class Observer{constructor(callback){observe=callback;}observe(){}}
  const dance=createExplorerDance(explorer,Observer);dance.request();assert.equal(plays,0);
  const visible=value=>observe([{target:explorer,isIntersecting:value,intersectionRatio:value?1:0}]);
  visible(true);assert.equal(plays,1);visible(false);assert.equal(explorer.style.animationPlayState,'paused');visible(true);assert.equal(plays,1);assert.equal(explorer.style.animationPlayState,'running');
  ended({target:explorer});assert.equal(classes.size,0);visible(false);visible(true);assert.equal(plays,1);dance.request();assert.equal(plays,2);
});
