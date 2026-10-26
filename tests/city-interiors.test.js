import test from 'node:test';
import assert from 'node:assert/strict';
import {cityHomeStyle,cityActivityPose,cityFurnitureAt} from '../src/city-interiors.js';

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
test('furniture activates on contact, skips occupied seats, and leaves ordinary tables solid',()=>{
  const chair={x:0,z:0,w:.65,d:.65,use:{pose:'sit',x:0,z:0}},table={x:3,z:0,w:2,d:2};
  assert.equal(cityFurnitureAt([chair,table],{x:0,z:.7},{x:0,z:.5}),chair.use);
  assert.equal(cityFurnitureAt([chair],{x:0,z:2},{x:0,z:1}),null);
  assert.equal(cityFurnitureAt([chair],{x:0,z:0},{x:0,z:.1}),null);
  chair.use.occupied=true;assert.equal(cityFurnitureAt([chair],{x:0,z:.7},{x:0,z:.5}),null);
  assert.equal(cityFurnitureAt([table],{x:3,z:1.4},{x:3,z:1.1}),null);
});

test('furniture accepts close and glancing contact before solid collisions',()=>{
  const chair={x:0,z:0,w:.65,d:.65,use:{pose:'sit',x:0,z:0}};
  assert.equal(cityFurnitureAt([chair],{x:0,z:.66},{x:0,z:.61}),chair.use);
  assert.equal(cityFurnitureAt([chair],{x:.61,z:.42},{x:.58,z:.41}),chair.use);
  assert.equal(cityFurnitureAt([chair],{x:0,z:.61},{x:0,z:.66}),null);
  const bed={x:3,z:-3,w:2.5,d:3.4,use:{pose:'lie',x:3,z:-2}};
  for(const [from,to] of [[{x:4.7,z:-3},{x:4.55,z:-3}],[{x:1.3,z:-3},{x:1.45,z:-3}],[{x:3,z:-1},{x:3,z:-1.1}],[{x:3,z:-5},{x:3,z:-4.9}]])assert.equal(cityFurnitureAt([bed],from,to),bed.use);
});
test('occupied dining chairs direct the player to the free seat at the same table',()=>{
  const occupied={x:0,z:0,w:.65,d:.65,use:{pose:'sit',x:0,z:0,occupied:true,mealId:1}};
  const free={x:0,z:2,w:.65,d:.65,use:{pose:'sit',x:0,z:2,mealId:1}};
  assert.equal(cityFurnitureAt([occupied,free],{x:0,z:-.7},{x:0,z:-.6}),free.use);
  free.use.occupied=true;assert.equal(cityFurnitureAt([occupied,free],{x:0,z:-.7},{x:0,z:-.6}),null);
});
test('repeat pet-owner and artist homes get different breeds, coats, and paintings',()=>{
  for(const [offset,key] of [[1,'cat'],[2,'dog'],[3,'painting']]){
    const styles=[offset,offset+6,offset+12,120+offset].map(index=>cityHomeStyle(20,index));
    assert.equal(new Set(styles.map(style=>style.theme)).size,1);
    assert.equal(new Set(styles.map(style=>typeof style[key]==='string'?style[key]:style[key].name)).size,4);
    if(key!=='painting')assert.equal(new Set(styles.map(style=>style[key].fur)).size,4);
  }
});
