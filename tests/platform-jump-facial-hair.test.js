import test from 'node:test';
import assert from 'node:assert/strict';
import {JUMP_FACIAL_HAIR,drawJumpFacialHair,facialHairCell} from '../src/platform-jump-facial-hair.js';
import {JUMP_DEFAULTS,validateJumpSettings} from '../src/platform-jump-rules.js';
import {drawJumper} from '../src/platform-jump-person.js';
test('all fourteen moustaches save as free choices with None as the default',()=>{
 assert.equal(JUMP_FACIAL_HAIR.length,15);assert.equal(new Set(JUMP_FACIAL_HAIR).size,15);assert.equal(JUMP_DEFAULTS.facialHair,'None');
 for(const facialHair of JUMP_FACIAL_HAIR){const s=validateJumpSettings({facialHair,outfit:'Daisy denim overalls'});assert.equal(s.facialHair,facialHair);assert.equal(s.outfit,'Daisy denim overalls');}
 assert.equal(validateJumpSettings({facialHair:'unknown'}).facialHair,'None');assert.equal(validateJumpSettings({pet:'cat',breed:'Calico'}).facialHair,'None');
});
test('moustaches use separate atlas cells anchored to the upper lip, with None removing them',t=>{
 const previous=globalThis.Image;t.after(()=>{globalThis.Image=previous;});globalThis.Image=class{constructor(){this.complete=true;this.naturalWidth=1536;this.naturalHeight=1536;}};
 const images=[],faces=[],heads=[],cells=new Set();
 const c=new Proxy({drawImage:(...a)=>{images.push(a);if(a[0].src?.endsWith('/characters.png'))faces.push(a);},ellipse:(...a)=>heads.push(a)},{get:(o,k)=>k in o?o[k]:()=>{}});
 for(const facialHair of JUMP_FACIAL_HAIR.slice(1)){
  images.length=0;assert.equal(drawJumpFacialHair(c,facialHair),true);assert.equal(images.length,1);
  const image=images[0];cells.add(image[1]+':'+image[2]);assert.equal(image[5],-17);const cell=facialHairCell(facialHair);assert.ok(Math.abs(image[6]+image[8]*(cell.anchor-cell.top)/(cell.bottom-cell.top)+59)<1e-10);
  for(const pose of [false,true,'clap'])assert.doesNotThrow(()=>drawJumper(c,0,0,{...JUMP_DEFAULTS,hairstyle:'Bald',facialHair},1,true,pose));
 }
 assert.equal(cells.size,14);assert.equal(faces.length,42);assert.ok(faces.every(a=>a[7]<=40&&a[8]<=46));assert.equal(heads.filter(a=>a[2]===20&&a[3]===23).length,faces.length);
 images.length=0;assert.equal(drawJumpFacialHair(c,'None'),false);assert.equal(drawJumpFacialHair(c,'unknown'),false);assert.equal(images.length,0);
});
