import test from 'node:test';
import assert from 'node:assert/strict';
import {flyoverFrame,FLYOVER_SECONDS} from '../src/platform-jump-flyover.js';
import {createJumpState,JUMP_LEVELS} from '../src/platform-jump-rules.js';
test('flyover shows the start, summit, full countdown and returns without moving the player',()=>{
 for(const level of Object.keys(JUMP_LEVELS)){const s=createJumpState(level),before=structuredClone(s);assert.equal(flyoverFrame(s,0).camera,0);assert.equal(flyoverFrame(s,4.5).camera,s.platforms.at(-1).y-350);assert.deepEqual([4.5,5.5,6.5,7.5,8.5].map(t=>flyoverFrame(s,t).message),['Ready','3','2','1','Go!']);assert.equal(flyoverFrame(s,FLYOVER_SECONDS).camera,0);assert.deepEqual(s,before);}
});
