import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../src/vendor/three/three.module.min.js';
import {GLTFLoader} from '../src/vendor/three/addons/loaders/GLTFLoader.js';
import {nurseryDragon} from '../src/dragon-nursery-dragon.js';
const loadModel=name=>{const b=readFileSync(new URL('../assets/dragon-adventures/models/'+name+'.glb',import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
test('continuous baby and adult bodies deform with four legs and two wings without invalid skin weights',async()=>{const dragon=nurseryDragon(new T.Scene(),{loadModel});await dragon.ready;for(const day of [2,6,7,16])for(const element of ['ember','river','fern']){dragon.animate(2,true,day>=7,element,day);const forms=dragon.group.children.filter(g=>g.visible);assert.equal(forms.length,1);const form=forms[0],bones=[];form.traverse(o=>{if(o.isBone)bones.push(o);});assert.equal(bones.filter(b=>/^(LFore|RFore|LHind|RHind)Upper$/.test(b.name)).length,4);assert.equal(bones.filter(b=>/^(Left|Right)Wing$/.test(b.name)).length,2);const body=form.getObjectByName(day>=7?'AdultDragonBody':'BabyDragonBody');assert.ok(body.isSkinnedMesh);assert.ok(body.geometry.attributes.position.count>3000);form.updateMatrixWorld(true);const weights=body.geometry.attributes.skinWeight;for(let i=0;i<weights.count;i+=37){const w=new T.Vector4().fromBufferAttribute(weights,i);assert.ok(Math.abs(w.x+w.y+w.z+w.w-1)<.0001);const p=new T.Vector3().fromBufferAttribute(body.geometry.attributes.position,i);body.applyBoneTransform(i,p);assert.ok(p.toArray().every(Number.isFinite));}}dragon.dispose();});


test('grown dragons keep the same happy hatchling anatomy and grow only modestly',async()=>{
 const dragon=nurseryDragon(new T.Scene(),{loadModel});await dragon.ready;
 const baby=dragon.group.children.find(o=>o.name==='baby-dragon'),adult=dragon.group.children.find(o=>o.name==='adult-dragon');
 for(const form of [baby,adult]){assert.ok(form.getObjectByName('HappySmile'));assert.equal(form.getObjectByName('LittleTongue'),undefined);assert.equal(form.getObjectByName('LittleTooth'),undefined);assert.ok(form.getObjectByName('GentleUpperLid'));assert.ok(form.getObjectByName('EyeHighlight'));}
 assert.equal(baby.getObjectByName('BabyDragonBody').geometry.attributes.position.count,adult.getObjectByName('AdultDragonBody').geometry.attributes.position.count);
 const {nurseryDragonProfile}=await import('../src/dragon-nursery-growth.js');const b=nurseryDragonProfile({egg:'river',day:2}),a=nurseryDragonProfile({egg:'river',day:7});assert.ok(a.scale>b.scale&&a.scale/b.scale<1.5);assert.equal(a.saddle,b.saddle);
 for(const day of [2,7]){dragon.animate(.1,true,false,'river',day);const form=day===2?baby:adult;const leg=form.getObjectByName('LForeUpper'),wing=form.getObjectByName('LeftWing'),walk=leg.quaternion.clone();dragon.animate(.5,true,false,'river',day);assert.ok(leg.quaternion.angleTo(walk)>.02);dragon.animate(.1,false,true,'river',day);const fly=wing.quaternion.clone();dragon.animate(.3,false,true,'river',day);assert.ok(wing.quaternion.angleTo(fly)>.02);}
 dragon.dispose();
});


test('both gentle dragon faces blink and reopen without changing their smile or eye positions',async()=>{
 const dragon=nurseryDragon(new T.Scene(),{loadModel});await dragon.ready;
 for(const day of [2,7]){dragon.animate(1,false,false,'river',day);const form=dragon.group.children.find(o=>o.visible),eye=form.getObjectByName(day<7?'BabyEye':'AdultEye'),rest=eye.scale.clone(),position=eye.position.clone();dragon.animate(4.5,false,false,'river',day);assert.ok(eye.scale.y<rest.y*.1||eye.scale.z<rest.z*.1);assert.deepEqual(eye.position.toArray(),position.toArray());dragon.animate(4.7,false,false,'river',day);assert.deepEqual(eye.scale.toArray(),rest.toArray());assert.ok(form.getObjectByName('HappySmile'));}dragon.dispose();
});
