import test from 'node:test';
import assert from 'node:assert/strict';
import {cityHomeStyle,cityActivityPose,cityPetPose} from '../src/city-interiors.js';

test('neighboring homes have different interests and keep them after reload or map growth',()=>{
  const profiles=Array.from({length:6},(_,x)=>cityHomeStyle(12,24+x));
  assert.equal(new Set(profiles.map(p=>p.theme)).size,6);
  for(let z=0;z<8;z++)for(let x=0;x<8;x++){
    assert.deepEqual(cityHomeStyle(12,z*12+x),cityHomeStyle(20,z*20+x));
    assert.deepEqual(cityHomeStyle(12,z*12+x),cityHomeStyle(12,z*12+x));
    assert.notEqual(cityHomeStyle(12,z*12+x).theme,cityHomeStyle(12,z*12+x+1).theme);
  }
});
test('every resident activity moves over time, with offset rhythms for different residents',()=>{
  for(const activity of ['eat','drink','type','write','paint','serve','read','water','watch']){
    const start=cityActivityPose(activity,0);
    assert.notDeepEqual(start,cityActivityPose(activity,.8));
    assert.notDeepEqual(start,cityActivityPose(activity,0,2));
    assert.ok(Object.values(cityActivityPose(activity,1e5)).every(Number.isFinite));
  }
  const typing=cityActivityPose('type',.2);assert.notEqual(typing.left,typing.right);
});
test('pets roam the open center aisle and animate their legs and tails',()=>{
  let previous=cityPetPose(0),distance=0;
  for(let t=.05;t<30;t+=.05){
    const pose=cityPetPose(t);
    assert.ok(pose.x>=-.2&&pose.x<=.7&&Math.abs(pose.z)<=1.7);
    distance+=Math.hypot(pose.x-previous.x,pose.z-previous.z);previous=pose;
  }
  assert.ok(distance>10);assert.notEqual(cityPetPose(0).stride,cityPetPose(.1).stride);assert.notEqual(cityPetPose(0).tail,cityPetPose(.1).tail);
});
