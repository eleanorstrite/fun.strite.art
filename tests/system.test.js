import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSystem as createRealSystem, freshSave, validateSave, UPGRADES } from '../src/system.js';
const testPassword=async (value,step)=>value===(step===1?'TestFirst':'TestSecond');
const createSystem=(storage,onError)=>createRealSystem(storage,onError,testPassword);
function memory(){const data=new Map();return {getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};}
test('sessions pay once and currency is shared across games',()=>{const system=createSystem(memory());const run=system.beginSession('test-game-a');assert.equal(run.finish(30),true);assert.equal(run.finish(30),false);system.beginSession('test-game-b').finish(20);assert.equal(system.snapshot().coins,50);assert.equal(system.snapshot().stats['test-game-a'].plays,1);});
test('boosts debit per purchase, share a three-slot bag and must be consumed before rebuying',()=>{
 const system=createSystem(memory());assert.throws(()=>system.buy('boots'));
 system.beginSession('test').finish(10000);
 system.buy('boots');system.buy('boots');system.buy('magnet');
 assert.equal(system.snapshot().coins,8500);assert.deepEqual(system.snapshot().boosts,{boots:2,magnet:1,eliminator:0,ward:0,frost:0,snack:0});
 assert.deepEqual(system.modifiers(),{speed:1,pickupRadius:1});
 assert.throws(()=>system.buy('magnet'));assert.equal(system.snapshot().coins,8500);
 assert.equal(system.consumeBoost('boots'),true);system.buy('magnet');
 assert.deepEqual(system.snapshot().boosts,{boots:1,magnet:2,eliminator:0,ward:0,frost:0,snack:0});
 assert.equal(system.consumeBoost('boots'),true);assert.equal(system.consumeBoost('boots'),false);
 assert.equal(system.consumeBoost('unknown'),false);
});
test('old permanent boosts migrate once and invalid bags cannot overwrite progress',()=>{
 const old=freshSave();delete old.boosts;old.upgrades=['boots','magnet'];
 const migrated=validateSave(old);assert.deepEqual(migrated.boosts,{boots:1,magnet:1,eliminator:0,ward:0,frost:0,snack:0});assert.deepEqual(migrated.upgrades,[]);
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
 assert.deepEqual(validateSave(old).boosts,{boots:1,magnet:1,eliminator:0,ward:0,frost:0,snack:0});
 for(const eliminator of [-1,1.5,null,'1',2])assert.throws(()=>validateSave({...old,boosts:{...old.boosts,eliminator}}));
});

test('current maze level persists and older saves start at the first level',()=>{
 const old=freshSave();delete old.mazeLevel;assert.equal(validateSave(old).mazeLevel,0);
 const storage=memory(),system=createSystem(storage);system.setMazeLevel(2);
 assert.equal(createSystem(storage).snapshot().mazeLevel,2);
 const copy=createSystem(memory());copy.importSave(system.exportSave());assert.equal(copy.snapshot().mazeLevel,2);
 for(const level of [-1,4,1.5,'2'])assert.throws(()=>system.setMazeLevel(level));
 assert.equal(system.snapshot().mazeLevel,2);
});

