import test from 'node:test';
import assert from 'node:assert/strict';
import {createJumpState,tapJump,tapJumpDirection,tickJump} from '../src/platform-jump-rules.js';
test('tapping each landing spot completes the scattered course without swiping',()=>{
 const s=createJumpState();for(let frame=0;frame<20000&&!s.done;frame++){if(s.grounded){const p=s.platforms[s.platform+1];tapJump(s,p.x+10,p.y-s.camera+18);}tickJump(s,.02,tapJumpDirection(s,.02));}
 assert.ok(s.done);assert.equal(s.platform,48);assert.equal(s.tapTarget,null);
});
test('midair taps change aim without adding another jump and aim does not oscillate',()=>{
 const s=createJumpState();tapJump(s,200,100);const jumps=s.jumps,vy=s.vy;tapJump(s,600,100);assert.equal(s.jumps,jumps);assert.equal(s.vy,vy);assert.ok(tapJumpDirection(s,.02)>0);
 s.x=599;tickJump(s,.02,tapJumpDirection(s,.02));assert.equal(s.x,600);assert.equal(tapJumpDirection(s,.02),0);assert.equal(tapJump(s,NaN,100),false);
});
test('sky taps reach the tapped horizontal position and cannot skip numbered platforms',()=>{
 const s=createJumpState('Easy');tapJump(s,850,50);assert.equal(s.tapTarget.x,850);assert.equal(s.landingLimit,1);for(let i=0;i<14;i++)tickJump(s,.04,tapJumpDirection(s,.04));assert.equal(s.x,850);assert.ok(s.platform<=1);
 // Even when directly above a later platform, it cannot catch this jump.
 s.x=s.platforms[3].x;s.y=s.platforms[3].y-2;s.vy=100;s.tapTarget=null;tickJump(s,.04,0);assert.equal(s.grounded,false);assert.equal(s.platform,0);
});
test('touch aim completes every difficulty in order, including after a fall',()=>{
 for(const difficulty of ['Easy','Medium','Hard','Expert']){const s=createJumpState(difficulty);let last=0;for(let frame=0;frame<15000&&!s.done;frame++){if(s.grounded){assert.ok(s.platform<=last+1);last=s.platform;const p=s.platforms[s.platform+1];tapJump(s,p.x,p.y-s.camera);}tickJump(s,.04,tapJumpDirection(s,.04));}assert.ok(s.done,difficulty);assert.equal(s.jumps,48);}
 const s=createJumpState();s.platform=0;s.landingLimit=8;tapJump(s,s.platforms[1].x,s.platforms[1].y);assert.equal(s.landingLimit,1);assert.equal(s.tapTarget.x,s.platforms[1].x);
});
