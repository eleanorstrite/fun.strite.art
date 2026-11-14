export const DRAGON_MILESTONES={hatch:2,ride:7,adult:7,farewell:17};
export function nurseryDragonDay(s){return s.egg?Math.max(1,s.day-(Number.isInteger(s.eggDay)?s.eggDay:1)+1):0;}
export function updateNurseryGrowth(s){s.hatched=!!s.egg&&nurseryDragonDay(s)>=DRAGON_MILESTONES.hatch;}
export function nurseryDragonStage(s){const day=nurseryDragonDay(s);return !s.egg||day<2?'Egg':day<7?'Baby dragon':'Full-grown dragon';}
export function nurseryDragonProfile(s){const adult=nurseryDragonDay(s)>=7;return {adult,young:false,scale:s.riding?.kind==='speed'||s.riding?.kind==='flying'?(adult?.88:.65):adult?.65:.48,saddle:1.32};}
export function nurseryMuzzle(s){const profile=nurseryDragonProfile(s);return {x:s.player.x-1.2,y:1.5*profile.scale,z:s.player.z-1.1*profile.scale};}
export function beginNurseryGoodbye(s){if(s.farewell!=='ready'||s.inside)return false;s.farewell='leaving';s.farewellTime=0;s.farewellHeading=s.heading;s.routeActive=false;s.message='One last pet. You will always be my dragon.';return true;}
export function tickNurseryGoodbye(s,dt){if(s.farewell!=='leaving')return;s.farewellTime+=Math.max(0,dt);if(s.farewellTime>=14){s.farewell='complete';s.message='Every adventure leaves a little magic behind.';}}