test('Snack Attack costs 1000 per use, saves separately from the knight bag, and never becomes owned',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 const system=createSystem(storage);system.beginSession('test').finish(5000);
 system.buy('boots');system.buy('boots');system.buy('boots');
 system.buy('snack');system.buy('snack');assert.equal(system.snapshot().coins,1500);
 assert.equal(system.snapshot().boosts.snack,2);assert.equal(system.snapshot().upgrades.includes('snack'),false);
 const restored=createSystem(storage);assert.equal(restored.consumeBoost('snack'),true);assert.equal(restored.snapshot().boosts.snack,1);
 restored.buy('snack');assert.equal(restored.snapshot().boosts.snack,2);
 const old=freshSave();delete old.boosts.snack;assert.equal(validateSave(old).boosts.snack,0);
 for(const snack of [-1,1.5,null,'1'])assert.throws(()=>validateSave({...old,boosts:{...old.boosts,snack}}));
});
test('hidden wallet unlocks only for the current visit and preserves earned coins',async()=>{
 const storage=memory(),system=createSystem(storage);
 system.beginSession('test').finish(30);
 assert.equal(await system.unlockWallet('wrong'),false);
 assert.equal(system.snapshot().unlimitedCoins,false);
 assert.throws(()=>system.buy('snack'));
 assert.equal(await system.unlockWallet('TestFirst','TestSecond'),true);
 system.buy('snack');system.buy('snack');system.buy('ice-dragons');
 assert.equal(system.snapshot().coins,30);
 assert.equal(system.snapshot().boosts.snack,2);
 assert.throws(()=>system.buy('ice-dragons'));
 for(let i=0;i<3;i++)system.buy('boots');
 assert.throws(()=>system.buy('magnet'));
 system.consumeBoost('boots');system.buy('magnet');
 const restored=createSystem(storage);assert.equal(restored.snapshot().unlimitedCoins,false);
 assert.throws(()=>restored.buy('snack'));assert.equal(restored.snapshot().coins,30);
 const copy=createSystem(memory());copy.importSave(restored.exportSave());
 assert.deepEqual(copy.snapshot(),restored.snapshot());
 copy.beginSession('test').finish(5);assert.equal(copy.snapshot().coins,35);
 assert.equal(copy.snapshot().unlimitedCoins,false);
});
test('legacy wallets remain finite and malformed unlimited settings are rejected',()=>{
 const old=freshSave();delete old.unlimitedCoins;
 assert.equal(validateSave(old).unlimitedCoins,false);
 for(const value of ['true',1,null,{}])assert.throws(()=>validateSave({...old,unlimitedCoins:value}));
});
test('Raven selection persists and times stay separate by difficulty',()=>{
 const storage=memory(),system=createSystem(storage);system.setRavenLevel('expert');
 assert.equal(createSystem(storage).snapshot().ravenLevel,'expert');
 assert.throws(()=>system.setRavenLevel('invalid'));
 system.beginSession('family-van-easy').finish(1,30000);
 system.beginSession('family-van-expert').finish(10,50000);
 assert.equal(system.snapshot().coins,11);
 assert.equal(system.snapshot().stats['family-van-easy'].bestTimeMs,30000);
 assert.equal(system.snapshot().stats['family-van-expert'].bestTimeMs,50000);
 const old=freshSave();delete old.ravenLevel;assert.equal(validateSave(old).ravenLevel,'easy');
});
test('stacking high scores persist independently from capped coin rewards',()=>{
 const storage=memory(),system=createSystem(storage),run=system.beginSession('burger-stack');
 assert.throws(()=>run.finish(40,null,-1));assert.equal(run.finish(40,null,75),true);assert.equal(run.finish(40,null,90),false);
 system.beginSession('burger-stack').finish(20,null,20);
 assert.equal(system.snapshot().stats['burger-stack'].bestScore,75);assert.equal(system.snapshot().coins,60);
 const copy=createSystem(memory());copy.importSave(system.exportSave());assert.equal(copy.snapshot().stats['burger-stack'].bestScore,75);
 assert.equal(createSystem(storage).snapshot().stats['burger-stack'].bestScore,75);
 const bad=JSON.parse(system.exportSave());bad.stats['burger-stack'].bestScore='75';assert.throws(()=>validateSave(bad));
});

test('entering the wallet password again disables unlimited coins and restores normal spending',async()=>{
 const storage=memory(),system=createSystem(storage);system.beginSession('test').finish(1200);
 await system.unlockWallet('TestFirst','TestSecond');system.buy('snack');assert.equal(system.snapshot().coins,1200);
 assert.equal(await system.unlockWallet('wrong'),false);assert.equal(system.snapshot().unlimitedCoins,true);
 assert.equal(await system.unlockWallet('TestFirst','TestSecond'),true);assert.equal(system.snapshot().unlimitedCoins,false);
 const restored=createSystem(storage);assert.equal(restored.snapshot().unlimitedCoins,false);assert.equal(restored.snapshot().coins,1200);
 restored.buy('snack');assert.equal(restored.snapshot().coins,200);assert.throws(()=>restored.buy('snack'));
 await restored.unlockWallet('TestFirst','TestSecond');assert.equal(restored.snapshot().unlimitedCoins,true);restored.buy('snack');assert.equal(restored.snapshot().coins,200);
});


test('hidden wallet requires both exact passwords and ignores cancelled attempts',async()=>{
 const system=createSystem(memory());
 for(const args of [['TestFirst'],['TestSecond'],['testfirst','TestSecond'],['TestFirst','wrong'],['wrong','TestSecond']]){
  assert.equal(await system.unlockWallet(...args),false);assert.equal(system.snapshot().unlimitedCoins,false);
 }
 assert.equal(await system.unlockWallet('TestFirst','TestSecond',()=>false),false);
 assert.equal(system.snapshot().unlimitedCoins,false);
 assert.equal(await system.unlockWallet('TestFirst','TestSecond'),true);
 assert.equal(system.snapshot().unlimitedCoins,true);
});


