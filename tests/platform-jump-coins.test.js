import test from 'node:test';
import assert from 'node:assert/strict';
import {createJumpState,tickJump,jump,collectJumpCoins} from '../src/platform-jump-rules.js';
test('every platform has one coin; collecting it once does not respawn after a fall',()=>{
 const s=createJumpState();assert.equal(s.coins.length,s.platforms.length);
 tickJump(s,.02);assert.equal(s.collectedCoins,1);
 for(let i=0;i<10;i++)tickJump(s,.02);assert.equal(s.collectedCoins,1);
 s.platform=1;s.landingLimit=1;s.x=s.platforms[1].x;s.y=s.platforms[1].y;
 collectJumpCoins(s);assert.equal(s.collectedCoins,2);assert.ok(s.coins[1].collected);
 s.platform=0;s.x=450;s.y=560;collectJumpCoins(s);assert.equal(s.collectedCoins,2);
 assert.equal(createJumpState().collectedCoins,0);
});
test('coins require contact and cannot be collected on unreached higher platforms',()=>{
 const s=createJumpState();s.x=20;collectJumpCoins(s);assert.equal(s.collectedCoins,0);
 s.x=s.platforms[5].x;s.y=s.platforms[5].y;collectJumpCoins(s);assert.equal(s.collectedCoins,0);
});
test('a normal climb collects coins without duplicating any platform reward',()=>{
 const s=createJumpState();tickJump(s,.02);
 for(let frame=0;frame<25000&&!s.done;frame++){const target=s.platforms[Math.min(48,s.platform+1)];if(s.grounded)jump(s);tickJump(s,.02,Math.abs(target.x-s.x)>4?Math.sign(target.x-s.x):0);}
 assert.ok(s.done);assert.equal(s.collectedCoins,s.coins.filter(c=>c.collected).length);assert.equal(s.collectedCoins,49);
});
