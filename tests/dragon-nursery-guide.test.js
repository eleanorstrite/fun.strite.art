import test from 'node:test';import assert from 'node:assert/strict';
import {newNursery} from '../src/dragon-nursery-rules.js';
import {NURSERY_MENTOR,NURSERY_GUIDE,canTalkToNurseryMentor} from '../src/dragon-nursery-guide.js';
test('the rules keeper can be approached before choosing an egg but cannot be spoken to from across the garden or indoors',()=>{const s=newNursery();assert.equal(canTalkToNurseryMentor(s),false);s.player={x:NURSERY_MENTOR.x+1,z:NURSERY_MENTOR.z+1};assert.equal(canTalkToNurseryMentor(s),true);s.inside=true;assert.equal(canTalkToNurseryMentor(s),false);});
test('talking never interrupts care, sleep, training, riding or the farewell',()=>{for(const blocked of [{sleep:1},{activity:{kind:'food'}},{careEffect:{action:'wash'}},{training:{kind:'target'}},{riding:{kind:'flying'}},{farewell:'ready'}]){const s={...newNursery(),player:{...NURSERY_MENTOR},...blocked};assert.equal(canTalkToNurseryMentor(s),false);}});

test('the egg-nursery guide explains both dresser and below-game person designers',()=>{const section=NURSERY_GUIDE.find(s=>s.title==='Dress at your dresser');assert.ok(section);for(const instruction of ['Walk up','click or tap','person designer','Back to the house','scroll below the game','save automatically'])assert.ok(section.text.includes(instruction),instruction);});
