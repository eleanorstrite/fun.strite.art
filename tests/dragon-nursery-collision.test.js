import test from 'node:test';
import assert from 'node:assert/strict';
import {createNurseryCollisions,routeNurseryGoal} from '../src/dragon-nursery-collision.js';
import {nurseryHouseContact,nurseryHouseApproach} from '../src/dragon-nursery-house.js';
function garden(){const c=createNurseryCollisions();c.add({name:'tree',x:0,z:0,radius:.25});c.add({name:'bath',x:7,z:-1,rx:1.4,rz:.9});c.add({name:'cottage',left:-4,right:4,back:-10,front:-4});return c;}
test('trunks, oval bathtub and house stop the whole body, including long steps',()=>{const c=garden();for(const [from,delta] of [[{x:0,z:3},{x:0,z:-6}],[{x:7,z:3},{x:0,z:-6}],[{x:2,z:0},{x:0,z:-12}]]){const p=c.move(from,delta);assert.equal(c.blocked(p),false);assert.ok(p.z> (from.x===7?.17:from.x===2?-3.73:.52));}});
test('obstacles allow sliding along their sides without cutting through corners',()=>{const c=createNurseryCollisions();c.add({left:0,right:2,back:-5,front:5});let p={x:-1,z:0};for(let i=0;i<40;i++)p=c.move(p,{x:.15,z:.1});assert.ok(p.x<=-.279);assert.ok(p.z>3.9);assert.equal(c.blocked(p),false);});
test('tap routes go around trees, bath and cottage using collision-free segments',()=>{const c=garden();for(const [start,end] of [[{x:0,z:3},{x:0,z:-2}],[{x:7,z:3},{x:7,z:-4}],[{x:0,z:-14},{x:0,z:-2.6}]]){const path=c.path(start,end);assert.ok(path?.length);let previous=start;for(const p of path){assert.ok(c.clear(previous,p));previous=p;}assert.deepEqual(previous,end);}});
test('blocked tap destinations resolve to the edge and retain actions and following goals',()=>{const c=garden(),next={x:5,z:5,action:'feed'},goal=routeNurseryGoal(c,{x:0,z:3},{x:0,z:0,action:'pet',next},false);let end=goal;while(end.next!==next)end=end.next;assert.equal(end.action,'pet');assert.equal(c.blocked(end),false);assert.equal(routeNurseryGoal(c,{x:0,z:3},goal,false),goal);});
test('indoor furniture is solid but doorway and appliance approaches stay usable',()=>{const c=createNurseryCollisions();c.add({inside:true,name:'bed',left:-4.35,right:-1.65,back:-4.1,front:.1});c.add({inside:true,name:'table',left:-1.4,right:-.6,back:-3.775,front:-2.925});c.add({inside:true,name:'sink',left:2.53,right:5.47,back:-4.11,front:-2.99});c.add({inside:true,name:'fridge',left:3.8,right:5.4,back:.425,front:1.86});c.add({inside:true,name:'dresser',left:-5.4,right:-4.28,back:.9,front:3.1});
 const p=c.move({x:0,z:-1},{x:-4,z:0},true);assert.ok(p.x> -1.38);assert.equal(nurseryHouseContact({inside:true,player:p}),'sleep');
 const t=c.move({x:-1,z:-1},{x:0,z:-3},true);assert.ok(t.z> -2.65);
 for(const point of [{x:0,z:3.9},{x:-3.7,z:2},{x:4,z:-2.2},{x:4.4,z:2.7}]){assert.equal(c.blocked(point,true),false);assert.ok(c.path({x:0,z:2},point,true));}
 assert.equal(c.blocked({x:-3,z:-1},false),false);
});
test('a saved position inside an object recovers to nearby open ground',()=>{const c=garden(),p=c.move({x:0,z:0},{x:0,z:0});assert.equal(c.blocked(p),false);assert.ok(Math.hypot(p.x,p.z)<.7);});

test('the front porch has a direct doorway approach without a trip around the cottage',()=>{assert.deepEqual(nurseryHouseApproach({x:2,z:-3.7}),[{x:0,z:-2.6,action:'house'}]);});
