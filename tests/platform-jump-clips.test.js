import test from 'node:test';
import assert from 'node:assert/strict';
import {JUMP_INTRO_LOOK,JUMP_CLIP_LENGTH} from '../src/platform-jump-clips.js';
import {JUMP_DEFAULTS} from '../src/platform-jump-rules.js';
test('opening clip has the requested preset without changing the saved player defaults',()=>{
 assert.equal(JUMP_INTRO_LOOK.pet,'dog');assert.equal(JUMP_INTRO_LOOK.breed,'Brindle');assert.equal(JUMP_INTRO_LOOK.petName,'Davina');assert.equal(JUMP_DEFAULTS.breed,'Brindle');assert.equal(JUMP_CLIP_LENGTH.intro,9);assert.equal(JUMP_CLIP_LENGTH.win,16);
});
