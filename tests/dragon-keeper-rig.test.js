import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../src/vendor/three/three.module.min.js';
import {GLTFLoader} from '../src/vendor/three/addons/loaders/GLTFLoader.js';
import {nurseryKeeper} from '../src/dragon-nursery-models.js';
import {KEEPER_HAIRSTYLES,KEEPER_OUTFITS,keeperHairNode,keeperOutfitNode} from '../src/dragon-keeper-looks.js';
import {sanitizeKeeperLook} from '../src/dragon-nursery-training.js';
import {newNursery,saveNursery,loadNursery} from '../src/dragon-nursery-rules.js';
const loadModel=name=>{const b=readFileSync(new URL('../assets/dragon-adventures/models/'+name+'.glb',import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
test('skinned keeper retains two arms and legs through customizations, walking and riding',async()=>{const person=nurseryKeeper(new T.Scene(),{loadModel},{});await person.ready;const bones=[];person.group.traverse(o=>{if(o.isBone)bones.push(o);});assert.equal(bones.filter(o=>/^(Left|Right)Arm$/.test(o.name)).length,2);assert.equal(bones.filter(o=>/^(Left|Right)Thigh$/.test(o.name)).length,2);for(const age of ['kid','adult'])for(const hairStyle of ['short','long','curly']){person.updateAppearance({age,hairStyle,glasses:true});assert.equal(person.heightScale,age==='kid'?.73:1);assert.equal(person.group.getObjectByName('Head').scale.x,age==='kid'?1.08:1);for(const style of ['Short','Long','Curly'])assert.equal(person.group.getObjectByName('KeeperHair'+style).visible,style.toLowerCase()===hairStyle);for(let i=0;i<20;i++)person.animate(i/30,true,false);person.animate(1,false,true);}person.group.updateMatrixWorld(true);person.group.traverse(o=>{if(!o.isSkinnedMesh)return;const pos=o.geometry.attributes.position;for(let i=0;i<pos.count;i+=83){const p=new T.Vector3().fromBufferAttribute(pos,i);o.applyBoneTransform(i,p);assert.ok(p.toArray().every(Number.isFinite));}});person.dispose();});
test('farewell wave raises the articulated arm above its resting elbow position',async()=>{const person=nurseryKeeper(new T.Scene(),{loadModel},{});await person.ready;person.animate(0,false);person.group.updateMatrixWorld(true);const elbow=person.group.getObjectByName('RightForearm'),rest=elbow.getWorldPosition(new T.Vector3()).y;person.interact('wave',1);person.group.updateMatrixWorld(true);assert.ok(elbow.getWorldPosition(new T.Vector3()).y>rest+.4);person.dispose();});

test('every wardrobe and hair choice uses a real selectable skinned mesh on the same two-limb-pair rig',async()=>{const person=nurseryKeeper(new T.Scene(),{loadModel},{});await person.ready;assert.ok(KEEPER_HAIRSTYLES.length>=36);assert.ok(KEEPER_OUTFITS.length>=25);for(const age of ['kid','adult'])for(const outfit of KEEPER_OUTFITS){for(const style of KEEPER_HAIRSTYLES){person.updateAppearance({age,outfit:outfit.id,hairStyle:style.id});for(const hair of KEEPER_HAIRSTYLES){const node=person.group.getObjectByName(keeperHairNode(hair.id));assert.ok(node,hair.id);let skinned=false;node.traverse(o=>{if(o.isSkinnedMesh)skinned=true;});assert.ok(skinned,hair.id);assert.equal(node.visible,hair.id===style.id);}for(const clothes of KEEPER_OUTFITS){const node=person.group.getObjectByName(keeperOutfitNode(clothes.id));assert.ok(node,clothes.id);let skinned=false;node.traverse(o=>{if(o.isSkinnedMesh)skinned=true;});assert.ok(skinned,clothes.id);assert.equal(node.visible,clothes.id===outfit.id);}}for(const riding of [false,true]){for(let i=0;i<12;i++)person.animate(i/20,true,riding);person.group.updateMatrixWorld(true);const active=person.group.getObjectByName(keeperOutfitNode(outfit.id));active.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const positions=mesh.geometry.attributes.position;for(let i=0;i<positions.count;i+=137){const p=new T.Vector3().fromBufferAttribute(positions,i);mesh.applyBoneTransform(i,p);assert.ok(p.toArray().every(Number.isFinite));assert.ok(p.length()<4,'clothing remains attached while walking or riding');}});}}person.dispose();});
test('expanded keeper choices persist, old appearances migrate, and unknown styles fall back safely',()=>{const old=sanitizeKeeperLook({hairStyle:'long',shirt:'#123456'});assert.equal(old.outfit,'ranger');assert.equal(old.hairStyle,'long');const s=newNursery();s.appearance=sanitizeKeeperLook({age:'kid',hairStyle:'twin-braids',outfit:'starlight',eyes:'#547b82',accent:'#d7b269',shirt:'#26384f'});let raw;const storage={setItem:(key,value)=>raw=value,getItem:()=>raw};saveNursery(s,storage);assert.deepEqual(loadNursery(storage).appearance,s.appearance);const invalid=sanitizeKeeperLook({outfit:'<script>',hairStyle:'../bad',eyes:'url(secret)',accent:'bad'});assert.equal(invalid.outfit,'ranger');assert.equal(invalid.hairStyle,'short');assert.match(invalid.eyes,/^#[0-9a-f]{6}$/i);});

test('fixed-look race riders retain only their chosen wardrobe without changing their appearance or skeleton',async()=>{const person=nurseryKeeper(new T.Scene(),{loadModel},{outfit:'starlight',hairStyle:'wavy'},{fixed:true});await person.ready;assert.ok(person.group.getObjectByName(keeperOutfitNode('starlight')));assert.ok(person.group.getObjectByName(keeperHairNode('wavy')));assert.equal(KEEPER_OUTFITS.filter(o=>person.group.getObjectByName(keeperOutfitNode(o.id))).length,1);assert.equal(KEEPER_HAIRSTYLES.filter(h=>person.group.getObjectByName(keeperHairNode(h.id))).length,1);person.animate(0,true,true);person.dispose();});

test('a tired keeper has visible half-closed eyelids and wakes up without keeping the sleepy pose',async()=>{const person=nurseryKeeper(new T.Scene(),{loadModel},{});await person.ready;person.animate(1,false,false,{sleepy:true});for(const side of ['Left','Right']){const lid=person.group.getObjectByName('KeeperBlink'+side);assert.equal(lid.visible,true);assert.equal(lid.morphTargetInfluences[0],1);assert.ok(lid.geometry.morphAttributes.position[0]);}person.animate(1.1,false,false,{sleepy:false});for(const side of ['Left','Right'])assert.equal(person.group.getObjectByName('KeeperBlink'+side).visible,false);person.dispose();});

test('the keeper face has outward-facing geometry and clothes, hair and eyes retain distinct physical surfaces',async()=>{
 const person=nurseryKeeper(new T.Scene(),{loadModel},{});await person.ready;
 const face=person.group.getObjectByName('KeeperFace');assert.ok(face?.isSkinnedMesh);
 const positions=face.geometry.attributes.position,index=face.geometry.index;let volume=0;
 for(let i=0;i<(index?.count??positions.count);i+=3){const vertex=n=>new T.Vector3().fromBufferAttribute(positions,index?index.getX(n):n);volume+=vertex(i).dot(vertex(i+1).cross(vertex(i+2)))/6;}
 assert.ok(volume>0,'the closed facial surface faces outward, so cheeks and jaw receive light');
 const surfaces=new Map();person.group.traverse(o=>{for(const m of o.material?Array.isArray(o.material)?o.material:[o.material]:[])surfaces.set(m.name,m);});
 assert.ok(surfaces.get('KeeperCloth').sheen>0);assert.ok(surfaces.get('KeeperHair').anisotropy>0);assert.ok(surfaces.get('KeeperIris').clearcoat>0);assert.ok(surfaces.get('KeeperLeather').roughness>surfaces.get('KeeperIris').roughness);
 person.updateAppearance({shirt:'#265478',hair:'#372219'});assert.equal(surfaces.get('KeeperCloth').color.getHexString(),'265478');assert.equal(surfaces.get('KeeperHair').color.getHexString(),'372219');person.dispose();
});

test('dress fabric stays attached to the torso instead of being pulled apart by opposite leg strides',async()=>{
 const person=nurseryKeeper(new T.Scene(),{loadModel},{});await person.ready;
 for(const id of ['scholar','starlight','violet','festival','mono-ruffle','mooncoat','rose-dress','cosmic-dress','anemone','nouveau']){
  const outfit=person.group.getObjectByName(keeperOutfitNode(id));let checked=0;
  outfit.traverse(mesh=>{if(!mesh.isSkinnedMesh||mesh.material.name!=='KeeperCloth')return;const weights=mesh.geometry.attributes.skinWeight,indices=mesh.geometry.attributes.skinIndex;for(let i=0;i<weights.count;i++)for(let j=0;j<4;j++){if(weights.getComponent(i,j)<.001)continue;assert.ok(!/Thigh|Shin/.test(mesh.skeleton.bones[indices.getComponent(i,j)].name),id+' fabric should not separate with the legs');checked++;}});assert.ok(checked>0,id);
 }
 // UV seam duplicates must remain coincident through the entire gait and mounted pose.
 for(const outfit of KEEPER_OUTFITS){person.updateAppearance({age:'adult',outfit:outfit.id});const meshes=[];person.group.getObjectByName(keeperOutfitNode(outfit.id)).traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const positions=mesh.geometry.attributes.position,seen=new Map(),pairs=[];for(let i=0;i<positions.count;i++){const key=[positions.getX(i),positions.getY(i),positions.getZ(i)].map(v=>v.toFixed(6)).join(',');if(seen.has(key))pairs.push([seen.get(key),i]);else seen.set(key,i);}meshes.push({mesh,pairs});});for(let frame=0;frame<16;frame++){person.animate(frame*.08,true,frame>=12,{swimming:frame>=4&&frame<8});person.group.updateMatrixWorld(true);for(const {mesh,pairs}of meshes)for(const [a,b]of pairs){const p=mesh.getVertexPosition(a,new T.Vector3()),q=mesh.getVertexPosition(b,new T.Vector3());assert.ok(p.distanceTo(q)<.012,outfit.id+' develops a visible clothing seam gap');}}}
 person.dispose();
});

test('riding dresses use their connected seated drape and return to their walking shape',async()=>{
 const person=nurseryKeeper(new T.Scene(),{loadModel},{outfit:'cosmic-dress'});await person.ready;const meshes=[];person.group.getObjectByName(keeperOutfitNode('cosmic-dress')).traverse(mesh=>{if(mesh.morphTargetDictionary?.RidingDrape!==undefined)meshes.push(mesh);});assert.ok(meshes.length>0);
 for(let i=0;i<12;i++)person.animate(i*.08,false,true);for(const mesh of meshes)assert.ok(mesh.morphTargetInfluences[mesh.morphTargetDictionary.RidingDrape]>.99);
 for(let i=12;i<24;i++)person.animate(i*.08,true,false);for(const mesh of meshes)assert.ok(mesh.morphTargetInfluences[mesh.morphTargetDictionary.RidingDrape]<.01);person.dispose();
});

test('a mounted keeper does not inherit the walking hip bounce',async()=>{const person=nurseryKeeper(new T.Scene(),{loadModel},{});await person.ready;person.animate(0,true,true);const hips=person.group.getObjectByName('Hips'),height=hips.position.y;for(let i=1;i<30;i++){person.animate(i*.08,true,true);assert.equal(hips.position.y,height);}person.dispose();});

test('every hairstyle covers the crown from all directions instead of leaving bald gaps',async()=>{
 const person=nurseryKeeper(new T.Scene(),{loadModel},{});await person.ready;
 for(const style of KEEPER_HAIRSTYLES){
  person.updateAppearance({age:'adult',hairStyle:style.id});person.group.updateMatrixWorld(true);
  const hair=person.group.getObjectByName(keeperHairNode(style.id)),face=person.group.getObjectByName('KeeperFace');hair.traverse(o=>o.skeleton?.update());face.skeleton.update();
  for(const theta of [.05,.45,.85])for(let j=0;j<8;j++){
   const angle=j*Math.PI/4,direction=new T.Vector3(Math.cos(angle)*Math.sin(theta),Math.cos(theta),Math.sin(angle)*Math.sin(theta)),origin=new T.Vector3(0,1.887,-.014).addScaledVector(direction,.5),ray=new T.Raycaster(origin,direction.negate());
   const covering=ray.intersectObject(hair)[0],scalp=ray.intersectObject(face)[0];assert.ok(covering,style.id+' has an uncovered crown');assert.ok(covering.distance<.385,style.id+' hair roots disappeared');if(scalp)assert.ok(covering.distance<scalp.distance-.001,style.id+' lets the scalp show through');
  }
 }
 person.dispose();
});
