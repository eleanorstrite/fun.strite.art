import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../src/vendor/three/three.module.min.js';
import {createFireGraphics} from '../src/city-fire-3d.js';
import {createCityFireTrip,cityTickFireTrip} from '../src/city-fire.js';
test('cab hides the parked truck windshield, renders the field and water, then restores the truck',()=>{
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(),materials=new Map(),geometries=new Map();
 const material=(k,o)=>{if(!materials.has(k))materials.set(k,new T.MeshStandardMaterial(o));return materials.get(k);},geo=(k,make)=>{if(!geometries.has(k))geometries.set(k,make());return geometries.get(k);};
 const graphics=createFireGraphics(scene,camera,material,geo),room=new T.Group();scene.add(room);const engine=graphics.truck(room);
 engine.group.traverse(object=>{if(object.isMesh)assert.equal(object.userData.animated,true,'truck parts must stay out of permanent room batches');});
 graphics.render({phase:'cab',trip:null});assert.equal(engine.group.visible,false);assert.equal(camera.getObjectByName('fire-truck-cab').visible,true);assert.equal(scene.getObjectByName('firefighting-grass-field').visible,false);
 const trip=createCityFireTrip();cityTickFireTrip(trip,.1,{spray:true});graphics.render({phase:'drive',trip});assert.equal(scene.getObjectByName('firefighting-grass-field').visible,true);assert.equal(scene.getObjectByName('fire-truck-water-spray').visible,true);assert.equal(camera.position.x,trip.x);
 graphics.render(null);assert.equal(engine.group.visible,true);assert.equal(camera.getObjectByName('fire-truck-cab').visible,false);assert.equal(scene.getObjectByName('firefighting-grass-field').visible,false);graphics.dispose();assert.equal(scene.getObjectByName('firefighting-grass-field'),undefined);
 for(const m of materials.values())m.dispose();for(const g of geometries.values())g.dispose();
});
test('timeout fills the field with flames and a sad firefighter, then clears for a retry or victory',()=>{
 const saved=globalThis.document;globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({clearRect(){},beginPath(){},roundRect(){},fill(){},moveTo(){},lineTo(){},fillText(){}})})};
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(),materials=new Map(),geometries=new Map();
 const material=(k,o)=>{if(!materials.has(k))materials.set(k,new T.MeshStandardMaterial(o));return materials.get(k);},geo=(k,make)=>{if(!geometries.has(k))geometries.set(k,make());return geometries.get(k);};
 const graphics=createFireGraphics(scene,camera,material,geo),trip=createCityFireTrip();
 try{
  graphics.render({phase:'drive',trip});graphics.render({phase:'failure',trip,clipTime:1.5});
  const flames=scene.getObjectByName('timeout-grass-fire'),bubble=scene.getObjectByName('fire-victory-speech'),frown=scene.getObjectByName('sad-firefighter-mouth');
  assert.ok(flames.visible&&flames.count>1100);assert.equal(bubble.userData.text,'Try again.');assert.ok(bubble.visible&&frown.visible);assert.ok(scene.getObjectByName('victory-firefighter').position.x>1.5);assert.equal(scene.getObjectByName('fire-truck-water-spray').visible,false);
  graphics.render(null);assert.equal(flames.visible,false);assert.equal(scene.getObjectByName('firefighting-grass-field').visible,false);
  graphics.render({phase:'drive',trip:createCityFireTrip()});assert.equal(flames.visible,false);
  graphics.render({phase:'victory',trip,clipTime:1});assert.equal(frown.visible,false);assert.equal(bubble.userData.text,'Hooray! You saved the town!');assert.equal(flames.visible,false);
 }finally{graphics.dispose();for(const m of materials.values())m.dispose();for(const g of geometries.values())g.dispose();if(saved===undefined)delete globalThis.document;else globalThis.document=saved;}
});
