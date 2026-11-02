import test from 'node:test';
import assert from 'node:assert/strict';
import {JUMP_OUTFITS,drawJumpOutfit} from '../src/platform-jump-clothes.js';
import {JUMP_DEFAULTS,validateJumpSettings} from '../src/platform-jump-rules.js';
import {drawJumper} from '../src/platform-jump-person.js';
test('all nine reference outfits save without changing the default or skin color',()=>{
 assert.equal(JUMP_OUTFITS.length,10);assert.equal(new Set(JUMP_OUTFITS).size,10);
 for(const outfit of JUMP_OUTFITS){const s=validateJumpSettings({outfit,skin:'#9c684a'});assert.equal(s.outfit,outfit);assert.equal(s.skin,'#9c684a');}
 assert.equal(validateJumpSettings({outfit:'unknown'}).outfit,'Classic colors');assert.equal(JUMP_DEFAULTS.outfit,'Classic colors');
});
test('each outfit uses its own atlas cell and preserves the existing head dimensions',t=>{
 const previous=globalThis.Image;t.after(()=>{globalThis.Image=previous;});
 globalThis.Image=class{constructor(){this.complete=true;this.naturalWidth=1236;this.naturalHeight=1236;}};
 const cells=new Set(),images=[],heads=[];
 const c=new Proxy({drawImage:(...args)=>images.push(args),ellipse:(...args)=>heads.push(args)},{get:(o,k)=>k in o?o[k]:()=>{}});
 for(const outfit of JUMP_OUTFITS.slice(1)){
  images.length=0;assert.equal(drawJumpOutfit(c,outfit),true);assert.equal(images.length,1);cells.add(images[0][1]+':'+images[0][2]);
  assert.equal(images[0][7],62);assert.equal(images[0][8],58);
  for(const wave of [false,true,'clap'])assert.doesNotThrow(()=>drawJumper(c,0,0,{...JUMP_DEFAULTS,hairstyle:'Bald',outfit},1,true,wave));
 }
 assert.equal(cells.size,9);assert.equal(heads.filter(a=>a[2]===20&&a[3]===23).length,27);
 assert.equal(drawJumpOutfit(c,'Classic colors'),false);
});

test('dressed bodies fit the garments instead of drawing the old bare torso and limbs',t=>{
 const previous=globalThis.Image;t.after(()=>{globalThis.Image=previous;});
 globalThis.Image=class{constructor(){this.complete=true;this.naturalWidth=1236;this.naturalHeight=1236;}};
 const rects=[],translations=[];
 const c=new Proxy({roundRect:(...a)=>rects.push(a),translate:(...a)=>translations.push(a)},{get:(o,k)=>k in o?o[k]:()=>{}});
 for(const outfit of JUMP_OUTFITS.slice(1))for(const pose of [false,true,'clap']){
  rects.length=0;translations.length=0;
  drawJumper(c,0,0,{...JUMP_DEFAULTS,hairstyle:'Bald',outfit},1,true,pose);
  assert.equal(rects.some(a=>a[0]===-17&&a[1]===-51&&a[2]===34&&a[3]===33),false,'The old bare torso must not show around clothing');
  assert.equal(rects.filter(a=>a[2]===8&&a[1]===-18).length,2,'Legs should follow the narrower shorts/skirt silhouette');
  assert.equal(translations.some(a=>a[0]===0&&a[1]===-9),true,'Head should meet the outfit neckline');
 }
 rects.length=0;drawJumper(c,0,0,{...JUMP_DEFAULTS,hairstyle:'Bald'},1);
 assert.equal(rects.some(a=>a[0]===-17&&a[1]===-51&&a[2]===34&&a[3]===33),true,'Classic colors should keep the original body');
});
