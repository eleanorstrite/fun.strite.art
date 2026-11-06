import test from 'node:test';
import assert from 'node:assert/strict';
import{drawStormCoverFrame}from'../src/storm-cover.js';
test('the Wizard Tetris homepage displays the generated cover artwork in the cover canvas',t=>{
 const previous=globalThis.Image;t.after(()=>globalThis.Image=previous);globalThis.Image=class{complete=true;naturalWidth=1672;naturalHeight=941;};const draws=[],ctx=new Proxy({drawImage:(...args)=>draws.push(args)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});assert.equal(drawStormCoverFrame({width:960,height:540,getContext:()=>ctx},0),true);assert.equal(draws.length,1);assert.ok(draws[0][0].src.endsWith('/assets/wizard-tetris-cover.png'));assert.deepEqual(draws[0].slice(1),[0,0,960,540]);
});
