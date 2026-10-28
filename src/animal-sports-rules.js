export const SPORTS_INSTRUCTIONS={bowling:'← → aim in the lane · ↑ roll. Phone: swipe sideways to aim; swipe up to roll. Five rounds, up to two rolls each. Knock down as many pins as you can!',tennis:'← → move · Space swing when the ball reaches you. Phone: swipe sideways to move; tap to swing. First to five points wins. Swing to serve each point.',basketball:'Arrow keys move · Space shoots · V passes. Phone: swipe to move, tap a teammate to pass, hold and release to shoot. Get close to the hoop for better shots. Play for 90 seconds.'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createSportsState(sport='bowling'){
 if(!Object.hasOwn(SPORTS_INSTRUCTIONS,sport))sport='bowling';
 return {sport,time:0,done:false,score:0,message:sport==='tennis'?'Swing to serve!':sport==='bowling'?'Aim, then roll!':'Move closer, pass, and shoot!',player:{x:480,y:490},ball:null,cooldown:0,round:1,roll:0,pins:makePins(),pinFlash:0,opponent:{x:480,y:190,score:0},rally:0,swing:0,remaining:90,active:0,team:[{x:480,y:490},{x:275,y:345},{x:685,y:350}],defenders:[{x:390,y:260},{x:600,y:260}],passCount:0,shots:0};
}
function makePins(){return Array.from({length:10},(_,i)=>{let row=0;while((row+1)*(row+2)/2<=i)row++;const slot=i-row*(row+1)/2;return {x:480+(slot-row/2)*48,y:225-row*30,up:true,fall:0};});}
export function sportsAction(s,action,target=null,random=Math.random){
 if(s.done)return false;
 if(s.sport==='bowling'){
  if(action!=='roll'||s.ball||s.cooldown>0)return false;s.ball={x:s.player.x,y:525,startX:s.player.x,progress:0};s.roll++;s.message='Rolling…';return true;
 }
 if(s.sport==='tennis'){
  if(action!=='swing'||s.swing>0)return false;s.swing=.25;
  if(!s.ball&&s.cooldown<=0){s.ball={x:s.player.x,y:460,vx:70,vy:-235};s.rally=0;s.message='Rally on!';return true;}
  const b=s.ball;if(b&&b.vy>0&&Math.abs(b.y-460)<65&&Math.abs(b.x-s.player.x)<90){b.vy=-Math.min(410,245+s.rally*18);b.vx=clamp((b.x-s.player.x)*4,-220,220);if(Math.abs(b.vx)<40)b.vx=s.player.x<480?85:-85;b.y=450;s.rally++;s.message='Nice return!';return true;}s.message='Swing when the ball is near your racket.';return false;
 }
 if(s.ball||s.cooldown>0)return false;
 if(action==='pass'){
  const next=Number.isInteger(target)&&target>=0&&target<3?target:(s.active+1)%3;if(next===s.active)return false;const p=s.team[s.active];s.ball={type:'pass',x:p.x,y:p.y,startX:p.x,startY:p.y,target:next,progress:0};s.passCount++;s.message='Pass!';return true;
 }
 if(action==='shoot'){
  const p=s.team[s.active],distance=Math.hypot(p.x-480,p.y-170),defended=s.defenders.some(d=>Math.hypot(d.x-p.x,d.y-p.y)<80),chance=clamp(.94-distance/600-(defended?.24:0),.12,.92);
  s.ball={type:'shot',startX:p.x,startY:p.y,x:p.x,y:p.y,progress:0,made:random()<chance,points:distance>270?3:2};s.shots++;s.message=defended?'Contested shot!':'Shot away!';return true;
 }return false;
}
function tennisPoint(s,player){if(player)s.score++;else s.opponent.score++;s.ball=null;s.cooldown=1.1;s.message=player?'Point! Swing to serve again.':'Opponent scores. Swing to serve again.';if(s.score>=5||s.opponent.score>=5){s.done=true;s.message=s.score>=5?'Match won!':'Good match — try again!';}}
export function tickSports(s,dt,input={}){
 if(s.done||dt<=0)return;dt=Math.min(dt,.05);s.time+=dt;s.cooldown=Math.max(0,s.cooldown-dt);s.swing=Math.max(0,s.swing-dt);s.pinFlash=Math.max(0,s.pinFlash-dt);
 let dx=input.x||0,dy=input.y||0;const length=Math.hypot(dx,dy);if(length>1){dx/=length;dy/=length;}
 if(s.sport==='bowling'){
  if(!s.ball&&s.cooldown<=0)s.player.x=clamp(s.player.x+dx*300*dt,315,645);
  if(s.ball){const b=s.ball;b.progress+=dt/1.6;b.y=525-b.progress*405;for(const pin of s.pins){if(pin.up&&Math.hypot(b.x-pin.x,b.y-pin.y)<43){pin.up=false;pin.fall=s.time;s.score++;s.pinFlash=.5;for(const other of s.pins)if(other.up&&other.y<pin.y&&Math.hypot(other.x-pin.x,other.y-pin.y)<76){other.up=false;other.fall=s.time;s.score++;}}}
   if(b.progress>=1){s.ball=null;const cleared=s.pins.every(p=>!p.up);s.message=cleared?(s.roll===1?'Strike!':'Spare!'):'Nice roll!';if(cleared||s.roll===2){s.cooldown=1.1;s.roll=0;s.round++;if(s.round>5){s.done=true;s.message='Five rounds complete!';}}}
  }else if(s.cooldown===0&&s.roll===0&&s.pins.some(p=>!p.up))s.pins=makePins();
 }else if(s.sport==='tennis'){
  s.player.x=clamp(s.player.x+dx*365*dt,230,730);const b=s.ball;
  if(b){s.opponent.x+=clamp(b.x-s.opponent.x,-155*dt,155*dt);b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<220||b.x>740){b.x=clamp(b.x,220,740);b.vx*=-1;}
   if(b.vy<0&&b.y<=190){if(Math.abs(b.x-s.opponent.x)<68){b.vy=Math.min(400,245+s.rally*16);b.vx=Math.sin(s.time*2.3)*170;b.y=191;s.rally++;}else tennisPoint(s,true);}else if(b.y>530)tennisPoint(s,false);
  }
 }else{
  s.remaining=Math.max(0,s.remaining-dt);const p=s.team[s.active];if(!s.ball){p.x=clamp(p.x+dx*250*dt,180,780);p.y=clamp(p.y+dy*250*dt,205,530);}
  s.team.forEach((mate,i)=>{if(i!==s.active&&s.ball?.type!=='pass'){mate.x+=(280+i*170+Math.sin(s.time+i)*45-mate.x)*dt;mate.y+=(315+Math.cos(s.time*.7+i)*50-mate.y)*dt;}});
  s.defenders.forEach((d,i)=>{const tx=p.x+(i?90:-90),ty=Math.max(225,p.y-110);d.x+=clamp(tx-d.x,-90*dt,90*dt);d.y+=clamp(ty-d.y,-80*dt,80*dt);});
  if(s.ball){const b=s.ball;b.progress+=dt/(b.type==='pass'?.45:1.1);const to=b.type==='pass'?s.team[b.target]:{x:480,y:170};b.x=b.startX+(to.x-b.startX)*Math.min(1,b.progress);b.y=b.startY+(to.y-b.startY)*Math.min(1,b.progress)-Math.sin(Math.min(1,b.progress)*Math.PI)*(b.type==='pass'?30:150);if(b.progress>=1){if(b.type==='pass')s.active=b.target;else{if(b.made)s.score+=b.points;s.message=b.made?`${b.points} points!`:'Off the rim! Get closer or pass for space.';s.cooldown=.35;}s.ball=null;}}
  if(s.remaining===0){s.done=true;s.message='Final buzzer!';}
 }
}
export function sportsReward(s){return Math.min(50,s.sport==='bowling'?s.score:s.sport==='tennis'?s.score*3:s.score*2);}
