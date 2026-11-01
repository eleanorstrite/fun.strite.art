import test from 'node:test';
import assert from 'node:assert/strict';
import {PET_MOTION,petMotionFrame} from '../src/platform-pet-motion.js';
import {PET_BREEDS,createJumpState,tickJump,jump} from '../src/platform-jump-rules.js';
test('all non-dog breeds and purchased outfits have species-specific movement sets',()=>{
 for(const [kind,breeds]of Object.entries(PET_BREEDS)){if(kind==='dog')continue;assert.deepEqual(PET_MOTION[kind].breeds,breeds);const rate=PET_MOTION[kind].rate;assert.deepEqual([0,1,2,3].map(n=>petMotionFrame(kind,'walk',n/rate)),[0,2,1,2]);assert.equal(petMotionFrame(kind,'sit'),3);assert.equal(petMotionFrame(kind,'jump'),5);assert.equal(petMotionFrame(kind,'land'),4);}
});
test('pet follows movement, rests after stopping, and resumes walking and jumping',()=>{
 const s=createJumpState();for(let i=0;i<160;i++)tickJump(s,.02);assert.equal(s.pet.pose,'sit');
 for(let i=0;i<25;i++)tickJump(s,.02,1);assert.equal(s.pet.pose,'walk');assert.ok(s.pet.x>370);assert.equal(s.pet.restTime,0);
 jump(s);for(let i=0;i<18;i++)tickJump(s,.02,1);assert.equal(s.pet.pose,'jump');for(let i=0;i<25;i++)tickJump(s,.02,1);assert.equal(s.pet.pose,'land');
});
