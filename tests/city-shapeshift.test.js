import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../src/vendor/three/three.module.min.js';
import {createCityShapeshift,cityAnimalView,CITY_ANIMAL_ART} from '../src/city-shapeshift-3d.js';
import {CITY_ANIMALS,cityMovementSpeed,CITY_ANIMAL_MOVEMENT} from '../src/city-powers.js';
test('animal photographs select the correct front, back and side views as the camera or animal turns',()=>{
 assert.equal(cityAnimalView(0,0),0);assert.equal(cityAnimalView(0,Math.PI),2);assert.equal(cityAnimalView(0,Math.PI/2),3);assert.equal(cityAnimalView(0,-Math.PI/2),1);assert.equal(cityAnimalView(Math.PI,0),2);assert.equal(cityAnimalView(Math.PI/2,Math.PI/2),0);
});
test('all six photographs load once, animate only while running, and stay out of interiors',()=>{
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(),materials=new Map(),geometries=new Map(),requests=[];
 camera.position.set(3,2,8);
 const material=(k,o)=>{if(!materials.has(k))materials.set(k,new T.MeshStandardMaterial(o));return materials.get(k);},geo=(k,f)=>{if(!geometries.has(k))geometries.set(k,f());return geometries.get(k);};
 const view=createCityShapeshift(T,scene,material,geo,camera,{loadTexture:(url,ready)=>requests.push({url,ready})}),args={mode:'walk',player:{x:3,z:4,angle:0},moving:true,dt:.04,powers:{shapeshift:30,animal:'tiger'}};
 for(const animal of CITY_ANIMALS){args.powers.animal=animal;assert.equal(view.render(args),false,'Keep person visible during loading');assert.equal(requests.at(-1).url,CITY_ANIMAL_ART[animal]);requests.at(-1).ready(new T.Texture({width:2048,height:1024}));assert.equal(view.render(args),true);const root=scene.getObjectByName('city-shapeshift');assert.equal(root.children.filter(c=>c.visible).length,1);const model=root.children.find(c=>c.visible);assert.equal(model.name,'shapeshift-'+animal);assert.equal(model.userData.view,0);assert.equal(root.position.x,3);
 const walk=model.getObjectByName('animal-walking-photograph'),poses=[],originalGeometry=Array.from(walk.geometry.attributes.position.array),originalScale=walk.scale.clone();for(let i=0;i<30;i++){args.player.z+=.4;camera.position.z=args.player.z+4;view.render({...args,dt:.08});poses.push(walk.visible);assert.deepEqual(Array.from(walk.geometry.attributes.position.array),originalGeometry,'Walking must not bend or jiggle the artwork');assert.deepEqual(walk.scale,originalScale,'Walking must not pulse the animal size');}assert.ok(new Set(poses).size===2);const stillGeometry=Array.from(walk.geometry.attributes.position.array);view.render({...args,moving:false,dt:0});assert.deepEqual(Array.from(walk.geometry.attributes.position.array),stillGeometry,'Pause must keep the artwork still');const before={opacity:walk.material.opacity,y:walk.position.y,scale:walk.scale.y};view.render({...args,dt:0});assert.deepEqual({opacity:walk.material.opacity,y:walk.position.y,scale:walk.scale.y},before);camera.position.z=args.player.z+4;args.player.angle=Math.PI;view.render(args);assert.equal(model.userData.view,2);assert.ok(walk.material.map.offset.x>=.5&&walk.material.map.offset.x<.76);args.player.angle=0;camera.position.z=args.player.z+4;
 }
 args.powers.animal='tiger';view.render(args);assert.equal(requests.length,6);for(const extra of [{interior:{}},{fire:{}},{mode:'build'}])assert.equal(view.render({...args,...extra}),false);args.powers.shapeshift=0;assert.equal(view.render(args),false);view.dispose();assert.equal(scene.getObjectByName('city-shapeshift'),undefined);for(const m of materials.values())m.dispose();for(const g of geometries.values())g.dispose();
});
test('closing during image loading disposes the late image without recreating the animal',()=>{
 const scene=new T.Scene();let ready;const geometry=new T.PlaneGeometry(),view=createCityShapeshift(T,scene,()=>new T.MeshBasicMaterial(),()=>geometry,null,{loadTexture:(_,callback)=>{ready=callback;}});view.render({mode:'walk',player:{x:0,z:0},powers:{shapeshift:10,animal:'cat'},dt:0});view.dispose();const sheet=new T.Texture();let disposed=false;sheet.addEventListener('dispose',()=>disposed=true);ready(sheet);assert.equal(disposed,true);assert.equal(scene.getObjectByName('city-shapeshift'),undefined);geometry.dispose();
});

test('animals travel faster than people with species-specific speeds and preserve other movement modes',()=>{
 const human=cityMovementSpeed();for(const animal of CITY_ANIMALS){const powers={shapeshift:30,animal};assert.ok(cityMovementSpeed({powers})>human);assert.ok(CITY_ANIMAL_MOVEMENT[animal].stride>0);assert.equal(cityMovementSpeed({powers,interior:true}),3.1);assert.equal(cityMovementSpeed({powers,swimming:true}),2.3);assert.equal(cityMovementSpeed({powers,altitude:2}),7);assert.equal(cityMovementSpeed({powers:{...powers,speed:30}}),10.5);assert.equal(cityMovementSpeed({powers:{...powers,shapeshift:0}}),human);}
 assert.ok(cityMovementSpeed({powers:{shapeshift:30,animal:'tiger'}})>cityMovementSpeed({powers:{shapeshift:30,animal:'elephant'}}));
});
