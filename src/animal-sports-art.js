import {drawEquipmentSprite} from './sports-equipment-art.js';
import {sportsShotPoint,sportsShotAligned} from './animal-sports-rules.js';
import {drawSportsHub} from './sports-hub.js';
import {SPORTS_EQUIPMENT,SPORTS_DEFAULTS} from './animal-sports-settings.js';
const ellipse=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
const line=(c,points,color='#ffffffbb',width=3)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
function panel(c,x,y,w,h,color,r=10){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function text(c,value,x,y,size=22,color='#fff'){c.fillStyle=color;c.font=`700 ${size}px system-ui`;c.textAlign='center';c.fillText(value,x,y);}
export function drawSportsAnimal(c,x,y,size,settings=SPORTS_DEFAULTS,time=0,moving=false){
 c.save();c.translate(x,y);c.scale(size/60,size/60);const coat=settings.color,jersey=settings.jersey,animal=settings.animal,bob=moving?Math.sin(time*11)*2:0;
 ellipse(c,0,6,27,8,'#101c3435');c.translate(0,bob);
 if(animal==='dragon'){for(const side of [-1,1]){c.fillStyle=coat;c.beginPath();c.moveTo(side*15,-25);c.lineTo(side*48,-50);c.quadraticCurveTo(side*42,-20,side*22,-7);c.fill();line(c,[[side*18,-25],[side*40,-41],[side*25,-15]],'#eee2cc77',2);}}
 for(const side of [-1,1]){ellipse(c,side*13,0+(moving?Math.sin(time*11+side)*3:0),10,6,'#fff1d9');ellipse(c,side*27,-22,7,14,coat);}
 panel(c,-23,-42,46,40,jersey,15);text(c,'7',0,-13,22,'#ffffff');
 if(animal==='cat'||animal==='dragon'){for(const side of [-1,1]){c.fillStyle=animal==='dragon'?'#f9dd9e':coat;c.beginPath();c.moveTo(side*9,-62);c.lineTo(side*26,-85);c.lineTo(side*29,-54);c.fill();}}
 if(animal==='dog'){ellipse(c,-25,-57,12,23,'#554237');ellipse(c,25,-57,12,23,'#554237');}
 if(animal==='capybara'){ellipse(c,-20,-70,8,9,coat);ellipse(c,20,-70,8,9,coat);}
 ellipse(c,0,-54,29,26,coat);ellipse(c,0,-42,animal==='capybara'?25:18,animal==='capybara'?16:12,'#e8c99d');
 if(animal==='bird'){c.fillStyle='#ffc34f';c.beginPath();c.moveTo(-11,-48);c.lineTo(0,-28);c.lineTo(13,-48);c.fill();for(let i=0;i<3;i++)ellipse(c,i*7-7,-80-i*2,4,10,coat);}else ellipse(c,0,-45,animal==='capybara'?10:6,5,'#3b3033');
 for(const side of [-1,1]){ellipse(c,side*12,-57,4,5,'#17283a');ellipse(c,side*12-1,-59,1.3,1.7,'#fff');}
 if(animal==='cat'){for(const side of [-1,1])for(let k=0;k<2;k++)line(c,[[side*14,-43+k*5],[side*36,-46+k*10]],'#68534d',1);}
 if(settings.accessory==='headband')panel(c,-28,-70,56,7,jersey,3);
 if(settings.accessory==='cap'){panel(c,-27,-82,54,18,jersey,12);panel(c,-32,-69,71,7,jersey,4);}
 if(settings.accessory==='glasses'){for(const side of [-1,1]){panel(c,side*12-10,-64,20,15,'#1c3047',5);line(c,[[side*12-5,-61],[side*12+2,-61]],'#9cdef5',2);}line(c,[[-3,-57],[3,-57]],'#17283a',3);}
 c.restore();
}
function ball(c,x,y,r,color,type,shine=false,finish='classic',time=0){
 if((type==='basketball'||type==='tennis')&&drawEquipmentSprite(c,type,finish,x,y,r*2,r*2,Math.sin(time*.5)*.12))return;
 const g=c.createRadialGradient(x-r*.35,y-r*.4,r*.05,x,y,r);g.addColorStop(0,'#fff1cd');g.addColorStop(.3,color);g.addColorStop(1,'#26364c');ellipse(c,x,y,r,r,g);
 if(type==='basketball'){c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.clip();line(c,[[x-r,y],[x+r,y]],'#472f25',1.6);line(c,[[x,y-r],[x,y+r]],'#472f25',1.6);c.strokeStyle='#472f25';c.lineWidth=1.6;c.beginPath();c.ellipse(x-r*.7,y,r*.55,r,0,0,Math.PI*2);c.stroke();c.beginPath();c.ellipse(x+r*.7,y,r*.55,r,0,0,Math.PI*2);c.stroke();c.restore();}
 if(type==='bowling'){for(const [a,b]of [[-.2,-.2],[.15,-.3],[0,.1]])ellipse(c,x+a*r,y+b*r,r*.12,r*.12,'#14304c');}
 if(shine){for(let i=1;i<5;i++)ellipse(c,x-i*9,y+i*4,Math.max(1,r*.35-i),Math.max(1,r*.35-i),'#eedaff80');}
}
export function drawBowlingBall(c,x,y,r,finish='classic',time=0){
 if(drawEquipmentSprite(c,'bowling',finish,x,y,r*2,r*2,Math.sin(time*.6)*.18))return;
 const item=SPORTS_EQUIPMENT.bowling[finish]||SPORTS_EQUIPMENT.bowling.classic;
 ball(c,x,y,r,item.color,'sphere');c.save();c.translate(x,y);c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.clip();c.rotate(time*.55);
 const accent={classic:'#b0fbff',sunset:'#ffdb84',galaxy:'#e5baff',emerald:'#b9ffe0',pearl:'#ffffff'}[finish]||'#fff';
 c.strokeStyle=accent;c.globalAlpha=.5;c.lineWidth=r*.14;
 for(let i=-1;i<=1;i++){c.beginPath();c.ellipse(i*r*.46,0,r*.3,r*1.3,.55,0,Math.PI*2);c.stroke();}
 c.globalAlpha=1;
 if(finish==='galaxy'||finish==='pearl')for(let i=0;i<16;i++){const a=i*2.4,d=r*Math.sqrt((i+.5)/17);ellipse(c,Math.cos(a)*d,Math.sin(a)*d,r*.025,r*.025,'#fff4cf');}
 for(const [a,b]of [[-.2,-.2],[.15,-.3],[0,.1]]){ellipse(c,a*r,b*r,r*.105,r*.13,'#102038');ellipse(c,a*r,b*r+r*.06,r*.07,r*.025,'#6d8199');}
 c.restore();ellipse(c,x-r*.35,y-r*.5,r*.22,r*.08,'#ffffff9c');
}
export function drawBowlingPreview(canvas,finish,time=0){drawEquipmentPreview(canvas,'bowling',finish,time);}
export function drawEquipmentPreview(canvas,sport,finish,time=0){
 const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);const g=c.createLinearGradient(0,0,0,180);g.addColorStop(0,'#13253e');g.addColorStop(1,'#364568');c.fillStyle=g;c.fillRect(0,0,320,180);
 const bob=Math.sin(time*1.7)*5;ellipse(c,160,151,57,9,'#09132688');if(sport==='bowling')drawBowlingBall(c,160,86+bob,61,finish,time);
 else if(sport==='basketball')ball(c,160,86+bob,61,SPORTS_EQUIPMENT.basketball[finish].color,'basketball',false,finish,time);
 else{c.save();c.translate(125,145+bob);c.scale(2.05,2.05);racket(c,0,0,SPORTS_EQUIPMENT.tennis[finish].color,0,false,finish,Math.sin(time*.7)*.12);c.restore();ball(c,235,116-bob,33,'#d5e64d','tennis',false,finish,time);}
 for(let i=0;i<6;i++){const a=time*.5+i*Math.PI/3;const x=160+Math.cos(a)*100,y=85+Math.sin(a)*55;line(c,[[x-3,y],[x+3,y]],'#d8ecff99',1);line(c,[[x,y-3],[x,y+3]],'#d8ecff99',1);}
}
function stands(c,sport){
 const bg=c.createLinearGradient(0,0,0,600);bg.addColorStop(0,sport==='tennis'?'#7dc8ed':'#0c1932');bg.addColorStop(1,'#294466');c.fillStyle=bg;c.fillRect(0,0,960,600);
 if(sport==='tennis'){ellipse(c,805,45,28,28,'#fff0b5');for(let i=0;i<6;i++){c.fillStyle=i%2?'#769c9f':'#a3bec0';c.beginPath();c.moveTo(i*200-80,130);c.lineTo(i*200+50,35+i%3*15);c.lineTo(i*200+180,130);c.fill();}}
 for(let row=0;row<5;row++){panel(c,40,58+row*17,880,13,sport==='basketball'?'#ae3c47':sport==='tennis'?'#c3a16c':'#293c69',2);for(let i=0;i<43;i++){ellipse(c,52+i*20,61+row*17,3,3,['#a9dfe3','#eac79c','#f18880','#9098d5'][i%4]);}}
 if(sport!=='tennis'){for(let i=0;i<7;i++){const x=70+i*135;const light=c.createRadialGradient(x,15,0,x,15,85);light.addColorStop(0,'#fffbdc80');light.addColorStop(1,'#fffbdc00');c.fillStyle=light;c.fillRect(x-85,0,170,100);panel(c,x-25,8,50,8,'#effbff',3);}}
}
function court(c,sport){
 stands(c,sport);const wood=c.createLinearGradient(0,140,0,600);wood.addColorStop(0,'#ce934e');wood.addColorStop(.6,'#ecc17d');wood.addColorStop(1,'#a95e30');c.fillStyle=sport==='tennis'?'#468a63':wood;c.fillRect(0,145,960,455);
 if(sport!=='tennis'){for(let i=0;i<40;i++)line(c,[[i*28,145],[i*28,600]],i%3?'#9b622c20':'#fff6ce50',1);for(let y=160;y<600;y+=28)line(c,[[0,y],[960,y]],'#a36b352e',1);}
 if(sport==='tennis'){panel(c,200,155,560,380,'#487dd1',0);c.strokeStyle='#fff';c.lineWidth=3;c.strokeRect(200,155,560,380);c.strokeRect(240,155,480,380);line(c,[[240,245],[720,245]]);line(c,[[240,445],[720,445]]);line(c,[[480,245],[480,445]]);}
 if(sport==='basketball'){c.strokeStyle='#fff4d2';c.lineWidth=4;c.strokeRect(150,155,660,390);panel(c,380,155,200,145,'#bb4d49',0);c.strokeRect(380,155,200,145);c.beginPath();c.arc(480,300,100,0,Math.PI);c.stroke();c.beginPath();c.ellipse(480,175,260,270,0,0,Math.PI);c.stroke();line(c,[[150,535],[810,535]],'#fff4d2',4);}
}
function racket(c,x,y,color,swing,reverse=false,finish='classic',tilt=0){c.save();c.translate(x,y);c.rotate((reverse?Math.PI:0)+(swing>0?-.7:.15)+tilt);if(drawEquipmentSprite(c,'racket',finish,0,-32,82,82)){c.restore();return;}line(c,[[0,0],[0,-20]],color,6);c.strokeStyle=color;c.lineWidth=4;c.beginPath();c.ellipse(0,-38,20,25,0,0,Math.PI*2);c.stroke();for(let v=-12;v<=12;v+=6)line(c,[[v,-56],[v,-20]],'#f5ffffbb',1);for(let v=-54;v<=-22;v+=7)line(c,[[-15,v],[15,v]],'#f5ffffbb',1);c.restore();}
const laneX=(x,y)=>480+(x-480)*(.45+(y-120)/430*.55)*.5;
export function drawSports(c,s,settings,playing=false){
 c.save();c.scale(c.canvas.width/960,c.canvas.height/600);const color=SPORTS_EQUIPMENT[s.sport][settings[s.sport]]?.color||'#31bad2',special=settings[s.sport]!=='classic';
 if(s.sport==='bowling'){
  stands(c,'bowling');panel(c,310,18,340,64,'#152f53');text(c,'NEON BOWL',480,60,32,'#6eebf1');
  for(let lane=-2;lane<=2;lane++){const center=480+lane*195;c.fillStyle=lane===0?'#e5ad65':'#b37b49';c.beginPath();c.moveTo(center-45,130);c.lineTo(center+45,130);c.lineTo(center+89,600);c.lineTo(center-89,600);c.fill();line(c,[[center-48,130],[center-94,600]],'#25354d',16);line(c,[[center+48,130],[center+94,600]],'#25354d',16);for(let i=-3;i<=3;i++)line(c,[[center+i*12,130],[center+i*24,600]],'#714a2928',1);}
  for(let y=270;y<540;y+=85)for(let i=-2;i<=2;i++){const x=laneX(480+i*35,y);c.fillStyle='#895b33';c.beginPath();c.moveTo(x,y);c.lineTo(x-4,y+8);c.lineTo(x+4,y+8);c.fill();}
  // Tight aim and a timed release replace the old automatic full-power strike.
  c.fillStyle=Math.abs(s.player.x-480)<=8?'#79f5b8':'#fff1a0';c.beginPath();c.moveTo(480,342);c.lineTo(467,366);c.lineTo(493,366);c.closePath();c.fill();
  panel(c,24,280,195,105,'#12283ee8');text(c,'SHOT POWER',122,305,16);panel(c,40,320,163,18,'#31465d',6);panel(c,40,320,Math.max(2,163*s.power),18,s.power>=.82&&s.power<=.9?'#7ef2b1':s.power>.94?'#f18b82':'#edc66e',6);text(c,`${Math.round(s.power*100)}% · BEST 82–90%`,122,365,13,'#fff0ba');line(c,[[40+163*.82,317],[40+163*.82,341]],'#7ef2b1',2);line(c,[[40+163*.9,317],[40+163*.9,341]],'#7ef2b1',2);
  panel(c,24,395,195,91,'#12283ee8');text(c,'RELEASE ACCURACY',122,419,14);line(c,[[42,444],[202,444]],'#95b2c4',5);panel(c,112,432,20,24,'#57c796',3);line(c,[[122+s.release*80,428],[122+s.release*80,460]],'#fff5ca',4);text(c,'Release in the green',122,477,12);
  s.rivals.forEach((r,i)=>{const center=[285,675,870][i],phase=(s.time+i*2.1)%7,rolling=phase>=1.5&&phase<3.4,progress=Math.max(0,Math.min(1,(phase-1.5)/1.9)),score=r.frames[Math.min(4,s.round-1)];
   for(let pin=0;pin<10;pin++){let row=0;while((row+1)*(row+2)/2<=pin)row++;const x=center+(pin-row*(row+1)/2-row/2)*12,y=215-row*15;c.save();c.translate(x,y);if(phase>3.3&&pin<score)c.rotate(1.4);ellipse(c,0,-5,4,9,'#eff8ff');ellipse(c,0,-16,3,4,'#fff');line(c,[[-3,-12],[3,-12]],'#ed6576',2);c.restore();}
   drawSportsAnimal(c,center-19,529,40,{...settings,animal:['cat','dog','bird'][i],jersey:['#b883ec','#ec8c55','#75c884'][i],color:['#c6a481','#a07e62','#6eb8c9'][i]},s.time,phase<1.5);
   if(rolling)drawBowlingBall(c,center+Math.sin(i+progress)*8,500-progress*330,12-progress*6,['galaxy','sunset','emerald'][i],s.time*5);else if(phase<1.5)drawBowlingBall(c,center+12,508,12,['galaxy','sunset','emerald'][i],s.time);
   panel(c,center-65,532,130,22,'#12283ede',6);text(c,r.name,center,548,12,'#e9f6ff');
  });
  panel(c,695,110,248,210,'#12283eec');text(c,'CHAMPIONSHIP',819,136,16,'#9fe5f0');text(c,'PLAYER     1   2   3   4   5   TOTAL',819,158,10);
  const rows=[{name:'You',frames:s.frames},...s.rivals];rows.forEach((row,index)=>{const complete=Math.min(5,s.round-1),values=row.frames.map((n,i)=>index===0?n:i<complete?n:0),y=185+index*33;c.textAlign='left';c.font='bold 12px system-ui';c.fillStyle=index===0?'#fff1aa':'#e0eff8';c.fillText(row.name,704,y);for(let i=0;i<5;i++)c.fillText(index===0?(s.frameMarks[i]||values[i]):i<complete?values[i]:'–',790+i*22,y);c.fillText(values.reduce((a,b)=>a+b,0),916,y);});
  for(const pin of s.pins){const x=laneX(pin.x,pin.y),y=pin.y;const fallen=!pin.up;if(fallen&&s.time-pin.fall>1.1)continue;c.save();c.translate(x,y);c.scale(.7,.85);if(fallen)c.rotate(Math.min(1,(s.time-pin.fall)*6)*1.3);ellipse(c,0,3,12,4,'#4e362655');const g=c.createLinearGradient(-10,0,10,0);g.addColorStop(0,'#aab9c7');g.addColorStop(.4,'#fff');g.addColorStop(1,'#dce6f2');ellipse(c,0,-10,10,17,g);ellipse(c,0,-32,6,7,g);panel(c,-4,-29,8,17,g,3);panel(c,-5,-26,10,3,'#e85263',1);panel(c,-5,-21,10,3,'#e85263',1);c.restore();}
  if(!s.ball){line(c,[[laneX(s.player.x,500),500],[laneX(s.player.x,200),200]],'#fffbd488',2);drawSportsAnimal(c,laneX(s.player.x,540)-35,546,50,settings,s.time,false);drawBowlingBall(c,laneX(s.player.x,520),520,18,settings.bowling,s.time);}else drawBowlingBall(c,laneX(s.ball.x,s.ball.y),s.ball.y,10+s.ball.y/70,settings.bowling,s.time*5);
 }else{
  court(c,s.sport);
  if(s.sport==='tennis'){
   drawSportsAnimal(c,s.opponent.x,s.opponent.y+20,38,{...settings,animal:'dog',color:'#ad8b6b',jersey:'#e97892',accessory:'cap'},s.time,!!s.ball);
   racket(c,s.opponent.x+28,s.opponent.y-15,'#f590b4',s.opponentSwing,true,'comet');text(c,s.tennisPlayers===2?'PLAYER 2 · A D W + SHIFT':'OPPONENT',s.opponent.x,s.opponent.y-65,12,'#153047');
   // A transparent mesh net spans the blue court.
   panel(c,190,314,580,4,'#edf6fa',1);for(let x=195;x<770;x+=13)line(c,[[x,318],[x,352]],'#f3f7fa70',1);for(let y=322;y<353;y+=8)line(c,[[190,y],[770,y]],'#f3f7fa60',1);line(c,[[190,307],[190,359]],'#d1e0ed',6);line(c,[[770,307],[770,359]],'#d1e0ed',6);
   drawSportsAnimal(c,s.player.x,s.player.y+18,55,settings,s.time,playing);racket(c,s.player.x+38,s.player.y-23,color,s.swing,false,settings.tennis);if(!s.ball&&!s.done)ball(c,s.player.x-25,s.player.y-2,9,'#dbeb55','tennis',false,settings.tennis,s.time);if(s.ball){ellipse(c,s.ball.x,s.ball.y+8,9,3,'#172c5555');ball(c,s.ball.x,s.ball.y,9,'#dbeb55','tennis',special,settings.tennis,s.time);}
  }else{
   // Backboard and net stay visible above the animals.
   panel(c,430,104,100,62,'#e9f5f9b0',4);c.strokeStyle='#fff';c.lineWidth=3;c.strokeRect(455,128,50,30);for(let i=0;i<6;i++)line(c,[[455+i*10,171],[466+i*6,195]],'#f8f5e7',1);ellipse(c,480,169,28,7,'#e96e3d');ellipse(c,480,167,23,4,'#ae5438');
   s.defenders.forEach(d=>{drawSportsAnimal(c,d.x,d.y,47,{...settings,animal:'dog',color:'#8c786b',jersey:'#c95664',accessory:'none'},s.time,playing);if(d.reach>0&&!s.aim){const target=s.ball||s.team[s.active],angle=Math.atan2(target.y-20-(d.y-20),target.x-d.x),x=d.x+Math.cos(angle)*38,y=d.y-20+Math.sin(angle)*38;line(c,[[d.x,d.y-22],[x,y]],'#8c786b',9);ellipse(c,x,y,6,6,'#ddbd93');text(c,'SWAT!',d.x,d.y-77,11,'#ffe79b');}});
   s.team.forEach((p,i)=>{if(i===s.active){ellipse(c,p.x,p.y+5,36,11,'#59e9ea88');text(c,'YOU',p.x,p.y-81,13,'#163c51');}else if(!s.enemyPossession){panel(c,p.x-27,p.y-87,54,20,'#143751b0',6);text(c,'PASS',p.x,p.y-72,11);}drawSportsAnimal(c,p.x,p.y,52,settings,s.time,playing);});
   if(s.enemyPossession){const d=s.defenders[s.enemyCarrier];text(c,'BALL CARRIER',d.x,d.y-80,12,'#932c39');text(c,'DEFEND · SPACE / TAP STEAL',480,110,18,'#fff2ac');}
   if(s.playerReach>0){const p=s.team[s.active],d=s.defenders[s.enemyCarrier],angle=Math.atan2(d.y-p.y,d.x-p.x);line(c,[[p.x,p.y-25],[p.x+Math.cos(angle)*42,p.y-25+Math.sin(angle)*42]],settings.color,9);text(c,'SWAT!',p.x,p.y-95,13,'#17344a');}
   if(s.aim){const p=s.team[s.active],aligned=sportsShotAligned(s.aim);for(let i=0;i<=24;i++){const dot=sportsShotPoint({x:p.x+28,y:p.y-28},s.aim,i/24);ellipse(c,dot.x,dot.y,3,3,aligned?'#72f7b6':'#fff4b4');}c.strokeStyle=aligned?'#58f0a5':'#ffed98';c.lineWidth=3;c.beginPath();c.ellipse(s.aim.x,s.aim.y,22,10,0,0,Math.PI*2);c.stroke();text(c,aligned?'ALIGNED · BALL PROTECTED':'AIM AT THE RIM · BALL PROTECTED',480,110,16,aligned?'#75ffc2':'#fff4c5');}
   if(s.ball)ball(c,s.ball.x,s.ball.y,13,color,'basketball',special,settings.basketball,s.time);else{const p=s.enemyPossession?s.defenders[s.enemyCarrier]:s.team[s.active];ball(c,p.x+28,p.y-20+Math.abs(Math.sin(s.time*9))*16,13,color,'basketball',special,settings.basketball,s.time);}
  }
 }
 if(s.sport==='tennis'&&!s.ball&&!s.done){const age=s.time-s.serveStarted;if(age<2.2){const x=age<.5?-220+700*(1-Math.pow(1-age/.5,3)):age<1.6?480:480+800*Math.pow((age-1.6)/.6,2);panel(c,x-160,250,320,78,'#103858e8',20);text(c,'Serve!',x,307,54,'#fff3a5');}}
 panel(c,18,18,220,74,'#10263bdc',12);text(c,s.sport==='bowling'?`ROUND ${Math.min(5,s.round)} / 5`:s.sport==='tennis'?'FIRST TO FIVE':`${Math.ceil(s.remaining)} SECONDS`,128,45,16,'#a8e6ef');text(c,s.sport==='tennis'?`${s.score} — ${s.opponent.score}`:s.sport==='basketball'?`YOU ${s.score} : ${s.enemyScore} THEM`:`${s.score} ${s.sport==='bowling'?'PINS':'POINTS'}`,128,77,25);
 panel(c,190,555,580,34,'#10263bdc',10);text(c,s.message,480,578,16,'#fff0cb');c.restore();
}
export function drawAnimalSportsPreview(canvas){const c=canvas.getContext('2d');if(c)drawSportsHub(c);}
