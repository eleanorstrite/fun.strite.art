/** Shared, renderer-independent progression API. No game owns the wallet. */
export const SAVE_KEY = 'sidequest.save.v1';
export const COLORS = ['#ed6e40', '#86966a', '#9b85bb', '#6e9eae', '#d5aa4d'];
export const ARMORS = { silver: { name: 'Silver', dark: '#8294a7', light: '#d8e3e4' }, gold: { name: 'Gold', dark: '#b88b38', light: '#ffe39a' }, midnight: { name: 'Midnight', dark: '#414565', light: '#9499c6' }, rose: { name: 'Rose', dark: '#a7657d', light: '#f2b8cd' } };
ARMORS.emerald={name:'Emerald',dark:'#287967',light:'#9ef0c8',upgrade:'emerald-armor'};
export const DRAGON_STYLES={classic:{name:'Classic dragons',colors:['#a34b50','#738959','#78609e','#4e8e98']},ice:{name:'Ice dragons',colors:['#66b9d3','#78cbd0','#8babe4','#a0c8ec'],upgrade:'ice-dragons'},ember:{name:'Ember dragons',colors:['#cf633c','#c98c35','#b94b53','#dd894c'],upgrade:'ember-dragons'}};
export const HELMETS = { plume: 'Feather plume', horns: 'Dragon horns', crown: 'Royal crown', plain: 'Classic helmet' };
HELMETS.winged='Winged helmet';
export const KNIGHT_DEFAULTS = { armor: 'silver', helmet: 'plume', cape: true, shield: false, dragon: 'classic' };
export const UPGRADES = [
  { id:'boots',name:'Super speed',group:'gameplay',category:'CHARACTER',icon:'↗',cost:800,description:'Move 25% faster in the maze. Active next adventure.' },
  { id:'magnet',name:'Gem magnet',group:'gameplay',category:'EQUIPMENT',icon:'⌁',cost:1000,description:'Collect gems from adjacent corridors. Active next adventure.' },
  { id:'aurora-background',name:'Northern lights',group:'appearance',category:'BACKGROUND',icon:'✧',cost:200,description:'Unlock an aurora home background. Select it in Pick your scenery.' },
  { id:'forest-background',name:'Enchanted forest',group:'appearance',category:'BACKGROUND',icon:'☾',cost:350,description:'Unlock a glowing forest home background. Select it in Pick your scenery.' },
  { id:'emerald-armor',name:'Emerald armor',group:'appearance',category:'KNIGHT STYLE',icon:'♜',cost:250,description:'Unlock emerald armor in the customizer below the arrows. Appearance only.' },
  { id:'winged-helmet',name:'Wings of courage',group:'appearance',category:'KNIGHT STYLE',icon:'♛',cost:300,description:'Unlock a winged helmet in the knight customizer. Appearance only.' },
  { id:'ember-dragons',name:'Ember dragons',group:'appearance',category:'DRAGON STYLE',icon:'♨',cost:350,description:'Dress the dragons in fiery colors. Choose in the customizer. Appearance only.' },
  { id:'ice-dragons',name:'Ice dragons',group:'appearance',category:'DRAGON STYLE',icon:'❄',cost:500,description:'Give the dragons icy blue scales. Choose in the customizer. Appearance only.' },
];
export function freshSave() { return { version: 1, coins: 0, character: { name: 'Pip', color: COLORS[0], style: 'antenna', ...KNIGHT_DEFAULTS }, upgrades: [], stats: {} }; }
export function validateSave(data) {
  const validInt = n => Number.isSafeInteger(n) && n >= 0 && n <= 1000000000;
  if (!data || data.version !== 1 || !validInt(data.coins) || !data.character || typeof data.character.name !== 'string' || !data.character.name.trim() || data.character.name.length > 24 || !COLORS.includes(data.character.color) || !['antenna', 'ears', 'plain'].includes(data.character.style) || !Array.isArray(data.upgrades) || data.upgrades.some(id => id !== 'garden' && !UPGRADES.some(u => u.id === id)) || !data.stats || typeof data.stats !== 'object' || Array.isArray(data.stats)) throw new Error('This is not a valid Sidequest save file.');
  const look = { ...KNIGHT_DEFAULTS };
  for (const field of Object.keys(look)) if (data.character[field] !== undefined) look[field] = data.character[field];
  if (!Object.hasOwn(ARMORS, look.armor) || !Object.hasOwn(HELMETS, look.helmet) || typeof look.cape !== 'boolean' || typeof look.shield !== 'boolean' || !Object.hasOwn(DRAGON_STYLES,look.dragon)) throw new Error('Invalid knight appearance in save file.');
  for(const required of [ARMORS[look.armor].upgrade,look.helmet==='winged'?'winged-helmet':null,DRAGON_STYLES[look.dragon].upgrade])if(required&&!data.upgrades.includes(required))throw new Error('Buy this appearance in the shop first.');
  const stats = {};
  for (const [id, stat] of Object.entries(data.stats)) {
    if (!/^[a-z][a-z0-9-]{0,40}$/.test(id) || !stat || !validInt(stat.plays) || !validInt(stat.best)) throw new Error('Invalid game progress in save file.');
    Object.defineProperty(stats, id, { value: { plays: stat.plays, best: stat.best }, enumerable: true, writable: true, configurable: true });
  }
  return { version: 1, coins: Math.min(1000000000,data.coins+(data.upgrades.includes('garden')?60:0)), character: { name: data.character.name.trim(), color: data.character.color, style: data.character.style, ...look }, upgrades: [...new Set(data.upgrades.filter(id=>id!=='garden'))], stats };
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
    setCharacter(character) { state = validateSave({ ...state, character }); persist(); },
    buy(id) {
      const item = UPGRADES.find(u => u.id === id);
      if (!item || state.upgrades.includes(id)) throw new Error('This upgrade is already yours.');
      if (state.coins < item.cost) throw new Error('Play an adventure to earn more coins.');
      state.coins -= item.cost; state.upgrades.push(id); persist();
    },
    modifiers() { return { speed: state.upgrades.includes('boots') ? 1.25 : 1, pickupRadius: state.upgrades.includes('magnet') ? 2 : 1 }; },
    // A session settles once, including early exits, so the same run cannot pay twice.
    beginSession(gameId) {
      if (!/^[a-z][a-z0-9-]{0,40}$/.test(gameId)) throw new Error('Invalid game ID.');
      let settled = false;
      return { finish(coins) {
        if (settled) return false;
        if (!Number.isInteger(coins) || coins < 0 || coins > 1000) throw new Error('Invalid session reward.');
        settled = true;
        const previous = Object.hasOwn(state.stats, gameId) ? state.stats[gameId] : { plays: 0, best: 0 };
        state.coins = Math.min(1000000000, state.coins + coins);
        state.stats[gameId] = { plays: Math.min(1000000000, previous.plays + 1), best: Math.max(previous.best, coins) };
        persist(); return true;
      } };
    },
    exportSave: () => JSON.stringify(state, null, 2),
    importSave(raw) { const next = validateSave(JSON.parse(raw)); state = next; persist(); },
  };
}
