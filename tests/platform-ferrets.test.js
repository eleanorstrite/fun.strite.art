import test from 'node:test';
import assert from 'node:assert/strict';
import {FERRET_BREEDS,FERRET_UNLOCKS,FERRET_SHOP_ITEMS,ferretUnlocked} from '../src/platform-ferrets.js';
import {validateJumpSettings,PET_BREEDS} from '../src/platform-jump-rules.js';
import {createSystem} from '../src/system.js';
test('natural ferrets are free and special ferrets require their own permanent unlock',()=>{
 assert.deepEqual(PET_BREEDS.ferret,FERRET_BREEDS);
 for(const breed of FERRET_BREEDS){const id=FERRET_UNLOCKS[breed];assert.equal(ferretUnlocked(breed),!id);assert.equal(validateJumpSettings({pet:'ferret',breed}).breed,id?'Sable':breed);if(id){assert.equal(validateJumpSettings({pet:'ferret',breed},[id]).breed,breed);assert.equal(validateJumpSettings({pet:'ferret',breed},['jump-other-ferret']).breed,'Sable');}}
});
test('ferret shop uses shared coins, rejects duplicates and restores ownership',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},system=createSystem(storage);const before=system.snapshot().coins;const item=FERRET_SHOP_ITEMS[0];
 if(before<item.cost){assert.throws(()=>system.buy(item.id));assert.equal(system.snapshot().coins,before);}
 const save=system.snapshot();save.coins=200;storage.setItem('sidequest.save.v1',JSON.stringify(save));const funded=createSystem(storage);
 for(const item of FERRET_SHOP_ITEMS){funded.buy(item.id);assert.ok(funded.snapshot().upgrades.includes(item.id));assert.throws(()=>funded.buy(item.id));}
 assert.equal(funded.snapshot().coins,50);assert.deepEqual(createSystem(storage).snapshot().upgrades,funded.snapshot().upgrades);
});
