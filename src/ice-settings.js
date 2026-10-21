export const ICE_CONES={waffle:'Waffle cone',sugar:'Sugar cone',chocolate:'Chocolate cone',cup:'Rainbow cup',pretzel:'Pretzel cone',cookie:'Cookie cone'};
export const ICE_FLAVORS={vanilla:{name:'Vanilla',color:'#fff0ce'},chocolate:{name:'Chocolate',color:'#976047'},strawberry:{name:'Strawberry',color:'#f2a1b8'},mint:{name:'Mint chip',color:'#9ddcc1'},blueberry:{name:'Blueberry',color:'#aaa0db'},rainbow:{name:'Rainbow',color:'#f4b0cb'},caramel:{name:'Salted caramel',color:'#d9a663'},cookies:{name:'Cookies & cream',color:'#eee2cf'},mango:{name:'Mango sorbet',color:'#ffc262'}};
export const ICE_TOPPINGS={sprinkles:'Rainbow sprinkles',chips:'Chocolate chips',sauce:'Chocolate drizzle',cream:'Whipped cream',cherry:'Cherry',stars:'Candy stars',marshmallows:'Mini marshmallows',caramel:'Caramel drizzle',berries:'Mixed berries'};
export const ICE_UNLOCKS={
  cone:{pretzel:'ice-cone-pretzel',cookie:'ice-cone-cookie'},
  flavor:{caramel:'ice-flavor-caramel',cookies:'ice-flavor-cookies',mango:'ice-flavor-mango'},
  topping:{marshmallows:'ice-topping-marshmallows',caramel:'ice-topping-caramel',berries:'ice-topping-berries'},
};
export const ICE_SHOP_ITEMS=Object.entries(ICE_UNLOCKS).flatMap(([kind,items])=>Object.entries(items).map(([key,id])=>({
  id,name:kind==='cone'?ICE_CONES[key]:kind==='flavor'?ICE_FLAVORS[key].name:ICE_TOPPINGS[key],
  group:'appearance',category:'MAKE YOUR OWN ICE CREAM · '+kind.toUpperCase(),icon:'🍦',cost:200,
  description:'For Make Your Own Ice Cream. Permanently unlock this '+kind+' in the ingredient chooser.'
})));
export function iceIngredientUnlocked(kind,id,upgrades=[]){
  const upgrade=ICE_UNLOCKS[kind]?.[id];return !upgrade||upgrades.includes(upgrade);
}
