export const SPORTS_INSTRUCTIONS={bowling:'← → aim. Hold ↑ to cycle power; release when the accuracy needle is centered. Green power (82–90%) and a precise release give the best strikes. Maximum power is harder to control! Phone: set power, swipe sideways to aim, then swipe up or tap Roll with the needle centered. Five rounds.',tennis:'Player 1: ← → move, Space swings. Player 2: A / D move, W moves toward the net, Shift swings. Choose solo or two-player before starting. Phone: swipe sideways and tap to swing. In solo mode, hit from the right half to make the opponent occasionally miss. First to five wins.',basketball:'Arrows move. Hold Space to enter shooting mode; arrows now adjust the dotted arc. Release Space to fire. V passes. Phone: hold to enter shooting mode, lift your finger, drag to aim, then tap to fire. Outside shooting mode, tap a teammate to pass or swipe to move. Three defenders can steal or intercept; shooting mode protects the ball. After a turnover, defend against their attack: get close and press Space (or tap Steal) to knock the ball away.'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createSportsState(sport='bowling',settings={}){
 if(!Object.hasOwn(SPORTS_INSTRUCTIONS,sport))sport='bowling';
 return {sport,time:0,done:false,score:0,message:sport==='tennis'?'Serve! Swing when you are ready.':sport==='bowling'?'Aim carefully: green power + centered accuracy needle!':'Hold Space to aim your shot!',player:{x:480,y:490},ball:null,cooldown:0,round:1,roll:0,pins:makePins(),pinFlash:0,power:.65,powerDirection:1,release:0,charging:false,frames:[0,0,0,0,0],frameMarks:['','','','',''],rivals:[{name:'Nova Fox',frames:[8,7,10,6,9]},{name:'Milo Moon',frames:[6,9,8,10,7]},{name:'Ziggy Zoom',frames:[9,6,7,8,10]}],opponent:{x:480,y:190,score:0},tennisPlayers:Number(settings.tennisPlayers)===2?2:1,rally:0,serveStarted:0,swing:0,opponentSwing:0,remaining:90,active:0,team:[{x:480,y:490},{x:275,y:345},{x:685,y:350}],defenders:[{x:360,y:280},{x:480,y:240},{x:600,y:280}],defenseGrace:3,stealCooldown:0,turnovers:0,enemyPossession:false,enemyCarrier:0,enemyScore:0,playerStealCooldown:0,playerReach:0,enemyAttackTime:0,passCount:0,shots:0,aim:null};
}
function makePins(){return Array.from({length:10},(_,i)=>{let row=0;while((row+1)*(row+2)/2<=i)row++;const slot=i-row*(row+1)/2;return {x:480+(slot-row/2)*48,y:225-row*30,up:true,fall:0};});}
export function sportsShotPoint(start,target,t){const p=clamp(t,0,1);return {x:start.x+(target.x-start.x)*p,y:start.y+(target.y-start.y)*p-Math.sin(p*Math.PI)*Math.min(170,70+Math.hypot(target.x-start.x,target.y-start.y)*.25)};}
export function sportsShotAligned(aim){return Boolean(aim&&Math.hypot(aim.x-480,aim.y-170)<=22);}
function tennisReturn(s,second=false){const b=s.ball,p=second?s.opponent:s.player;if(!b||(second?b.vy>=0:b.vy<=0))return false;const hitY=second?p.y+18:p.y-36;if(Math.abs(b.y-hitY)>72||Math.abs(b.x-p.x)>105)return false;b.vy=(second?1:-1)*Math.min(350,225+s.rally*12);b.vx=clamp((b.x-p.x)*3,-185,185);if(Math.abs(b.vx)<35)b.vx=p.x<480?65:-65;b.y=hitY+(second?8:-8);if(!second){b.allowAiMiss=p.x>480;b.aiAttempt=undefined;}s.rally++;s.message=second?(s.tennisPlayers===2?'Player 2 returns!':'Opponent returns!'):'Nice return!';return true;}
export function sportsAction(s,action,target=null){
 if(s.done)return false;
 if(s.sport==='bowling'){
  if(action!=='roll'||s.ball||s.cooldown>0)return false;s.charging=false;s.ball={x:s.player.x,y:525,startX:s.player.x,progress:0,power:s.power,knocked:0,release:s.release,gutter:false,strike:Math.abs(s.player.x-480)<=8&&Math.abs(s.release)<=.12&&s.power>=.82&&s.power<=.9};s.roll++;s.message='Rolling…';return true;
 }
 if(s.sport==='tennis'){
  const second=action==='swing2';if(action!=='swing'&&!second||second&&s.tennisPlayers!==2)return false;const key=second?'opponentSwing':'swing';if(s[key]>.1)return false;s[key]=.42;
  if(!s.ball&&s.cooldown<=0){const p=second?s.opponent:s.player;s.ball={x:p.x,y:second?p.y+28:p.y-45,vx:65,vy:second?225:-225,allowAiMiss:!second&&p.x>480};s.rally=0;s.message='Rally on!';return true;}
  // The swing remains active so an early press can connect as the ball arrives.
  tennisReturn(s,second);return true;
 }
 if(s.enemyPossession){
  if(!['aim','steal'].includes(action)||s.ball||s.playerStealCooldown>0)return false;
  s.playerStealCooldown=.65;s.playerReach=.3;const p=s.team[s.active],d=s.defenders[s.enemyCarrier];
  if(Math.hypot(p.x-d.x,p.y-d.y)<=72){s.enemyPossession=false;s.defenseGrace=3;s.cooldown=0;s.message='You stole it! Your ball — move, pass or shoot.';}else s.message='Get closer to the ball carrier, then press Space to steal!';return true;
 }
 if(s.ball||s.cooldown>0)return false;
 if(action==='aim'){if(!s.aim){const p=s.team[s.active];s.aim={x:p.x+28,y:215};s.message='Aim the dotted arc at the rim, then release Space / tap.';}return true;}
 if(action==='pass'){
  if(s.aim)return false;const next=Number.isInteger(target)&&target>=0&&target<3?target:(s.active+1)%3;if(next===s.active)return false;const p=s.team[s.active];s.ball={type:'pass',x:p.x,y:p.y-20,startX:p.x,startY:p.y-20,target:next,progress:0};s.passCount++;s.message='Pass!';return true;
 }
 if(action==='shoot'&&s.aim){
  const p=s.team[s.active],aim={...s.aim},distance=Math.hypot(p.x-480,p.y-170);s.ball={type:'shot',startX:p.x+28,startY:p.y-28,x:p.x+28,y:p.y-28,endX:aim.x,endY:aim.y,progress:0,made:sportsShotAligned(aim),points:distance>270?3:2};s.aim=null;s.shots++;s.message='Shot away!';return true;
 }return false;
}
function tennisPoint(s,player){if(player)s.score++;else s.opponent.score++;s.ball=null;s.serveStarted=s.time;s.swing=0;s.opponentSwing=0;s.cooldown=.8;s.message=player?'Player 1 scores! Swing to serve.':`${s.tennisPlayers===2?'Player 2':'Opponent'} scores. Swing to serve.`;if(s.score>=5||s.opponent.score>=5){s.done=true;s.message=s.score>=5?'Player 1 wins!':s.tennisPlayers===2?'Player 2 wins!':'Good match — try again!';}}
function knockBasketballLoose(s,d,intercepted){
 const p=s.team[s.active],b=s.ball;s.turnovers++;s.ball={type:'loose',x:b?.x??p.x+28,y:b?.y??p.y-20,startX:b?.x??p.x+28,startY:b?.y??p.y-20,endX:d.x,endY:d.y-20,progress:0};s.enemyCarrier=Math.max(0,s.defenders.indexOf(d));s.aim=null;s.message=intercepted?'Pass intercepted! Opponents will attack from the baseline.':'Ball stolen! Opponents will attack from the baseline.';
}
function basketballDefense(s,dt,random){
 s.defenseGrace=Math.max(0,s.defenseGrace-dt);s.stealCooldown=Math.max(0,s.stealCooldown-dt);
 const p=s.team[s.active];s.defenders.forEach((d,i)=>{
  d.reach=Math.max(0,(d.reach||0)-dt);
  const guarding=i===0?p:s.team[(s.active+i)%3];
  const target=s.ball?.type==='pass'?{x:s.ball.x,y:s.ball.y+20}:guarding;
  const tx=clamp(target.x+(i===0?(s.aim?65:38):i===1?-55:55),180,780),ty=target.y-(i===0?(s.aim?55:22):48),distance=Math.hypot(tx-d.x,ty-d.y),step=Math.min(distance,110*dt);
  if(distance){d.x+=((tx-d.x)/distance)*step;d.y+=((ty-d.y)/distance)*step;}
 });
 // One team-wide attempt at a time, with recovery protection after turnovers.
 if(s.aim||s.ball||s.cooldown>0||s.defenseGrace>0||s.stealCooldown>0)return;
 const d=s.defenders.find(d=>Math.hypot(d.x-(p.x+22),d.y-p.y)<46);
 if(d){d.reach=.4;s.stealCooldown=1.6;if(random()<.28)knockBasketballLoose(s,d,false);}
}
function interceptBasketball(s,b,from,random){
 if(s.defenseGrace>0||s.stealCooldown>0||b.contested)return;
 // Test the swept pass segment so fast passes cannot tunnel through a defender.
 const vx=b.x-from.x,vy=b.y-from.y,length=vx*vx+vy*vy;
 const d=s.defenders.find(d=>{const x=d.x,y=d.y-20,t=length?clamp(((x-from.x)*vx+(y-from.y)*vy)/length,0,1):0;return Math.hypot(x-from.x-vx*t,y-from.y-vy*t)<28;});
 if(d){b.contested=true;d.reach=.4;s.stealCooldown=1.6;if(random()<.35)knockBasketballLoose(s,d,true);}
}
export function tickSports(s,dt,input={},random=Math.random){
 if(s.done||dt<=0)return;dt=Math.min(dt,.05);s.time+=dt;s.cooldown=Math.max(0,s.cooldown-dt);s.swing=Math.max(0,s.swing-dt);s.opponentSwing=Math.max(0,s.opponentSwing-dt);s.pinFlash=Math.max(0,s.pinFlash-dt);
 let dx=input.x||0,dy=input.y||0;const length=Math.hypot(dx,dy);if(length>1){dx/=length;dy/=length;}
 if(s.sport==='bowling'){
  if(!s.ball&&s.cooldown<=0){s.player.x=clamp(s.player.x+dx*250*dt,315,645);s.release=Math.sin(s.time*3.6);if(s.charging){s.power+=dt*.7*s.powerDirection;if(s.power>=1){s.power=1;s.powerDirection=-1;}else if(s.power<=.1){s.power=.1;s.powerDirection=1;}}}
  if(s.ball){const b=s.ball;b.progress+=dt/(2.3-b.power);b.y=525-b.progress*405;b.x=b.startX+b.release*90*Math.min(1,b.progress/.74);if(b.x<315||b.x>645)b.gutter=true;const knock=pin=>{if(!pin.up)return;pin.up=false;pin.fall=s.time;s.score++;s.frames[s.round-1]++;b.knocked++;s.pinFlash=.5;};
   if(!b.gutter&&b.strike&&b.y<=225){s.pins.forEach(knock);}else if(!b.gutter)for(const pin of s.pins){const limit=b.power>.94?6:Math.ceil(b.power*8);if(b.knocked>=limit)break;if(pin.up&&Math.hypot(b.x-pin.x,b.y-pin.y)<25+b.power*18){knock(pin);for(const other of s.pins)if(b.knocked<limit&&other.up&&other.y<pin.y&&Math.hypot(other.x-pin.x,other.y-pin.y)<35+b.power*41)knock(other);}}
   if(b.progress>=1){s.ball=null;const cleared=s.pins.every(p=>!p.up);s.message=cleared?(s.roll===1?'Strike!':'Spare!'):b.gutter?'Gutter ball! Center your release.':b.knocked===0?'Miss! Watch the accuracy needle.':b.power>.94?'Too much power! Try the green zone.':'Aim for the remaining pins!';if(cleared||s.roll===2){s.frameMarks[s.round-1]=cleared?(s.roll===1?'X':'/'):String(s.frames[s.round-1]);s.cooldown=1.1;s.roll=0;s.round++;if(s.round>5){s.done=true;s.message='Five rounds complete!';}}}
  }else if(s.cooldown===0&&s.roll===0&&s.pins.some(p=>!p.up))s.pins=makePins();
 }else if(s.sport==='tennis'){
  s.player.x=clamp(s.player.x+dx*365*dt,230,730);
  if(s.tennisPlayers===2){s.opponent.x=clamp(s.opponent.x+(input.p2x||0)*365*dt,230,730);s.opponent.y=clamp(s.opponent.y+(input.p2y||0)*170*dt,175,265);}
  const b=s.ball;if(b){if(s.tennisPlayers===1){
    // Shots hit from the right half can cause an occasional mistimed return.
    // Decide once per incoming shot, using the hitter position at contact.
    if(b.vy<0&&b.aiAttempt===undefined)b.aiAttempt=!b.allowAiMiss||random()>=.3;
    s.opponent.x+=clamp(b.x-s.opponent.x,-145*dt,145*dt);
    if(b.vy<0&&(b.aiAttempt?Math.abs(b.y-(s.opponent.y+18))<48:b.y<150))s.opponentSwing=.3;
   }
   b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<220||b.x>740){b.x=clamp(b.x,220,740);b.vx*=-1;}if(s.swing>0)tennisReturn(s);if(s.opponentSwing>0&&(s.tennisPlayers===2||b.aiAttempt!==false))tennisReturn(s,true);
   if(b.y<130)tennisPoint(s,true);else if(b.y>540)tennisPoint(s,false);
  }
 }else{
  s.remaining=Math.max(0,s.remaining-dt);const p=s.team[s.active];if(s.aim){s.aim.x=clamp(s.aim.x+dx*150*dt,150,810);s.aim.y=clamp(s.aim.y+dy*150*dt,105,440);s.message=sportsShotAligned(s.aim)?'Aligned! Release Space / tap to shoot.':'Adjust the dotted arc until it meets the rim.';}else if(!s.ball){p.x=clamp(p.x+dx*250*dt,180,780);p.y=clamp(p.y+dy*250*dt,205,530);}
  s.team.forEach((mate,i)=>{if(i!==s.active&&s.ball?.type!=='pass'){mate.x+=(280+i*170+Math.sin(s.time+i)*45-mate.x)*dt;mate.y+=(315+Math.cos(s.time*.7+i)*50-mate.y)*dt;}});
  s.playerStealCooldown=Math.max(0,s.playerStealCooldown-dt);s.playerReach=Math.max(0,s.playerReach-dt);
  if(s.enemyPossession){
   s.enemyAttackTime+=dt;const carrier=s.defenders[s.enemyCarrier];
   s.defenders.forEach((d,i)=>{const tx=i===s.enemyCarrier?480:((i+3-s.enemyCarrier)%3===1?300:660),ty=i===s.enemyCarrier?230:290,dist=Math.hypot(tx-d.x,ty-d.y),step=Math.min(dist,72*dt);if(dist){d.x+=(tx-d.x)/dist*step;d.y+=(ty-d.y)/dist*step;}});
   if(!s.ball&&carrier.y<=232&&s.enemyAttackTime>1){s.ball={type:'enemy-shot',x:carrier.x+28,y:carrier.y-28,startX:carrier.x+28,startY:carrier.y-28,endX:480,endY:170,progress:0};s.message='Opponent shoots!';}
  }else basketballDefense(s,dt,random);
  if(s.ball){const b=s.ball,from={x:b.x,y:b.y};b.progress+=dt/(b.type==='pass'?.45:b.type==='loose'?1:1.1);const mate=s.team[b.target],to=b.type==='pass'?{x:mate.x,y:mate.y-20}:{x:b.endX,y:b.endY};
   const pos=b.type==='pass'?{x:b.startX+(to.x-b.startX)*Math.min(1,b.progress),y:b.startY+(to.y-b.startY)*Math.min(1,b.progress)}:sportsShotPoint({x:b.startX,y:b.startY},to,b.progress);b.x=pos.x;b.y=pos.y;
   if(b.type==='pass')interceptBasketball(s,b,from,random);
   if(s.ball===b&&b.progress>=1){
    if(b.type==='pass')s.active=b.target;
    else if(b.type==='loose'){s.enemyPossession=true;s.enemyAttackTime=0;s.playerStealCooldown=0;s.defenders.forEach((d,i)=>{d.x=i===s.enemyCarrier?480:((i+3-s.enemyCarrier)%3===1?300:660);d.y=510;d.reach=0;});s.team[s.active]={x:480,y:335};s.message='Defend! Move close and press Space / tap Steal.';}
    else if(b.type==='enemy-shot'){s.enemyScore+=2;s.enemyPossession=false;s.team[s.active]={x:480,y:490};s.defenders.forEach((d,i)=>{d.x=360+i*120;d.y=260;});s.defenseGrace=3;s.message='Opponents scored 2. Your ball!';}
    else{if(b.made)s.score+=b.points;s.message=b.made?`${b.points} points! Swish!`:'Miss! Aim the dotted arc at the rim.';s.cooldown=.35;}
    s.ball=null;
   }
  }
  if(s.remaining===0){s.done=true;s.aim=null;s.message='Final buzzer!';}
 }
}
export function sportsReward(s){return Math.min(50,s.sport==='bowling'?s.score:s.sport==='tennis'?Math.max(s.score,s.tennisPlayers===2?s.opponent.score:0)*3:s.score*2);}
