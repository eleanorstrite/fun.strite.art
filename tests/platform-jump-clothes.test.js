import test from 'node:test';
import assert from 'node:assert/strict';
import {JUMP_OUTFITS,drawJumpOutfit,outfitCell,CLOTHING_SHOP_ITEMS,outfitUnlocked,drawOutfitBody,SCIENCE_TOPS,outfitUsesPants} from '../src/platform-jump-clothes.js';
import {JUMP_DEFAULTS,validateJumpSettings} from '../src/platform-jump-rules.js';
import {drawJumper} from '../src/platform-jump-person.js';
test('all twenty-two reference clothing choices save without changing the default or skin color',()=>{
 assert.equal(JUMP_OUTFITS.length,23);assert.equal(new Set(JUMP_OUTFITS).size,23);
 for(const outfit of JUMP_OUTFITS){const s=validateJumpSettings({outfit,skin:'#9c684a'},CLOTHING_SHOP_ITEMS.map(item=>item.id));assert.equal(s.outfit,outfit);assert.equal(s.skin,'#9c684a');}
 assert.equal(validateJumpSettings({outfit:'unknown'}).outfit,JUMP_DEFAULTS.outfit);assert.equal(JUMP_DEFAULTS.outfit,'Lace collar & skirt');
});
test('each outfit uses its own atlas cell and preserves the existing head dimensions',t=>{
 const previous=globalThis.Image;t.after(()=>{globalThis.Image=previous;});
 globalThis.Image=class{constructor(){this.complete=true;this.naturalWidth=1236;this.naturalHeight=1236;}};
 const cells=new Set(),images=[],faces=[],heads=[];
 const c=new Proxy({drawImage:(...args)=>{images.push(args);if(args[0].src?.endsWith('/characters.png'))faces.push(args);},ellipse:(...args)=>heads.push(args)},{get:(o,k)=>k in o?o[k]:()=>{}});
 for(const outfit of JUMP_OUTFITS.slice(1)){
  images.length=0;assert.equal(drawJumpOutfit(c,outfit),true);assert.equal(images.length,1);cells.add(images[0][0].src+':'+images[0][1]+':'+images[0][2]);
  assert.equal(images[0][7]>0&&images[0][7]<=62,true);assert.equal(images[0][8]>0&&images[0][8]<=58,true);
  for(const wave of [false,true,'clap'])assert.doesNotThrow(()=>drawJumper(c,0,0,{...JUMP_DEFAULTS,hairstyle:'Bald',outfit},1,true,wave));
 }
 assert.equal(cells.size,22);assert.equal(faces.length,66);assert.ok(faces.every(a=>a[7]<=40&&a[8]<=46));assert.equal(heads.filter(a=>a[2]===20&&a[3]===23).length,faces.length);
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
  assert.equal(rects.filter(a=>(a[2]===8||a[2]===5)&&(a[1]===-18||a[1]===-28||a[1]===-22)).length,2,'Legs should follow the narrower shorts/skirt silhouette');
  assert.equal(translations.some(a=>a[0]===0&&a[1]===-39),true,'Head should sit at the shared starter neckline');
  assert.equal(rects.some(a=>a[0]===-4&&a[1]===-52&&a[2]===8&&a[3]===7),true,'Use a short neck hidden under the jaw and collar');
 }
 rects.length=0;drawJumper(c,0,0,{...JUMP_DEFAULTS,hairstyle:'Bald',outfit:'Classic colors'},1);
 assert.equal(rects.some(a=>a[0]===-17&&a[1]===-51&&a[2]===34&&a[3]===33),true,'Classic colors should keep the original body');
});

test('pastel outfits use the new two-column atlas without changing older outfit cells',()=>{
 for(let i=1;i<=9;i++){const cell=outfitCell(JUMP_OUTFITS[i]);assert.equal(cell.file,'platform-jump-outfits.png');assert.equal(cell.index,i-1);assert.equal(cell.columns,3);}
 for(let i=10;i<=15;i++){const cell=outfitCell(JUMP_OUTFITS[i]);assert.equal(cell.file,'platform-jump-pastel-outfits.png');assert.equal(cell.index,i-10);assert.equal(cell.columns,2);assert.equal(cell.rows,3);}
 assert.equal(outfitCell('Classic colors'),null);assert.equal(outfitCell('unknown'),null);
});

