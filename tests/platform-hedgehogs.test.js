import test from 'node:test';
import assert from 'node:assert/strict';
import {HEDGEHOG_BREEDS,HEDGEHOG_UNLOCKS,HEDGEHOG_SHOP_ITEMS,hedgehogUnlocked} from '../src/platform-hedgehogs.js';
import {validateJumpSettings,PET_BREEDS} from '../src/platform-jump-rules.js';
import {createSystem} from '../src/system.js';
test('natural hedgehogs are free and special hedgehogs require their own permanent unlock',()=>{
 assert.deepEqual(PET_BREEDS.hedgehog,HEDGEHOG_BREEDS);
 for(const breed of HEDGEHOG_BREEDS){const id=HEDGEHOG_UNLOCKS[breed];assert.equal(hedgehogUnlocked(breed),!id);assert.equal(validateJumpSettings({pet:'hedgehog',breed}).breed,id?'Salt and pepper':breed);if(id){assert.equal(validateJumpSettings({pet:'hedgehog',breed},[id]).breed,breed);assert.equal(validateJumpSettings({pet:'hedgehog',breed},['jump-other-hedgehog']).breed,'Salt and pepper');}}
});
test('hedgehog shop uses shared coins, rejects duplicates and restores ownership',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},system=createSystem(storage);const before=system.snapshot().coins;const item=HEDGEHOG_SHOP_ITEMS[0];
 if(before<item.cost){assert.throws(()=>system.buy(item.id));assert.equal(system.snapshot().coins,before);}
 const save=system.snapshot();save.coins=200;storage.setItem('sidequest.save.v1',JSON.stringify(save));const funded=createSystem(storage);
 for(const item of HEDGEHOG_SHOP_ITEMS){funded.buy(item.id);assert.ok(funded.snapshot().upgrades.includes(item.id));assert.throws(()=>funded.buy(item.id));}
 assert.equal(funded.snapshot().coins,50);assert.deepEqual(createSystem(storage).snapshot().upgrades,funded.snapshot().upgrades);
});
