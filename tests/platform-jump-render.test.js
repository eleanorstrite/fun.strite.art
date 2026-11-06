import {jumpSurface,JUMP_SURFACES} from '../src/platform-jump-surfaces.js';
import {tickJump,JUMP_LEVELS} from '../src/platform-jump-rules.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {drawPlatformJump,JUMP_COVER_LOOK} from '../src/platform-jump-art.js';
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
 assert.deepEqual(validateJumpSettings(),JUMP_INTRO_LOOK);assert.deepEqual(JUMP_COVER_LOOK,JUMP_INTRO_LOOK);
 assert.equal(JUMP_DEFAULTS.breed,'Brindle');assert.equal(JUMP_DEFAULTS.petName,'Davina');
 assert.equal(validateJumpSettings({pet:'cat',breed:'Calico',petName:'Mittens'}).breed,'Calico');
});

test('starter kid uses the reference outfit and upgrades only the old default look',()=>{
 assert.equal(JUMP_DEFAULTS.hairstyle,'Sunset blossom waves');assert.equal(JUMP_DEFAULTS.hair,'#ee702e');assert.equal(JUMP_DEFAULTS.outfit,'Lace collar & skirt');assert.equal(JUMP_DEFAULTS.shirt,'#efb17f');assert.equal(JUMP_DEFAULTS.pants,'#82935a');
 const old={skin:'#dba47b',hair:'#513324',shirt:'#6b67dc',pants:'#304b71',hairstyle:'Short',pet:'cat',breed:'Calico',petName:'Mittens'};
 const upgraded=validateJumpSettings(old);assert.equal(upgraded.hairstyle,JUMP_DEFAULTS.hairstyle);assert.equal(upgraded.petName,'Mittens');assert.equal(upgraded.breed,'Calico');
 assert.equal(validateJumpSettings({...old,shirt:'#ff1122'}).shirt,'#ff1122');assert.equal(validateJumpSettings({...old,shirt:'#ff1122'}).outfit,'Classic colors');assert.equal(validateJumpSettings({...old,shirt:'#ff1122'}).hairstyle,'Short');
});

test('the previous untouched starter changes to the shared girl while custom appearances stay saved',()=>{
 const old={skin:'#dba47b',hair:'#513324',shirt:'#efb17f',pants:'#82935a',hairstyle:'Short waves',outfit:'Classic colors',pet:'cat',breed:'Calico',petName:'Mittens'};
 const updated=validateJumpSettings(old);assert.equal(updated.outfit,JUMP_DEFAULTS.outfit);assert.equal(updated.hairstyle,JUMP_DEFAULTS.hairstyle);assert.equal(updated.hair,JUMP_DEFAULTS.hair);assert.equal(updated.petName,'Mittens');
 const customized=validateJumpSettings({...old,outfit:'Daisy denim overalls'});assert.equal(customized.outfit,'Daisy denim overalls');assert.equal(customized.hairstyle,'Short waves');assert.equal(customized.hair,'#513324');
});

test('taco trucks are mixed through every course and their roofs remain landable coin platforms',()=>{
 assert.ok(JUMP_SURFACES.includes('taco truck'));assert.equal(jumpSurface(0),'ground');assert.equal(jumpSurface(48),'finish');
 for(const difficulty of Object.keys(JUMP_LEVELS)){const course=createJumpState(difficulty),trucks=course.platforms.map((p,i)=>jumpSurface(i)==='taco truck'?i:0).filter(Boolean);assert.ok(trucks.length>=6);assert.ok(trucks[0]<10&&trucks.at(-1)>40);assert.ok(new Set(course.platforms.slice(1,48).map((p,i)=>jumpSurface(i+1))).size>=7);
 for(const number of trucks){const s=createJumpState(difficulty),p=s.platforms[number];s.x=p.x;s.y=p.y-5;s.vy=200;s.grounded=false;s.platform=number-1;s.landingLimit=number;tickJump(s,.04);assert.equal(s.grounded,true);assert.equal(s.platform,number);assert.equal(s.y,p.y);assert.equal(s.coins[number].collected,true);}}
});
