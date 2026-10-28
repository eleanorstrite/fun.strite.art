import test from 'node:test';
import assert from 'node:assert/strict';
import {dragonIntroPose,DRAGON_INTRO_SECONDS,DRAGON_INVITATION} from '../src/dragon-intro.js';
test('rainbow dragon flies in, turns to the viewer, greets them and accelerates offscreen',()=>{
 assert.equal(DRAGON_INVITATION,'Are you ready to play some memory?');assert.ok(dragonIntroPose(0).x<0);assert.equal(dragonIntroPose(2).phase,'fly-in');assert.equal(dragonIntroPose(2.9).phase,'turn');assert.ok(dragonIntroPose(2.9).face>0&&dragonIntroPose(2.9).face<1);assert.equal(dragonIntroPose(4).face,1);assert.equal(dragonIntroPose(4).phase,'greeting');assert.equal(dragonIntroPose(8).phase,'fly-away');assert.ok(dragonIntroPose(9).x-dragonIntroPose(8.5).x>dragonIntroPose(8).x-dragonIntroPose(7.5).x);assert.ok(dragonIntroPose(DRAGON_INTRO_SECONDS).x>1240);assert.equal(dragonIntroPose(DRAGON_INTRO_SECONDS).done,true);
});
test('reduced motion keeps the dragon still while preserving its greeting and completion',()=>{
 for(const time of [1,3,4,8]){const pose=dragonIntroPose(time,true);assert.equal(pose.x,480);assert.equal(pose.y,295);assert.equal(pose.wing,0);}assert.equal(dragonIntroPose(4,true).face,1);assert.equal(dragonIntroPose(9.5,true).done,true);
});
