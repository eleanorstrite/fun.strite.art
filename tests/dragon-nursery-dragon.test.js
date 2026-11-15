import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../src/vendor/three/three.module.min.js';
import {GLTFLoader} from '../src/vendor/three/addons/loaders/GLTFLoader.js';
import {nurseryDragon,dragonLegPose} from '../src/dragon-nursery-dragon.js';
import {DRAGON_FACE_IMAGE,DRAGON_FACE_PALETTES} from '../src/dragon-face-art.js';
const loadModel=name=>{const b=readFileSync(new URL('../assets/dragon-adventures/models/'+name+'.glb',import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const kit=()=>({loadModel});
test('all colors and both ages have complete three-dimensional bodies, four legs, jaws and flapping wings',async()=>{
 const dragon=nurseryDragon(new T.Scene(),kit());await dragon.ready;
 for(const day of [2,7])for(const element of ['ember','river','fern']){dragon.animate(1,true,false,element,day);const form=dragon.group.getObjectByName(day<7?'baby-dragon':'adult-dragon');assert.ok(form.visible);const bones=[];form.traverse(o=>{if(o.isBone)bones.push(o);});assert.equal(bones.filter(b=>/^(LFore|RFore|LHind|RHind)Upper$/.test(b.name)).length,4);assert.equal(bones.filter(b=>/^(Left|Right)Wing$/.test(b.name)).length,2);assert.ok(form.getObjectByName('Jaw'));const body=form.getObjectByName(day<7?'BabyDragonBody':'AdultDragonBody');body.geometry.computeBoundingBox();const size=body.geometry.boundingBox.getSize(new T.Vector3());assert.ok(size.x>1&&size.y>1&&size.z>2);assert.ok(body.isSkinnedMesh);assert.ok(!form.getObjectByName('egg'));}
 dragon.dispose();
});
test('cover-inspired faces use recessed 3D smiles and fitted glossy eyes instead of stretched photo patches',async()=>{
 assert.ok(DRAGON_FACE_IMAGE.endsWith('/assets/game-covers/dragon-adventures.jpg'));const dragon=nurseryDragon(new T.Scene(),kit());await dragon.ready;
 for(const day of [2,7])for(const element of Object.keys(DRAGON_FACE_PALETTES)){
  dragon.animate(1,false,false,element,day);const root=dragon.group.getObjectByName(day<7?'baby-dragon':'adult-dragon'),parts={eyes:[],irises:[],pupils:[]};
  root.traverse(mesh=>{if(!mesh.isMesh)return;const kind=/^(?:Baby|Adult)Eye/.test(mesh.name)?'eyes':/^(?:Baby|Adult)Iris/.test(mesh.name)?'irises':/^(?:Baby|Adult)Pupil/.test(mesh.name)?'pupils':null;if(!kind)return;parts[kind].push(mesh);assert.ok(mesh.isSkinnedMesh);assert.equal(mesh.material.map,null);mesh.geometry.computeBoundingBox();assert.ok(mesh.geometry.boundingBox.getSize(new T.Vector3()).z>.02);if(kind!=='eyes'){assert.ok(mesh.material.isMeshPhysicalMaterial);assert.equal(mesh.material.clearcoat,1);}if(kind==='irises')assert.equal(mesh.material.color.getHexString(),DRAGON_FACE_PALETTES[element].iris.slice(1));});
  for(const list of Object.values(parts))assert.equal(list.length,2);
  const width=mesh=>mesh.geometry.boundingBox.getSize(new T.Vector3()).x;
  assert.ok(width(parts.irises[0])<width(parts.eyes[0]));assert.ok(width(parts.pupils[0])<width(parts.irises[0])*.7);
  const mouth=root.getObjectByName('DragonHappyMouth');mouth.geometry.computeBoundingBox();assert.ok(mouth.geometry.boundingBox.getSize(new T.Vector3()).z>.07,'the smile has an actual recessed bowl');assert.equal(mouth.material.map,null);assert.equal(mouth.skeleton.bones.find(b=>b.name==='Jaw').name,'Jaw');
 }
 dragon.dispose();
});
test('skin seams remain coincident through walking, swimming, flying, panting and head turns',async()=>{
 const dragon=nurseryDragon(new T.Scene(),kit());await dragon.ready;
 for(const day of [2,7]){dragon.animate(0,false,false,'ember',day);const form=dragon.group.getObjectByName(day<7?'baby-dragon':'adult-dragon'),body=form.getObjectByName(day<7?'BabyDragonBody':'AdultDragonBody'),position=body.geometry.attributes.position,seen=new Map(),pairs=[];
  for(let i=0;i<position.count;i++){const key=[position.getX(i),position.getY(i),position.getZ(i)].map(n=>n.toFixed(6)).join(',');if(seen.has(key))pairs.push([seen.get(key),i]);else seen.set(key,i);}assert.ok(pairs.length>0);
  for(let i=0;i<20;i++){dragon.animate(i*.08,true,i>10&&i<15,'ember',day,false,{mood:'pant',lookYaw:.4,speed:2,swimming:i>=15});dragon.group.updateMatrixWorld(true);for(const [a,b]of pairs){const p=new T.Vector3().fromBufferAttribute(position,a),q=new T.Vector3().fromBufferAttribute(position,b);body.applyBoneTransform(a,p);body.applyBoneTransform(b,q);assert.ok(p.distanceTo(q)<.0001);}body.traverse(o=>{if(o.isMesh)assert.ok(o.matrixWorld.elements.every(Number.isFinite));});}
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

test('blinking closes attached upper lids and reopens them without detaching from the face',async()=>{
 const dragon=nurseryDragon(new T.Scene(),kit());await dragon.ready;
 for(const day of [2,7]){
  for(let i=0;i<20;i++)dragon.animate(1+i*.016,false,false,'river',day);
  const root=dragon.group.getObjectByName(day<7?'baby-dragon':'adult-dragon'),lids=[];root.traverse(mesh=>{if(/^(RelaxedEyeHood|GentleUpperLid)/.test(mesh.name))lids.push(mesh);});assert.equal(lids.length,4);assert.ok(lids.every(l=>l.morphTargetInfluences[0]<.01));
  for(let i=0;i<=12;i++)dragon.animate(4.3+i/60,false,false,'river',day);
  assert.ok(lids.every(l=>l.visible&&l.isSkinnedMesh));root.traverse(mesh=>{if(/Catchlight/.test(mesh.name))assert.equal(mesh.visible,false,'highlights must disappear behind a closing lid');});for(const lid of lids){assert.equal(lid.material.map,null);assert.ok(lid.geometry.morphAttributes.position.length);assert.ok(lid.morphTargetInfluences[0]>.2);}
  for(let i=0;i<20;i++)dragon.animate(5+i*.016,false,false,'river',day);assert.ok(lids.every(l=>l.morphTargetInfluences[0]<.01));
 }
 dragon.dispose();
});
