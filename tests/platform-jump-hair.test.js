import {SHOP_HAIR} from '../src/platform-hair-shop.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {JUMP_HAIR,validateJumpSettings} from '../src/platform-jump-rules.js';
import {drawJumper} from '../src/platform-jump-art.js';
test('every hairstyle saves with the selected hair color and renders in gameplay',()=>{
 const c=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(target,key)=>key in target?target[key]:()=>{}});
 assert.equal(new Set(JUMP_HAIR).size,23);
 for(const hairstyle of JUMP_HAIR){const settings=validateJumpSettings({hairstyle,hair:'#edb967'},SHOP_HAIR.map(h=>h.id));assert.equal(settings.hairstyle,hairstyle);assert.equal(settings.hair,'#edb967');assert.doesNotThrow(()=>drawJumper(c,0,0,settings,1,true));}
 assert.equal(validateJumpSettings({hairstyle:'not a hairstyle'}).hairstyle,'Short waves');
});

test('reference hairstyles require their own permanent unlock',()=>{
 for(const hair of SHOP_HAIR){assert.equal(validateJumpSettings({hairstyle:hair.name}).hairstyle,'Short waves');assert.equal(validateJumpSettings({hairstyle:hair.name},[hair.id]).hairstyle,hair.name);assert.equal(validateJumpSettings({hairstyle:hair.name},['unrelated']).hairstyle,'Short waves');}
});
