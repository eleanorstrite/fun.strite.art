import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../src/vendor/three/three.module.min.js';
import {createCityShapeshift} from '../src/city-shapeshift-3d.js';
import {CITY_ANIMALS} from '../src/city-powers.js';
test('six animated animal forms replace the player only during outdoor magic and clean up',()=>{
 const scene=new T.Scene(),materials=new Map(),geometries=new Map();const material=(k,o)=>{if(!materials.has(k))materials.set(k,new T.MeshStandardMaterial(o));return materials.get(k);},geo=(k,f)=>{if(!geometries.has(k))geometries.set(k,f());return geometries.get(k);};const view=createCityShapeshift(T,scene,material,geo),args={mode:'walk',player:{x:3,z:4,angle:1},moving:true,dt:.04,powers:{shapeshift:30,animal:'tiger'}};
 for(const animal of CITY_ANIMALS){args.powers.animal=animal;assert.equal(view.render(args),true);const root=scene.getObjectByName('city-shapeshift');assert.equal(root.children.filter(c=>c.visible).length,1);assert.equal(root.children.find(c=>c.visible).name,'shapeshift-'+animal);assert.equal(root.position.x,3);assert.equal(root.rotation.y,1);}
 assert.equal(view.render({...args,interior:{}}),false);assert.equal(view.render({...args,fire:{}}),false);assert.equal(view.render({...args,mode:'build'}),false);args.powers.shapeshift=0;assert.equal(view.render(args),false);view.dispose();assert.equal(scene.getObjectByName('city-shapeshift'),undefined);for(const m of materials.values())m.dispose();for(const g of geometries.values())g.dispose();
});
