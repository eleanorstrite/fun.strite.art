// Pointer ownership is always scoped to a player, including release/cancel events.
export function createWizardTouchInput(){
 const fast=[new Set(),new Set()],moves=[new Map(),new Map()];
 return {fast,moves,begin(player,action,pointer){if(action==='down')fast[player].add(pointer);if(action==='left'||action==='right')moves[player].set(pointer,action);},release(player,pointer){fast[player].delete(pointer);moves[player].delete(pointer);},clear(){for(const set of fast)set.clear();for(const map of moves)map.clear();}};
}
