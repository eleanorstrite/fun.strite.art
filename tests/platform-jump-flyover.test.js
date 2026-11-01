import test from 'node:test';
import assert from 'node:assert/strict';
import {flyoverFrame,FLYOVER_SECONDS} from '../src/platform-jump-flyover.js';
import {createJumpState,JUMP_LEVELS} from '../src/platform-jump-rules.js';
import {jumperPose} from '../src/platform-jump-person.js';
test('flyover shows the start, summit, full countdown and returns without moving the player',()=>{
 for(const level of Object.keys(JUMP_LEVELS)){const s=createJumpState(level),before=structuredClone(s);assert.equal(flyoverFrame(s,0).camera,0);assert.equal(flyoverFrame(s,4.5).camera,s.platforms.at(-1).y-350);assert.deepEqual([4.5,5.5,6.5,7.5,8.5].map(t=>flyoverFrame(s,t).message),['Ready','3','2','1','Go!']);assert.equal(flyoverFrame(s,FLYOVER_SECONDS).camera,0);assert.deepEqual(s,before);}
});
test('human gait bends joints and uses distinct jump and landing poses',()=>{
 const walk=jumperPose(.1,true),step=jumperPose(.4,true),jump=jumperPose(0,false,{pose:'jump'}),land=jumperPose(0,false,{pose:'land'});assert.notDeepEqual(walk.legs,step.legs);assert.notDeepEqual(walk.arms,step.arms);assert.notDeepEqual(jump.legs,land.legs);assert.notDeepEqual(jump.arms,land.arms);assert.ok(Math.abs(walk.bob)<=.6);
});
test('side profile jumping has bent knees and elbows and walking alternates legs',async()=>{
 const {sideJumperPose}=await import('../src/platform-jump-person.js');const p=sideJumperPose(0,'jump');
 const bend=(a,b,c)=>Math.abs((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]));
 for(const leg of p.legs){assert.ok(bend(leg.hip,leg.knee,leg.foot)>150);assert.ok(leg.foot[1]<-8);}
 for(const arm of p.arms)assert.ok(bend(arm.shoulder,arm.elbow,arm.hand)>100);
 assert.notDeepEqual(sideJumperPose(.1,'walk').legs,sideJumperPose(.4,'walk').legs);
});
