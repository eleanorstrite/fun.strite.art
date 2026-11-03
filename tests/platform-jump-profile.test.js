import test from 'node:test';
import assert from 'node:assert/strict';
import {JUMP_DEFAULTS,JUMP_PROFILE_VERSION} from '../src/platform-jump-rules.js';
import {prepareJumpProfile,loadJumpProfile,JUMP_PROFILE_KEY} from '../src/platform-jump-profile.js';
test('older saved characters start as the home-screen girl and Davina once',()=>{
 const old={hairstyle:'Short',outfit:'Classic colors',pet:'cat',breed:'Calico',petName:'Mittens',difficulty:'Hard',background:'Sunset'};
 const s=prepareJumpProfile(old);for(const key of ['skin','hair','hairstyle','outfit','facialHair','pet','breed','petName'])assert.equal(s[key],JUMP_DEFAULTS[key]);
 assert.equal(s.petName,'Davina');assert.equal(s.difficulty,'Hard');assert.equal(s.background,'Sunset');assert.equal(s.profileVersion,JUMP_PROFILE_VERSION);
 const later=prepareJumpProfile({...s,outfit:'Daisy denim overalls',pet:'cat',breed:'Calico',petName:'Mittens',facialHair:'Brown curled handlebar'});
 assert.equal(later.outfit,'Daisy denim overalls');assert.equal(later.pet,'cat');assert.equal(later.petName,'Mittens');assert.equal(later.facialHair,'Brown curled handlebar');
});
test('the starter migration persists and storage errors do not prevent play',()=>{
 const data=new Map([[JUMP_PROFILE_KEY,JSON.stringify({pet:'rabbit',breed:'White',petName:'Old pet'})]]),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 assert.equal(loadJumpProfile(storage).petName,'Davina');assert.equal(JSON.parse(data.get(JUMP_PROFILE_KEY)).profileVersion,JUMP_PROFILE_VERSION);
 const custom={...loadJumpProfile(storage),petName:'My Davina'};storage.setItem(JUMP_PROFILE_KEY,JSON.stringify(custom));assert.equal(loadJumpProfile(storage).petName,'My Davina');
 assert.deepEqual(loadJumpProfile({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}),JUMP_DEFAULTS);
});
