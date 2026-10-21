import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSystem, freshSave, validateSave, UPGRADES } from '../src/system.js';
function memory(){const data=new Map();return {getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};}
test('sessions pay once and currency is shared across games',()=>{const system=createSystem(memory());const run=system.beginSession('test-game-a');assert.equal(run.finish(30),true);assert.equal(run.finish(30),false);system.beginSession('test-game-b').finish(20);assert.equal(system.snapshot().coins,50);assert.equal(system.snapshot().stats['test-game-a'].plays,1);});
test('boosts debit per purchase, share a three-slot bag and must be consumed before rebuying',()=>{
 const system=createSystem(memory());assert.throws(()=>system.buy('boots'));
 system.beginSession('test').finish(10000);
 system.buy('boots');system.buy('boots');system.buy('magnet');
 assert.equal(system.snapshot().coins,8500);assert.deepEqual(system.snapshot().boosts,{boots:2,magnet:1,eliminator:0});
 assert.deepEqual(system.modifiers(),{speed:1,pickupRadius:1});
 assert.throws(()=>system.buy('magnet'));assert.equal(system.snapshot().coins,8500);
 assert.equal(system.consumeBoost('boots'),true);system.buy('magnet');
 assert.deepEqual(system.snapshot().boosts,{boots:1,magnet:2,eliminator:0});
 assert.equal(system.consumeBoost('boots'),true);assert.equal(system.consumeBoost('boots'),false);
 assert.equal(system.consumeBoost('unknown'),false);
});
test('old permanent boosts migrate once and invalid bags cannot overwrite progress',()=>{
 const old=freshSave();delete old.boosts;old.upgrades=['boots','magnet'];
 const migrated=validateSave(old);assert.deepEqual(migrated.boosts,{boots:1,magnet:1,eliminator:0});assert.deepEqual(migrated.upgrades,[]);
 assert.deepEqual(validateSave(migrated),migrated);
 const system=createSystem(memory()),before=system.snapshot();
 for(const boosts of [null,[],{boots:4,magnet:0},{boots:2,magnet:2},{boots:-1,magnet:0},{boots:.5,magnet:0}])assert.throws(()=>system.importSave(JSON.stringify({...before,boosts})));
 assert.deepEqual(system.snapshot(),before);
});
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
  const old=freshSave();delete old.boosts;old.coins=20;old.upgrades=['garden','garden','boots'];
  const migrated=validateSave(old);assert.equal(migrated.coins,80);assert.deepEqual(migrated.upgrades,[]);assert.equal(migrated.boosts.boots,1);assert.deepEqual(validateSave(migrated),migrated);
});
test('premium looks require purchases and remain selectable after exporting and restoring',()=>{
  const system=createSystem(memory());const c=system.snapshot().character;
  for(const change of [{armor:'emerald'},{helmet:'winged'},{dragon:'ice'},{dragon:'ember'}])assert.throws(()=>system.setCharacter({...c,...change}));
  system.beginSession('test-game').finish(1000);system.beginSession('test-game').finish(1000);
  for(const id of ['emerald-armor','winged-helmet','ice-dragons','ember-dragons'])system.buy(id);
  assert.equal(system.snapshot().coins,1050);system.setCharacter({...c,armor:'emerald',helmet:'winged',dragon:'ice'});
  const copy=createSystem(memory());copy.importSave(system.exportSave());assert.deepEqual(copy.snapshot(),system.snapshot());assert.throws(()=>copy.buy('ice-dragons'));assert.equal(copy.snapshot().coins,1050);
});

test('speed and magnet cost five hundred coins and eliminator costs one thousand',()=>{
  assert.equal(UPGRADES.find(item=>item.id==='boots').cost,500);
  assert.equal(UPGRADES.find(item=>item.id==='magnet').cost,500);
  assert.equal(UPGRADES.find(item=>item.id==='eliminator').cost,1000);
});
test('robot outfits and mixed accessories survive reload and export without changing knight settings',()=>{
  const storage=memory(),system=createSystem(storage),before=system.snapshot().character;
  const robot={outfit:'spacesuit',hat:'beanie',color:'#9b85bb',glasses:true,headphones:true,backpack:true};
  system.setCharacter({...before,robot});const restored=createSystem(storage);assert.deepEqual(restored.snapshot().character.robot,robot);assert.equal(restored.snapshot().character.armor,before.armor);
  const copy=createSystem(memory());copy.importSave(system.exportSave());assert.deepEqual(copy.snapshot(),restored.snapshot());
});
test('old saves get a classic robot and invalid wardrobe data cannot overwrite a save',()=>{
  const old=freshSave();delete old.character.robot;assert.equal(validateSave(old).character.robot.outfit,'none');
  const system=createSystem(memory()),before=system.snapshot();for(const robot of [null,[],{outfit:'unknown'},{hat:'unknown'},{color:'red'},{glasses:'yes'}])assert.throws(()=>system.setCharacter({...before.character,robot}));assert.deepEqual(system.snapshot(),before);
});

test('dragon eliminators cost a thousand coins, share the bag, and persist until consumed',()=>{
 const storage=memory(),system=createSystem(storage);system.beginSession('test').finish(4000);
 system.buy('eliminator');assert.equal(system.snapshot().coins,3000);
 system.buy('boots');system.buy('magnet');assert.throws(()=>system.buy('eliminator'));
 assert.equal(createSystem(storage).snapshot().boosts.eliminator,1);
 const restored=createSystem(memory());restored.importSave(system.exportSave());
 assert.equal(restored.consumeBoost('eliminator'),true);assert.equal(restored.consumeBoost('eliminator'),false);
 restored.buy('eliminator');assert.equal(restored.snapshot().boosts.eliminator,1);
 const old=freshSave();old.boosts={boots:1,magnet:1};
 assert.deepEqual(validateSave(old).boosts,{boots:1,magnet:1,eliminator:0});
 for(const eliminator of [-1,1.5,null,'1',2])assert.throws(()=>validateSave({...old,boosts:{...old.boosts,eliminator}}));
});
