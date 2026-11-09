// Game ownership is explicit: descriptions sometimes mention other games to
// explain that an item does NOT work there.
const GAME_NAMES={
 'platform-jump':['Platform Jump'],
 'wizard-tetris':['Wizard Tetris','Storm Stack','Stormstack'],
 'animal-sports':['Animal Sports','Bowling','Tennis','Basketball'],
 'knights-and-dragons':['Knights and Dragons','Knight and Dragon','Knight maze'],
 'the-raven':['The Raven','Raven','Family van'],
 'ice-cream':['Make Your Own Ice Cream','Ice cream','Milkshake'],
 'city-builder':['City Builder'],
 'hoop-flight':['Hoop Flight','Airplane','Plane'],
 'flappy-animals':['Flappy Animals','Flappy Bird'],
 'dragon-adventures':['Dragon Adventures'],
 'dragon-memory':['Dragon Memory'],
 'burger-stack':['Stack the Hamburger','Burger Stack','Hamburger'],
 'tag':['Tag'],
 'carve-pumpkin':['Carve the Pumpkin','Pumpkin'],
 website:['Website','Home screen','Scenery']
};
const KNIGHT_ITEMS=new Set(['boots','magnet','eliminator','ward','frost','emerald-armor','sapphire-armor','sunset-armor','winged-helmet','ember-dragons','ice-dragons','forest-dragons','neon-dragons']);
export function shopItemGame(item){
 if(KNIGHT_ITEMS.has(item.id))return 'knights-and-dragons';
 for(const [prefix,game]of [['jump-','platform-jump'],['wizard-','wizard-tetris'],['sports-','animal-sports'],['ice-','ice-cream'],['city-','city-builder'],['air-','hoop-flight'],['flight-','flappy-animals']])if(item.id.startsWith(prefix))return game;
 if(item.id==='dragon-race')return 'dragon-adventures';
 if(item.id==='snack')return 'the-raven';
 if(['aurora-background','forest-background'].includes(item.id))return 'website';
 return null;
}
const normalize=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
export function searchShopItems(items,query=''){
 const needle=normalize(query);if(!needle)return items;
 const games=Object.entries(GAME_NAMES).filter(([,names])=>names.some(name=>normalize(name).includes(needle))).map(([id])=>id);
 if(games.length)return items.filter(item=>games.includes(shopItemGame(item)));
 const words=needle.split(' ');
 return items.filter(item=>{const text=normalize([item.name,item.category,item.group,...(GAME_NAMES[shopItemGame(item)]??[])].join(' '));return words.every(word=>text.includes(word));});
}
