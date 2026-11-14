import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {KEEPER_OUTFITS,KEEPER_OUTFIT_PALETTES} from '../src/dragon-keeper-looks.js';
import {newNursery,saveNursery,loadNursery} from '../src/dragon-nursery-rules.js';
import {sanitizeKeeperLook} from '../src/dragon-nursery-training.js';

test('every selectable outfit has its own compact rendered clothing picture',()=>{
 const images=new Set();for(const outfit of KEEPER_OUTFITS){const png=readFileSync(new URL('../assets/dragon-adventures/wardrobe/'+outfit.id+'.png',import.meta.url));assert.equal(png.subarray(1,4).toString(),'PNG',outfit.id);assert.equal(png.readUInt32BE(16),288);assert.equal(png.readUInt32BE(20),368);images.add(createHash('sha256').update(png).digest('hex'));}assert.equal(images.size,KEEPER_OUTFITS.length);
});
test('the new city outfit and custom colors persist for either keeper age',()=>{
 for(const age of ['kid','adult']){const s=newNursery();s.appearance=sanitizeKeeperLook({age,outfit:'city-sweatshirt',...KEEPER_OUTFIT_PALETTES['city-sweatshirt'],shirt:'#283b59'});let raw;const storage={getItem:()=>raw,setItem:(key,value)=>raw=value};saveNursery(s,storage);assert.deepEqual(loadNursery(storage).appearance,s.appearance);assert.equal(s.appearance.outfit,'city-sweatshirt');}
});
