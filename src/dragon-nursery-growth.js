export const DRAGON_MILESTONES={hatch:5,ride:10,adult:15};
export function nurseryDragonDay(s){return s.egg?Math.max(1,s.day-(Number.isInteger(s.eggDay)?s.eggDay:1)+1):0;}
export function updateNurseryGrowth(s){s.hatched=!!s.egg&&nurseryDragonDay(s)>=DRAGON_MILESTONES.hatch;}
export function nurseryDragonStage(s){const day=nurseryDragonDay(s);return !s.egg||day<5?'Egg':day<10?'Baby dragon':day<15?'Young dragon':'Full-grown dragon';}
export function nurseryDragonProfile(s){const adult=nurseryDragonDay(s)>=15,young=nurseryDragonDay(s)>=10;return {adult,young,scale:s.riding?.kind==='speed'||s.riding?.kind==='flying'?.88:adult?.8:young?.64:.48,saddle:adult?1.74:1.4};}

export function nurseryMuzzle(s){const profile=nurseryDragonProfile(s);return {x:s.player.x-1.2,y:(profile.adult?3:1.5)*profile.scale,z:s.player.z-(profile.adult?1.9:1.1)*profile.scale};}
