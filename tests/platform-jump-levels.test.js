import test from 'node:test';
import assert from 'node:assert/strict';
import {JUMP_LEVELS,createJumpState,tapJump,tapJumpDirection,tickJump,jump,validateJumpSettings} from '../src/platform-jump-rules.js';
for(const difficulty of Object.keys(JUMP_LEVELS))for(const controls of ['keyboard','tap'])for(const dt of [.02,.04])test(`${difficulty} is completable with ${controls} controls at ${dt}s steps`,()=>{
 const s=createJumpState(difficulty);for(let frame=0;frame<25000&&!s.done;frame++){const p=s.platforms[Math.min(48,s.platform+1)];if(s.grounded){if(controls==='tap')tapJump(s,p.x,p.y-s.camera);else jump(s);}tickJump(s,dt,controls==='tap'?tapJumpDirection(s,dt):Math.abs(p.x-s.x)>4?Math.sign(p.x-s.x):0);}
 assert.ok(s.done,`Stopped at ${s.platform}`);assert.equal(s.platform,48);assert.equal(560-s.y,s.summit);assert.equal(s.difficulty,difficulty);
});
test('levels progressively narrow landing spots and increase heights and gaps',()=>{
 let previous=null;for(const difficulty of Object.keys(JUMP_LEVELS)){const s=createJumpState(difficulty),p=s.platforms.slice(1,48);const width=p.reduce((sum,p)=>sum+p.w,0)/p.length,travel=p.reduce((sum,p,i)=>sum+Math.abs(p.x-s.platforms[i].x),0)/p.length;if(previous){assert.ok(width<previous.width);assert.ok(travel>previous.travel);assert.ok(s.summit>previous.summit);}previous={width,travel,summit:s.summit};assert.equal(validateJumpSettings({difficulty}).difficulty,difficulty);assert.deepEqual(s.platforms,createJumpState(difficulty).platforms);}
 assert.equal(validateJumpSettings({difficulty:'Impossible'}).difficulty,'Medium');assert.equal(createJumpState('__proto__').difficulty,'Medium');
});
