import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSystem, freshSave, validateSave, UPGRADES } from '../src/system.js';
function memory(){const data=new Map();return {getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};}
test('sessions pay once and currency is shared across games',()=>{const system=createSystem(memory());const run=system.beginSession('test-game-a');assert.equal(run.finish(30),true);assert.equal(run.finish(30),false);system.beginSession('test-game-b').finish(20);assert.equal(system.snapshot().coins,50);assert.equal(system.snapshot().stats['test-game-a'].plays,1);});
test('purchases debit the wallet once and change shared modifiers',()=>{const system=createSystem(memory());assert.throws(()=>system.buy('boots'));system.beginSession('test-game-a').finish(1000);system.beginSession('test-game-b').finish(1000);system.buy('boots');assert.equal(system.snapshot().coins,1200);assert.equal(system.modifiers().speed,1.25);assert.throws(()=>system.buy('boots'));system.buy('magnet');assert.deepEqual(system.modifiers(),{speed:1.25,pickupRadius:2});assert.equal(system.snapshot().coins,200);});
test('character, upgrades and game progress persist and export',()=>{const storage=memory(),system=createSystem(storage);system.setCharacter({name:'Ada',color:'#6e9eae',style:'ears'});system.beginSession('test-game-b').finish(1000);system.buy('magnet');assert.deepEqual(createSystem(storage).snapshot(),system.snapshot());const copy=createSystem(memory());copy.importSave(system.exportSave());assert.deepEqual(copy.snapshot(),system.snapshot());});
test('invalid imports are atomic and unsafe values are rejected',()=>{const system=createSystem(memory());const previous=system.snapshot();for(const coins of [-1,1.5,Infinity,'100'])assert.throws(()=>system.importSave(JSON.stringify({...freshSave(),coins})));assert.throws(()=>validateSave({...freshSave(),upgrades:['unlimited-money']}));assert.throws(()=>system.importSave('{'));assert.deepEqual(system.snapshot(),previous);assert.throws(()=>system.beginSession('__proto__'));assert.throws(()=>system.beginSession('garden').finish(-1));});
test('storage failure leaves progress usable and exportable',()=>{let warned=false;const system=createSystem({getItem(){throw Error();},setItem(){throw Error();}},()=>warned=true);system.beginSession('garden').finish(10);assert.equal(warned,true);assert.equal(system.isSaved(),false);assert.equal(JSON.parse(system.exportSave()).coins,10);});
test('knight appearance persists through saves and older saves get appearance defaults',()=>{
  const storage=memory(),system=createSystem(storage);
  system.setCharacter({...system.snapshot().character,armor:'gold',helmet:'crown',cape:false,shield:true});
  const restored=createSystem(storage).snapshot();assert.equal(restored.character.armor,'gold');assert.equal(restored.character.helmet,'crown');assert.equal(restored.character.cape,false);assert.equal(restored.character.shield,true);
  const copy=createSystem(memory());copy.importSave(system.exportSave());assert.deepEqual(copy.snapshot(),restored);
  const old=freshSave();old.character={name:'Pip',color:'#ed6e40',style:'antenna'};const migrated=validateSave(old);assert.equal(migrated.character.armor,'silver');assert.equal(migrated.character.helmet,'plume');assert.equal(migrated.character.cape,true);assert.equal(migrated.character.shield,false);
});
test('invalid knight accessories cannot overwrite a good save',()=>{
  const system=createSystem(memory()),before=system.snapshot();
  for(const look of [{armor:'unknown'},{helmet:'unknown'},{cape:'yes'},{shield:1}])assert.throws(()=>system.setCharacter({...before.character,...look}));
  assert.deepEqual(system.snapshot(),before);
});
test('retired garden upgrade refunds sixty coins once and preserves existing speed purchases',()=>{
  const old=freshSave();old.coins=20;old.upgrades=['garden','garden','boots'];
  const migrated=validateSave(old);assert.equal(migrated.coins,80);assert.deepEqual(migrated.upgrades,['boots']);assert.deepEqual(validateSave(migrated),migrated);
});
test('premium looks require purchases and remain selectable after exporting and restoring',()=>{
  const system=createSystem(memory());const c=system.snapshot().character;
  for(const change of [{armor:'emerald'},{helmet:'winged'},{dragon:'ice'},{dragon:'ember'}])assert.throws(()=>system.setCharacter({...c,...change}));
  system.beginSession('test-game').finish(1000);system.beginSession('test-game').finish(1000);
  for(const id of ['emerald-armor','winged-helmet','ice-dragons','ember-dragons'])system.buy(id);
  assert.equal(system.snapshot().coins,600);system.setCharacter({...c,armor:'emerald',helmet:'winged',dragon:'ice'});
  const copy=createSystem(memory());copy.importSave(system.exportSave());assert.deepEqual(copy.snapshot(),system.snapshot());assert.throws(()=>copy.buy('ice-dragons'));assert.equal(copy.snapshot().coins,600);
});

test('gameplay items cost more than every cosmetic item',()=>{
  const maxAppearance=Math.max(...UPGRADES.filter(item=>item.group==='appearance').map(item=>item.cost));
  for(const item of UPGRADES.filter(item=>item.group==='gameplay'))assert.equal(item.cost>maxAppearance,true);
});
