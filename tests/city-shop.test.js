import test from 'node:test';
import assert from 'node:assert/strict';
import {CITY_SHOPS,createCityShop,cityAtRegister,cityOrderFood,cityPickUpFood,cityPlaceFood,cityCarriedFood,cityEatOrderedFood,cityCanLeaveShop} from '../src/city-shop.js';
const table={id:'table',x:0,z:0,w:2,d:2,y:1,occupied:[{x:.6,z:.6}]};
const customer={x:-1,z:-2.2};
test('register menus are shop specific and ordering requires an available nearby counter',()=>{
  assert.equal(createCityShop('school'),null);
  assert.deepEqual(CITY_SHOPS.cafe.menu,['bread','milkshake','sandwich','pizza','doughnut','strawberries','tacos','waffles','pancakes','galaxyShake']);
  assert.ok(CITY_SHOPS.bakery.menu.includes('croissant'));assert.ok(CITY_SHOPS.market.menu.includes('milk'));
  const shop=createCityShop('cafe',[table]);assert.equal(cityAtRegister(shop,{x:0,z:5}),false);
  assert.equal(cityOrderFood(shop,'pizza',{x:0,z:5}),null);assert.equal(cityOrderFood(shop,'carrot',customer),null);
  const food=cityOrderFood(shop,'pizza',customer);assert.equal(food.surface,'counter');assert.equal(food.y,1.2);
  assert.equal(cityOrderFood(shop,'bread',customer),null,'counter cannot overlap orders');
});
test('food moves from counter to hand to a chosen clear table spot, never out the door',()=>{
  const shop=createCityShop('cafe',[table]),food=cityOrderFood(shop,'sandwich',customer);
  assert.equal(cityPickUpFood(shop,food.id,{x:6,z:5}),false);assert.equal(cityPickUpFood(shop,food.id,customer),true);
  assert.equal(cityCanLeaveShop(shop),false);assert.equal(cityCarriedFood(shop),food);
  assert.equal(cityPlaceFood(shop,'floor',{x:0,z:0},{x:0,z:1}),false);
  assert.equal(cityPlaceFood(shop,'table',{x:.9,z:0},{x:0,z:1}),false,'edge rejected');
  assert.equal(cityPlaceFood(shop,'table',{x:.6,z:.6},{x:0,z:1}),false,'existing plate rejected');
  assert.equal(cityPlaceFood(shop,'table',{x:0,z:0},{x:5,z:5}),false,'distant placement rejected');
  assert.equal(cityPlaceFood(shop,'table',{x:-.4,z:.3},{x:0,z:1}),true);
  assert.deepEqual({x:food.x,z:food.z,y:food.y,surface:food.surface},{x:-.4,z:.3,y:1,surface:'table'});assert.equal(cityCanLeaveShop(shop),true);
  assert.equal(cityPickUpFood(shop,food.id,{x:0,z:1}),true);assert.equal(cityCanLeaveShop(shop),false);
  assert.equal(cityEatOrderedFood(shop,{x:6,z:5}),food,'carried food stays edible while moving');assert.equal(cityCanLeaveShop(shop),true);assert.equal(shop.items.length,0);
});
test('one hand holds one item and placed orders cannot overlap',()=>{
  const shop=createCityShop('bakery',[table]),first=cityOrderFood(shop,'bread',customer);cityPickUpFood(shop,first.id,customer);
  const second=cityOrderFood(shop,'cookie',customer);assert.equal(cityPickUpFood(shop,second.id,customer),false);
  cityPlaceFood(shop,'table',{x:0,z:0},{x:0,z:1});cityPickUpFood(shop,second.id,customer);
  assert.equal(cityPlaceFood(shop,'table',{x:.1,z:0},{x:0,z:1}),false);
  assert.equal(cityPlaceFood(shop,'table',{x:-.6,z:0},{x:0,z:1}),true);
});
test('Space can eat the counter order and cannot eat a distant or already eaten order',()=>{
  const shop=createCityShop('market'),player={x:-3.2,z:5},food=cityOrderFood(shop,'milk',player);
  assert.equal(cityEatOrderedFood(shop,{x:5,z:-5}),null);assert.equal(cityEatOrderedFood(shop,player),food);assert.equal(cityEatOrderedFood(shop,player),null);
  assert.ok(cityOrderFood(shop,'apple',player));
});
test('rejected and duplicate orders never charge; a failed charge creates no food',()=>{
 const shop=createCityShop('cafe');let charged=0;const charge=()=>charged++;
 cityOrderFood(shop,'pizza',{x:6,z:5},charge);cityOrderFood(shop,'cake',customer,charge);assert.equal(charged,0);
 assert.throws(()=>cityOrderFood(shop,'pizza',customer,()=>{throw Error('Not enough coins');}));assert.equal(shop.items.length,0);assert.equal(shop.nextId,1);
 cityOrderFood(shop,'pizza',customer,charge);cityOrderFood(shop,'pizza',customer,charge);assert.equal(charged,1);assert.equal(shop.items.length,1);
});
test('paid orders restore at their last surface and reject invalid saved items',async()=>{
 const {restoreCityOrders}=await import('../src/city-shop.js');const shop=createCityShop('cafe',[table]);
 restoreCityOrders(shop,[null,{kind:'pizza',surface:'counter',x:-2,z:-3.1,carried:true},{kind:'cake',surface:'counter',x:-2,z:-3.1},{kind:'bread',surface:'counter',x:Infinity,z:0}]);
 assert.equal(shop.items.length,1);assert.equal(shop.items[0].carried,false);assert.equal(shop.items[0].y,1.2);assert.equal(shop.nextId,2);
});
test('saved orders follow their plot when resizing and clear when the building is replaced',async()=>{
 const {createCityState,cityPlace,cityResize,citySerialize}=await import('../src/city-builder.js');const state=createCityState();cityPlace(state,2,2,'bakery');
 state.shopOrders['2,2']={id:'bakery',items:[{kind:'cake',surface:'counter',x:-2,z:-3.1}]};cityResize(state,20);
 const restored=createCityState(citySerialize(state));assert.equal(restored.shopOrders['2,2'].items[0].kind,'cake');cityPlace(restored,2,2,'cafe');assert.equal(restored.shopOrders['2,2'],undefined);
});
test('only the fancy recipes need shop unlocks; everyday foods stay available',async()=>{
 const {CITY_FOOD,CITY_FOOD_UNLOCKS,cityFoodUnlocked}=await import('../src/city-shop.js');
 assert.deepEqual(CITY_FOOD_UNLOCKS.map(item=>item.id).sort(),['city-cake','city-fruit-cup','city-galaxy-shake','city-white-cake']);
 for(const [kind,food] of Object.entries(CITY_FOOD)){
   assert.equal(cityFoodUnlocked(kind),!food.upgrade);
   assert.equal(cityFoodUnlocked(kind,CITY_FOOD_UNLOCKS.map(item=>item.id)),true);
   if(food.upgrade)assert.equal(food.price,5);else assert.ok(food.price===1||food.price===2);
 }
});

test('new everyday foods can be bought and eaten as their own food in every listed shop',async()=>{
 const {CITY_FOOD}=await import('../src/city-shop.js');
 for(const kind of ['chocolateDoughnut','vanillaDoughnut','strawberries','tacos','waffles','pancakes','chips']){
  assert.ok(CITY_FOOD[kind].photo);assert.equal(CITY_FOOD[kind].upgrade,undefined);
  for(const [id,config] of Object.entries(CITY_SHOPS).filter(([,s])=>s.menu.includes(kind))){
   const shop=createCityShop(id),player=config.register;let paid;
   const item=cityOrderFood(shop,kind,player,k=>paid=k);assert.equal(paid,kind);
   assert.equal(cityPickUpFood(shop,item.id,config.serve),true);
   assert.equal(cityEatOrderedFood(shop,player).kind,kind);assert.equal(shop.items.length,0);
  }
 }
});
