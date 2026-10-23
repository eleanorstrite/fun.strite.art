import test from 'node:test';
import assert from 'node:assert/strict';
import { CITY_ITEMS, CITY_CATEGORIES, createCityState, cityPlace, cityUndo, cityPoint, cityCell } from '../src/city-builder.js';
test('every city category offers buildings or scenery',()=>{
  for(const category of Object.keys(CITY_CATEGORIES))assert.ok(Object.values(CITY_ITEMS).some(item=>item.category===category));
});
test('place, replace, erase and undo preserve the previous plot',()=>{
  const state=createCityState();assert.equal(state.tiles.length,144);
  assert.equal(cityPlace(state,3,4,'cottage'),true);
  assert.equal(cityPlace(state,3,4,'cottage'),false);
  cityPlace(state,3,4,'glass');cityPlace(state,3,4,null);
  assert.equal(state.tiles[51],null);cityUndo(state);assert.equal(state.tiles[51],'glass');
  cityUndo(state);assert.equal(state.tiles[51],'cottage');cityUndo(state);assert.equal(state.tiles[51],null);
  assert.equal(cityUndo(state),false);
});
test('city saves reload, and malformed saves cannot introduce invalid buildings',()=>{
  const state=createCityState();cityPlace(state,0,0,'hospital');cityPlace(state,11,11,'road');
  assert.deepEqual(createCityState(JSON.stringify(state)).tiles,state.tiles);
  assert.equal(createCityState('{bad').tiles.filter(Boolean).length,0);
  assert.equal(createCityState('{"tiles":["unknown","park"]}').tiles[0],null);
  assert.equal(createCityState('{"tiles":["unknown","park"]}').tiles[1],'park');
});
test('isometric hit testing identifies every tile center',()=>{
  for(let y=0;y<12;y++)for(let x=0;x<12;x++){const p=cityPoint(x+.5,y+.5);assert.deepEqual(cityCell(p.x,p.y),{x,y});}
});
test('off-map and invalid placements do not change the city',()=>{
  const state=createCityState();for(const [x,y,tool] of [[-1,0,'road'],[12,2,'road'],[2,12,'road'],[0,0,'fake'],[.5,0,'road']])assert.equal(cityPlace(state,x,y,tool),false);
  assert.equal(state.history.length,0);assert.equal(state.tiles.filter(Boolean).length,0);
});

test('map size and setting migrate safely and preserve plots when growing',async()=>{
  const {cityResize,citySerialize}=await import('../src/city-builder.js');
  const state=createCityState('{"tiles":["cafe"]}');assert.equal(state.size,12);assert.equal(state.theme,'city');
  cityPlace(state,11,11,'hospital');assert.equal(cityResize(state,20),true);
  assert.equal(state.tiles[0],'cafe');assert.equal(state.tiles[11*20+11],'hospital');
  assert.equal(cityResize(state,8),false);assert.equal(state.size,20);
  assert.equal(cityResize(state,8,true),true);assert.equal(state.tiles[0],'cafe');assert.equal(state.history.length,0);
  state.theme='country';state.person.accessory='scarf';state.person.pants='#123456';
  const restored=createCityState(citySerialize(state));assert.equal(restored.theme,'country');assert.equal(restored.size,8);assert.equal(restored.person.accessory,'scarf');assert.equal(restored.person.pants,'#123456');
});
test('invalid appearance and map options fall back to safe defaults',()=>{
  const state=createCityState('{"size":99999,"theme":"bad","person":{"skin":"invalid","outfit":"invalid","accessory":"invalid"}}');
  assert.equal(state.size,12);assert.equal(state.person.outfit,'jacket');assert.equal(state.person.accessory,'none');assert.match(state.person.skin,/^#[0-9a-f]{6}$/i);
});
test('walking respects building walls, water, map edges, and interior furniture',async()=>{
  const {cityCanWalk,cityDoor}=await import('../src/city-builder.js');const state=createCityState();cityPlace(state,0,0,'cafe');cityPlace(state,1,0,'pond');
  assert.equal(cityCanWalk(state,2.5,2.5),false);assert.equal(cityCanWalk(state,.5,.5),true);assert.equal(cityCanWalk(state,-1,1),false);assert.equal(cityCanWalk(state,7.5,2.5),false);
  const door=cityDoor(state,0);assert.equal(cityCanWalk(state,door.x,door.z),true);
  const room=[{x:0,z:0,w:2,d:2}];assert.equal(cityCanWalk(state,0,0,room),false);assert.equal(cityCanWalk(state,0,4,room),true);assert.equal(cityCanWalk(state,9,4,room),false);
});
test('tap walking routes around buildings to their front doors',async()=>{
  const {cityPath,cityCanWalk,cityDoor}=await import('../src/city-builder.js');const state=createCityState();
  cityPlace(state,0,0,'cafe');cityPlace(state,1,0,'glass');cityPlace(state,2,0,'townhouse');
  const path=cityPath(state,{x:.5,z:.5},cityDoor(state,2));assert.ok(path.length>0);
  for(const point of path)assert.equal(cityCanWalk(state,point.x,point.z),true);
  assert.deepEqual(path.at(-1),{x:12.5,z:4.5});
});
test('Play spawns at an accessible door, or on open ground for an empty map',async()=>{
  const {citySpawn,cityCanWalk}=await import('../src/city-builder.js');const state=createCityState();
  let spawn=citySpawn(state);assert.equal(cityCanWalk(state,spawn.x,spawn.z),true);
  cityPlace(state,2,3,'cafe');spawn=citySpawn(state);assert.deepEqual(spawn,{x:12.5,z:19.55});assert.equal(cityCanWalk(state,spawn.x,spawn.z),true);
});
