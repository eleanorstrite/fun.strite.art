export const DRAGON_SAVE_KEY='sidequest.dragon-adventures.v1';
export const DRAGON_MUSIC_URL='https://www.facebook.com/atommusicaudio/videos/dragons-roar-epic-fantasy-music-for-adventure-shorts-fantasy-dragon-adventure-ad/2143288636104953/';
export const DRAGON_TYPES=[
 {id:'ember',name:'Ember',color:'#ff8b35',breath:'Fire',baby:7},
 {id:'frost',name:'Frost',color:'#80eaff',breath:'Ice crystals',baby:5},
 {id:'amethyst',name:'Amethyst',color:'#bb83ff',breath:'Crystal stars',baby:3},
 {id:'sunstone',name:'Sunstone',color:'#ffe184',breath:'Golden light',baby:6},
 {id:'forest',name:'Forest',color:'#72e7a1',breath:'Leaf balls',baby:4},
 {id:'aurora',name:'Aurora',color:'#f8a2ed',breath:'Starlight',baby:0},
 {id:'thunder',name:'Thunder',color:'#ffe455',breath:'Lightning',baby:1}
];
export const DRAGON_NEST={x:260,z:580};
export const dragonEggPosition=index=>({x:540+index*190,z:450+(index%2)*90});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const dragonStage=s=>s.day<5?'egg':s.day<15?'baby':s.day<40?'kid':'adult';
export const dragonDailyTasks=s=>dragonStage(s)==='egg'?['warm','turn','love']:['feed','walk','love'];
export const dragonType=s=>DRAGON_TYPES.find(t=>t.id===s.type);
export function createDragonAdventureState(){return {version:1,phase:'intro',intro:0,day:0,type:null,carrying:false,nested:false,player:{x:320,z:620,facing:1},dragon:{x:370,z:620,altitude:0},mounted:false,hoverTime:0,care:{warm:false,turn:false,love:false,feed:false,walk:false},walkDistance:0,walking:false,time:0,transition:0,breathCooldown:0,breaths:[],action:'',actionTime:0,message:'A sky full of dragons. A lifetime of adventure.',messageTime:5};}
export function dragonMessage(s,text){s.message=text;s.messageTime=4;return false;}
export function skipDragonIntro(s){if(s.phase==='intro'){s.phase='explore';s.intro=10;dragonMessage(s,'Choose an egg. Walk near it and press Space, then carry it to the nest.');return true;}return false;}
export function interactDragonAdventure(s){
 if(s.phase==='intro')return skipDragonIntro(s);
 if(s.transition>0)return false;
 if(!s.type){const index=DRAGON_TYPES.findIndex((t,i)=>distance(s.player,dragonEggPosition(i))<100);if(index<0)return dragonMessage(s,'Walk to a glowing egg and press Space to pick it up.');s.type=DRAGON_TYPES[index].id;s.carrying=true;return !dragonMessage(s,'You chose '+dragonType(s).name+'! Carry your egg to the nest on the left.');}
 if(s.carrying){if(distance(s.player,DRAGON_NEST)>125)return dragonMessage(s,'Bring your egg to the nest before putting it down.');s.carrying=false;s.nested=true;s.phase='care';s.dragon={...DRAGON_NEST,altitude:0};return !dragonMessage(s,'Your egg is safe. Warm it, turn it gently, and sing to it before resting.');}
 if(s.mounted){s.mounted=false;s.dragon.altitude=0;s.hoverTime=0;s.player.x=clamp(s.dragon.x-90,60,3100);s.player.z=s.dragon.z;return !dragonMessage(s,'Back on your feet. Your dragon is staying with you.');}
 if(dragonStage(s)==='egg'||dragonStage(s)==='baby')return dragonMessage(s,dragonStage(s)==='egg'?'Your egg hatches on day 5.':'Your baby is growing. Hovering begins on day 15.');
 if(distance(s.player,s.dragon)>150)return dragonMessage(s,'Walk closer to your dragon, then press Space to ride.');
 s.mounted=true;s.walking=false;s.hoverTime=0;s.player.x=s.dragon.x;s.player.z=s.dragon.z;return !dragonMessage(s,dragonStage(s)==='adult'?'You are riding! ↑ climbs, ↓ descends, ← → steer. Tap the sky or press F to breathe '+dragonType(s).breath.toLowerCase()+'.':'Your young dragon can hover for 3 seconds. Full flight unlocks on day 40.');
}
export function careForDragon(s,task){
 if(!s.nested||s.carrying||s.transition>0||s.mounted||!dragonDailyTasks(s).includes(task))return false;
 if(distance(s.player,s.dragon)>150)return dragonMessage(s,'Come closer to your '+(dragonStage(s)==='egg'?'egg':'dragon')+' first.');
 if(s.care[task])return dragonMessage(s,'You have already done that today.');
 if(task==='walk'){s.walking=true;return !dragonMessage(s,'Take a walk together. Lead your dragon through the meadow.');}
 s.care[task]=true;s.action=task;s.actionTime=2;
 return !dragonMessage(s,({warm:'Your egg glows in the warmth of your hands.',turn:'You gently turn the egg in its nest.',love:dragonStage(s)==='egg'?'Your song makes the egg shimmer.':'Your dragon leans in for a loving scratch.',feed:'Your dragon happily munches its food.'})[task]);
}
export function canRestDragon(s){return s.nested&&!s.carrying&&!s.mounted&&s.transition<=0&&dragonDailyTasks(s).every(task=>s.care[task]);}
export function restDragonAdventure(s){
 if(!canRestDragon(s))return dragonMessage(s,'Finish today’s care before resting.');
 const before=dragonStage(s);s.day++;s.care={warm:false,turn:false,love:false,feed:false,walk:false};s.walkDistance=0;s.walking=false;s.action='rest';s.actionTime=2;
 if(before!==dragonStage(s)){s.transition=3.5;s.action='grow';s.actionTime=3.5;dragonMessage(s,s.day===5?'The egg is hatching! Meet your baby '+dragonType(s).name+' dragon.':s.day===15?'Your dragon is a kid! It can hover for a few seconds.':'Day 40! Your dragon is fully grown. The whole sky is yours!');}
 else dragonMessage(s,'Good morning! Day '+s.day+' with '+dragonType(s).name+'.');
 return true;
}
export function breatheDragon(s){if(!s.mounted||s.dragon.altitude<12||s.breathCooldown>0)return false;s.breathCooldown=1;s.action='breath';s.actionTime=.8;s.breaths.push({x:s.dragon.x+s.player.facing*(dragonStage(s)==='adult'?125:70),z:s.dragon.z,altitude:s.dragon.altitude+(dragonStage(s)==='adult'?290:160),facing:s.player.facing,age:0,type:s.type});return true;}
export function tickDragonAdventure(s,dt,input={}){
 dt=clamp(Number.isFinite(dt)?dt:0,0,.1);s.time+=dt;s.messageTime=Math.max(0,s.messageTime-dt);s.actionTime=Math.max(0,s.actionTime-dt);s.breathCooldown=Math.max(0,s.breathCooldown-dt);for(const b of s.breaths){b.age+=dt;b.x+=b.facing*260*dt;}s.breaths=s.breaths.filter(b=>b.age<1.6);
 if(s.phase==='intro'){s.intro+=dt;if(s.intro>=10)skipDragonIntro(s);return;}
 if(s.transition>0){s.transition=Math.max(0,s.transition-dt);return;}
 const dx=clamp(input.x||0,-1,1),dy=clamp(input.y||0,-1,1),old={...s.player};s.moving=!!(dx||dy);
 if(s.mounted){s.player.x=clamp(s.player.x+dx*240*dt,60,3100);s.dragon.x=s.player.x;if(dx)s.player.facing=Math.sign(dx);const adult=dragonStage(s)==='adult';s.dragon.altitude=clamp(s.dragon.altitude-(adult||s.hoverTime<3?dy:0)*170*dt,0,adult?1000:45);if(!adult&&s.dragon.altitude>0){s.hoverTime+=dt;if(s.hoverTime>=3)s.dragon.altitude=Math.max(0,s.dragon.altitude-120*dt);}if(s.dragon.altitude===0&&dy>=0)s.hoverTime=0;return;}
 const length=Math.max(1,Math.hypot(dx,dy));s.player.x=clamp(s.player.x+dx/length*155*dt,60,3100);s.player.z=clamp(s.player.z+dy/length*155*dt,300,820);if(dx)s.player.facing=Math.sign(dx);
 if(s.type&&s.nested&&dragonStage(s)!=='egg'){
  const gap=distance(s.player,s.dragon),follow=gap>85?Math.min(1,dt*2.8):0;s.dragon.x+=(s.player.x-s.player.facing*85-s.dragon.x)*follow;s.dragon.z+=(s.player.z-s.dragon.z)*follow;
  if(!s.care.walk&&s.walking&&gap<250){s.walkDistance+=distance(old,s.player);if(s.walkDistance>=250){s.care.walk=true;s.walking=false;s.action='walk';s.actionTime=2;dragonMessage(s,'A lovely walk! Your dragon is feeling stronger.');}}
 }
}
export function serializeDragonAdventure(s){return JSON.stringify({version:1,day:s.day,type:s.type,carrying:s.carrying,nested:s.nested,player:s.mounted?{...s.player,x:clamp(s.dragon.x-110,60,3100)}:s.player,dragon:{...s.dragon,altitude:0},care:s.care,walkDistance:s.walkDistance,walking:s.walking});}
export function loadDragonAdventure(storage=globalThis.localStorage){try{
 const raw=JSON.parse(storage?.getItem(DRAGON_SAVE_KEY)||'null');if(raw?.version!==1||!DRAGON_TYPES.some(t=>t.id===raw.type)||!Number.isInteger(raw.day)||raw.day<0||raw.day>100000||!raw.carrying&&!raw.nested)return null;
 const s=createDragonAdventureState();s.phase=raw.nested?'care':'explore';s.type=raw.type;s.day=raw.day;s.carrying=raw.carrying===true;s.nested=raw.nested===true;
 for(const key of ['player','dragon'])for(const field of ['x','z'])if(Number.isFinite(raw[key]?.[field]))s[key][field]=clamp(raw[key][field],field==='x'?60:300,field==='x'?3100:820);
 s.player.facing=raw.player?.facing===-1?-1:1;for(const task of Object.keys(s.care))s.care[task]=raw.care?.[task]===true;s.walkDistance=clamp(Number(raw.walkDistance)||0,0,250);s.walking=raw.walking===true;s.message='Welcome back. Your '+dragonType(s).name+' dragon is waiting on day '+s.day+'.';return s;
 }catch{return null;}}
export function saveDragonAdventure(s,storage=globalThis.localStorage){if(!s.type)return true;try{storage?.setItem(DRAGON_SAVE_KEY,serializeDragonAdventure(s));return !!storage;}catch{return false;}}
