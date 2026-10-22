import { createMazeAudio } from './maze-audio.js';

export const VAN_FINISH=6000;
export const SNACK_ATTACK_SECONDS=5;
export const VAN_OBSTACLES=[
  {z:450,x:-70,type:'cones'},{z:720,x:75,type:'crate'},
  {z:1100,x:0,type:'jump'},{z:1530,x:-90,type:'crate'},{z:1780,x:80,type:'cones'},
  {z:2200,x:0,type:'gap',length:180},{z:2700,x:-60,type:'crate'},
  {z:3100,x:0,type:'jump'},{z:3500,x:80,type:'crate'},
  {z:3950,x:0,type:'gap',length:230},{z:4450,x:-70,type:'cones'},
  {z:4800,x:0,type:'jump'},{z:5300,x:70,type:'crate'},
];
export const VAN_LEVELS={
  easy:{name:'Easy',scene:'Countryside cruise',finish:6000,speed:230,coins:1,spacing:400,ice:false,lava:false},
  medium:{name:'Medium',scene:'Snowy switchbacks',finish:8000,speed:285,coins:2,spacing:360,ice:true,lava:false},
  hard:{name:'Hard',scene:'Lava storm',finish:10000,speed:345,coins:5,spacing:330,ice:false,lava:true},
  expert:{name:'Expert',scene:'Frozen volcano',finish:12000,speed:410,coins:10,spacing:300,ice:true,lava:true},
};
export const vanRecordId=level=>'family-van-'+level;
export function buildVanCourse(level){
  if(level==='easy')return VAN_OBSTACLES.map(o=>({...o}));
  const config=VAN_LEVELS[level],course=[];
  for(let z=600,i=0;z<config.finish-400;z+=config.spacing,i++){
    const type=i%10===7?'gap':i%10===3?'jump':config.lava&&i%4===1?'lava':i%2?'crate':'cones';
    course.push({z,x:['gap','jump'].includes(type)?0:[-90,90,0][i%3],type,...(type==='gap'?{length:180}:{})});
  }
  return course;
}
const clampVan=(n,a,b)=>Math.max(a,Math.min(b,n));
export const vanRoadCenter=z=>340+Math.sin(z/650)*62+Math.sin(z/290)*24;
export function createVanState(level="easy"){if(!Object.hasOwn(VAN_LEVELS,level))level="easy";return {level,config:VAN_LEVELS[level],obstacles:buildVanCourse(level),slide:0,status:'ready',intro:0,z:0,x:vanRoadCenter(0),speed:0,time:0,lives:3,lane:0,snack:0,snackShots:[],snackCleared:[],snackThrow:0,snackCount:0,jump:0,fly:0,dodge:0,jumpCooldown:0,flyCooldown:0,dodgeCooldown:0,dodgeDir:1,steer:1,invincible:0,checkpoint:0,earned:0,message:'All aboard!'};}
export function vanAction(s,action){
  if(s.status!=='playing')return false;
  if(action==='jump'&&!s.jumpCooldown&&!s.fly){s.jump=.95;s.jumpCooldown=1.4;return true;}
  if(['left','right'].includes(action)&&!s.dodgeCooldown){const lane=clampVan(s.lane+(action==='left'?-1:1),-1,1);if(lane===s.lane)return false;s.lane=lane;s.dodge=.25;s.dodgeCooldown=.3;return true;}
  return false;
}
export function tickSnackAttack(s,dt,emit=()=>{}){
  if(s.snack<=0){s.snackShots=[];s.snackCleared=[];s.snackThrow=0;return;}
  s.snackShots??=[];s.snackCleared??=[];
  for(const shot of s.snackShots){
    const before=shot.age;shot.age+=dt;
    if(before<.55&&shot.age>=.55&&shot.target!==null){s.snackCleared.push(shot.target);emit('gem');}
  }
  s.snackShots=s.snackShots.filter(shot=>shot.age<.9);
  s.snackThrow=Math.max(0,(s.snackThrow||0)-dt);
  if(s.snackThrow>0)return;
  const target=s.obstacles.find(o=>o.z+(o.length||35)>=s.z-40&&o.z<s.z+650&&!s.snackCleared.includes(o.z)&&!s.snackShots.some(shot=>shot.target===o.z));
  const count=s.snackCount||0;
  const z=target?Math.max(s.z+45,target.z):s.z+350;
  s.snackShots.push({age:0,fromX:s.x+52,fromZ:s.z+10,x:target?vanRoadCenter(target.z)+target.x:vanRoadCenter(z)+(count%2?65:-65),z,target:target?.z??null,kind:count%2?'candy':'sandwich'});
  s.snackCount=count+1;s.snackThrow=.38;
  if(target)emit('whoosh');
}
export function tickVan(s,seconds,keys={},emit=()=>{}){
  const dt=clampVan(seconds,0,.05);
  if(s.status==='intro'){s.intro+=dt;if(s.intro>=7){s.status='playing';s.message='The Raven drives itself. Dodge, jump, and beat your best time!';}return;}
  if(s.status!=='playing')return;
  s.time+=dt;
  for(const name of ['jump','dodge','jumpCooldown','dodgeCooldown','invincible','snack'])s[name]=Math.max(0,s[name]-dt);
  s.speed=clampVan(s.speed+(keys.down?-360:180+s.config.speed*.15)*dt,0,s.config.speed);
  const previous=s.z;s.z=Math.min(s.config.finish,s.z+s.speed*dt);
  const target=vanRoadCenter(s.z)+s.lane*90;
  if(s.config.ice){
    // A damped spring retains sideways momentum on ice, then settles in the chosen lane.
    s.slide+=((target-s.x)*16-s.slide*4.5)*dt;
    s.slide=clampVan(s.slide,-420,420);s.x+=s.slide*dt;
  }else s.x+=clampVan(target-s.x,-450*dt,450*dt);
  for(const o of s.obstacles){
    if(o.type!=='lava')continue;
    if(o.age===undefined&&o.z-s.z<500)o.age=0;
    if(o.age!==undefined){const before=o.age;o.age+=dt;if(before<1.2&&o.age>=1.2&&s.snack<=0)emit('thunder');}
  }
  // Flight is available only on the approach to a gap and until the rear of
  // the van clears it. Holding Space cannot bypass the rest of the course.
  const gap=s.obstacles.find(o=>o.type==='gap'&&s.z>=o.z-180&&s.z<=o.z+o.length+60);
  const wasFlying=s.fly>0;
  s.fly=keys.fly&&gap&&s.snack<=0?1:0;
  if(s.fly){s.jump=0;if(!wasFlying)emit('jet');}
  tickSnackAttack(s,dt,emit);
  const flying=s.fly>0,jumping=s.jump>0&&Math.sin((1-s.jump/.95)*Math.PI)>.25;
  if(Math.abs(s.x-vanRoadCenter(s.z))>145&&!flying){s.speed=Math.min(s.speed,75);s.message='Grass slows you down — steer back onto the road.';}
  const obstacle=s.obstacles.find(o=>{
    if(s.z<o.z-38||previous>o.z+(o.length||35))return false;
    if(flying||s.snack>0)return false;
    if(o.type==='lava')return o.age>=1.2&&o.age<4&&Math.abs(s.x-(vanRoadCenter(o.z)+o.x))<65;
    if(o.type==='gap')return true;
    if(o.type==='jump')return !jumping;
    return !jumping&&s.dodge<=0&&Math.abs(s.x-(vanRoadCenter(o.z)+o.x))<46;
  });
  if(obstacle&&s.invincible<=0){
    s.lives--;s.speed=0;s.fly=0;s.jump=0;s.dodge=0;s.z=s.checkpoint*1000;s.x=vanRoadCenter(s.z);s.lane=0;s.slide=0;s.invincible=2;for(const o of s.obstacles)if(o.type==='lava'&&o.z>=s.z)delete o.age;
    s.message=obstacle.type==='gap'?'Use Fly to cross the broken road!':'Bump! Try steering, jumping, or dodging.';emit('crash');
    if(s.lives<=0)s.status='lost';return;
  }
  const checkpoint=Math.min(Math.ceil(s.config.finish/1000)-1,Math.floor(s.z/1000));
  if(checkpoint>s.checkpoint){s.checkpoint=checkpoint;s.message='Checkpoint saved!';emit('flightCoin');}
  if(s.z>=s.config.finish){s.status='won';s.earned=s.config.coins;s.message='The whole family made it!';emit('win');}
}
function vanOval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function vanRound(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
export function drawFamilyVan(c,x,y,scale=1,side=false,door=false){
  c.save();c.translate(x,y);c.scale(scale,scale);
  if(side){
    vanOval(c,0,48,160,12,'#17232a44');
    vanRound(c,-154,-8,308,60,22,'#171d23');vanRound(c,-112,-67,245,90,35,'#252c33');
    c.fillStyle='#273f4c';c.beginPath();c.moveTo(-104,-49);c.lineTo(-135,-8);c.lineTo(-70,-8);c.lineTo(-63,-49);c.fill();
    vanRound(c,-54,-52,75,43,5,'#567684');vanRound(c,30,-52,85,43,6,'#354f5e');
    c.fillStyle='#71808a';c.fillRect(-144,27,291,4);c.fillRect(-16,0,20,4);
    c.fillStyle='#e7edce';c.fillRect(-151,3,22,9);c.fillStyle='#ee7467';c.fillRect(135,6,15,13);
    if(door){vanRound(c,-48,-52,75,95,6,'#0b1219');vanRound(c,31,-52,51,95,5,'#252e37');}
    for(const xx of [-100,100]){vanOval(c,xx,44,29,29,'#101318');vanOval(c,xx,44,18,18,'#58616b');vanOval(c,xx,44,9,9,'#b0b5b7');}
  }else{
    vanRound(c,-29,-53,58,110,17,'#141b23');vanRound(c,-24,-43,48,90,12,'#29313a');
    vanRound(c,-21,-34,42,24,7,'#7799a8');vanRound(c,-20,22,40,18,5,'#486371');
    c.fillStyle='#414c56';c.fillRect(-18,-3,36,19);c.fillStyle='#fff3bf';c.fillRect(-24,-48,12,5);c.fillRect(12,-48,12,5);
    c.fillStyle='#ee7467';c.fillRect(-24,44,10,5);c.fillRect(14,44,10,5);
    c.fillStyle='#111820';for(const xx of [-33,27]){c.fillRect(xx,-30,6,20);c.fillRect(xx,24,6,20);}
    c.fillStyle='#a1a7ad';c.fillRect(-20,51,40,3);
  }
  c.restore();
}
function drawVanPassenger(c,x,y,index,walk){
  c.save();c.translate(x,y);
  if(index===3){
    vanOval(c,0,-15,22,12,'#20252b');vanOval(c,18,-27,12,13,'#343b43');vanOval(c,11,-29,6,12,'#14191e');
    c.fillStyle='#252b31';for(const xx of [-15,-4,9,19])c.fillRect(xx,-10,5,13+Math.sin(walk+xx)*2);
    c.strokeStyle='#20252b';c.lineWidth=6;c.beginPath();c.moveTo(-19,-19);c.lineTo(-30,-32+Math.sin(walk)*4);c.stroke();vanOval(c,24,-29,2.5,2.5,'#f0d7a4');
  }else{
    const small=index===2,head=small?-44:-66;
    c.strokeStyle='#34435b';c.lineWidth=7;c.beginPath();c.moveTo(-8,-22);c.lineTo(-9+Math.sin(walk)*6,0);c.moveTo(8,-22);c.lineTo(9-Math.sin(walk)*6,0);c.stroke();
    if(index!==0){vanOval(c,-15,head+6,8,22,'#573f35');vanOval(c,15,head+6,8,22,'#573f35');}
    vanRound(c,-17,head+15,34,small?28:43,9,['#9866a9','#4b9d99','#4b9d99'][index]);
    vanOval(c,0,head,16,19,'#efbc91');
    vanOval(c,0,head-13,17,9,index===0?'#d5d7d8':'#573f35');
    if(index===0){vanOval(c,12,head-21,9,9,'#e4e4e0');c.strokeStyle='#584e62';c.lineWidth=2;c.strokeRect(-12,head-3,10,7);c.strokeRect(2,head-3,10,7);}
    else{vanRound(c,10,head-17,10,5,2,'#edb771');vanOval(c,-5,head,1.5,2,'#26313a');vanOval(c,5,head,1.5,2,'#26313a');}
    c.strokeStyle='#a36e59';c.lineWidth=2;c.beginPath();c.arc(0,head+6,5,0,Math.PI);c.stroke();
    c.strokeStyle='#efbc91';c.lineWidth=6;c.beginPath();c.moveTo(-16,head+24);c.lineTo(-23,head+42);c.moveTo(16,head+24);c.lineTo(23,head+42);c.stroke();
  }
  c.restore();
}
function drawSnack(c,x,y,kind,turn){
  c.save();c.translate(x,y);c.rotate(turn);
  if(kind==='popcorn'){
    for(const [xx,yy] of [[0,0],[-5,-4],[5,-4],[-4,4],[4,4]])vanOval(c,xx,yy,5,5,'#fff2b9');vanOval(c,0,1,2,2,'#d8a64e');
  }else if(kind==='sandwich'){
    c.lineJoin='round';c.strokeStyle='#b77c42';c.lineWidth=3;
    c.fillStyle='#fff0bd';c.beginPath();c.moveTo(-15,12);c.lineTo(-15,-14);c.lineTo(17,12);c.closePath();c.fill();c.stroke();
    c.strokeStyle='#71a64f';c.lineWidth=4;c.beginPath();c.moveTo(-12,5);c.lineTo(7,5);c.stroke();
    c.strokeStyle='#df8772';c.lineWidth=3;c.beginPath();c.moveTo(-12,9);c.lineTo(12,9);c.stroke();
  }else{
    c.fillStyle='#f4aa69';c.beginPath();c.moveTo(-8,0);c.lineTo(-19,-9);c.lineTo(-19,9);c.closePath();c.fill();c.beginPath();c.moveTo(8,0);c.lineTo(19,-9);c.lineTo(19,9);c.closePath();c.fill();
    vanRound(c,-10,-8,20,16,6,'#e8659b');c.strokeStyle='#fff4d4';c.lineWidth=3;c.beginPath();c.moveTo(-4,-6);c.lineTo(3,6);c.stroke();
  }
  c.restore();
}
function drawSnackAttack(c,s,heightUp){
  if(s.snack<=0)return;
  // The daughter leans out of the right-hand passenger window, with the same
  // brown hair, gold clip, and teal outfit as her boarding-scene character.
  c.save();c.translate(s.x,500-heightUp);
  vanRound(c,20,-24,15,33,4,'#0b1720');vanRound(c,28,-9,24,24,7,'#4b9d99');
  const wave=Math.sin((SNACK_ATTACK_SECONDS-s.snack)*Math.PI/.19);
  c.strokeStyle='#efbc91';c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(40,4);c.lineTo(56,-6-wave*12);c.stroke();
  vanOval(c,43,-23,18,23,'#573f35');vanOval(c,46,-20,13,16,'#efbc91');vanOval(c,42,-34,15,8,'#573f35');
  vanRound(c,52,-35,10,5,2,'#edb771');vanOval(c,43,-22,2,2,'#26313a');vanOval(c,52,-22,2,2,'#26313a');
  c.strokeStyle='#a36e59';c.lineWidth=2;c.beginPath();c.arc(48,-16,5,0,Math.PI);c.stroke();
  c.restore();
  for(const shot of s.snackShots||[]){
    const progress=Math.min(1,shot.age/.55),x=shot.fromX+(shot.x-shot.fromX)*progress;
    const startY=500-(shot.fromZ-s.z)-heightUp,endY=500-(shot.z-s.z);
    if(progress<1){
      const y=startY+(endY-startY)*progress-Math.sin(progress*Math.PI)*65;
      drawSnack(c,x,y,shot.kind,progress*Math.PI*2);
    }else if(shot.target!==null){
      const fade=1-(shot.age-.55)/.35;c.save();c.globalAlpha=Math.max(0,fade);
      for(let i=0;i<8;i++){const a=i*Math.PI/4,r=18+(1-fade)*40;vanOval(c,shot.x+Math.cos(a)*r,endY+Math.sin(a)*r,4,4,['#f6d377','#e8659b','#90c56a'][i%3]);}
      c.textAlign='center';c.fillStyle='#fff4c7';c.font='bold 18px sans-serif';c.fillText('SNACK!',shot.x,endY-30);c.restore();
    }
  }
}
export function drawVanScene(c,s,width,height){
  c.save();c.scale(width/900,height/650);
  if(s.status==='intro'||s.status==='ready'){
    c.fillStyle='#d9edf3';c.fillRect(0,0,900,650);vanOval(c,760,90,46,46,'#ffe3a1');
    c.fillStyle='#93b694';c.fillRect(0,300,900,350);vanRound(c,70,125,230,220,8,'#edddbc');
    c.fillStyle='#9d7061';c.beginPath();c.moveTo(45,130);c.lineTo(185,45);c.lineTo(325,130);c.fill();
    vanRound(c,148,225,65,120,5,'#6d8791');vanRound(c,92,160,52,48,5,'#b2d4df');vanRound(c,227,160,52,48,5,'#b2d4df');
    c.fillStyle='#a5aaa4';c.fillRect(0,385,900,265);c.fillStyle='#d8d7c5';c.fillRect(0,381,900,12);
    drawFamilyVan(c,600,376,1.25,true,s.intro<6.3);
    const names=['Grandma','Mom','Girl','Molly'];
    for(let i=0;i<4;i++){
      const p=clampVan((s.intro-i*1.35)/1.2,0,1);if(p>=1)continue;
      const startX=430-i*95,x=startX+(570-startX)*p,y=470-55*p;
      drawVanPassenger(c,x,y,i,s.intro*10);c.fillStyle='#263d4a';c.textAlign='center';c.font='16px sans-serif';c.fillText(names[i],x,y+25);
    }
    c.textAlign='center';c.fillStyle='#263d4a';c.font='bold 32px sans-serif';c.fillText('THE RAVEN',450,555);c.font='19px sans-serif';c.fillText('Grandma, Mom, her girl, and Molly — all aboard The Raven!',450,590);
    c.restore();return;
  }
  c.fillStyle=s.config.ice?'#d7e9ed':s.config.lava?'#543b48':'#8cae83';c.fillRect(0,0,900,650);
  const screenY=z=>500-(z-s.z);
  // A winding road with scenery anchored in world space.
  for(let z=Math.floor((s.z-180)/40)*40;z<s.z+560;z+=40){
    const y=screenY(z),cx=vanRoadCenter(z),next=vanRoadCenter(z+42);
    c.fillStyle=s.config.ice?'#f4fbff':s.config.lava?'#a65a42':'#dacdb0';c.beginPath();c.moveTo(cx-162,y);c.lineTo(cx+162,y);c.lineTo(next+162,y-42);c.lineTo(next-162,y-42);c.fill();
    c.fillStyle=s.config.ice?'#8eb8cb':s.config.lava?'#3d3442':'#4c6267';c.beginPath();c.moveTo(cx-145,y);c.lineTo(cx+145,y);c.lineTo(next+145,y-42);c.lineTo(next-145,y-42);c.fill();
    if(s.config.ice&&Math.floor(z/40)%4===0){c.strokeStyle='#e6faff77';c.lineWidth=3;c.beginPath();c.moveTo(cx-125,y-30);c.lineTo(cx-65,y-45);c.moveTo(cx+45,y-4);c.lineTo(cx+115,y-20);c.stroke();}
    if(Math.floor(z/40)%2===0){c.fillStyle='#d6d6b5';c.fillRect(cx-3,y-30,6,24);}
    if(Math.floor(z/40)%3===0)for(const side of [-1,1]){const tx=cx+side*210;vanOval(c,tx+5,y+7,25,12,'#34594933');vanOval(c,tx,y,23,26,s.config.ice?'#77999f':s.config.lava?'#382d3d':'#477c5d');vanOval(c,tx-6,y-8,14,17,s.config.ice?'#f5fcff':s.config.lava?'#ed8654':'#63966a');}
  }
  for(const o of s.obstacles.filter(o=>s.snack<=0||!s.snackCleared?.includes(o.z))){
    const y=screenY(o.z),x=vanRoadCenter(o.z)+o.x;if(y< -250||y>740)continue;
    if(o.type==='lava'){
      if(o.age===undefined||o.age<1.2){
        c.save();c.strokeStyle='#ffda7b';c.lineWidth=4;c.setLineDash([5,8]);c.beginPath();c.ellipse(x,y,62,36,0,0,Math.PI*2);c.stroke();c.restore();
        c.fillStyle='#fff3c4';c.font='bold 15px sans-serif';c.textAlign='center';c.fillText('DODGE IMPACT',x,y+54);
        if(o.age!==undefined){const fall=1-o.age/1.2;vanOval(c,x+fall*50,y-fall*280,13,24,'#ffb24e');vanOval(c,x+fall*50,y-fall*280,7,14,'#fff1a2');}
      }else if(o.age<4){
        vanOval(c,x,y,62,36,'#d54830');vanOval(c,x,y,44,25,'#ff9a42');vanOval(c,x,y,23,13,'#ffdd75');
        for(let n=0;n<7;n++){const a=n*6.28/7;vanOval(c,x+Math.cos(a)*55,y+Math.sin(a)*29,5,7,'#ffc55a');}
      }
    }else if(o.type==='gap'){
      c.fillStyle='#234b61';c.fillRect(vanRoadCenter(o.z)-162,y-o.length,324,o.length);c.strokeStyle='#88ced1';c.lineWidth=3;
      for(let n=0;n<5;n++){c.beginPath();c.moveTo(x-130,y-25-n*36);c.quadraticCurveTo(x,y-45-n*36,x+130,y-25-n*36);c.stroke();}
    }else if(o.type==='jump'){
      vanRound(c,x-145,y-18,290,32,4,'#e8b654');c.fillStyle='#9d6840';for(let n=0;n<12;n++)c.fillRect(x-140+n*24,y-14,10,24);
    }else if(o.type==='crate'){
      vanRound(c,x-29,y-27,58,54,5,'#ad7447');c.strokeStyle='#e4b874';c.lineWidth=5;c.strokeRect(x-23,y-21,46,42);c.beginPath();c.moveTo(x-22,y-20);c.lineTo(x+22,y+20);c.stroke();
    }else for(const dx of [-19,19]){c.fillStyle='#e98649';c.beginPath();c.moveTo(x+dx,y-24);c.lineTo(x+dx+16,y+17);c.lineTo(x+dx-16,y+17);c.fill();c.fillStyle='#fff1cb';c.fillRect(x+dx-8,y-2,16,6);}
    if(o.type==='gap'||o.type==='jump'){vanRound(c,x-85,y+65,170,33,8,'#fff3ce');c.fillStyle='#304956';c.textAlign='center';c.font='bold 17px sans-serif';c.fillText(o.type==='gap'?'HOLD SPACE · FLY':'JUMP · ↑',x,y+87);}
  }
  const finishY=screenY(s.config.finish);if(finishY> -30&&finishY<650){for(let i=0;i<12;i++){c.fillStyle=i%2?'#fff4d5':'#1e3545';c.fillRect(vanRoadCenter(s.config.finish)-144+i*24,finishY,24,28);}c.fillStyle='#fff';c.font='bold 25px sans-serif';c.textAlign='center';c.fillText('FINISH',vanRoadCenter(s.config.finish),finishY-12);}
  const heightUp=s.fly>0?45:s.jump>0?Math.sin((1-s.jump/.95)*Math.PI)*36:0;
  vanOval(c,s.x,511,34,14,'#18334355');
  if(s.fly>0){c.fillStyle='#dce9ed';c.beginPath();c.moveTo(s.x-20,495-heightUp);c.lineTo(s.x-85,520-heightUp);c.lineTo(s.x+85,520-heightUp);c.lineTo(s.x+20,495-heightUp);c.fill();}
  if(s.invincible<=0||Math.floor(s.invincible*8)%2)drawFamilyVan(c,s.x,500-heightUp,1+heightUp/200);
  drawSnackAttack(c,s,heightUp);
  // Side minimap, visible throughout the course.
  vanRound(c,710,16,174,618,18,'#203e4c');c.fillStyle='#f5ecd4';c.textAlign='center';c.font='bold 18px sans-serif';c.fillText('COURSE MAP',797,47);
  const mapY=z=>570-z/s.config.finish*470,mapX=z=>797+(vanRoadCenter(z)-340)*.35;
  c.strokeStyle='#738d8d';c.lineWidth=26;c.lineCap='round';c.beginPath();for(let z=0;z<=s.config.finish;z+=80){if(z===0)c.moveTo(mapX(z),mapY(z));else c.lineTo(mapX(z),mapY(z));}c.stroke();
  for(const o of s.obstacles.filter(o=>s.snack<=0||!s.snackCleared?.includes(o.z))){c.fillStyle=o.type==='gap'?'#79c9e5':o.type==='jump'?'#f4c565':'#ed906a';c.fillRect(mapX(o.z)-9,mapY(o.z)-3,18,6);}
  vanOval(c,mapX(s.z)+(s.x-vanRoadCenter(s.z))*.12,mapY(s.z),7,7,'#fff3b7');c.fillStyle='#fff3b7';c.font='13px sans-serif';c.fillText('FINISH',797,81);c.fillText(Math.floor(s.z/s.config.finish*100)+'% complete',797,605);
  vanRound(c,15,12,675,68,12,'#203e4cee');c.textAlign='left';c.fillStyle='#fff0cc';c.font='bold 20px sans-serif';c.fillText('THE RAVEN · '+s.config.name+' · '+s.config.scene,30,40);c.font='16px sans-serif';c.fillText('♥'.repeat(s.lives)+'   '+s.time.toFixed(1)+'s   ·   '+s.earned+' coins   ·   '+Math.round(s.speed/3)+' km/h',30,65);
  const upcoming=s.snack>0?null:s.obstacles.find(o=>o.z>s.z-20&&o.z-s.z<450);
  c.fillStyle='#203e4c';c.fillRect(0,610,700,40);c.fillStyle='#fff3d7';c.textAlign='center';c.font='16px sans-serif';c.fillText(upcoming?.type==='gap'?'Broken road ahead! Press Fly before the edge.':upcoming?.type==='jump'?'Barrier ahead! Jump close to the striped bar.':s.message,350,635);
  if(s.status==='won'||s.status==='lost'){vanRound(c,90,210,540,170,22,'#fff3d9');c.fillStyle='#284653';c.font='bold 30px sans-serif';c.fillText(s.status==='won'?'Everyone made it!':'Time for another road trip!',360,265);c.font='20px sans-serif';c.fillText(s.status==='won'?'A family adventure to remember.':'Use the minimap and try again.',360,305);c.fillText(s.earned+' coins earned',360,345);}
  c.restore();
}
export function createVanEnding(won,audio){
  let time=0,spoken=false,boom=false;
  return {get time(){return time;},get complete(){return time>=(won?7:6);},advance(dt){
    time=Math.min(won?7:6,time+Math.max(0,dt));
    if(!won&&time>=.8&&!boom){boom=true;audio.play('thunder');}
    if(time>=(won?3.2:3.8)&&!spoken){spoken=true;audio.say(won?'Hooray! You win!':'You Lose.',won?1.2:.8);if(won)audio.play('win');}
  }};
}
export function drawVanEnding(c,won,time,width,height,reduced=false){
  c.save();c.scale(width/900,height/650);
  c.fillStyle=won?'#d7eef1':'#c7d5dc';c.fillRect(0,0,900,650);
  vanOval(c,760,90,42,42,'#ffe5ad');
  c.fillStyle='#90ad83';c.fillRect(0,320,900,330);c.fillStyle='#87918d';c.fillRect(0,400,900,250);
  if(won){
    c.fillStyle='#496f67';c.fillRect(85,130,15,275);c.fillRect(800,130,15,275);
    vanRound(c,85,112,730,65,8,'#fff0c8');c.fillStyle='#294852';c.font='bold 29px sans-serif';c.textAlign='center';c.fillText('FINISH · THE RAVEN',450,154);
    const vanX=500+(reduced?0:(1-clampVan(time/.8,0,1))*520);
    drawFamilyVan(c,vanX,355,1.15,true,time>.8);
    for(let i=0;i<4;i++){
      const progress=clampVan((time-.9-i*.4)/.85,0,1);if(time<.9+i*.4)continue;
      const x=vanX-10+(210+i*150-(vanX-10))*progress,y=405+100*progress;
      drawVanPassenger(c,x,y,i,reduced?0:time*10);
      if(progress===1&&time>=3.2){
        const wave=reduced?0:Math.sin(time*9+i)*9;
        c.strokeStyle=i===3?'#252b31':'#efbc91';c.lineWidth=6;c.lineCap='round';c.beginPath();c.moveTo(x-15,y-(i===3?15:40));c.lineTo(x-28,y-(i===3?35:65)-wave);c.stroke();
      }
    }
    if(time>=3.2){
      for(let i=0;i<24;i++){
        const age=(time-3.2+i*.073)%1.7,origin=210+(i%4)*150;
        const x=origin+Math.sin(i*7)*age*55,y=440-age*260+age*age*145;
        if(reduced){if(i<12)drawSnack(c,150+i*52,240+(i%3)*28,['popcorn','candy','sandwich'][i%3],i);}
        else drawSnack(c,x,y,['popcorn','candy','sandwich'][i%3],age*(i%2?4:-4));
      }
      vanRound(c,190,185,520,74,20,'#fff5dcee');c.fillStyle='#284c55';c.textAlign='center';c.font='bold 36px sans-serif';c.fillText('Hooray! You win!',450,234);
    }
  }else{
    if(time<.8)drawFamilyVan(c,450,365,1.15,true,false);
    if(time>=.8){
      const blast=time-.8;
      // A cartoon puff, loose van parts, and whole characters tumbling onto grass.
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6,spread=reduced?45:Math.min(115,blast*140);
        vanOval(c,450+Math.cos(a)*spread,355+Math.sin(a)*spread*.6,Math.max(18,65-blast*9),Math.max(16,55-blast*7),blast<.8?(i%2?'#ffd17a':'#e98a54'):(i%2?'#809095':'#aab6b6'));
      }
      if(blast<1.2){c.fillStyle='#fff2c9';c.textAlign='center';c.font='bold 42px sans-serif';c.fillText('POOF!',450,365);}
      for(let i=0;i<3;i++){
        const p=clampVan(blast/1.5,0,1),x=450+(i-1)*160*p,y=410-Math.sin(p*Math.PI)*100;
        c.save();c.translate(x,y);c.rotate(reduced?0:blast*(i-1)*3);vanRound(c,-35,-13,70,26,8,'#29333a');c.restore();
      }
      for(let i=0;i<4;i++){
        const p=reduced?1:clampVan(blast/1.8,0,1),x=450+(160+i*190-450)*p,y=390+135*p-Math.sin(p*Math.PI)*(190+(i%2)*35);
        c.save();c.translate(x,y);c.rotate(reduced?0:Math.sin(p*Math.PI)*(i%2?1:-1)*1.5);drawVanPassenger(c,0,0,i,0);c.restore();
      }
    }
    if(time>=3.8){vanRound(c,240,110,420,105,22,'#fff1dce8');c.fillStyle='#644857';c.textAlign='center';c.font='bold 42px sans-serif';c.fillText('You Lose',450,177);}
  }
  c.textAlign='center';c.fillStyle='#253f49';c.font='20px sans-serif';c.fillText(won?'A snack party for the whole family!':'The Raven needs repairs. Try another run!',450,594);
  c.restore();
}
export function drawVanPreview(canvas){const c=canvas.getContext('2d');if(c)drawVanScene(c,createVanState(),canvas.width,canvas.height);}
export function createVanAdventure({canvas,onHud,onFinish,consumeBoost=()=>false,bestTimeMs=null,getBestTime=()=>null,initialLevel="easy",onLevelChangeRaven=()=>{},controls=document.querySelector('#van-controls')}){
  const c=canvas.getContext('2d');if(!c)throw Error('Canvas is unavailable.');
  const audio=createMazeAudio(),controller=new AbortController(),options={signal:controller.signal};
  let selectedLevel=Object.hasOwn(VAN_LEVELS,initialLevel)?initialLevel:"easy";
  let s=createVanState(selectedLevel),active=false,paused=false,destroyed=false,last=0,frame,ending=null;const keys={};
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  const clear=()=>{for(const k of Object.keys(keys))delete keys[k];};
  function action(name){if(!active||paused||document.hidden)return;if(vanAction(s,name))audio.play(name==='jump'?'bounce':'whoosh');}
  function hold(name,value){if(!value){delete keys[name];return;}if(active&&!paused&&!document.hidden&&s.status==='playing'){keys[name]=true;}}
  canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))return;e.preventDefault();
    if(e.key===' '){if(!e.repeat)hold('fly',true);}else if(e.key==='ArrowDown')hold('down',true);
    else if(!e.repeat)action({ArrowLeft:'left',ArrowRight:'right',ArrowUp:'jump'}[e.key]);
  },options);
  globalThis.window?.addEventListener('keyup',e=>{if(e.key===' ')hold('fly',false);if(e.key==='ArrowDown')hold('down',false);},options);
  canvas.addEventListener('blur',clear,options);
  document.addEventListener?.('visibilitychange',()=>{last=0;clear();if(document.hidden)audio.stop();},options);
  const buttons={};controls.replaceChildren();
  const tip=document.createElement('p');tip.textContent='Automatic driving · ← → Dodge · ↑ Jump · Hold Space near water gaps to fly; auto-land after crossing · ↓ Brake. Beat your best time!';controls.append(tip);
  const row=document.createElement('div');row.className='van-buttons';controls.append(row);
  for(const [name,label] of [['left','← Dodge'],['right','Dodge →'],['jump','↑ Jump'],['fly','Hold to fly · Space'],['down','↓ Brake'],['skip','Skip intro']]){
    const b=document.createElement('button');b.type='button';b.className='button outline';b.textContent=label;buttons[name]=b;row.append(b);
    if(['fly','down'].includes(name)){
      b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);hold(name,true);},options);
      for(const event of ['pointerup','pointercancel','lostpointercapture','blur'])b.addEventListener(event,()=>hold(name,false),options);
      b.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!e.repeat)hold(name,true);}},options);
      b.addEventListener('keyup',()=>hold(name,false),options);
    }else b.onclick=()=>{if(name==='skip'){if(active&&!paused&&ending){audio.stop();finish();}else if(active&&!paused&&s.status==='intro'){s.intro=7;s.status='playing';canvas.focus();}}else{action(name);canvas.focus({preventScroll:true});}};
  }
  const levelRow=document.createElement('div');levelRow.className='van-levels';levelRow.setAttribute('role','group');levelRow.setAttribute('aria-label','Choose The Raven difficulty');controls.append(levelRow);
  const levelButtons={};
  for(const [id,config] of Object.entries(VAN_LEVELS)){
    const button=document.createElement('button');button.type='button';button.className='button outline';
    button.textContent=config.name+' · '+config.coins+' '+(config.coins===1?'coin':'coins')+'/lap';
    button.onclick=()=>{if(active)return;selectedLevel=id;s=createVanState(id);ending=null;bestTimeMs=getBestTime(id);onLevelChangeRaven(id);hud();};
    levelButtons[id]=button;levelRow.append(button);
  }
  const levelInfo=document.createElement('p');controls.append(levelInfo);
  bestTimeMs=getBestTime(selectedLevel);
  function hud(){
    for(const [id,button] of Object.entries(levelButtons)){button.disabled=active;button.setAttribute('aria-pressed',String(selectedLevel===id));}
    levelInfo.textContent=s.config.scene+' · '+s.config.finish+' m · '+Math.round(s.config.speed/3)+' km/h · '+s.config.coins+(s.config.coins===1?' coin':' coins')+' per completed lap. '+(s.config.ice?'Icy road: steer early and allow for sliding. ':'')+(s.config.lava?'Dodge the dotted circles before lava lands! ':'')+'One course finish is one lap. Choose before starting.';
    for(const [name,b] of Object.entries(buttons)){
      b.hidden=name==='skip'&&s.status!=='intro'&&!ending;b.disabled=!active||paused||(name==='skip'?s.status!=='intro'&&!ending:s.status!=='playing');if(name==='skip')b.textContent=ending?'Skip ending':'Skip intro';
      if(['jump','left','right'].includes(name)){const timer=s[name==='jump'?'jumpCooldown':'dodgeCooldown'];b.disabled=b.disabled||timer>0||(name==='jump'&&s.fly>0);}
      if(name==='fly')b.setAttribute('aria-pressed',String(s.fly>0));

    }
    onHud({ravenSnack:{seconds:s.snack,canUse:active&&!paused&&!document.hidden&&s.status==='playing'},text:ending?(s.status==='won'?'The family is celebrating!':'Watch The Raven’s cartoon crash…'):s.status==='intro'?'All aboard! Watch the family get into The Raven.':s.message+' · '+s.earned+' coins · Best: '+(bestTimeMs?(bestTimeMs/1000).toFixed(2)+'s':'—')});
  }
  function finish(){if(!active)return;active=false;clear();if(s.status==='won')bestTimeMs=Math.min(bestTimeMs||Infinity,Math.round(s.time*1000));onFinish(s.earned,{title:s.status==='won'?'The Raven finished!':s.status==='lost'?'The van needs a rest.':'Road trip saved.',detail:s.config.name+' · '+s.time.toFixed(1)+' seconds · '+Math.floor(s.z/s.config.finish*100)+'% of the course',...(s.status==='won'?{timeMs:Math.round(s.time*1000)}:{})});}
  function tick(now){if(destroyed)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(active&&!paused&&!document.hidden){if(ending){ending.advance(dt);if(ending.complete)finish();}else{tickVan(s,dt,keys,cue=>audio.play(cue));if(s.status==='won'||s.status==='lost'){clear();ending=createVanEnding(s.status==='won',audio);}}}hud();if(ending)drawVanEnding(c,s.status==='won',ending.time,canvas.width,canvas.height,reduced);else drawVanScene(c,s,canvas.width,canvas.height);frame=requestAnimationFrame(tick);}
  hud();frame=requestAnimationFrame(tick);
  return {getRecordId:()=>vanRecordId(selectedLevel),activateSnack(){if(!active||paused||document.hidden||s.status!=='playing'||s.snack>0||!consumeBoost('snack'))return false;s.snack=SNACK_ATTACK_SECONDS;s.snackShots=[];s.snackCleared=[];s.snackThrow=0;s.snackCount=0;s.message='Snack Attack! Sandwiches and candy clear the road!';audio.play('sword');hud();canvas.focus({preventScroll:true});return true;},start(){clear();audio.stop();audio.unlock();ending=null;s=createVanState(selectedLevel);s.status='intro';active=true;paused=false;last=0;canvas.focus();hud();},pause(value){paused=value;last=0;clear();if(value)audio.stop();else audio.unlock();hud();},setMuted:value=>audio.setMuted(value),destroy(){if(destroyed)return;destroyed=true;clear();finish();controller.abort();cancelAnimationFrame(frame);audio.destroy();controls.replaceChildren();}};
}
