import test from 'node:test';
import assert from 'node:assert/strict';
import {COSTUME_PET_TYPES,COSTUME_PET_BREEDS,COSTUME_PET_SHOP_ITEMS,costumePetSprite,costumePetUnlocked,costumePetUpgrade} from '../src/platform-costume-pets.js';
import {COSTUME_PET_BOUNDS} from '../src/platform-costume-pet-bounds.js';
import {validateJumpSettings} from '../src/platform-jump-rules.js';
import {drawRealJumpPet} from '../src/platform-jump-pets.js';
import {UPGRADES,createSystem} from '../src/system.js';
test('all nine pet costumes are unique permanent shop unlocks and validate ownership',()=>{
 assert.equal(COSTUME_PET_SHOP_ITEMS.length,9);assert.equal(new Set(COSTUME_PET_SHOP_ITEMS.map(item=>item.id)).size,9);
 for(const item of COSTUME_PET_SHOP_ITEMS){assert.ok(UPGRADES.includes(item));assert.equal(item.cost,50);const {pet,breed}=item.petCostume;assert.equal(costumePetUnlocked(pet,breed),false);assert.notEqual(validateJumpSettings({pet,breed}).breed,breed);assert.equal(costumePetUnlocked(pet,breed,[item.id]),true);assert.equal(validateJumpSettings({pet,breed},[item.id]).breed,breed);}
 assert.equal(costumePetUpgrade('dragon','Rainbow'),null);
});
test('cat, dog and bird costumes render full walking and jumping poses from their own atlases',t=>{
 const previous=globalThis.Image;t.after(()=>globalThis.Image=previous);globalThis.Image=class{complete=true;naturalWidth=1536;naturalHeight=1247;};
 const draws=[],c=new Proxy({drawImage:(...args)=>draws.push(args)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 for(const pet of COSTUME_PET_TYPES){assert.equal(COSTUME_PET_BOUNDS[pet].length,9);for(const breed of COSTUME_PET_BREEDS){const idle=costumePetSprite(pet,breed),jump=costumePetSprite(pet,breed,'jump');assert.notDeepEqual(idle.bounds,jump.bounds);for(const pose of ['idle','walk','jump']){draws.length=0;assert.equal(drawRealJumpPet(c,100,100,{pet,breed,petName:''},.2,pose==='walk',1,pose),true);assert.ok(draws.length>0);assert.ok(draws.at(-1)[0].src.includes('platform-costume-'+pet));assert.ok(draws.at(-1).slice(1).every(Number.isFinite));}}}
});
test('buying the nine costumes debits the wallet once and keeps all unlocks after reload',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},system=createSystem(storage);system.beginSession('pet-costume-test').finish(500);
 for(const item of COSTUME_PET_SHOP_ITEMS)system.buy(item.id);
 assert.equal(system.snapshot().coins,50);assert.throws(()=>system.buy(COSTUME_PET_SHOP_ITEMS[0].id));
 const restored=createSystem(storage).snapshot();for(const item of COSTUME_PET_SHOP_ITEMS)assert.ok(restored.upgrades.includes(item.id));
});
