import test from 'node:test';
import assert from 'node:assert/strict';
import {CITY_SHOPS,createCityShop,cityAtRegister,cityOrderFood,cityPickUpFood,cityPlaceFood,cityCarriedFood,cityEatOrderedFood,cityCanLeaveShop} from '../src/city-shop.js';
const table={id:'table',x:0,z:0,w:2,d:2,y:1,occupied:[{x:.6,z:.6}]};
const customer={x:-1,z:-2.2};
test('register menus are shop specific and ordering requires an available nearby counter',()=>{
  assert.equal(createCityShop('school'),null);
  assert.deepEqual(CITY_SHOPS.cafe.menu,['bread','milkshake','sandwich','pizza']);
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
