import test from 'node:test';
import assert from 'node:assert/strict';
import {createJumpState,tickJump,jump,validateJumpSettings,PET_BREEDS} from '../src/platform-jump-rules.js';
test('all 48 sky platforms can be reached with ordinary jumps and steering',()=>{
 const s=createJumpState();for(let i=0;i<20000&&!s.done;i++){const target=s.platforms[Math.min(48,s.platform+1)];if(s.grounded)jump(s);tickJump(s,.02,Math.abs(target.x-s.x)>4?Math.sign(target.x-s.x):0);}
 assert.equal(s.done,true);assert.equal(s.platform,48);assert.equal(s.y,-4240);assert.ok(s.jumps>=48);assert.ok(s.camera< -4000);const before=structuredClone(s);tickJump(s,.04,1);assert.deepEqual(s,before);
});
test('falling lands on the first platform crossed rather than resetting or tunneling through it',()=>{
 const s=createJumpState();const p=s.platforms[20];s.x=p.x;s.y=p.y-20;s.vy=1300;s.grounded=false;tickJump(s,.04);assert.equal(s.platform,20);assert.equal(s.y,p.y);assert.equal(s.grounded,true);
 s.x=25;s.y=-4500;s.vy=0;s.grounded=false;for(let i=0;i<500&&!s.grounded;i++)tickJump(s,.02);assert.equal(s.y,560);assert.equal(s.platform,0);assert.ok(s.time>3,'Fall takes time instead of teleporting');assert.ok(s.camera> -200);
});
test('walking off a ledge falls, jumping is grounded only, and pets follow the path',()=>{
 const s=createJumpState();s.platform=1;s.x=s.platforms[1].x+s.platforms[1].w/2+11;s.y=s.platforms[1].y;tickJump(s,.04,1);assert.equal(s.grounded,false);assert.equal(jump(s),false);assert.ok(s.vy>0);
 const fresh=createJumpState();assert.equal(jump(fresh),true);assert.equal(jump(fresh),false);for(let i=0;i<30;i++)tickJump(fresh,.02,1);assert.ok(fresh.pet.x>405);assert.ok(fresh.pet.y<560);assert.ok(fresh.trail.length<20);
});
test('pet editor supports requested varieties, validates saved settings and treats names as text',()=>{
 for(const pet of ['cat','dog','capybara','dragon','guinea pig','rabbit'])for(const breed of PET_BREEDS[pet])assert.equal(validateJumpSettings({pet,breed}).breed,breed);
 assert.equal(validateJumpSettings({pet:'dog',breed:'Tabby'}).breed,'Brindle');assert.equal(validateJumpSettings({petName:'Davina'}).petName,'Davina');assert.equal(validateJumpSettings({petName:'a'.repeat(80)}).petName.length,24);assert.equal(validateJumpSettings({pet:'__proto__'}).pet,'dog');assert.equal(validateJumpSettings({hair:'bad'}).hair,'#513324');assert.equal(validateJumpSettings({hairstyle:'Curls',background:'Aurora'}).hairstyle,'Curls');
});
test('every pet breed maps to its own realistic artwork cell',async()=>{
 const {petSpriteCell}=await import('../src/platform-jump-pets.js');const cells=new Set();for(const [pet,breeds]of Object.entries(PET_BREEDS).filter(([pet])=>!['ferret','hedgehog'].includes(pet)))for(const breed of breeds){const cell=petSpriteCell(pet,breed);assert.ok(cell);assert.ok(cell.row>=0&&cell.row<6&&cell.column>=0&&cell.column<4);cells.add(`${cell.row}:${cell.column}`);}assert.equal(cells.size,Object.entries(PET_BREEDS).filter(([pet])=>!['ferret','hedgehog'].includes(pet)).flatMap(([,breeds])=>breeds).length);assert.equal(petSpriteCell('dog','Tabby'),null);
});
test('dogs use different walking, takeoff, airborne and landing poses',async()=>{
 const {dogPoseFrame,DOG_MOTION_BREEDS}=await import('../src/platform-dog-motion.js');assert.deepEqual(DOG_MOTION_BREEDS,PET_BREEDS.dog);assert.deepEqual([0,.12,.24,.36].map(t=>dogPoseFrame('walk',t)),[0,1,2,3]);assert.equal(dogPoseFrame('idle'),4);assert.equal(dogPoseFrame('crouch'),5);assert.equal(dogPoseFrame('jump'),6);assert.equal(dogPoseFrame('land'),7);
 const s=createJumpState();tickJump(s,.02,1);assert.equal(s.pet.pose,'walk');jump(s);tickJump(s,.02,1);assert.equal(s.pet.pose,'crouch');for(let i=0;i<18;i++)tickJump(s,.02,1);assert.equal(s.pet.pose,'jump');for(let i=0;i<30;i++)tickJump(s,.02,1);assert.equal(s.pet.pose,'land');
});
