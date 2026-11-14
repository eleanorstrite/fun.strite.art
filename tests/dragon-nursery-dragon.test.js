import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../src/vendor/three/three.module.min.js';
import {nurseryDragon} from '../src/dragon-nursery-dragon.js';
import {DRAGON_COVER_IMAGE,DRAGON_COVER_PETS} from '../src/dragon-cover-parts.js';
import {GAME_COVERS} from '../src/game-covers.js';
const kit=()=>({loadCoverArt:async url=>{assert.equal(url,DRAGON_COVER_IMAGE);return new T.Texture();},loadModel(){throw Error('The cover pets must use the original picture, not replacement models.');}});

test('pet faces sample the same original image and pixels as the home-screen cover',async()=>{
 assert.ok(DRAGON_COVER_IMAGE.endsWith('/assets/game-covers/'+GAME_COVERS['dragon-adventures'].file));const dragon=nurseryDragon(new T.Scene(),kit());await dragon.ready;
 for(const [element,art]of Object.entries(DRAGON_COVER_PETS)){
  const root=dragon.group.getObjectByName(element+'-cover-dragon'),unit=2.4/(art.baseline-art.top);assert.ok(root);
  for(const part of art.parts){const mesh=root.getObjectByName(part.id+'-original-pixels'),position=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv;assert.equal(mesh.material.toneMapped,false);assert.equal(mesh.material.color.getHexString(),'ffffff');assert.equal(mesh.material.map.colorSpace,T.SRGBColorSpace);for(let i=0;i<position.count;i++){assert.ok(Math.abs(uv.getX(i)*1280-(position.getX(i)/unit+part.pivot[0]))<.001);assert.ok(Math.abs((1-uv.getY(i))*720-(part.pivot[1]-position.getY(i)/unit))<.001);}}
 }
 dragon.dispose();
});
test('every element keeps its face pixels and visible limbs during care, walking, flying, racing and growth',async()=>{
 const dragon=nurseryDragon(new T.Scene(),kit());await dragon.ready;
 for(const element of ['ember','river','fern'])for(const day of [2,6,7,16]){
  const root=dragon.group.getObjectByName(element+'-cover-dragon'),face=root.getObjectByName('face-original-pixels'),original=Array.from(face.geometry.attributes.uv.array);
  for(const [moving,riding,race]of [[false,false,false],[true,false,false],[false,true,false],[true,true,true]])for(let i=0;i<12;i++){dragon.animate(i*.1,moving,riding,element,day,race);assert.equal(root.visible,true);assert.equal(dragon.group.userData.stage,day>=7?'adult':'baby');assert.deepEqual(Array.from(face.geometry.attributes.uv.array),original);for(const other of Object.keys(DRAGON_COVER_PETS))assert.equal(dragon.group.getObjectByName(other+'-cover-dragon').visible,other===element);dragon.group.updateMatrixWorld(true);root.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));});}
  assert.ok(DRAGON_COVER_PETS[element].parts.filter(p=>p.kind==='paw').length<=4);
 }
 const {nurseryDragonProfile}=await import('../src/dragon-nursery-growth.js');const b=nurseryDragonProfile({egg:'river',day:2}),a=nurseryDragonProfile({egg:'river',day:7});assert.ok(a.scale>b.scale&&a.scale/b.scale<1.5);dragon.dispose();
});
test('pictured paws, wings and tails move while the art faces the camera from any walking direction',async()=>{
 const scene=new T.Scene(),dragon=nurseryDragon(scene,kit());await dragon.ready;const camera=new T.PerspectiveCamera();camera.position.set(4,3,-5);camera.lookAt(0,1,0);camera.updateMatrixWorld(true);
 for(const element of Object.keys(DRAGON_COVER_PETS)){const root=dragon.group.getObjectByName(element+'-cover-dragon');dragon.animate(.1,true,false,element,7);const paw=root.children.find(p=>p.name.includes('paw')),start=paw.position.clone();dragon.animate(.4,true,false,element,7);assert.ok(paw.position.distanceTo(start)>.001);dragon.animate(.1,false,true,element,7);const wing=root.getObjectByName('left-wing'),before=wing.scale.y;dragon.animate(.4,false,true,element,7);assert.ok(Math.abs(wing.scale.y-before)>.001);
  dragon.animate(.5,false,false,element,7);for(const heading of [0,1,Math.PI]){dragon.group.rotation.y=heading;scene.updateMatrixWorld(true);const mesh=root.getObjectByName('face-original-pixels');mesh.onBeforeRender(null,scene,camera);const q=root.parent.getWorldQuaternion(new T.Quaternion());assert.ok(q.angleTo(camera.getWorldQuaternion(new T.Quaternion()))<.00001);}}
 dragon.dispose();
});
test('disposing while cover art is loading releases the eventual texture without adding a pet',async()=>{
 let finish,disposed=0;const texture=new T.Texture();texture.addEventListener('dispose',()=>disposed++);const dragon=nurseryDragon(new T.Scene(),{loadCoverArt:()=>new Promise(resolve=>finish=resolve)});await Promise.resolve();dragon.dispose();finish(texture);await dragon.ready;assert.equal(disposed,1);assert.equal(dragon.group.getObjectByName('face-original-pixels'),undefined);
});
