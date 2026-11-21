export const RECESS_BELL_SECONDS=2.6;
export const RECESS_LOOK_SECONDS=1.3;
export const RECESS_RUN_SECONDS=5.2;
export const SCHOOL_DOOR={x:-4,z:-11.65};
export function startFourSquareEnding(s){
 if(s.ending||s.phase==='over')return false;
 s.phase='ending';s.phaseTime=0;s.remaining=0;s.ball=null;s.command=null;s.popcorn=null;s.story=null;
 s.ending={elapsed:0,stage:'bell'};s.notice='Recess bell';s.noticeTime=0;
 s.kids.forEach(k=>{k.kneel=0;k.jump=0;k.hit=0;k.clapQueued=0;k.clapRemaining=0;k.clapProgress=null;k.clapPulse=0;k.holding=false;delete k.escape;k.insideSchool=false;});return true;
}
export function tickFourSquareEnding(s,dt){
 const ending=s.ending;if(!ending||s.phase!=='ending')return;
 ending.elapsed+=dt;
 const runStart=RECESS_BELL_SECONDS+RECESS_LOOK_SECONDS;
 ending.stage=ending.elapsed<RECESS_BELL_SECONDS?'bell':ending.elapsed<runStart?'look':'run';
 if(ending.stage==='run')s.kids.forEach((k,i)=>{
  const running=ending.elapsed-runStart-i*.07;if(running<=0||k.insideSchool)return;
  const dx=SCHOOL_DOOR.x-k.x,dz=SCHOOL_DOOR.z-k.z,d=Math.hypot(dx,dz),step=Math.min(d,(4.4+i*.12)*dt);
  if(d<.22){k.insideSchool=true;return;}
  k.x+=dx/d*step;k.z+=dz/d*step;k.heading=Math.atan2(dx,dz);
 });
 if(ending.elapsed>=runStart+RECESS_RUN_SECONDS){s.kids.forEach(k=>{k.x=SCHOOL_DOOR.x;k.z=SCHOOL_DOOR.z;k.insideSchool=true;});ending.stage='done';s.phase='over';}
}
