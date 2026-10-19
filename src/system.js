/** Shared, renderer-independent progression API. No game owns the wallet. */
export const SAVE_KEY = 'sidequest.save.v1';
export const COLORS = ['#ed6e40', '#86966a', '#9b85bb', '#6e9eae', '#d5aa4d'];
export const ARMORS = { silver: { name: 'Silver', dark: '#8294a7', light: '#d8e3e4' }, gold: { name: 'Gold', dark: '#b88b38', light: '#ffe39a' }, midnight: { name: 'Midnight', dark: '#414565', light: '#9499c6' }, rose: { name: 'Rose', dark: '#a7657d', light: '#f2b8cd' } };
export const HELMETS = { plume: 'Feather plume', horns: 'Dragon horns', crown: 'Royal crown', plain: 'Classic helmet' };
export const KNIGHT_DEFAULTS = { armor: 'silver', helmet: 'plume', cape: true, shield: false };
export const UPGRADES = [
  { id: 'boots', name: 'A little extra pep', category: 'CHARACTER', icon: '↗', cost: 40, description: 'Move 25% faster. More exploring, less getting there.' },
  { id: 'garden', name: 'Room to bloom', category: 'ENVIRONMENT', icon: '✳', cost: 60, description: 'Bring flowers and colorful trees into every world.' },
  { id: 'magnet', name: 'A magnetic personality', category: 'EQUIPMENT', icon: '⌁', cost: 80, description: 'Pick up coins from twice as far away. A handy little helper.' },
];
export function freshSave() { return { version: 1, coins: 0, character: { name: 'Pip', color: COLORS[0], style: 'antenna', ...KNIGHT_DEFAULTS }, upgrades: [], stats: {} }; }
export function validateSave(data) {
  const validInt = n => Number.isSafeInteger(n) && n >= 0 && n <= 1000000000;
  if (!data || data.version !== 1 || !validInt(data.coins) || !data.character || typeof data.character.name !== 'string' || !data.character.name.trim() || data.character.name.length > 24 || !COLORS.includes(data.character.color) || !['antenna', 'ears', 'plain'].includes(data.character.style) || !Array.isArray(data.upgrades) || data.upgrades.some(id => !UPGRADES.some(u => u.id === id)) || !data.stats || typeof data.stats !== 'object' || Array.isArray(data.stats)) throw new Error('This is not a valid Sidequest save file.');
  const look = { ...KNIGHT_DEFAULTS };
  for (const field of Object.keys(look)) if (data.character[field] !== undefined) look[field] = data.character[field];
  if (!Object.hasOwn(ARMORS, look.armor) || !Object.hasOwn(HELMETS, look.helmet) || typeof look.cape !== 'boolean' || typeof look.shield !== 'boolean') throw new Error('Invalid knight appearance in save file.');
  const stats = {};
  for (const [id, stat] of Object.entries(data.stats)) {
    if (!/^[a-z][a-z0-9-]{0,40}$/.test(id) || !stat || !validInt(stat.plays) || !validInt(stat.best)) throw new Error('Invalid game progress in save file.');
    Object.defineProperty(stats, id, { value: { plays: stat.plays, best: stat.best }, enumerable: true, writable: true, configurable: true });
  }
  return { version: 1, coins: data.coins, character: { name: data.character.name.trim(), color: data.character.color, style: data.character.style, ...look }, upgrades: [...new Set(data.upgrades)], stats };
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
    modifiers() { return { speed: state.upgrades.includes('boots') ? 1.25 : 1, pickupRadius: state.upgrades.includes('magnet') ? 2 : 1, garden: state.upgrades.includes('garden') }; },
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