test('new visits and imported old unlimited saves always start with earned coins',async()=>{
 const storage=memory(),system=createSystem(storage);
 assert.equal(system.snapshot().unlimitedCoins,false);assert.equal(system.snapshot().coins,0);
 system.beginSession('test').finish(123);
 await system.unlockWallet('TestFirst','TestSecond');system.beginSession('test').finish(7);
 assert.equal(system.snapshot().unlimitedCoins,true);
 assert.equal(JSON.parse(system.exportSave()).unlimitedCoins,false);
 const restored=createSystem(storage);assert.equal(restored.snapshot().unlimitedCoins,false);assert.equal(restored.snapshot().coins,130);
 const legacy={...restored.snapshot(),unlimitedCoins:true};
 restored.importSave(JSON.stringify(legacy));assert.equal(restored.snapshot().unlimitedCoins,false);assert.equal(restored.snapshot().coins,130);
 const oldStorage={getItem:()=>JSON.stringify(legacy),setItem(){}};
 assert.equal(createSystem(oldStorage).snapshot().unlimitedCoins,false);
 assert.equal(createSystem(oldStorage).snapshot().coins,130);
});

test('new shop cosmetics unlock usable saved styles and spells share the three-slot bag',()=>{
 const storage=memory(),s=createSystem(storage);s.beginSession('test').finish(5000);
 for(const [id,field,value] of [['sapphire-armor','armor','sapphire'],['sunset-armor','armor','sunset'],['forest-dragons','dragon','forest'],['neon-dragons','dragon','neon']]){
  assert.throws(()=>s.setCharacter({...s.snapshot().character,[field]:value}));s.buy(id);s.setCharacter({...s.snapshot().character,[field]:value});assert.equal(createSystem(storage).snapshot().character[field],value);assert.throws(()=>s.buy(id));
 }
 s.buy('ward');s.buy('frost');s.buy('boots');assert.throws(()=>s.buy('magnet'));assert.equal(s.snapshot().coins,2300);
 assert.equal(s.consumeBoost('ward'),true);s.buy('frost');assert.equal(s.snapshot().boosts.frost,2);assert.equal(createSystem(storage).snapshot().boosts.frost,2);
 for(const bad of [-1,1.5,'1',null])assert.throws(()=>validateSave({...freshSave(),boosts:{...freshSave().boosts,ward:bad}}));
 const legacy=freshSave();delete legacy.boosts.ward;delete legacy.boosts.frost;assert.equal(validateSave(legacy).boosts.ward,0);assert.equal(validateSave(legacy).boosts.frost,0);
});
test('City food spends the shared wallet, rejects locked recipes, and persists permanent unlocks',()=>{
 const storage=memory(),system=createSystem(storage);system.beginSession('garden').finish(40);
 let balance;const stop=system.subscribe(save=>balance=save.coins);
 system.buyCityFood('bread');assert.equal(balance,39);assert.equal(createSystem(storage).snapshot().coins,39);
 const before=system.snapshot();for(const kind of ['cake','toString','__proto__','missing'])assert.throws(()=>system.buyCityFood(kind));assert.deepEqual(system.snapshot(),before);
 system.buy('city-cake');assert.equal(system.snapshot().coins,14);system.buyCityFood('cake');assert.equal(system.snapshot().coins,10);
 const reopened=createSystem(storage);assert.ok(reopened.snapshot().upgrades.includes('city-cake'));reopened.buyCityFood('cake');reopened.buyCityFood('cake');assert.equal(reopened.snapshot().coins,2);assert.throws(()=>reopened.buyCityFood('cake'));assert.equal(reopened.snapshot().coins,2);reopened.buyCityFood('pizza');assert.equal(reopened.snapshot().coins,0);assert.throws(()=>reopened.buyCityFood('bread'));stop();
});
test('City food honors an unlocked unlimited wallet without changing saved coins',async()=>{
 const system=createSystem(memory());await system.unlockWallet('TestFirst','TestSecond');system.buy('city-cake');system.buyCityFood('cake');assert.equal(system.snapshot().coins,0);assert.equal(system.snapshot().unlimitedCoins,true);
});
