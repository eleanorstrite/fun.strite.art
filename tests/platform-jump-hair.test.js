import {SHOP_HAIR,hairBreezeOffset,STARTER_HAIR,hairUnlocked,HAIR_SHOP_ITEMS} from '../src/platform-hair-shop.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {JUMP_HAIR,validateJumpSettings,JUMP_DEFAULTS} from '../src/platform-jump-rules.js';
import {drawJumper} from '../src/platform-jump-art.js';
test('every hairstyle saves with the selected hair color and renders in gameplay',()=>{
 const c=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(target,key)=>key in target?target[key]:()=>{}});
 assert.equal(new Set(JUMP_HAIR).size,23);
 for(const hairstyle of JUMP_HAIR){const settings=validateJumpSettings({hairstyle,hair:'#edb967'},SHOP_HAIR.map(h=>h.id));assert.equal(settings.hairstyle,hairstyle);assert.equal(settings.hair,'#edb967');assert.doesNotThrow(()=>drawJumper(c,0,0,settings,1,true));}
 assert.equal(validateJumpSettings({hairstyle:'not a hairstyle'}).hairstyle,JUMP_DEFAULTS.hairstyle);
});

test('reference hairstyles require their own permanent unlock',()=>{
 for(const hair of SHOP_HAIR){assert.equal(validateJumpSettings({hairstyle:hair.name}).hairstyle,JUMP_DEFAULTS.hairstyle);assert.equal(validateJumpSettings({hairstyle:hair.name},[hair.id]).hairstyle,hair.name);assert.equal(validateJumpSettings({hairstyle:hair.name},['unrelated']).hairstyle,JUMP_DEFAULTS.hairstyle);}
});

test('breeze anchors the crown and bends the ends over time',()=>{
 for(const time of [0,1,2,5,10]){assert.equal(hairBreezeOffset(-101,time),0);assert.equal(hairBreezeOffset(-78,time),0);assert.ok(Math.abs(hairBreezeOffset(-21,time))<=19);}
 const tips=Array.from({length:121},(_,i)=>hairBreezeOffset(-21,i/20));
 assert.ok(Math.max(...tips)-Math.min(...tips)>20,'tips should visibly sweep in the wind');
 assert.notEqual(hairBreezeOffset(-21,0),hairBreezeOffset(-21,1));
 assert.ok(Math.abs(hairBreezeOffset(-21,1)-hairBreezeOffset(-21,1.001))<.05);
});

test('the orange starter hairstyle is free and can be selected again without a purchase',()=>{
 assert.equal(hairUnlocked(STARTER_HAIR),true);assert.equal(HAIR_SHOP_ITEMS.find(h=>h.hairstyle===STARTER_HAIR).cost,0);
 assert.equal(validateJumpSettings({hairstyle:STARTER_HAIR}).hairstyle,STARTER_HAIR);
});
