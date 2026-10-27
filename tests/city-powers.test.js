import test from 'node:test';
import assert from 'node:assert/strict';
import {createCityPowers,cityGrantPower,cityTickPowers,cityPowerMessage} from '../src/city-powers.js';
import {cityWalkCamera} from '../src/city-builder.js';
test('special foods grant distinct 30-second powers, stack, refresh, and expire',()=>{
 const powers=createCityPowers();assert.equal(cityGrantPower(powers,'bread'),null);assert.equal(cityPowerMessage(powers),'');
 assert.equal(cityGrantPower(powers,'galaxyShake'),'flight');assert.match(cityPowerMessage(powers),/Now fly! 30s/);
 cityTickPowers(powers,15);cityGrantPower(powers,'fruitCup');cityGrantPower(powers,'cake');assert.deepEqual(powers,{...createCityPowers(),flight:15,speed:30,flowers:30});
 cityTickPowers(powers,15);assert.deepEqual(powers,{...createCityPowers(),flight:0,speed:15,flowers:15});cityGrantPower(powers,'cake');assert.equal(powers.flowers,30);cityTickPowers(powers,30);assert.deepEqual(powers,createCityPowers());
});
test('flying camera keeps the same distance and rises with the character',()=>{
 const ground=cityWalkCamera({x:5,z:9},.7),air=cityWalkCamera({x:5,z:9,altitude:12},.7);
 assert.equal(air.position.y-ground.position.y,12);assert.equal(air.target.y-ground.target.y,12);assert.equal(air.position.x,ground.position.x);assert.equal(air.position.z,ground.position.z);
});

test('white cake waits for outdoors, allows six forms and expires after 30 outdoor seconds',async()=>{
 const {CITY_ANIMALS,cityChooseAnimal}=await import('../src/city-powers.js');const p=createCityPowers();assert.equal(cityChooseAnimal(p,'cat'),false);assert.equal(cityGrantPower(p,'whiteCake'),'shapeshift');cityTickPowers(p,60,false);assert.equal(p.shapeshift,30);
 for(const animal of CITY_ANIMALS){assert.equal(cityChooseAnimal(p,animal),true);assert.equal(p.animal,animal);}assert.equal(cityChooseAnimal(p,'unknown'),false);cityTickPowers(p,10,true);assert.equal(p.shapeshift,20);cityTickPowers(p,60,false);assert.equal(p.shapeshift,20);cityTickPowers(p,20,true);assert.equal(p.shapeshift,0);assert.equal(cityChooseAnimal(p,'cat'),false);
});
