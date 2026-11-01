import test from 'node:test';
import assert from 'node:assert/strict';
import {drawPlatformJump} from '../src/platform-jump-art.js';
import {createJumpState,JUMP_DEFAULTS,validateJumpSettings} from '../src/platform-jump-rules.js';
import {JUMP_INTRO_LOOK} from '../src/platform-jump-clips.js';
// Exercise the complete render path at every course height, including props
// drawn before the player: one thrown error otherwise stops the animation loop.
test('the whole course renders through every prop and reaches character drawing',()=>{
 let faces=0;
 const c=new Proxy({canvas:{width:900,height:650},createLinearGradient:()=>({addColorStop(){}}),measureText:()=>({width:50}),ellipse(...args){if(args[2]===20&&args[3]===23)faces++;}},{get(target,key){return key in target?target[key]:()=>{};}});
 const state=createJumpState();for(const p of state.platforms){state.camera=p.y-430;assert.doesNotThrow(()=>drawPlatformJump(c,state,JUMP_DEFAULTS));}
 assert.equal(faces,state.platforms.length,'The person must be drawn on every frame');
});
test('fresh settings match the front-page and opening characters without erasing saved pets',()=>{
 assert.deepEqual(validateJumpSettings(),JUMP_INTRO_LOOK);
 assert.equal(JUMP_DEFAULTS.breed,'Brindle');assert.equal(JUMP_DEFAULTS.petName,'Davina');
 assert.equal(validateJumpSettings({pet:'cat',breed:'Calico',petName:'Mittens'}).breed,'Calico');
});
