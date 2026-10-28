import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../src/vendor/three/three.module.min.js';
import {createCityShapeshift,cityAnimalView,CITY_ANIMAL_ART} from '../src/city-shapeshift-3d.js';
import {CITY_ANIMALS} from '../src/city-powers.js';
test('animal photographs select the correct front, back and side views as the camera or animal turns',()=>{
 assert.equal(cityAnimalView(0,0),0);assert.equal(cityAnimalView(0,Math.PI),2);assert.equal(cityAnimalView(0,Math.PI/2),3);assert.equal(cityAnimalView(0,-Math.PI/2),1);assert.equal(cityAnimalView(Math.PI,0),2);assert.equal(cityAnimalView(Math.PI/2,Math.PI/2),0);
});
test('all six photographs load once, animate only while running, and stay out of interiors',()=>{
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(),materials=new Map(),geometries=new Map(),requests=[];
 camera.position.set(3,2,8);
 const material=(k,o)=>{if(!materials.has(k))materials.set(k,new T.MeshStandardMaterial(o));return materials.get(k);},geo=(k,f)=>{if(!geometries.has(k))geometries.set(k,f());return geometries.get(k);};
 const view=createCityShapeshift(T,scene,material,geo,camera,{loadTexture:(url,ready)=>requests.push({url,ready})}),args={mode:'walk',player:{x:3,z:4,angle:0},moving:true,dt:.04,powers:{shapeshift:30,animal:'tiger'}};
 for(const animal of CITY_ANIMALS){args.powers.animal=animal;assert.equal(view.render(args),false,'Keep person visible during loading');assert.equal(requests.at(-1).url,CITY_ANIMAL_ART[animal]);requests.at(-1).ready(new T.Texture({width:2048,height:1024}));assert.equal(view.render(args),true);const root=scene.getObjectByName('city-shapeshift');assert.equal(root.children.filter(c=>c.visible).length,1);const model=root.children.find(c=>c.visible);assert.equal(model.name,'shapeshift-'+animal);assert.equal(model.userData.view,0);assert.equal(root.position.x,3);
 const walk=model.getObjectByName('animal-walking-photograph'),poses=[];for(let i=0;i<30;i++){view.render({...args,dt:.08});poses.push(walk.visible);}assert.ok(new Set(poses).size===2);const before={opacity:walk.material.opacity,y:walk.position.y,scale:walk.scale.y};view.render({...args,dt:0});assert.deepEqual({opacity:walk.material.opacity,y:walk.position.y,scale:walk.scale.y},before);args.player.angle=Math.PI;view.render(args);assert.equal(model.userData.view,2);assert.ok(walk.material.map.offset.x>=.5&&walk.material.map.offset.x<.76);args.player.angle=0;
 }
 args.powers.animal='tiger';view.render(args);assert.equal(requests.length,6);for(const extra of [{interior:{}},{fire:{}},{mode:'build'}])assert.equal(view.render({...args,...extra}),false);args.powers.shapeshift=0;assert.equal(view.render(args),false);view.dispose();assert.equal(scene.getObjectByName('city-shapeshift'),undefined);for(const m of materials.values())m.dispose();for(const g of geometries.values())g.dispose();
});
test('closing during image loading disposes the late image without recreating the animal',()=>{
 const scene=new T.Scene();let ready;const geometry=new T.PlaneGeometry(),view=createCityShapeshift(T,scene,()=>new T.MeshBasicMaterial(),()=>geometry,null,{loadTexture:(_,callback)=>{ready=callback;}});view.render({mode:'walk',player:{x:0,z:0},powers:{shapeshift:10,animal:'cat'},dt:0});view.dispose();const sheet=new T.Texture();let disposed=false;sheet.addEventListener('dispose',()=>disposed=true);ready(sheet);assert.equal(disposed,true);assert.equal(scene.getObjectByName('city-shapeshift'),undefined);geometry.dispose();
});
