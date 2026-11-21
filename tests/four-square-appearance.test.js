import test from 'node:test';
import assert from 'node:assert/strict';
import {fourSquareHeadGeometry} from '../src/four-square-anatomy.js';
import {GAME_COVERS} from '../src/game-covers.js';
test('Four Square uses a still cover without an animated overlay',()=>{assert.ok(GAME_COVERS['four-square'].file.includes('still'));assert.ok(!GAME_COVERS['four-square'].animated);assert.equal(GAME_COVERS['four-square'].animation,undefined);});
test('sculpted heads have finite continuous geometry, useful normals and bounded child proportions',()=>{const g=fourSquareHeadGeometry();g.computeBoundingBox();for(const name of ['position','normal','uv'])assert.ok([...g.attributes[name].array].every(Number.isFinite));assert.ok(g.index.count>10000);assert.ok(g.boundingBox.min.y>=-.32&&g.boundingBox.max.y<=.32);assert.ok(g.boundingBox.min.x>=-.29&&g.boundingBox.max.x<=.29);for(let i=0;i<g.attributes.normal.count;i++){const n=g.attributes.normal;assert.ok(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))>.99);}g.dispose();});

test('continuous limbs have normalized skin weights and bend without disconnected surfaces',async()=>{
 const T=await import('../src/vendor/three/three.module.min.js'),{createFourSquareLimb}=await import('../src/four-square-limb.js');
 const parent=new T.Group(),material=new T.MeshStandardMaterial(),limb=createFourSquareLimb(parent,{upper:.34,lower:.34,radius:.1,materials:[material,material]});
 assert.equal(limb.mesh.isSkinnedMesh,true);assert.equal(limb.mesh.skeleton.bones.length,2);assert.equal(limb.hinge.position.y,-.34);
 const weights=limb.mesh.geometry.attributes.skinWeight;for(let i=0;i<weights.count;i++)assert.ok(Math.abs(weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i)-1)<1e-6);
 for(const bend of [0,.8,1.7]){limb.hinge.rotation.x=bend;parent.updateMatrixWorld(true);limb.mesh.skeleton.update();for(let i=0;i<limb.mesh.geometry.attributes.position.count;i++){const p=new T.Vector3();limb.mesh.getVertexPosition(i,p);assert.ok([p.x,p.y,p.z].every(Number.isFinite));assert.ok(p.length()<1);}}
 limb.mesh.skeleton.dispose();limb.mesh.geometry.dispose();material.dispose();
});
