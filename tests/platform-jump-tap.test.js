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
