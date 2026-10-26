export const CITY_FOOD={
  bread:{name:'Bread',shape:'loaf',color:'#c78f4c'},milkshake:{name:'Milkshake',shape:'shake',color:'#eba5b9'},sandwich:{name:'Sandwich',shape:'sandwich',color:'#e9c385'},pizza:{name:'Pizza',shape:'pizza',color:'#edbd63'},
  croissant:{name:'Croissant',shape:'croissant',color:'#cf9250'},cupcake:{name:'Cupcake',shape:'cupcake',color:'#e8a9ca'},cookie:{name:'Cookie',shape:'cookie',color:'#bc8a51'},doughnut:{name:'Doughnut',shape:'doughnut',color:'#e8a2b7'},
  apple:{name:'Apple',shape:'apple',color:'#c44f42'},milk:{name:'Milk',shape:'carton',color:'#eee9db'},cheese:{name:'Cheese',shape:'cheese',color:'#e8bd49'},cereal:{name:'Cereal',shape:'carton',color:'#d99c4d'},carrot:{name:'Carrot',shape:'carrot',color:'#e89542'}
};
export const CITY_SHOPS={
  cafe:{name:'Café menu',menu:['bread','milkshake','sandwich','pizza'],register:{x:-1,z:-3.5},counter:{id:'counter',x:-3,z:-3.5,w:5,d:1.3,y:1.2},serve:{x:-2,z:-3.1}},
  bakery:{name:'Bakery menu',menu:['bread','croissant','cupcake','cookie','doughnut'],register:{x:-1,z:-3.5},counter:{id:'counter',x:-3,z:-3.5,w:5,d:1.3,y:1.2},serve:{x:-2,z:-3.1}},
  market:{name:'Market groceries',menu:['apple','milk','bread','cheese','cereal','carrot'],register:{x:-4,z:4},counter:{id:'counter',x:-4,z:4,w:3,d:1,y:1.05},serve:{x:-3.2,z:4.1}}
};
export const CITY_HOLD_SECONDS=.55;
export function createCityShop(id,surfaces=[]){return CITY_SHOPS[id]?{id,items:[],nextId:1,surfaces:[CITY_SHOPS[id].counter,...surfaces.filter(s=>s.id!=='counter')]}:null;}
export const cityCarriedFood=shop=>shop?.items.find(item=>item.carried)??null;
export const cityAtRegister=(shop,player)=>Boolean(shop&&Math.hypot(player.x-CITY_SHOPS[shop.id].register.x,player.z-CITY_SHOPS[shop.id].register.z)<2);
export function cityOrderFood(shop,kind,player){
  if(!cityAtRegister(shop,player)||!CITY_SHOPS[shop.id].menu.includes(kind)||shop.items.length>=6||shop.items.some(item=>!item.carried&&item.surface==='counter'))return null;
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
