import { ICE_SHOP_ITEMS } from './ice-settings.js';
import { FLIGHT_BACKGROUNDS, FLIGHT_DEFAULTS, validateFlightSettings } from './flight-settings.js';
/** Shared, renderer-independent progression API. No game owns the wallet. */
export const SAVE_KEY = 'sidequest.save.v1';
export const COLORS = ['#ed6e40', '#86966a', '#9b85bb', '#6e9eae', '#d5aa4d'];
export const ARMORS = { silver: { name: 'Silver', dark: '#8294a7', light: '#d8e3e4' }, gold: { name: 'Gold', dark: '#b88b38', light: '#ffe39a' }, midnight: { name: 'Midnight', dark: '#414565', light: '#9499c6' }, rose: { name: 'Rose', dark: '#a7657d', light: '#f2b8cd' } };
ARMORS.emerald={name:'Emerald',dark:'#287967',light:'#9ef0c8',upgrade:'emerald-armor'};
export const DRAGON_STYLES={classic:{name:'Classic dragons',colors:['#a34b50','#738959','#78609e','#4e8e98']},ice:{name:'Ice dragons',colors:['#66b9d3','#78cbd0','#8babe4','#a0c8ec'],upgrade:'ice-dragons'},ember:{name:'Ember dragons',colors:['#cf633c','#c98c35','#b94b53','#dd894c'],upgrade:'ember-dragons'}};
ARMORS.sapphire={name:'Sapphire',dark:'#285baf',light:'#9cdbff',upgrade:'sapphire-armor'};
ARMORS.sunset={name:'Sunset',dark:'#ad4c70',light:'#ffc78e',upgrade:'sunset-armor'};
DRAGON_STYLES.forest={name:'Forest dragons',colors:['#417d55','#7ba74d','#409e88','#b0bd5e'],upgrade:'forest-dragons'};
DRAGON_STYLES.neon={name:'Neon dragons',colors:['#ef60bd','#6bf0d4','#b48aff','#d5ef63'],upgrade:'neon-dragons'};
export const MAZE_BOOST_IDS=['boots','magnet','eliminator','ward','frost'];
export const mazeBagCount=boosts=>MAZE_BOOST_IDS.reduce((sum,id)=>sum+(boosts[id]||0),0);
export const HELMETS = { plume: 'Feather plume', horns: 'Dragon horns', crown: 'Royal crown', plain: 'Classic helmet' };
HELMETS.winged='Winged helmet';
export const ROBOT_OUTFITS={none:'Classic robot',hoodie:'Cozy hoodie',overalls:'Explorer overalls',spacesuit:'Space suit',jacket:'Adventure jacket'};
export const ROBOT_HATS={none:'No hat',cap:'Baseball cap',beanie:'Beanie',tophat:'Top hat'};
export const ROBOT_DEFAULTS={outfit:'none',hat:'none',color:'#6e9eae',glasses:false,headphones:false,backpack:false};
export const PLANE_STYLES={sport:'Sport plane',swept:'Swept wings',biplane:'Biplane',jet:'Passenger jet',glider:'Sailplane',seaplane:'Seaplane',stealth:'Stealth jet',rocket:'Rocket plane'};
export const PLANE_HATS={none:'No hat',cap:'Baseball cap',tophat:'Top hat',crown:'Golden crown',beanie:'Cozy beanie'};
export const PLANE_SCARVES={none:'No scarf',short:'Short scarf',long:'Flying scarf'};
export const PLANE_UNLOCKS={stealth:'air-stealth',rocket:'air-rocket'};
export const AIR_BACKGROUNDS={
  valley:{name:'River valley'},sunset:{name:'Golden sunset'},ocean:{name:'Island coast'},
  desert:{name:'Desert canyon'},snow:{name:'Alpine snow'},meadow:{name:'Sunny meadows'},
  aurora:{name:'Aurora night',upgrade:'air-aurora'},city:{name:'Twilight city',upgrade:'air-city'},
};
export const AIR_DIFFICULTIES={
  sloth:{name:'Sloth (slow)',coins:1,speed:220,boost:340,spread:1,radius:.38,random:0,tilt:0},
  easy:{name:'Easy',coins:2,speed:260,boost:380,spread:1.12,radius:.37,random:0,tilt:0},
  medium:{name:'Medium',coins:3,speed:310,boost:430,spread:1.4,radius:.35,random:0,tilt:0},
  hard:{name:'Hard',coins:5,speed:370,boost:490,spread:1.5,radius:.33,random:.22,tilt:.7},
  expert:{name:'Expert',coins:20,speed:440,boost:560,spread:1.6,radius:.30,random:.35,tilt:1.1},
};
export const airRecordId=difficulty=>difficulty==='sloth'?'hoop-flight':'hoop-flight-'+difficulty;
export const PLANE_DEFAULTS={color:'#ed6e40',style:'sport',difficulty:'sloth',background:'valley',hat:'none',scarf:'none',accessoryColor:'#d34c65'};
export const KNIGHT_DEFAULTS = { armor: 'silver', helmet: 'plume', cape: true, shield: false, dragon: 'classic' };
export const UPGRADES = [
  {id:'ward',name:'Dragon shield',group:'gameplay',category:'KNIGHTS AND DRAGONS ONLY',icon:'🛡️',cost:600,description:'One use: dragons cannot take a life for 15 seconds. Activate above the maze. Uses one slot in your three-boost bag.'},
  {id:'frost',name:'Frost spell',group:'gameplay',category:'KNIGHTS AND DRAGONS ONLY',icon:'❄️',cost:700,description:'One use: slow every dragon to half speed for 15 seconds. Activate above the maze. Uses one slot in your three-boost bag.'},
  ...['sapphire','sunset'].map(id=>({id:ARMORS[id].upgrade,name:ARMORS[id].name+' armor',group:'appearance',category:'KNIGHTS AND DRAGONS ARMOR',icon:'♜',cost:250,description:'Permanently unlock this armor color in the knight customizer. Appearance only; works in 2D and 3D.'})),
  ...['forest','neon'].map(id=>({id:DRAGON_STYLES[id].upgrade,name:DRAGON_STYLES[id].name,group:'appearance',category:'KNIGHTS AND DRAGONS LOOK',icon:'🐲',cost:200,description:'Permanently unlock this dragon color collection in the knight customizer. Appearance only; works in 2D and 3D.'})),
  {id:'snack',name:'Snack Attack',group:'gameplay',category:'THE RAVEN ONLY',icon:'🍿',cost:1000,description:'One use in The Raven: the youngest girl throws sandwiches and candy from the window, clearing obstacles for 5 seconds. Activate the snack button above the course. Buy again for another use.'},
  ...ICE_SHOP_ITEMS,
  ...Object.entries(PLANE_UNLOCKS).map(([style,id])=>({id,name:PLANE_STYLES[style],group:'appearance',category:'HOOP FLIGHT AIRPLANE',icon:'✈',cost:200,description:'For Hoop Flight only. Permanently unlock this airplane design in the plane customizer. Cosmetic: all planes fly the same.'})),
  ...Object.values(AIR_BACKGROUNDS).filter(scene=>scene.upgrade).map(scene=>({id:scene.upgrade,name:scene.name,group:'appearance',category:'HOOP FLIGHT BACKGROUND',icon:'🌄',cost:200,description:'For Hoop Flight only — separate from home-screen and Flappy Animals backgrounds. Permanently unlock in the plane customizer.'})),

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
export async function verifyWalletPassword(password,step=1) {
  if(typeof password!=='string'||![1,2].includes(step))return false;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password));
  const key=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return key===["cd0299854a830cfdbcfb7d6887ddb636c09496099c873f6ce5496aec9c3f044a","b5259d596f2cfb78e33b1d8851b575151635d7cb14f68b265ca80e027ab8f542"][step-1];
}
export function freshSave() { return { version: 1, mazeLevel:0, ravenLevel:'easy', coins: 0, unlimitedCoins: false, character: { name: 'Pip', color: COLORS[0], style: 'antenna', ...KNIGHT_DEFAULTS, robot:{...ROBOT_DEFAULTS}, flight:{...FLIGHT_DEFAULTS},plane:{...PLANE_DEFAULTS} }, upgrades: [], boosts: {boots:0,magnet:0,eliminator:0,ward:0,frost:0,snack:0}, stats: {} }; }
export function validateSave(data) {
  if(data?.unlimitedCoins!==undefined&&typeof data.unlimitedCoins!=='boolean')throw Error('Invalid wallet setting.');
  const ravenLevel=data?.ravenLevel??'easy';
  if(!['easy','medium','hard','expert'].includes(ravenLevel))throw Error('Invalid Raven level.');
  const mazeLevel=data?.mazeLevel??0;
  if(!Number.isInteger(mazeLevel)||mazeLevel<0||mazeLevel>3)throw Error('Invalid maze level.');
  const validInt = n => Number.isSafeInteger(n) && n >= 0 && n <= 1000000000;
  if (!data || data.version !== 1 || !validInt(data.coins) || !data.character || typeof data.character.name !== 'string' || !data.character.name.trim() || data.character.name.length > 24 || !COLORS.includes(data.character.color) || !['antenna', 'ears', 'plain'].includes(data.character.style) || !Array.isArray(data.upgrades) || data.upgrades.some(id => !['garden','flight-sunset'].includes(id) && !UPGRADES.some(u => u.id === id)) || !data.stats || typeof data.stats !== 'object' || Array.isArray(data.stats)) throw new Error('This is not a valid Sidequest save file.');
  if(data.character.robot!==undefined&&(!data.character.robot||typeof data.character.robot!=='object'||Array.isArray(data.character.robot)))throw new Error('Invalid robot appearance.');
  const plane=data.character.plane===undefined?{...PLANE_DEFAULTS}:data.character.plane;
  if(!plane||Array.isArray(plane)||!Object.hasOwn(PLANE_STYLES,plane.style)||typeof plane.color!=='string'||!/^#[0-9a-f]{6}$/i.test(plane.color))throw Error('Invalid airplane appearance.');
  const hat=plane.hat??'none',scarf=plane.scarf??'none',accessoryColor=plane.accessoryColor??'#d34c65';
  if(!Object.hasOwn(PLANE_HATS,hat)||!Object.hasOwn(PLANE_SCARVES,scarf)||typeof accessoryColor!=='string'||!/^#[0-9a-f]{6}$/i.test(accessoryColor))throw Error('Invalid airplane accessories.');
  const planeBackground=plane.background??'valley';
  if(!Object.hasOwn(AIR_BACKGROUNDS,planeBackground))throw Error('Invalid airplane background.');
  for(const upgrade of [PLANE_UNLOCKS[plane.style],AIR_BACKGROUNDS[planeBackground].upgrade]){
    if(upgrade&&!data.upgrades.includes(upgrade))throw Error('Buy this Hoop Flight appearance in the shop first.');
  }
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
  const snack=boosts?.snack===undefined?0:boosts.snack;
  if(!validInt(snack))throw new Error('Invalid Snack Attack inventory.');
  const ward=boosts?.ward===undefined?0:boosts.ward,frost=boosts?.frost===undefined?0:boosts.frost;
  if(!validInt(ward)||!validInt(frost))throw new Error('Invalid spell inventory.');
  const eliminator=boosts?.eliminator===undefined?0:boosts.eliminator;
  if(!validInt(eliminator) || !boosts || Array.isArray(boosts) || !validInt(boosts.boots) || !validInt(boosts.magnet) || boosts.boots+boosts.magnet+eliminator+ward+frost>3)throw new Error('Your boost bag can hold up to three boosts.');
  const stats = {};
  for (const [id, stat] of Object.entries(data.stats)) {
    if (!/^[a-z][a-z0-9-]{0,40}$/.test(id) || !stat || !validInt(stat.plays) || !validInt(stat.best)) throw new Error('Invalid game progress in save file.');
    if(stat.bestScore!==undefined&&!validInt(stat.bestScore))throw Error('Invalid best score.');
    if(stat.bestTimeMs!==undefined&&(!validInt(stat.bestTimeMs)||stat.bestTimeMs===0))throw Error('Invalid best race time.');
    Object.defineProperty(stats, id, { value: { plays: stat.plays, best: stat.best,...(stat.bestScore===undefined?{}:{bestScore:stat.bestScore}),...(stat.bestTimeMs===undefined?{}:{bestTimeMs:stat.bestTimeMs}) }, enumerable: true, writable: true, configurable: true });
  }
  return { version: 1, mazeLevel, ravenLevel, unlimitedCoins: data.unlimitedCoins===true, coins: Math.min(1000000000,data.coins+(data.upgrades.includes('garden')?60:0)+(data.upgrades.includes('flight-sunset')?200:0)), character: { name: data.character.name.trim(), color: data.character.color, style: data.character.style, ...look, flight, plane:{color:plane.color,style:plane.style,difficulty:planeDifficulty,background:planeBackground,hat,scarf,accessoryColor}, robot:{outfit:robot.outfit,hat:robot.hat,color:robot.color,glasses:robot.glasses,headphones:robot.headphones,backpack:robot.backpack} }, upgrades: [...new Set(data.upgrades.filter(id=>!['garden','flight-sunset',...MAZE_BOOST_IDS,'snack'].includes(id)))], boosts:{boots:boosts.boots,magnet:boosts.magnet,eliminator,ward,frost,snack}, stats };
}
export function createSystem(storage, onStorageError = () => {}, checkWalletPassword = verifyWalletPassword) {
  let state = freshSave();
  let writable = true;
  const listeners = new Set();
  try { const raw = storage.getItem(SAVE_KEY); if (raw) state = validateSave(JSON.parse(raw)); }
  catch { writable = false; onStorageError(); }
  // Password unlocks apply only to this visit, never to saved or imported wallets.
  state.unlimitedCoins=false;
  const snapshot = () => JSON.parse(JSON.stringify(state));
  function persist() {
    try { storage.setItem(SAVE_KEY, JSON.stringify({...state,unlimitedCoins:false})); writable = true; }
    catch { writable = false; onStorageError(); }
    for (const listener of listeners) listener(snapshot());
  }
  return {
    snapshot,
    async unlockWallet(password,secondPassword,isCurrent=()=>true) {
      const valid=await checkWalletPassword(password,1)&&await checkWalletPassword(secondPassword,2);
      if(!valid||!isCurrent())return false;
      state.unlimitedCoins=!state.unlimitedCoins;persist();return true;
    },
    isSaved: () => writable,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    setRavenLevel(ravenLevel) { state=validateSave({...state,ravenLevel});persist(); },
    setMazeLevel(mazeLevel) { state=validateSave({...state,mazeLevel});persist(); },
    setCharacter(character) { state = validateSave({ ...state, character }); persist(); },
    buy(id) {
      const item = UPGRADES.find(u => u.id === id);
      if (!item || state.upgrades.includes(id)) throw new Error('This upgrade is already yours.');
      if(item.group==='gameplay' && id!=='snack' && mazeBagCount(state.boosts)>=3)throw new Error('Boost bag full! Use a boost before buying more.');
      if (!state.unlimitedCoins && state.coins < item.cost) throw new Error('Play an adventure to earn more coins.');
      if(!state.unlimitedCoins)state.coins -= item.cost;
      if(item.group==='gameplay')state.boosts[id]++;else state.upgrades.push(id);
      persist();
    },
    consumeBoost(id) {
      if(![...MAZE_BOOST_IDS,'snack'].includes(id) || state.boosts[id]<1)return false;
      state.boosts[id]--;persist();return true;
    },
    modifiers() { return { speed: 1, pickupRadius: 1 }; },
    // A session settles once, including early exits, so the same run cannot pay twice.
    beginSession(gameId) {
      if (!/^[a-z][a-z0-9-]{0,40}$/.test(gameId)) throw new Error('Invalid game ID.');
      let settled = false;
      return { finish(coins,timeMs=null,score=null) {
        if (settled) return false;
        if (!Number.isSafeInteger(coins) || coins < 0 || coins > 1000000000) throw new Error('Invalid session reward.');
        if(timeMs!==null&&(!Number.isSafeInteger(timeMs)||timeMs<=0||timeMs>1000000000))throw Error('Invalid finish time.');
        if(score!==null&&(!Number.isSafeInteger(score)||score<0||score>1000000000))throw Error('Invalid score.');
        settled = true;
        const previous = Object.hasOwn(state.stats, gameId) ? state.stats[gameId] : { plays: 0, best: 0 };
        state.coins = Math.min(1000000000, state.coins + coins);
        state.stats[gameId] = { plays: Math.min(1000000000, previous.plays + 1), best: Math.max(previous.best, coins),...((previous.bestScore!==undefined||score!==null)?{bestScore:Math.max(previous.bestScore??0,score??0)}:{}),...((previous.bestTimeMs!==undefined||timeMs!==null)?{bestTimeMs:timeMs===null?previous.bestTimeMs:Math.min(previous.bestTimeMs??timeMs,timeMs)}:{}) };
        persist(); return true;
      } };
    },
    exportSave: () => JSON.stringify({...state,unlimitedCoins:false}, null, 2),
    importSave(raw) { const next = validateSave(JSON.parse(raw)); state = {...next,unlimitedCoins:false}; persist(); },
  };
}
