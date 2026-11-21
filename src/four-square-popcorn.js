export const isFourSquarePopcorn=s=>s.phase==='popcorn'||s.phase==='popcorn-choice';
export const POPCORN_TIMING={flash:.65,botFlash:.25,clap:.14,catch:.22,drop:.45,pass:.4};
export const fourSquarePopcornFlightTime=count=>Math.max(.9,.65+count*.13);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function requestFourSquarePopcorn(s){
 if(s.phase!=='serve'||s.cooldown>0)return false;
 s.ball=null;s.command={name:'Popcorn',king:s.order[0]};s.cooldown=13;s.phase='popcorn-choice';s.popcorn={king:s.order[0],stage:'choice',includeKing:null};s.notice='Popcorn! Choose whether the king participates.';s.noticeTime=3.5;
 if(s.order[0]!==0)startFourSquarePopcorn(s,s.random()<.65);return true;
}
// Kids usually manage the early claps; longer counts become genuinely fallible.
export function fourSquarePopcornMistakeChance(count){return count===0?0:count<8?.012:Math.min(.6,.28+(count-8)*.085);}
function prepareTurn(s){const p=s.popcorn;p.actor=p.participants[p.index];p.stage='announce';p.elapsed=0;p.claps=0;p.lastClap=0;p.turnSerial++;p.deadline=fourSquarePopcornFlightTime(p.required);p.announceDuration=p.actor===0?POPCORN_TIMING.flash:POPCORN_TIMING.botFlash;p.drop=false;p.planned=p.required;p.hesitate=false;
 if(p.actor!==0){if(s.random()<fourSquarePopcornMistakeChance(p.required)){if(s.random()<.5)p.drop=true;else p.hesitate=true;}p.nextClap=.14+s.random()*.035;}
 s.kids[p.actor].heading=0;
}
export function startFourSquarePopcorn(s,includeKing){if(s.phase!=='popcorn-choice'||typeof includeKing!=='boolean')return false;const king=s.popcorn.king;clearFourSquareClaps(s);s.popcorn={king,includeKing,participants:[...s.order].reverse().filter(id=>includeKing||id!==king),index:0,actor:null,required:0,turnSerial:0,completed:0,stage:'turn'};s.phase='popcorn';prepareTurn(s);return true;}
export function clearFourSquareClaps(s){for(const k of s.kids){k.clapQueued=0;k.clapRemaining=0;k.clapProgress=null;k.clapPulse=0;}}
export function endFourSquarePopcorn(s){clearFourSquareClaps(s);s.popcorn=null;}
export function tickFourSquareClap(k,dt){k.clapRemaining=Math.max(0,(k.clapRemaining||0)-dt);if(!k.clapRemaining&&(k.clapQueued||0)>0){k.clapQueued--;k.clapRemaining=POPCORN_TIMING.clap;k.clapSerial=(k.clapSerial||0)+1;}k.clapProgress=k.clapRemaining>0?1-k.clapRemaining/POPCORN_TIMING.clap:null;k.clapPulse=k.clapProgress===null?0:Math.sin(k.clapProgress*Math.PI);}
function queueClap(s){const p=s.popcorn;p.claps++;p.lastClap=p.elapsed;s.kids[p.actor].clapQueued=(s.kids[p.actor].clapQueued||0)+1;}
export function clapFourSquarePopcorn(s){const p=s.popcorn;if(s.phase!=='popcorn'||p?.stage!=='turn'||p.actor!==0||p.claps>p.required)return false;queueClap(s);return true;}
export function fourSquarePopcornBall(s){const p=s.popcorn;if(s.phase!=='popcorn'||!p)return null;const k=s.kids[p.actor],hold={x:k.x,y:1.15,z:k.z+.4};
 if(p.stage==='announce')return hold;
 if(p.stage==='turn'){const t=clamp(p.elapsed/p.deadline,0,1);return {...hold,y:hold.y+4*t*(1-t)*2.7};}
 if(p.stage==='catch'){const t=clamp(p.elapsed/(p.drop?POPCORN_TIMING.drop:POPCORN_TIMING.catch),0,1),from=p.catchFrom,to=p.drop?{...hold,y:.18}:hold;return {x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t+(p.drop&&p.elapsed>POPCORN_TIMING.drop?Math.sin((p.elapsed-POPCORN_TIMING.drop)*Math.PI/.15)*.18:0),z:from.z+(to.z-from.z)*t};}
 const next=s.kids[p.participants[(p.index+1)%p.participants.length]],t=clamp(p.elapsed/POPCORN_TIMING.pass,0,1);return {x:hold.x+(next.x-hold.x)*t,y:1.15+Math.sin(t*Math.PI)*.8,z:hold.z+(next.z+.4-hold.z)*t};
}
function beginCatch(s){const p=s.popcorn;p.catchFrom=fourSquarePopcornBall(s);p.failure=p.drop?'Dropped the Popcorn ball.':p.claps!==p.required?`Popcorn needed ${p.required} claps, but they clapped ${p.claps}.`:null;p.stage='catch';p.elapsed=0;const k=s.kids[p.actor];k.clapQueued=0;k.clapRemaining=0;k.clapProgress=null;k.clapPulse=0;}
export function tickFourSquarePopcorn(s,dt,onOut){const p=s.popcorn;if(s.phase!=='popcorn'||!p)return;p.elapsed+=dt;
 if(p.stage==='announce'){if(p.elapsed>=p.announceDuration){p.stage='turn';p.elapsed=0;}return;}
 if(p.stage==='turn'){
  // The ball lands on time, even if a child hesitates or still has another clap to do.
  if(p.elapsed>=p.deadline){beginCatch(s);return;}
  if(p.actor!==0&&p.claps<p.planned&&p.elapsed>=p.nextClap){queueClap(s);const pause=p.hesitate&&(p.claps===3||p.claps===7);p.nextClap+=pause?.60:.13+s.random()*.015;}return;
 }
 if(p.stage==='catch'){if(p.elapsed<(p.drop?POPCORN_TIMING.drop+.1:POPCORN_TIMING.catch))return;if(p.failure){onOut(s,p.actor,p.failure);return;}p.completed++;if(p.actor===0)s.score++;p.stage='pass';p.elapsed=0;s.kids[p.actor].hit=.4;return;}
 if(p.elapsed>=POPCORN_TIMING.pass){p.index=(p.index+1)%p.participants.length;p.required++;prepareTurn(s);}
}
export function fourSquarePopcornPose(s,id){const p=s.popcorn;if(s.phase!=='popcorn'||p.actor!==id)return null;const k=s.kids[id];return {clap:k.clapProgress!==null&&k.clapProgress!==undefined,pulse:k.clapPulse||0,toss:p.stage==='turn'?Math.sin(clamp(p.elapsed/.20,0,1)*Math.PI):0,holding:p.stage==='catch'&&!p.drop&&p.elapsed>.10,passing:p.stage==='pass'?Math.sin(Math.min(1,p.elapsed/POPCORN_TIMING.pass)*Math.PI):0};}
