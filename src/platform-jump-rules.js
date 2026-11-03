import {COSTUME_PET_BREEDS,costumePetUnlocked} from './platform-costume-pets.js';
import {REFERENCE_PET_BREEDS} from './platform-reference-pets.js';
import {JUMP_FACIAL_HAIR} from './platform-jump-facial-hair.js';
import {JUMP_OUTFITS,outfitUnlocked} from './platform-jump-clothes.js';
import {hairUnlocked,STARTER_HAIR} from './platform-hair-shop.js';
import {JUMP_HAIR} from './platform-jump-hair.js';
export {JUMP_HAIR} from './platform-jump-hair.js';
import {HEDGEHOG_BREEDS,hedgehogUnlocked} from './platform-hedgehogs.js';
import {FERRET_BREEDS,ferretUnlocked} from './platform-ferrets.js';
export const PET_BREEDS={cat:['Tabby','Calico','Black cat','White cat',...REFERENCE_PET_BREEDS.cat,...COSTUME_PET_BREEDS],dog:['Brindle','Dachshund','Black Labrador','Golden Retriever',...COSTUME_PET_BREEDS],capybara:['Classic','Chocolate','Cream'],dragon:['Emerald','Fire','Frost','Rainbow'],'guinea pig':['Tricolor','White','Black and white','Chocolate'],rabbit:['Tan lop','White','Black']};
PET_BREEDS.bird=[...REFERENCE_PET_BREEDS.bird,...COSTUME_PET_BREEDS];
PET_BREEDS.ferret=FERRET_BREEDS;
PET_BREEDS.hedgehog=HEDGEHOG_BREEDS;
export const JUMP_PROFILE_VERSION=1;
export const JUMP_DEFAULTS={skin:'#dba47b',hair:'#ee702e',shirt:'#efb17f',pants:'#82935a',hairstyle:STARTER_HAIR,background:'Blue sky',pet:'dog',breed:'Brindle',petName:'Davina',difficulty:'Medium',outfit:'Lace collar & skirt',facialHair:'None',profileVersion:JUMP_PROFILE_VERSION};
export const JUMP_BACKGROUNDS=['Blue sky','Sunset','Aurora','Candy clouds'];
export const JUMP_LEVELS={
 Easy:{rise:80,variation:10,minTravel:75,maxTravel:145,width:180,widthRange:31,description:'Wide landing spots, close together. A gentle first climb.'},
 Medium:{rise:100,variation:18,minTravel:135,maxTravel:225,width:110,widthRange:31,description:'Scattered landing spots with moderate gaps.'},
 Hard:{rise:110,variation:8,minTravel:160,maxTravel:235,width:96,widthRange:20,description:'Higher jumps, wider gaps, and narrower landing spots.'},
 Expert:{rise:120,variation:6,minTravel:185,maxTravel:220,width:76,widthRange:20,description:'The narrowest landing spots and longest, highest jumps. Aim carefully!'}
};
export function validateJumpSettings(value={},owned=[]){const s={...JUMP_DEFAULTS};if(!value||typeof value!=='object')return s;for(const key of ['skin','hair','shirt','pants'])if(/^#[0-9a-f]{6}$/i.test(value[key]))s[key]=value[key];if(JUMP_FACIAL_HAIR.includes(value.facialHair))s.facialHair=value.facialHair;if(JUMP_OUTFITS.includes(value.outfit)&&outfitUnlocked(value.outfit,owned))s.outfit=value.outfit;if(Object.hasOwn(JUMP_LEVELS,value.difficulty))s.difficulty=value.difficulty;if(JUMP_HAIR.includes(value.hairstyle)&&hairUnlocked(value.hairstyle,owned))s.hairstyle=value.hairstyle;if(JUMP_BACKGROUNDS.includes(value.background))s.background=value.background;if(Object.hasOwn(PET_BREEDS,value.pet))s.pet=value.pet;s.breed=PET_BREEDS[s.pet].includes(value.breed)?value.breed:PET_BREEDS[s.pet][0];if(!costumePetUnlocked(s.pet,s.breed,owned))s.breed=PET_BREEDS[s.pet][0];if(s.pet==='ferret'&&!ferretUnlocked(s.breed,owned))s.breed='Sable';if(s.pet==='hedgehog'&&!hedgehogUnlocked(s.breed,owned))s.breed='Salt and pepper';if(typeof value.petName==='string')s.petName=value.petName.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,24);if(!Object.hasOwn(value,'outfit')&&typeof value.shirt==='string'&&typeof value.pants==='string')s.outfit='Classic colors';const oldStarter=(!value.outfit||value.outfit==='Classic colors')&&value.hair==='#513324'&&value.skin==='#dba47b'&&((value.hairstyle==='Short'&&value.shirt==='#6b67dc'&&value.pants==='#304b71')||(value.hairstyle==='Short waves'&&value.shirt==='#efb17f'&&value.pants==='#82935a'));if(oldStarter){for(const key of ['hairstyle','hair','shirt','pants','outfit'])s[key]=JUMP_DEFAULTS[key];}return s;}
export function createJumpState(difficulty='Medium'){if(!Object.hasOwn(JUMP_LEVELS,difficulty))difficulty='Medium';const level=JUMP_LEVELS[difficulty];const platforms=[{x:450,y:560,w:900}];let x=450,y=560,seed=73129,gap=level.rise;
 // A fixed seed keeps restarts learnable while avoiding repeating zigzag columns.
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=1;i<=48;i++){
  if(i%2)gap=level.rise-level.variation+Math.floor(random()*(level.variation*2+1));else gap=level.rise*2-gap;
  let best=x,bestScore=-Infinity;
  for(let attempt=0;attempt<40;attempt++){const candidate=100+random()*700,travel=Math.abs(candidate-x);if(travel<level.minTravel||travel>level.maxTravel)continue;
   const overlap=platforms.slice(Math.max(1,platforms.length-4),-1).reduce((sum,p)=>sum+Math.max(0,105-Math.abs(candidate-p.x)),0),score=random()*75-overlap;
   if(score>bestScore){best=candidate;bestScore=score;}
  }
  // Guaranteed reachable fallback if the sampled candidates all missed the range.
  x=Math.round(bestScore===-Infinity?x+(x>450?-1:1)*(level.minTravel+level.maxTravel)/2:best);y-=gap;
  platforms.push({x,y,w:i===48?200:level.width+Math.floor(random()*level.widthRange)});
 }
 return {difficulty,summit:48*level.rise,x:450,y:560,vx:0,vy:0,grounded:true,platform:0,platforms,coins:platforms.map(p=>({x:p.x,y:p.y-58,collected:false})),collectedCoins:0,time:0,camera:0,highest:0,done:false,jumps:0,trail:[],pet:{x:370,y:560,pose:'idle',facing:1},facing:1};}
export function collectJumpCoins(s){
 for(let i=0;i<s.coins.length;i++){
  const coin=s.coins[i];
  if(!coin.collected&&i<=(s.landingLimit??s.platform)&&((i>0&&s.grounded&&s.platform===i)||(Math.abs(s.x-coin.x)<=30&&Math.abs(s.y-50-coin.y)<=38))){coin.collected=true;s.collectedCoins++;}
 }
}
export function jump(s){if(!s.done&&s.grounded){s.vy=-640;s.landingLimit=s.platform+1;s.grounded=false;s.jumps++;return true;}return false;}
export function tickJump(s,dt,input=0){if(s.done||dt<=0)return;dt=Math.min(dt,.04);s.time+=dt;s.vx=Math.max(-1,Math.min(1,input))*(s.tapTarget?.speed||290);if(input)s.facing=input<0?-1:1;const oldY=s.y;s.x=Math.max(18,Math.min(882,s.x+s.vx*dt));if(s.grounded){const p=s.platforms[s.platform];if(Math.abs(s.x-p.x)>p.w/2+12){s.grounded=false;s.vy=0;}}
 if(!s.grounded){s.vy=Math.min(1400,s.vy+1300*dt);s.y+=s.vy*dt;if(s.vy>=0){let landing=null;for(let i=0;i<s.platforms.length;i++){const p=s.platforms[i];if(i<=(s.landingLimit??48)&&oldY<=p.y&&s.y>=p.y&&Math.abs(s.x-p.x)<p.w/2+12&&(!landing||p.y<landing.p.y))landing={p,i};}if(landing){s.y=landing.p.y;s.vy=0;s.grounded=true;s.platform=landing.i;s.tapTarget=null;if(s.platform===48)s.done=true;}}}
 collectJumpCoins(s);
 s.highest=Math.max(s.highest,560-s.y);const cameraTarget=Math.min(0,s.y-430);s.camera+=(cameraTarget-s.camera)*Math.min(1,dt*8);s.trail.push({time:s.time,x:s.x-80*s.facing,y:s.y,vx:s.vx,vy:s.vy,grounded:s.grounded,facing:s.facing});while(s.trail.length>1&&s.trail[1].time<s.time-.28)s.trail.shift();const target=s.trail[0];s.pet.restTime=target.grounded&&Math.abs(target.vx)<1?(s.pet.restTime||0)+dt:0;s.pet.facing=target.facing;s.pet.pose=target.grounded?(!s.grounded&&s.vy<0?'crouch':Math.abs(target.vx)>0?'walk':s.pet.restTime>2.5&&s.pet.restTime%10<8?'sit':'idle'):target.vy<0?'jump':'land';s.pet.x+=(target.x-s.pet.x)*Math.min(1,dt*12);s.pet.y+=(target.y-s.pet.y)*Math.min(1,dt*12);
}
// Pointer coordinates are normalized to the game's 900 × 650 world by the UI.
export function tapJump(s,x,screenY){if(s.done||!Number.isFinite(x)||!Number.isFinite(screenY))return false;const worldY=screenY+s.camera;
 const nextIndex=Math.min(48,(s.grounded?s.platform+1:(s.landingLimit??s.platform+1))),next=s.platforms[nextIndex];
 // Only the next numbered landing spot can attract a tap. Sky taps stay free aim.
 const nearby=Math.abs(next.y-worldY)<=65&&Math.abs(next.x-x)<=next.w/2+30;
 const targetX=Math.max(18,Math.min(882,nearby?next.x:x));
 if(s.grounded){jump(s);const rise=Math.max(640*640/2600,Math.min(s.y-worldY,s.y-next.y+60));s.vy=-Math.sqrt(2600*rise);}
 const speed=Math.max(290,Math.min(1800,Math.abs(targetX-s.x)/Math.max(.16,-s.vy/1300)));
 s.tapTarget={x:targetX,y:nearby?next.y:Math.max(next.y-60,worldY),speed};return true;
}
export function tapJumpDirection(s,dt){return s.tapTarget?Math.max(-1,Math.min(1,(s.tapTarget.x-s.x)/((s.tapTarget.speed||290)*Math.max(dt,.001)))):0;}
