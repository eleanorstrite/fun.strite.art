import test from 'node:test';
import assert from 'node:assert/strict';
import {JUMP_INTRO_LOOK,JUMP_CLIP_LENGTH,drawJumpClip} from '../src/platform-jump-clips.js';
import {JUMP_DEFAULTS} from '../src/platform-jump-rules.js';
test('opening clip has the requested preset without changing the saved player defaults',()=>{
 assert.equal(JUMP_INTRO_LOOK.pet,'dog');assert.equal(JUMP_INTRO_LOOK.breed,'Brindle');assert.equal(JUMP_INTRO_LOOK.petName,'Davina');assert.equal(JUMP_DEFAULTS.breed,'Brindle');assert.equal(JUMP_CLIP_LENGTH.intro,9);assert.equal(JUMP_CLIP_LENGTH.win,16);
});

test('the human and Davina settle on the starting platform instead of jumping off screen',()=>{
 const translations=[];
 const c=new Proxy({canvas:{width:900,height:650},createLinearGradient:()=>({addColorStop(){}}),measureText:()=>({width:320}),translate:(...a)=>translations.push(a)},{get:(o,k)=>k in o?o[k]:()=>{}});
 for(const time of [7,8,8.99]){translations.length=0;drawJumpClip(c,'intro',time,JUMP_DEFAULTS);assert.ok(translations.some(a=>a[0]===310&&a[1]===500));assert.ok(translations.some(a=>a[0]===590&&a[1]===500));assert.ok(translations.every(a=>a[0]<=900));}
});
