// Pointer ownership is always scoped to a player, including release/cancel events.
export function createWizardTouchInput(){
 const fast=[new Set(),new Set()],moves=[new Map(),new Map()];
 return {fast,moves,begin(player,action,pointer){if(action==='down')fast[player].add(pointer);if(action==='left'||action==='right')moves[player].set(pointer,action);},release(player,pointer){fast[player].delete(pointer);moves[player].delete(pointer);},clear(){for(const set of fast)set.clear();for(const map of moves)map.clear();}};
}
// Each finger owns its starting side until release, even if it crosses the center.
export function createWizardGestures({playerAt,onAction,onFaster}){
 const pointers=new Map();
 return {begin(id,x,y){pointers.set(id,{player:playerAt(x,y),x,y,startX:x,startY:y,moved:false});},move(id,x,y){const p=pointers.get(id);if(!p)return;const dx=x-p.x,dy=y-p.y;if(Math.abs(dx)>=28&&Math.abs(x-p.startX)>Math.abs(y-p.startY)){const steps=Math.floor(Math.abs(dx)/28);for(let i=0;i<Math.min(steps,5);i++)onAction(p.player,dx<0?'left':'right');p.x=x;p.moved=true;}if(dy>=25){onFaster(p.player);p.y=y;p.moved=true;}if(Math.hypot(x-p.startX,y-p.startY)>15)p.moved=true;},end(id,cancel=false){const p=pointers.get(id);pointers.delete(id);if(p&&!p.moved&&!cancel)onAction(p.player,'rotate');},clear(){pointers.clear();}};
}
