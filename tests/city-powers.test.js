import test from 'node:test';
import assert from 'node:assert/strict';
import {createCityPowers,cityGrantPower,cityTickPowers,cityPowerMessage} from '../src/city-powers.js';
import {cityWalkCamera} from '../src/city-builder.js';
test('special foods grant distinct minute-long powers, stack, refresh, and expire',()=>{
 const powers=createCityPowers();assert.equal(cityGrantPower(powers,'bread'),null);assert.equal(cityPowerMessage(powers),'');
 assert.equal(cityGrantPower(powers,'galaxyShake'),'flight');assert.match(cityPowerMessage(powers),/Now fly! 60s/);
 cityTickPowers(powers,15);cityGrantPower(powers,'fruitCup');cityGrantPower(powers,'cake');assert.deepEqual(powers,{flight:45,speed:60,flowers:60});
 cityTickPowers(powers,45);assert.deepEqual(powers,{flight:0,speed:15,flowers:15});cityGrantPower(powers,'cake');assert.equal(powers.flowers,60);cityTickPowers(powers,60);assert.deepEqual(powers,createCityPowers());
});
test('flying camera keeps the same distance and rises with the character',()=>{
 const ground=cityWalkCamera({x:5,z:9},.7),air=cityWalkCamera({x:5,z:9,altitude:12},.7);
 assert.equal(air.position.y-ground.position.y,12);assert.equal(air.target.y-ground.target.y,12);assert.equal(air.position.x,ground.position.x);assert.equal(air.position.z,ground.position.z);
});
