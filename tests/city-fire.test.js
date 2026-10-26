import test from 'node:test';
import assert from 'node:assert/strict';
import {createCityFireTrip,cityTickFireTrip,cityNearTruck} from '../src/city-fire.js';
test('firefighting starts fresh, moves and steers, sprays only forward, and ends at one minute',()=>{
 const trip=createCityFireTrip();assert.equal(trip.remaining,60);assert.equal(trip.fires.length,8);assert.equal(cityNearTruck({x:0,z:.7}),true);assert.equal(cityNearTruck({x:0,z:5}),false);
 for(let i=0;i<50;i++)cityTickFireTrip(trip,.04,{spray:true});assert.equal(trip.fires[0].health,0);assert.equal(trip.extinguished,1);assert.equal(trip.fires[4].health,1);
 const oldZ=trip.z;for(let i=0;i<20;i++)cityTickFireTrip(trip,.04,{up:true,left:true});assert.ok(trip.z<oldZ);assert.notEqual(trip.angle,Math.PI);
 for(let i=0;i<1600;i++)cityTickFireTrip(trip,.04,{up:true,spray:true});assert.equal(trip.remaining,0);assert.equal(trip.spraying,false);assert.equal(trip.speed,0);assert.ok(Math.abs(trip.x)<=32&&Math.abs(trip.z)<=32);
 const saved=structuredClone(trip);cityTickFireTrip(trip,1,{up:true});assert.deepEqual(trip,saved);assert.equal(createCityFireTrip().fires[0].health,1);
});
test('victory requires every fire to be out',async()=>{
 const {cityFireTripWon}=await import('../src/city-fire.js');const trip=createCityFireTrip();trip.extinguished=8;assert.equal(cityFireTripWon(trip),false);for(const fire of trip.fires)fire.health=0;assert.equal(cityFireTripWon(trip),true);trip.fires[7].health=.01;assert.equal(cityFireTripWon(trip),false);
});
