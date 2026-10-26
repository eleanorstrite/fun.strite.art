export const CITY_FOOD={
  bread:{price:1,name:'Bread',shape:'loaf',color:'#c78f4c'},milkshake:{price:2,name:'Milkshake',shape:'shake',color:'#eba5b9'},sandwich:{price:2,name:'Sandwich',shape:'sandwich',color:'#e9c385'},pizza:{price:2,name:'Pizza',shape:'pizza',color:'#edbd63'},
  croissant:{price:1,name:'Croissant',shape:'croissant',color:'#cf9250'},cupcake:{price:2,name:'Cupcake',shape:'cupcake',color:'#e8a9ca'},cookie:{price:1,name:'Cookie',shape:'cookie',color:'#bc8a51'},doughnut:{price:1,name:'Doughnut',shape:'doughnut',color:'#e8a2b7'},
  apple:{price:1,name:'Apple',shape:'apple',color:'#c44f42'},milk:{price:1,name:'Milk',shape:'carton',color:'#eee9db'},cheese:{price:2,name:'Cheese',shape:'cheese',color:'#e8bd49'},cereal:{price:2,name:'Cereal',shape:'carton',color:'#d99c4d'},carrot:{price:1,name:'Carrot',shape:'carrot',color:'#e89542'}
};
CITY_FOOD.cake={name:'Rainbow rosette cake',price:5,shape:'cake',color:'#efb3d1',upgrade:'city-cake',unlockCost:25,icon:'🎂',description:'A tall vanilla cake with rainbow drip icing, rainbow buttercream roses, and candy sprinkles. Eat it to grow rainbow flowers outside with Space for 30 seconds!'};
CITY_FOOD.galaxyShake={name:'Galaxy milkshake',price:5,shape:'galaxy',color:'#9c8beb',upgrade:'city-galaxy-shake',unlockCost:30,icon:'🌌',description:'A swirling galaxy shake in a glass, topped with whipped cream, a ringed candy planet, and a striped straw. Drink it to fly outside with Space and arrow keys for 30 seconds!'};
CITY_FOOD.fruitCup={name:'Rainbow fruit parfait',price:5,shape:'fruit-cup',color:'#77d6bb',upgrade:'city-fruit-cup',unlockCost:20,icon:'🌈',description:'A clear glass of yogurt, granola, blueberries, kiwi, orange, and strawberries. Eat it for 30 seconds of super speed with a sparkling golden contrail!'};
export const CITY_FOOD_UNLOCKS=Object.entries(CITY_FOOD).filter(([,food])=>food.upgrade).map(([kind,food])=>({id:food.upgrade,name:food.name,group:'appearance',category:'CITY BUILDER · Fancy food recipe',icon:food.icon,cost:food.unlockCost,action:'Unlock recipe',description:`${food.description} Permanently unlock the recipe; each City Builder order then costs ${food.price} shared coins.`}));
export const cityFoodUnlocked=(kind,upgrades=[])=>Boolean(Object.hasOwn(CITY_FOOD,kind)&&(!CITY_FOOD[kind].upgrade||upgrades.includes(CITY_FOOD[kind].upgrade)));
export const CITY_SHOPS={
  cafe:{name:'Café menu',menu:['bread','milkshake','sandwich','pizza','galaxyShake'],register:{x:-1,z:-3.5},counter:{id:'counter',x:-3,z:-3.5,w:5,d:1.3,y:1.2},serve:{x:-2,z:-3.1}},
  bakery:{name:'Bakery menu',menu:['bread','croissant','cupcake','cookie','doughnut','cake'],register:{x:-1,z:-3.5},counter:{id:'counter',x:-3,z:-3.5,w:5,d:1.3,y:1.2},serve:{x:-2,z:-3.1}},
  market:{name:'Market groceries',menu:['apple','milk','bread','cheese','cereal','carrot','fruitCup'],register:{x:-4,z:4},counter:{id:'counter',x:-4,z:4,w:3,d:1,y:1.05},serve:{x:-3.2,z:4.1}}
};
export const CITY_HOLD_SECONDS=.55;
export function createCityShop(id,surfaces=[]){return CITY_SHOPS[id]?{id,items:[],nextId:1,surfaces:[CITY_SHOPS[id].counter,...surfaces.filter(s=>s.id!=='counter')]}:null;}
export const cityCarriedFood=shop=>shop?.items.find(item=>item.carried)??null;
export const cityAtRegister=(shop,player)=>Boolean(shop&&Math.hypot(player.x-CITY_SHOPS[shop.id].register.x,player.z-CITY_SHOPS[shop.id].register.z)<2);
export function cityOrderFood(shop,kind,player,purchase=()=>{}){
  if(!cityAtRegister(shop,player)||!CITY_SHOPS[shop.id].menu.includes(kind)||shop.items.length>=6||shop.items.some(item=>!item.carried&&item.surface==='counter'))return null;
  purchase(kind);
  const config=CITY_SHOPS[shop.id],item={id:shop.nextId++,kind,x:config.serve.x,z:config.serve.z,y:config.counter.y,surface:'counter',carried:false};shop.items.push(item);return item;
}
export function cityPickUpFood(shop,id,player){
  const item=shop?.items.find(item=>item.id===id);if(!item||item.carried||cityCarriedFood(shop)||Math.hypot(item.x-player.x,item.z-player.z)>2.4)return false;
  item.carried=true;return true;
}
export function cityPlaceFood(shop,surfaceId,point,player){
  const item=cityCarriedFood(shop),surface=shop?.surfaces.find(s=>s.id===surfaceId);
  if(!item||!surface||Math.hypot(point.x-player.x,point.z-player.z)>2.4||Math.abs(point.x-surface.x)>surface.w/2-.22||Math.abs(point.z-surface.z)>surface.d/2-.22)return false;
  if(shop.items.some(other=>other!==item&&!other.carried&&Math.hypot(point.x-other.x,point.z-other.z)<.48)||(surface.occupied??[]).some(p=>Math.hypot(point.x-p.x,point.z-p.z)<.45))return false;
  Object.assign(item,{carried:false,surface:surfaceId,x:point.x,z:point.z,y:surface.y});return true;
}
export function cityEatOrderedFood(shop,player){
  const item=cityCarriedFood(shop)??shop?.items.filter(item=>Math.hypot(item.x-player.x,item.z-player.z)<=2.4).sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z))[0];
  if(!item)return null;shop.items.splice(shop.items.indexOf(item),1);return item;
}
export const cityCanLeaveShop=shop=>!cityCarriedFood(shop);

export function restoreCityOrders(shop,saved){
  if(!shop||!Array.isArray(saved))return;
  for(const item of saved.slice(0,6)){
    const surface=shop.surfaces.find(s=>s.id===item?.surface);
    if(!surface||!CITY_SHOPS[shop.id].menu.includes(item.kind)||!Number.isFinite(item.x)||!Number.isFinite(item.z)||Math.abs(item.x-surface.x)>surface.w/2||Math.abs(item.z-surface.z)>surface.d/2)continue;
    shop.items.push({id:shop.nextId++,kind:item.kind,x:item.x,z:item.z,y:surface.y,surface:surface.id,carried:false});
  }
}
