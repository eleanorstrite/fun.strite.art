export const ICE_CONES={waffle:'Waffle cone',sugar:'Sugar cone',chocolate:'Chocolate cone',cup:'Rainbow cup',pretzel:'Pretzel cone',cookie:'Cookie cone',cake:'Cake cone',bowl:'Waffle bowl',dipped:'Chocolate-dipped cone',fish:'Fish cone'};
export const ICE_FLAVORS={vanilla:{name:'Vanilla',color:'#fff0ce'},chocolate:{name:'Chocolate',color:'#976047'},strawberry:{name:'Strawberry',color:'#f2a1b8'},mint:{name:'Mint chip',color:'#9ddcc1'},blueberry:{name:'Blueberry',color:'#aaa0db'},rainbow:{name:'Rainbow',color:'#f4b0cb'},caramel:{name:'Salted caramel',color:'#d9a663'},cookies:{name:'Cookies & cream',color:'#c9c6cd'},mango:{name:'Mango sorbet',color:'#ffc262'},pistachio:{name:'Pistachio',color:'#b1d180'},marshmallow:{name:'Marshmallow',color:'#bcdff0'},rockyroad:{name:'Rocky road',color:'#89604b'},vanillaalmond:{name:'Vanilla & almond',color:'#f4e8c5'},maplewalnut:{name:'Maple & walnut',color:'#e4bf79'},mascarpone:{name:'Mascarpone',color:'#fff5df'},orangechocolate:{name:'Orange & chocolate',color:'#b58363'},pannacotta:{name:'Panna cotta',color:'#fff0dd'},chocolateraspberry:{name:'Chocolate & raspberry',color:'#f0d2cf'},chocolatealmond:{name:'Chocolate & almond',color:'#bb8d70'},neapolitan:{name:'Strawberry, vanilla & chocolate',color:'#edc6ba'},cherry:{name:'Cherry ripple',color:'#efb2a4'},orange:{name:'Orange sorbet',color:'#ffe38b'}};
export const ICE_TOPPINGS={sprinkles:'Rainbow sprinkles',chips:'Chocolate chips',sauce:'Chocolate drizzle',cream:'Whipped cream',cherry:'Cherry',stars:'Candy stars',marshmallows:'Mini marshmallows',caramel:'Caramel drizzle',berries:'Mixed berries',pinkSprinkles:'Pink sprinkles',chocolateSprinkles:'Chocolate sprinkles',pearlSprinkles:'Pearl sprinkles',strawberrySyrup:'Strawberry syrup',butterscotch:'Butterscotch syrup',blueberrySauce:'Blueberry syrup',mms:'M&M’s',truFru:'Tru Fru bites',waferRolls:'Chocolate wafer rolls',redVelvetWhip:'Red velvet whip',banana:'Banana slices',strawberries:'Strawberries',chocolatePieces:'Chocolate pieces',oreo:'Oreo cookies',brownie:'Chocolate brownie',goldfish:'Goldfish crackers',cookieCrumbs:'Cookie crumbs',almonds:'Almonds',walnuts:'Walnuts',raspberries:'Raspberries',orangeSlice:'Orange slice'};
export const ICE_SYRUPS={sauce:{color:'#633c32',shine:'#a46b48',bottle:'#7d4a32',label:'CHOCO'},caramel:{color:'#c38532',shine:'#f6ce78',bottle:'#d6a04c',label:'CARAMEL'},strawberrySyrup:{color:'#dd3d62',shine:'#ff98ab',bottle:'#e35670',label:'STRAWBERRY'},butterscotch:{color:'#d59627',shine:'#ffe19a',bottle:'#dbae54',label:'BUTTERSCOTCH'},blueberrySauce:{color:'#655095',shine:'#b99ad8',bottle:'#8370ac',label:'BLUEBERRY'}};
export const isIceSyrup=id=>Object.hasOwn(ICE_SYRUPS,id);
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
