import test from 'node:test';
import assert from 'node:assert/strict';
import {createCityState,cityDoor,cityPath,cityCanWalk} from '../src/city-builder.js';
import {seedCozyTown,COZY_TOWN_BUILDINGS} from '../src/city-cozy-town.js';
test('a fresh cozy town contains every enterable building with reachable front doors',()=>{const s=createCityState();assert.equal(seedCozyTown(s),true);for(const id of COZY_TOWN_BUILDINGS){const index=s.tiles.indexOf(id);assert.ok(index>=0,id);const door=cityDoor(s,index);assert.equal(cityCanWalk(s,door.x,door.z),true);assert.ok(cityPath(s,{x:.5,z:.5},door).length>0,id+' can be reached without walking through a wall');}assert.equal(s.history.length,0);});
test('cozy town seeding never replaces existing player construction',()=>{const s=createCityState();s.tiles[20]='cottage';s.person.jacket='#123456';const before=JSON.stringify(s);assert.equal(seedCozyTown(s),false);assert.equal(JSON.stringify(s),before);const small=createCityState('{"size":8}');assert.equal(seedCozyTown(small),false);assert.equal(small.tiles.filter(Boolean).length,0);});
