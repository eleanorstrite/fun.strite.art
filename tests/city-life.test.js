import test from 'node:test';
import assert from 'node:assert/strict';
import {citySip,cityRoomClear,cityRoomRoute,createCityRoamer,cityRoam,createCityRoutine,cityTickRoutine,cityBedReaction} from '../src/city-life.js';
const furniture=[{x:-3,z:0,w:3.3,d:1.2},{x:-3,z:2,w:1.5,d:1.2},{x:3,z:-3,w:2.5,d:3.4},{x:5,z:-1,w:1.3,d:.7}];
test('sips lift smoothly, hold at the mouth, then return to the table',()=>{
  assert.equal(citySip(0),0);assert.equal(citySip(3),1);assert.equal(citySip(3.8),1);assert.equal(citySip(6),0);assert.ok(citySip(2)>0&&citySip(2)<1);assert.equal(citySip(2),citySip(9));
});
test('pets explore several parts of a furnished room, pause, and avoid solid furniture',()=>{
  const pet=createCityRoamer(3),regions=new Set();let stopped=0;
  for(let i=0;i<4000;i++){cityRoam(pet,.05,furniture);assert.ok(cityRoomClear(pet,furniture,.3));regions.add(`${Math.floor(pet.x/2)},${Math.floor(pet.z/2)}`);if(!pet.moving)stopped++;}
  assert.ok(regions.size>10);assert.ok(stopped>50);assert.ok(stopped<3900);
});
test('a couch owner stands, routes to the fridge, retrieves a snack and sits again',()=>{
  const owner=createCityRoutine('home',{x:-3,z:0,angle:0}),stages=new Set();let returned=false;
  for(let i=0;i<1800;i++){cityTickRoutine(owner,.05,furniture);stages.add(owner.stage);if(['outbound','returning','fridge'].includes(owner.stage))assert.ok(cityRoomClear(owner,furniture));if(stages.has('fridge')&&owner.stage==='seated'){returned=true;break;}}
  for(const stage of ['standing','outbound','fridge','returning','sitting'])assert.ok(stages.has(stage),stage);assert.ok(returned);assert.equal(owner.x,-3);assert.equal(owner.z,0);
});
test('cafe patrons alternate laptop use or exit visits, and never reclaim a player-occupied seat',()=>{
  const laptop=createCityRoutine('laptop',{x:2,z:-1}),visitor=createCityRoutine('leave',{x:-3,z:2}),chairs=[{x:-3,z:2,w:.65,d:.65}];let typed=false,left=false;
  for(let i=0;i<1200;i++){cityTickRoutine(laptop,.05,[]);cityTickRoutine(visitor,.05,chairs,[],true);typed ||= laptop.stage==='typing';left ||= visitor.stage==='away';}
  assert.ok(typed);assert.ok(left);assert.equal(visitor.stage,'waiting');
  for(let i=0;i<25;i++)cityTickRoutine(visitor,.05,chairs,[],false);assert.equal(visitor.stage,'seated');
});
test('routing cannot cross a wall and bed protests apply only while resting in a home bed',()=>{
  assert.deepEqual(cityRoomRoute({x:-2,z:0},{x:2,z:0},[{x:0,z:0,w:.5,d:20}]),[]);
  for(const [theme,cue] of [['dog','dog'],['cat','cat'],['artist','owner']]){assert.equal(cityBedReaction(theme,{pose:'lie'}),cue);assert.equal(cityBedReaction(theme,{pose:'sit'}),null);assert.equal(cityBedReaction(theme,null),null);}
  assert.equal(cityBedReaction(null,{pose:'lie'}),null);
});
