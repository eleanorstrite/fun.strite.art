import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BACKGROUNDS, BACKGROUND_KEY, loadBackground, saveBackground } from '../src/backgrounds.js';
test('background choices persist independently and all scenes can be restored',()=>{
  const values=new Map([['sidequest.save.v1','existing progress']]),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  assert.equal(loadBackground(storage),'country');
  for(const scene of BACKGROUNDS){assert.equal(saveBackground(storage,scene.id,BACKGROUNDS.map(s=>s.upgrade)),true);assert.equal(loadBackground(storage,BACKGROUNDS.map(s=>s.upgrade)),scene.id);}
  assert.equal(values.get('sidequest.save.v1'),'existing progress');
  assert.throws(()=>saveBackground(storage,'invalid'));assert.equal(values.get(BACKGROUND_KEY),'classic');
});
test('invalid or unavailable background storage falls back without preventing play',()=>{
  assert.equal(loadBackground({getItem:()=>'<bad>'}),'country');
  const storage={getItem(){throw Error();},setItem(){throw Error();}};assert.equal(loadBackground(storage),'country');assert.equal(saveBackground(storage,'sunset'),false);
});
test('premium backgrounds require ownership and become usable after purchase',()=>{
  const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  assert.throws(()=>saveBackground(storage,'aurora'));assert.equal(saveBackground(storage,'aurora',['aurora-background']),true);
  assert.equal(loadBackground(storage,['aurora-background']),'aurora');assert.equal(loadBackground(storage,[]),'country');
});
