import test from 'node:test';
import assert from 'node:assert/strict';
import {createDragonPetBehavior,petPositionBlocked} from '../src/dragon-pet-behavior.js';
const state=()=>({player:{x:0,z:7},heading:Math.PI,inside:false});
test('an idle pet looks, pants, circles, hops and chases its tail independently',()=>{
 const s=state(),pet=createDragonPetBehavior(),moods=new Set();let maxJump=0,minX=99,maxX=-99;
 for(let i=0;i<1600;i++){const p=pet.update(s,.05,false);moods.add(p.mood);maxJump=Math.max(maxJump,p.jump);minX=Math.min(minX,p.position.x);maxX=Math.max(maxX,p.position.x);assert.ok(!petPositionBlocked(p.position.x,p.position.z));assert.ok(Math.hypot(p.position.x-s.player.x,p.position.z-s.player.z)<7);}
 for(const mood of ['look','pant','circle','hop','chase'])assert.ok(moods.has(mood),mood);assert.ok(maxJump>.2);assert.ok(maxX-minX>.8);
});
test('the pet follows with lag and turns gradually rather than mirroring player movement',()=>{
 const s=state(),pet=createDragonPetBehavior();let p=pet.update(s,.05),old={...p.position};s.heading=0;const turn=pet.update(s,.05,false);assert.ok(Math.hypot(turn.position.x-old.x,turn.position.z-old.z)<.05);
 let changed=false;for(let i=0;i<150;i++){s.player.x+=.04;const next=pet.update(s,.05,true),step=Math.hypot(next.position.x-p.position.x,next.position.z-p.position.z);assert.ok(step<.25);if(step>.005)changed=true;p=next;}assert.ok(changed);assert.ok(Math.hypot(p.position.x-s.player.x,p.position.z-s.player.z)<4);assert.ok(Math.hypot(p.position.x-s.player.x,p.position.z-s.player.z)>.3);
});
test('care, training, riding and sleep interrupt play; tapping the pet keeps it attentive',()=>{
 for(const key of ['careEffect','training','riding','activity','sleep','farewell']){const s=state(),pet=createDragonPetBehavior();pet.update(s,.05);s[key]=key==='sleep'?1:{};const p=pet.update(s,.08);for(let i=0;i<40;i++)assert.deepEqual(pet.update(s,.08).position,p.position);assert.equal(p.moving,false);assert.equal(p.jump,0);}
 const s=state(),pet=createDragonPetBehavior();pet.update(s,.05);pet.attend();const p=pet.update(s,.05);for(let i=0;i<40;i++)assert.equal(pet.update(s,.05).mood,'look');assert.equal(p.jump,0);
});
test('pet movement remains inside room bounds and avoids cottage and bath collision regions',()=>{
 assert.ok(petPositionBlocked(0,-8));assert.ok(petPositionBlocked(7,-1));const s=state(),pet=createDragonPetBehavior();s.inside=true;s.player={x:0,z:2};for(let i=0;i<1000;i++){const p=pet.update(s,.05);assert.ok(!petPositionBlocked(p.position.x,p.position.z,true));}
});

test('leaving a sink, fridge or bed activity puts the pet in free room space',()=>{
 for(const player of [{x:4,z:-3},{x:4.4,z:2.7},{x:-3,z:-1}]){const s={...state(),inside:true,player,activity:{}};const pet=createDragonPetBehavior();pet.update(s,.05);s.activity=null;const p=pet.update(s,.05);assert.ok(!petPositionBlocked(p.position.x,p.position.z,true));}
});

test('pet play begins promptly, includes happy expressions and stays close to a resting keeper',()=>{
 const s=state(),pet=createDragonPetBehavior();let firstHop=Infinity,maxDistance=0;const moods=new Set();
 for(let i=0;i<1000;i++){const p=pet.update(s,.04,false);moods.add(p.mood);if(p.jump>.1)firstHop=Math.min(firstHop,i*.04);maxDistance=Math.max(maxDistance,Math.hypot(p.position.x-s.player.x,p.position.z-s.player.z));if(p.mood==='grin')assert.equal(p.grin,1);}
 assert.ok(firstHop<3,'the pet should show life without a long wait');assert.ok(moods.has('grin'));assert.ok(maxDistance<3,'idle play remains beside the keeper');
});
