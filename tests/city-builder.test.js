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