test('butterfly clothing requires its own permanent shop unlock',()=>{
 assert.equal(CLOTHING_SHOP_ITEMS.length,4);
 for(const item of CLOTHING_SHOP_ITEMS){
  assert.equal(item.cost,50);assert.equal(outfitUnlocked(item.outfit),false);
  assert.equal(validateJumpSettings({outfit:item.outfit}).outfit,JUMP_DEFAULTS.outfit);
  assert.equal(validateJumpSettings({outfit:item.outfit},[item.id]).outfit,item.outfit);
  assert.equal(validateJumpSettings({outfit:item.outfit},['unrelated']).outfit,JUMP_DEFAULTS.outfit);
  const cell=outfitCell(item.outfit);assert.equal(cell.file,'platform-jump-butterfly-outfits.png');assert.equal(cell.columns,2);assert.equal(cell.rows,2);
 }
 for(const outfit of JUMP_OUTFITS.slice(0,16))assert.equal(outfitUnlocked(outfit),true);
});

test('waving sleeves include the shoulder and share the arm joint instead of rotating edge strips',t=>{
 const previous=globalThis.Image;t.after(()=>{globalThis.Image=previous;});
 globalThis.Image=class{constructor(){this.complete=true;this.naturalWidth=1236;this.naturalHeight=1236;}};
 for(const outfit of JUMP_OUTFITS.slice(1))for(const time of [0,.4,1]){
  const images=[],bodyAngles=[],sleeveAngles=[],bodyJoints=[],sleeveJoints=[];
  const body=new Proxy({rotate:a=>bodyAngles.push(a),translate:(...a)=>bodyJoints.push(a)},{get:(o,k)=>k in o?o[k]:()=>{}});
  const clothes=new Proxy({drawImage:(...a)=>{images.push(a);if(a[0].src?.endsWith('/characters.png'))faces.push(a);},rotate:a=>sleeveAngles.push(a),translate:(...a)=>sleeveJoints.push(a)},{get:(o,k)=>k in o?o[k]:()=>{}});
  drawOutfitBody(body,{...JUMP_DEFAULTS,outfit},time,false,true);drawJumpOutfit(clothes,outfit,time,false,true);
  const sleeveless=outfit.endsWith('butterfly dress');assert.equal(images.length,sleeveless?1:3);
  const cell=outfitCell(outfit);for(const image of images)assert.equal(image[3]>=image[0].naturalWidth/cell.columns*.9,true,'Retain the complete sleeve artwork, including its inner seam');
  if(!sleeveless){assert.equal(sleeveAngles[0],bodyAngles[1]);assert.equal(bodyJoints.some(a=>a[0]===15&&a[1]===-43),true);assert.equal(sleeveJoints.some(a=>a[0]===15&&a[1]===-43),true);}
 }
});

test('science tops are free and allow independent pants colors',t=>{
 const previous=globalThis.Image;t.after(()=>{globalThis.Image=previous;});globalThis.Image=class{constructor(){this.complete=true;this.naturalWidth=1536;this.naturalHeight=512;}};
 assert.equal(SCIENCE_TOPS.length,3);
 for(const outfit of SCIENCE_TOPS){
  assert.equal(outfitUnlocked(outfit),true);assert.equal(outfitUsesPants(outfit),true);
  const settings=validateJumpSettings({outfit,pants:'#304b71'});assert.equal(settings.outfit,outfit);assert.equal(settings.pants,'#304b71');
  const cell=outfitCell(outfit);assert.equal(cell.file,'platform-jump-science-shirts.png');assert.equal(cell.columns,3);assert.equal(cell.rows,1);
  const fills=[];let c;const target={roundRect(x,y,w,h){if(y===-22&&w===8)fills.push(c.fillStyle);}};c=new Proxy(target,{get:(o,k)=>k in o?o[k]:()=>{}});
  drawOutfitBody(c,settings);assert.equal(fills.length,2);assert.equal(fills.every(color=>color===settings.pants),true);
 }
 assert.equal(outfitUsesPants('Orange monarch butterfly dress'),false);assert.equal(CLOTHING_SHOP_ITEMS.length,4);
});
