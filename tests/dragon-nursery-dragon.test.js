import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../src/vendor/three/three.module.min.js';
import {GLTFLoader} from '../src/vendor/three/addons/loaders/GLTFLoader.js';
import {nurseryDragon,dragonLegPose} from '../src/dragon-nursery-dragon.js';
import {DRAGON_FACE_IMAGE,DRAGON_FACE_RECTS} from '../src/dragon-face-art.js';
const loadModel=name=>{const b=readFileSync(new URL('../assets/dragon-adventures/models/'+name+'.glb',import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const kit=()=>({loadModel,loadFaceArt:async()=>new T.Texture()});
test('all colors and both ages have complete three-dimensional bodies, four legs, jaws and flapping wings',async()=>{
 const dragon=nurseryDragon(new T.Scene(),kit());await dragon.ready;
 for(const day of [2,7])for(const element of ['ember','river','fern']){dragon.animate(1,true,false,element,day);const form=dragon.group.getObjectByName(day<7?'baby-dragon':'adult-dragon');assert.ok(form.visible);const bones=[];form.traverse(o=>{if(o.isBone)bones.push(o);});assert.equal(bones.filter(b=>/^(LFore|RFore|LHind|RHind)Upper$/.test(b.name)).length,4);assert.equal(bones.filter(b=>/^(Left|Right)Wing$/.test(b.name)).length,2);assert.ok(form.getObjectByName('Jaw'));const body=form.getObjectByName(day<7?'BabyDragonBody':'AdultDragonBody');body.geometry.computeBoundingBox();const size=body.geometry.boundingBox.getSize(new T.Vector3());assert.ok(size.x>1&&size.y>1&&size.z>2);assert.ok(body.isSkinnedMesh);assert.ok(!form.getObjectByName('egg'));}
 dragon.dispose();
});
test('original cover eyes and smiles are mapped onto curved skinned facial surfaces',async()=>{
 assert.ok(DRAGON_FACE_IMAGE.endsWith('/assets/game-covers/dragon-adventures.jpg'));const dragon=nurseryDragon(new T.Scene(),kit());await dragon.ready;
 for(const element of Object.keys(DRAGON_FACE_RECTS)){dragon.animate(1,false,false,element,7);const root=dragon.group.getObjectByName('adult-dragon');let eyes=0;root.traverse(mesh=>{if(!mesh.isMesh||!/^AdultEye/.test(mesh.name))return;eyes++;const uv=mesh.geometry.attributes.uv,rect=DRAGON_FACE_RECTS[element].eye;for(let i=0;i<uv.count;i++){assert.ok(uv.getX(i)>=rect[0]/1280-.00001&&uv.getX(i)<=(rect[0]+rect[2])/1280+.00001);assert.ok(uv.getY(i)>=1-(rect[1]+rect[3])/720-.00001&&uv.getY(i)<=1-rect[1]/720+.00001);}mesh.geometry.computeBoundingBox();assert.ok(mesh.geometry.boundingBox.getSize(new T.Vector3()).z>.03);assert.ok(mesh.isSkinnedMesh);});assert.equal(eyes,2);}
 dragon.dispose();
});
test('skin seams remain coincident through walking, flying, panting and head turns',async()=>{
 const dragon=nurseryDragon(new T.Scene(),kit());await dragon.ready;
 for(const day of [2,7]){dragon.animate(0,false,false,'ember',day);const form=dragon.group.getObjectByName(day<7?'baby-dragon':'adult-dragon'),body=form.getObjectByName(day<7?'BabyDragonBody':'AdultDragonBody'),position=body.geometry.attributes.position,seen=new Map(),pairs=[];
  for(let i=0;i<position.count;i++){const key=[position.getX(i),position.getY(i),position.getZ(i)].map(n=>n.toFixed(6)).join(',');if(seen.has(key))pairs.push([seen.get(key),i]);else seen.set(key,i);}assert.ok(pairs.length>0);
  for(let i=0;i<20;i++){dragon.animate(i*.08,true,i>10,'ember',day,false,{mood:'pant',lookYaw:.4,speed:2});dragon.group.updateMatrixWorld(true);for(const [a,b]of pairs){const p=new T.Vector3().fromBufferAttribute(position,a),q=new T.Vector3().fromBufferAttribute(position,b);body.applyBoneTransform(a,p);body.applyBoneTransform(b,q);assert.ok(p.distanceTo(q)<.0001);}body.traverse(o=>{if(o.isMesh)assert.ok(o.matrixWorld.elements.every(Number.isFinite));});}
 }
 dragon.dispose();
});
test('riding uses the actual skinned saddle and remains aligned with heading rather than a camera-facing image',async()=>{
 const dragon=nurseryDragon(new T.Scene(),kit());await dragon.ready;dragon.group.position.set(3,5,-4);dragon.group.scale.setScalar(.88);let previous;
 for(let i=0;i<15;i++){dragon.group.rotation.y=i*.1;dragon.animate(i*.08,false,true,'river',7);const mount=dragon.getMountPoint();assert.ok(mount.y>6&&mount.y<6.4);assert.ok(Math.hypot(mount.x-3,mount.z+4)<.3);if(previous)assert.ok(mount.distanceTo(previous)<.03);previous=mount;assert.equal(dragon.group.rotation.y,i*.1);}
 const poseA=dragonLegPose(.1),poseB=dragonLegPose(.7);assert.ok(Math.abs(poseA.hip-poseB.hip)>.05);assert.ok([poseA.hip,poseA.knee,poseB.hip,poseB.knee].every(Number.isFinite));dragon.dispose();
});

test('walking paws stay close to the floor and lift smoothly instead of dangling or sinking',async()=>{
 const dragon=nurseryDragon(new T.Scene(),kit());await dragon.ready;let minimum=99,maximum=-99;
 for(let i=0;i<90;i++){dragon.animate(i*.03,true,false,'ember',7,false,{speed:1.7});dragon.group.updateMatrixWorld(true);dragon.group.getObjectByName('adult-dragon').traverse(mesh=>{if(!mesh.isSkinnedMesh||!mesh.name.startsWith('Claw'))return;mesh.geometry.computeBoundingBox();const point=mesh.geometry.boundingBox.getCenter(new T.Vector3());mesh.applyBoneTransform(0,point);mesh.localToWorld(point);minimum=Math.min(minimum,point.y);maximum=Math.max(maximum,point.y);});}
 assert.ok(minimum>.04&&minimum<.13);assert.ok(maximum>.14&&maximum<.23);dragon.dispose();
});

test('grinning animates the original curved smile and relaxes smoothly afterward',async()=>{
 const dragon=nurseryDragon(new T.Scene(),kit());await dragon.ready;
 for(const day of [2,7]){for(let i=0;i<18;i++)dragon.animate(i*.08,false,false,'fern',day,false,{mood:'grin',grin:1});const root=dragon.group.getObjectByName(day<7?'baby-dragon':'adult-dragon');let count=0;root.traverse(mesh=>{if(!mesh.name.startsWith('DragonHappyMouth'))return;count++;assert.ok(mesh.isSkinnedMesh);assert.ok(mesh.morphTargetInfluences[0]>.99);const base=mesh.geometry.attributes.position,target=mesh.geometry.morphAttributes.position[0];assert.ok(new T.Box3().setFromBufferAttribute(target).getSize(new T.Vector3()).x>new T.Box3().setFromBufferAttribute(base).getSize(new T.Vector3()).x);});assert.equal(count,1);
  for(let i=18;i<36;i++)dragon.animate(i*.08,false,false,'fern',day,false,{mood:'look',grin:0});root.traverse(mesh=>{if(mesh.name.startsWith('DragonHappyMouth'))assert.ok(mesh.morphTargetInfluences[0]<.01);});
 }
 dragon.dispose();
});
