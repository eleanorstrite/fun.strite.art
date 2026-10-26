import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../src/vendor/three/three.module.min.js';
import {createCityMagic} from '../src/city-magic-3d.js';
test('magic renders distinct bounded effects, pauses, survives avatar edits, and cleans up',()=>{
 const scene=new T.Scene(),avatar=new T.Group(),materials=new Map(),geometries=new Map();scene.add(avatar);
 const material=(key,options)=>{if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial(options));return materials.get(key);};const geo=(key,make)=>{if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);};
 const magic=createCityMagic(T,scene,avatar,material,geo),player={x:2,z:2,angle:0,altitude:0},powers={flight:60,speed:60,flowers:60};
 const wings=scene.getObjectByName('golden-flight-wings'),trail=scene.getObjectByName('golden-speed-contrail'),garden=scene.getObjectByName('rainbow-magic-garden');assert.equal(wings.visible,false);
 for(let i=0;i<80;i++)magic.growFlower(i,0);assert.equal(garden.children.length,70);
 magic.render({player,powers,moving:true,interior:null,mode:'walk',dt:.1});assert.ok(trail.children.some(p=>p.visible));assert.ok(scene.getObjectByName('golden-speed-shimmer').visible);
 const scale=garden.children[0].scale.x,positions=trail.children.slice(0,100).map(p=>p.position.toArray());magic.render({player,powers,moving:true,interior:null,mode:'walk',dt:0});assert.equal(garden.children[0].scale.x,scale);assert.deepEqual(trail.children.slice(0,100).map(p=>p.position.toArray()),positions);
 player.altitude=5;magic.render({player,powers,moving:true,interior:null,mode:'walk',dt:.1});assert.equal(wings.visible,true);
 magic.render({player,powers,moving:false,interior:{},mode:'walk',dt:.1});assert.equal(wings.visible,false);assert.equal(garden.visible,false);assert.equal(trail.visible,false);
 avatar.clear();magic.reattach();assert.equal(wings.parent,avatar);magic.dispose();assert.equal(scene.children.length,1);assert.equal(avatar.children.length,0);
 for(const value of materials.values())value.dispose();for(const value of geometries.values())value.dispose();
});
