export const isFourSquarePopcorn=s=>s.phase==='popcorn'||s.phase==='popcorn-choice';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function requestFourSquarePopcorn(s){
 if(s.phase!=='serve'||s.cooldown>0)return false;
 s.ball=null;s.command={name:'Popcorn',king:s.order[0]};s.cooldown=13;s.phase='popcorn-choice';s.popcorn={king:s.order[0],stage:'choice',includeKing:null};s.notice='Popcorn! Choose whether the king participates.';s.noticeTime=3.5;
 if(s.order[0]!==0)startFourSquarePopcorn(s,s.random()<.65);return true;
}
function prepareTurn(s){const p=s.popcorn;p.actor=p.participants[p.index];p.stage='turn';p.elapsed=0;p.claps=0;p.lastClap=0;p.turnSerial++;p.deadline=Math.max(3,1.3+p.required*.55);p.drop=false;p.planned=p.required;
 if(p.actor!==0){const chance=p.required===0?0:Math.min(.3,.035+p.required*.012);if(s.random()<chance){if(s.random()<.5)p.drop=true;else p.planned=Math.max(0,p.required+(s.random()<.5?-1:1));}p.nextClap=.55+s.random()*.15;}
 s.kids[p.actor].heading=0;
}
export function startFourSquarePopcorn(s,includeKing){if(s.phase!=='popcorn-choice'||typeof includeKing!=='boolean')return false;const king=s.popcorn.king;clearFourSquareClaps(s);s.popcorn={king,includeKing,participants:[...s.order].reverse().filter(id=>includeKing||id!==king),index:0,actor:null,required:0,turnSerial:0,completed:0,stage:'turn'};s.phase='popcorn';prepareTurn(s);return true;}
export function clearFourSquareClaps(s){for(const k of s.kids){k.clapQueued=0;k.clapRemaining=0;k.clapProgress=null;k.clapPulse=0;}}
export function endFourSquarePopcorn(s){clearFourSquareClaps(s);s.popcorn=null;}
export function tickFourSquareClap(k,dt){k.clapRemaining=Math.max(0,(k.clapRemaining||0)-dt);if(!k.clapRemaining&&(k.clapQueued||0)>0){k.clapQueued--;k.clapRemaining=.28;k.clapSerial=(k.clapSerial||0)+1;}k.clapProgress=k.clapRemaining>0?1-k.clapRemaining/.28:null;k.clapPulse=k.clapProgress===null?0:Math.sin(k.clapProgress*Math.PI);}
function queueClap(s){const p=s.popcorn;p.claps++;p.lastClap=p.elapsed;s.kids[p.actor].clapQueued=(s.kids[p.actor].clapQueued||0)+1;}
export function clapFourSquarePopcorn(s){const p=s.popcorn;if(s.phase!=='popcorn'||p?.stage!=='turn'||p.actor!==0||p.claps>p.required)return false;queueClap(s);return true;}
export function fourSquarePopcornBall(s){const p=s.popcorn;if(s.phase!=='popcorn'||!p)return null;const k=s.kids[p.actor],hold={x:k.x,y:1.15,z:k.z+.4};
 if(p.stage==='turn')return {...hold,y:1.15+Math.sin(Math.PI*clamp(p.elapsed/p.deadline,0,1))*2.1};
 if(p.stage==='catch'){const t=clamp(p.elapsed/(p.drop?.7:.55),0,1),from=p.catchFrom,to=p.drop?{...hold,y:.18}:hold;return {x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t+(p.drop&&p.elapsed>.7?Math.sin((p.elapsed-.7)*Math.PI/.3)*.18:0),z:from.z+(to.z-from.z)*t};}
 const next=s.kids[p.participants[(p.index+1)%p.participants.length]],t=clamp(p.elapsed/.85,0,1);return {x:hold.x+(next.x-hold.x)*t,y:1.15+Math.sin(t*Math.PI)*.8,z:hold.z+(next.z+.4-hold.z)*t};
}
function beginCatch(s){const p=s.popcorn;p.catchFrom=fourSquarePopcornBall(s);p.failure=p.drop?'Dropped the Popcorn ball.':p.claps!==p.required?`Popcorn needed ${p.required} claps, but they clapped ${p.claps}.`:null;p.stage='catch';p.elapsed=0;}
export function tickFourSquarePopcorn(s,dt,onOut){const p=s.popcorn;if(s.phase!=='popcorn'||!p)return;p.elapsed+=dt;
 if(p.stage==='turn'){if(p.actor!==0&&p.claps<p.planned&&p.elapsed>=p.nextClap){queueClap(s);p.nextClap+=.38+s.random()*.08;}const k=s.kids[p.actor],finished=!k.clapRemaining&&!k.clapQueued,quiet=p.elapsed-p.lastClap>.55;
  if(finished&&(p.elapsed>=p.deadline||p.elapsed>1.4&&quiet&&p.claps>=p.required))beginCatch(s);return;
 }
 if(p.stage==='catch'){if(p.elapsed<(p.drop?1:.7))return;if(p.failure){onOut(s,p.actor,p.failure);return;}p.completed++;if(p.actor===0)s.score++;p.stage='pass';p.elapsed=0;s.kids[p.actor].hit=.4;return;}
 if(p.elapsed>=.85){p.index=(p.index+1)%p.participants.length;p.required++;prepareTurn(s);}
}
export function fourSquarePopcornPose(s,id){const p=s.popcorn;if(s.phase!=='popcorn'||p.actor!==id)return null;const k=s.kids[id];return {clap:k.clapProgress!==null&&k.clapProgress!==undefined,pulse:k.clapPulse||0,toss:p.stage==='turn'?Math.sin(clamp(p.elapsed/.45,0,1)*Math.PI):0,holding:p.stage==='catch'&&!p.drop&&p.elapsed>.45,passing:p.stage==='pass'?Math.sin(Math.min(1,p.elapsed/.85)*Math.PI):0};}
