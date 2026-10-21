import { FLIGHT_BACKGROUNDS, FLIGHT_DEFAULTS, validateFlightSettings } from './flight-settings.js';
/** Shared, renderer-independent progression API. No game owns the wallet. */
export const SAVE_KEY = 'sidequest.save.v1';
export const COLORS = ['#ed6e40', '#86966a', '#9b85bb', '#6e9eae', '#d5aa4d'];
export const ARMORS = { silver: { name: 'Silver', dark: '#8294a7', light: '#d8e3e4' }, gold: { name: 'Gold', dark: '#b88b38', light: '#ffe39a' }, midnight: { name: 'Midnight', dark: '#414565', light: '#9499c6' }, rose: { name: 'Rose', dark: '#a7657d', light: '#f2b8cd' } };
ARMORS.emerald={name:'Emerald',dark:'#287967',light:'#9ef0c8',upgrade:'emerald-armor'};
export const DRAGON_STYLES={classic:{name:'Classic dragons',colors:['#a34b50','#738959','#78609e','#4e8e98']},ice:{name:'Ice dragons',colors:['#66b9d3','#78cbd0','#8babe4','#a0c8ec'],upgrade:'ice-dragons'},ember:{name:'Ember dragons',colors:['#cf633c','#c98c35','#b94b53','#dd894c'],upgrade:'ember-dragons'}};
export const HELMETS = { plume: 'Feather plume', horns: 'Dragon horns', crown: 'Royal crown', plain: 'Classic helmet' };
HELMETS.winged='Winged helmet';
export const ROBOT_OUTFITS={none:'Classic robot',hoodie:'Cozy hoodie',overalls:'Explorer overalls',spacesuit:'Space suit',jacket:'Adventure jacket'};
export const ROBOT_HATS={none:'No hat',cap:'Baseball cap',beanie:'Beanie',tophat:'Top hat'};
export const ROBOT_DEFAULTS={outfit:'none',hat:'none',color:'#6e9eae',glasses:false,headphones:false,backpack:false};
export const PLANE_STYLES={sport:'Sport plane',swept:'Swept wings',biplane:'Biplane',jet:'Passenger jet'};
export const AIR_DIFFICULTIES={
  sloth:{name:'Sloth (slow)',coins:1,speed:220,boost:340,spread:1,radius:.38,random:0,tilt:0},
  easy:{name:'Easy',coins:2,speed:260,boost:380,spread:1.12,radius:.37,random:0,tilt:0},
  medium:{name:'Medium',coins:3,speed:310,boost:430,spread:1.4,radius:.35,random:0,tilt:0},
  hard:{name:'Hard',coins:5,speed:370,boost:490,spread:1.5,radius:.33,random:.22,tilt:.7},
  expert:{name:'Expert',coins:10,speed:440,boost:560,spread:1.6,radius:.30,random:.35,tilt:1.1},
};
export const airRecordId=difficulty=>difficulty==='sloth'?'hoop-flight':'hoop-flight-'+difficulty;
export const PLANE_DEFAULTS={color:'#ed6e40',style:'sport',difficulty:'sloth'};
export const KNIGHT_DEFAULTS = { armor: 'silver', helmet: 'plume', cape: true, shield: false, dragon: 'classic' };
export const UPGRADES = [
  { id:'boots',name:'Super speed',group:'gameplay',category:'CHARACTER',icon:'👟',cost:500,description:'One use: move 25% faster for 15 seconds. Tap the shoe above the maze to activate.' },
  { id:'eliminator',name:'Dragon eliminator',group:'gameplay',category:'EQUIPMENT',icon:'🐉',cost:1000,description:'One use: make all dragons disappear for 15 seconds. They return to their same positions. Activate above the maze.' },
  { id:'magnet',name:'Gem magnet',group:'gameplay',category:'EQUIPMENT',icon:'🧲',cost:500,description:'One use: collect gems from adjacent corridors for 15 seconds. Tap the magnet above the maze.' },
  ...Object.values(FLIGHT_BACKGROUNDS).filter(scene=>scene.upgrade).map(scene=>({
    id:scene.upgrade,name:scene.name,group:'appearance',category:'FLAPPY ANIMALS / FLAPPY BIRD BACKGROUND',icon:'🌄',cost:200,
    description:'For Flappy Animals (Flappy Bird) only — not the home screen. Unlock permanently, then choose it in the flight background chooser.'
  })),
  { id:'aurora-background',name:'Northern lights',group:'appearance',category:'BACKGROUND',icon:'✧',cost:200,description:'Unlock an aurora home background. Select it in Pick your scenery.' },
  { id:'forest-background',name:'Enchanted forest',group:'appearance',category:'BACKGROUND',icon:'☾',cost:350,description:'Unlock a glowing forest home background. Select it in Pick your scenery.' },
  { id:'emerald-armor',name:'Emerald armor',group:'appearance',category:'KNIGHT STYLE',icon:'♜',cost:250,description:'Unlock emerald armor in the customizer below the arrows. Appearance only.' },
  { id:'winged-helmet',name:'Wings of courage',group:'appearance',category:'KNIGHT STYLE',icon:'♛',cost:300,description:'Unlock a winged helmet in the knight customizer. Appearance only.' },
  { id:'ember-dragons',name:'Ember dragons',group:'appearance',category:'DRAGON STYLE',icon:'♨',cost:200,description:'Dress the dragons in fiery colors. Choose in the customizer. Appearance only.' },
  { id:'ice-dragons',name:'Ice dragons',group:'appearance',category:'DRAGON STYLE',icon:'❄',cost:200,description:'Give the dragons icy blue scales. Choose in the customizer. Appearance only.' },
];
export function freshSave() { return { version: 1, mazeLevel:0, coins: 0, character: { name: 'Pip', color: COLORS[0], style: 'antenna', ...KNIGHT_DEFAULTS, robot:{...ROBOT_DEFAULTS}, flight:{...FLIGHT_DEFAULTS},plane:{...PLANE_DEFAULTS} }, upgrades: [], boosts: {boots:0,magnet:0,eliminator:0}, stats: {} }; }
export function validateSave(data) {
  const mazeLevel=data?.mazeLevel??0;
  if(!Number.isInteger(mazeLevel)||mazeLevel<0||mazeLevel>3)throw Error('Invalid maze level.');
  const validInt = n => Number.isSafeInteger(n) && n >= 0 && n <= 1000000000;
  if (!data || data.version !== 1 || !validInt(data.coins) || !data.character || typeof data.character.name !== 'string' || !data.character.name.trim() || data.character.name.length > 24 || !COLORS.includes(data.character.color) || !['antenna', 'ears', 'plain'].includes(data.character.style) || !Array.isArray(data.upgrades) || data.upgrades.some(id => !['garden','flight-sunset'].includes(id) && !UPGRADES.some(u => u.id === id)) || !data.stats || typeof data.stats !== 'object' || Array.isArray(data.stats)) throw new Error('This is not a valid Sidequest save file.');
  if(data.character.robot!==undefined&&(!data.character.robot||typeof data.character.robot!=='object'||Array.isArray(data.character.robot)))throw new Error('Invalid robot appearance.');
  const plane=data.character.plane===undefined?{...PLANE_DEFAULTS}:data.character.plane;
  if(!plane||Array.isArray(plane)||!Object.hasOwn(PLANE_STYLES,plane.style)||typeof plane.color!=='string'||!/^#[0-9a-f]{6}$/i.test(plane.color))throw Error('Invalid airplane appearance.');
  const planeDifficulty=plane.difficulty??'sloth';
  if(!Object.hasOwn(AIR_DIFFICULTIES,planeDifficulty))throw Error('Invalid airplane difficulty.');
  const robot={...ROBOT_DEFAULTS,...data.character.robot};
  if(!Object.hasOwn(ROBOT_OUTFITS,robot.outfit)||!Object.hasOwn(ROBOT_HATS,robot.hat)||!COLORS.includes(robot.color)||['glasses','headphones','backpack'].some(key=>typeof robot[key]!=='boolean'))throw new Error('Invalid robot appearance.');
  const look = { ...KNIGHT_DEFAULTS };
  for (const field of Object.keys(look)) if (data.character[field] !== undefined) look[field] = data.character[field];
  if (!Object.hasOwn(ARMORS, look.armor) || !Object.hasOwn(HELMETS, look.helmet) || typeof look.cape !== 'boolean' || typeof look.shield !== 'boolean' || !Object.hasOwn(DRAGON_STYLES,look.dragon)) throw new Error('Invalid knight appearance in save file.');
  for(const required of [ARMORS[look.armor].upgrade,look.helmet==='winged'?'winged-helmet':null,DRAGON_STYLES[look.dragon].upgrade])if(required&&!data.upgrades.includes(required))throw new Error('Buy this appearance in the shop first.');
  const flight=validateFlightSettings(data.character.flight);
  const flightUpgrade=FLIGHT_BACKGROUNDS[flight.background].upgrade;
  if(flightUpgrade&&!data.upgrades.includes(flightUpgrade))throw new Error('Buy this Flappy Animals background in the shop first.');
  const boosts = data.boosts === undefined
    ? {boots:Number(data.upgrades.includes('boots')),magnet:Number(data.upgrades.includes('magnet'))}
    : data.boosts;
  const eliminator=boosts?.eliminator===undefined?0:boosts.eliminator;
  if(!validInt(eliminator) || !boosts || Array.isArray(boosts) || !validInt(boosts.boots) || !validInt(boosts.magnet) || boosts.boots+boosts.magnet+eliminator>3)throw new Error('Your boost bag can hold up to three boosts.');
  const stats = {};
  for (const [id, stat] of Object.entries(data.stats)) {
    if (!/^[a-z][a-z0-9-]{0,40}$/.test(id) || !stat || !validInt(stat.plays) || !validInt(stat.best)) throw new Error('Invalid game progress in save file.');
    if(stat.bestTimeMs!==undefined&&(!validInt(stat.bestTimeMs)||stat.bestTimeMs===0))throw Error('Invalid best race time.');
    Object.defineProperty(stats, id, { value: { plays: stat.plays, best: stat.best,...(stat.bestTimeMs===undefined?{}:{bestTimeMs:stat.bestTimeMs}) }, enumerable: true, writable: true, configurable: true });
  }
  return { version: 1, mazeLevel, coins: Math.min(1000000000,data.coins+(data.upgrades.includes('garden')?60:0)+(data.upgrades.includes('flight-sunset')?200:0)), character: { name: data.character.name.trim(), color: data.character.color, style: data.character.style, ...look, flight, plane:{color:plane.color,style:plane.style,difficulty:planeDifficulty}, robot:{outfit:robot.outfit,hat:robot.hat,color:robot.color,glasses:robot.glasses,headphones:robot.headphones,backpack:robot.backpack} }, upgrades: [...new Set(data.upgrades.filter(id=>!['garden','flight-sunset','boots','magnet','eliminator'].includes(id)))], boosts:{boots:boosts.boots,magnet:boosts.magnet,eliminator}, stats };
}
export function createSystem(storage, onStorageError = () => {}) {
  let state = freshSave();
  let writable = true;
  const listeners = new Set();
  try { const raw = storage.getItem(SAVE_KEY); if (raw) state = validateSave(JSON.parse(raw)); }
  catch { writable = false; onStorageError(); }
  const snapshot = () => JSON.parse(JSON.stringify(state));
  function persist() {
    try { storage.setItem(SAVE_KEY, JSON.stringify(state)); writable = true; }
    catch { writable = false; onStorageError(); }
    for (const listener of listeners) listener(snapshot());
  }
  return {
    snapshot,
    isSaved: () => writable,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    setMazeLevel(mazeLevel) { state=validateSave({...state,mazeLevel});persist(); },
    setCharacter(character) { state = validateSave({ ...state, character }); persist(); },
    buy(id) {
      const item = UPGRADES.find(u => u.id === id);
      if (!item || state.upgrades.includes(id)) throw new Error('This upgrade is already yours.');
      if(item.group==='gameplay' && state.boosts.boots+state.boosts.magnet+state.boosts.eliminator>=3)throw new Error('Boost bag full! Use a boost before buying more.');
      if (state.coins < item.cost) throw new Error('Play an adventure to earn more coins.');
      state.coins -= item.cost;
      if(item.group==='gameplay')state.boosts[id]++;else state.upgrades.push(id);
      persist();
    },
    consumeBoost(id) {
      if(!['boots','magnet','eliminator'].includes(id) || state.boosts[id]<1)return false;
      state.boosts[id]--;persist();return true;
    },
    modifiers() { return { speed: 1, pickupRadius: 1 }; },
    // A session settles once, including early exits, so the same run cannot pay twice.
    beginSession(gameId) {
      if (!/^[a-z][a-z0-9-]{0,40}$/.test(gameId)) throw new Error('Invalid game ID.');
      let settled = false;
      return { finish(coins,timeMs=null) {
        if (settled) return false;
        if (!Number.isSafeInteger(coins) || coins < 0 || coins > 1000000000) throw new Error('Invalid session reward.');
        if(timeMs!==null&&(!Number.isSafeInteger(timeMs)||timeMs<=0||timeMs>1000000000))throw Error('Invalid finish time.');
        settled = true;
        const previous = Object.hasOwn(state.stats, gameId) ? state.stats[gameId] : { plays: 0, best: 0 };
        state.coins = Math.min(1000000000, state.coins + coins);
        state.stats[gameId] = { plays: Math.min(1000000000, previous.plays + 1), best: Math.max(previous.best, coins),...((previous.bestTimeMs!==undefined||timeMs!==null)?{bestTimeMs:timeMs===null?previous.bestTimeMs:Math.min(previous.bestTimeMs??timeMs,timeMs)}:{}) };
        persist(); return true;
      } };
    },
    exportSave: () => JSON.stringify(state, null, 2),
    importSave(raw) { const next = validateSave(JSON.parse(raw)); state = next; persist(); },
  };
}
