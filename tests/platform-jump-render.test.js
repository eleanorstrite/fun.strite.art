import test from 'node:test';
import assert from 'node:assert/strict';
import {drawPlatformJump} from '../src/platform-jump-art.js';
import {createJumpState,JUMP_DEFAULTS,validateJumpSettings} from '../src/platform-jump-rules.js';
import {JUMP_INTRO_LOOK} from '../src/platform-jump-clips.js';
// Exercise the complete render path at every course height, including props
// drawn before the player: one thrown error otherwise stops the animation loop.
test('the whole course renders through every prop and reaches character drawing',()=>{
 let faces=0;
 const c=new Proxy({canvas:{width:900,height:650},createLinearGradient:()=>({addColorStop(){}}),measureText:()=>({width:50}),ellipse(...args){if(args[2]===14&&args[3]===18)faces++;}},{get(target,key){return key in target?target[key]:()=>{};}});
 const state=createJumpState();for(const p of state.platforms){state.camera=p.y-430;assert.doesNotThrow(()=>drawPlatformJump(c,state,JUMP_DEFAULTS));}
 assert.equal(faces,state.platforms.length,'The person must be drawn on every frame');
});
test('fresh settings match the front-page and opening characters without erasing saved pets',()=>{
 assert.deepEqual(validateJumpSettings(),JUMP_INTRO_LOOK);
 assert.equal(JUMP_DEFAULTS.breed,'Brindle');assert.equal(JUMP_DEFAULTS.petName,'Davina');
 assert.equal(validateJumpSettings({pet:'cat',breed:'Calico',petName:'Mittens'}).breed,'Calico');
});

test('starter kid uses the reference outfit and upgrades only the old default look',()=>{
 assert.equal(JUMP_DEFAULTS.hairstyle,'Short waves');assert.equal(JUMP_DEFAULTS.shirt,'#efb17f');assert.equal(JUMP_DEFAULTS.pants,'#82935a');
 const old={skin:'#dba47b',hair:'#513324',shirt:'#6b67dc',pants:'#304b71',hairstyle:'Short',pet:'cat',breed:'Calico',petName:'Mittens'};
 const upgraded=validateJumpSettings(old);assert.equal(upgraded.hairstyle,'Short waves');assert.equal(upgraded.petName,'Mittens');assert.equal(upgraded.breed,'Calico');
 assert.equal(validateJumpSettings({...old,shirt:'#ff1122'}).shirt,'#ff1122');assert.equal(validateJumpSettings({...old,shirt:'#ff1122'}).hairstyle,'Short');
});
