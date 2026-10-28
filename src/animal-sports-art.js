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
function ball(c,x,y,r,color,type,shine=false){
 const g=c.createRadialGradient(x-r*.35,y-r*.4,r*.05,x,y,r);g.addColorStop(0,'#fff1cd');g.addColorStop(.3,color);g.addColorStop(1,'#26364c');ellipse(c,x,y,r,r,g);
 if(type==='basketball'){c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.clip();line(c,[[x-r,y],[x+r,y]],'#472f25',1.6);line(c,[[x,y-r],[x,y+r]],'#472f25',1.6);c.strokeStyle='#472f25';c.lineWidth=1.6;c.beginPath();c.ellipse(x-r*.7,y,r*.55,r,0,0,Math.PI*2);c.stroke();c.beginPath();c.ellipse(x+r*.7,y,r*.55,r,0,0,Math.PI*2);c.stroke();c.restore();}
 if(type==='bowling'){for(const [a,b]of [[-.2,-.2],[.15,-.3],[0,.1]])ellipse(c,x+a*r,y+b*r,r*.12,r*.12,'#14304c');}
 if(shine){for(let i=1;i<5;i++)ellipse(c,x-i*9,y+i*4,Math.max(1,r*.35-i),Math.max(1,r*.35-i),'#eedaff80');}
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
const laneX=(x,y)=>480+(x-480)*(.45+(y-120)/430*.55);
export function drawSports(c,s,settings,playing=false){
 c.save();c.scale(c.canvas.width/960,c.canvas.height/600);const color=SPORTS_EQUIPMENT[s.sport][settings[s.sport]]?.color||'#31bad2',special=settings[s.sport]!=='classic';
 if(s.sport==='bowling'){
  stands(c,'bowling');panel(c,310,18,340,64,'#152f53');text(c,'NEON BOWL',480,60,32,'#6eebf1');
  for(let lane=-2;lane<=2;lane++){const center=480+lane*260;c.fillStyle=lane===0?'#e5ad65':'#b37b49';c.beginPath();c.moveTo(center-75,130);c.lineTo(center+75,130);c.lineTo(center+190,600);c.lineTo(center-190,600);c.fill();line(c,[[center-78,130],[center-200,600]],'#25354d',16);line(c,[[center+78,130],[center+200,600]],'#25354d',16);for(let i=-3;i<=3;i++)line(c,[[center+i*20,130],[center+i*47,600]],'#714a2928',1);}
  for(let y=270;y<540;y+=85)for(let i=-2;i<=2;i++){const x=laneX(480+i*35,y);c.fillStyle='#895b33';c.beginPath();c.moveTo(x,y);c.lineTo(x-4,y+8);c.lineTo(x+4,y+8);c.fill();}
  for(const pin of s.pins){const x=laneX(pin.x,pin.y),y=pin.y;const fallen=!pin.up;if(fallen&&s.time-pin.fall>1.1)continue;c.save();c.translate(x,y);if(fallen)c.rotate(Math.min(1,(s.time-pin.fall)*6)*1.3);ellipse(c,0,3,12,4,'#4e362655');const g=c.createLinearGradient(-10,0,10,0);g.addColorStop(0,'#aab9c7');g.addColorStop(.4,'#fff');g.addColorStop(1,'#dce6f2');ellipse(c,0,-10,10,17,g);ellipse(c,0,-32,6,7,g);panel(c,-4,-29,8,17,g,3);panel(c,-5,-26,10,3,'#e85263',1);panel(c,-5,-21,10,3,'#e85263',1);c.restore();}
  if(!s.ball){line(c,[[laneX(s.player.x,500),500],[laneX(s.player.x,200),200]],'#fffbd488',2);drawSportsAnimal(c,laneX(s.player.x,540)-40,566,57,settings,s.time,false);ball(c,laneX(s.player.x,520),520,18,color,'bowling',special);}else ball(c,laneX(s.ball.x,s.ball.y),s.ball.y,10+s.ball.y/70,color,'bowling',special);
 }else{
  court(c,s.sport);
  if(s.sport==='tennis'){
   drawSportsAnimal(c,s.opponent.x,210,38,{...settings,animal:'dog',color:'#ad8b6b',jersey:'#e97892',accessory:'cap'},s.time,!!s.ball);
   // A transparent mesh net spans the blue court.
   panel(c,190,314,580,4,'#edf6fa',1);for(let x=195;x<770;x+=13)line(c,[[x,318],[x,352]],'#f3f7fa70',1);for(let y=322;y<353;y+=8)line(c,[[190,y],[770,y]],'#f3f7fa60',1);line(c,[[190,307],[190,359]],'#d1e0ed',6);line(c,[[770,307],[770,359]],'#d1e0ed',6);
   drawSportsAnimal(c,s.player.x,508,55,settings,s.time,playing);c.save();c.translate(s.player.x+38,467);c.rotate(s.swing>0?-1.1:.3);line(c,[[0,0],[0,-24]],color,6);c.strokeStyle=color;c.lineWidth=5;c.beginPath();c.ellipse(0,-43,20,28,0,0,Math.PI*2);c.stroke();for(let x=-12;x<=12;x+=6)line(c,[[x,-64],[x,-22]],'#e5fafaaa',1);for(let y=-61;y<=-25;y+=6)line(c,[[-14,y],[14,y]],'#e5fafaaa',1);c.restore();if(s.ball){ellipse(c,s.ball.x,s.ball.y+8,9,3,'#172c5555');ball(c,s.ball.x,s.ball.y,9,'#dbeb55','tennis',special);}
  }else{
   // Backboard and net stay visible above the animals.
   panel(c,430,104,100,62,'#e9f5f9b0',4);c.strokeStyle='#fff';c.lineWidth=3;c.strokeRect(455,128,50,30);for(let i=0;i<6;i++)line(c,[[455+i*10,171],[466+i*6,195]],'#f8f5e7',1);ellipse(c,480,169,28,7,'#e96e3d');ellipse(c,480,167,23,4,'#ae5438');
   s.defenders.forEach(d=>drawSportsAnimal(c,d.x,d.y,47,{...settings,animal:'dog',color:'#8c786b',jersey:'#c95664',accessory:'none'},s.time,playing));
   s.team.forEach((p,i)=>{if(i===s.active){ellipse(c,p.x,p.y+5,36,11,'#59e9ea88');text(c,'YOU',p.x,p.y-81,13,'#163c51');}else{panel(c,p.x-27,p.y-87,54,20,'#143751b0',6);text(c,'PASS',p.x,p.y-72,11);}drawSportsAnimal(c,p.x,p.y,52,settings,s.time,playing);});
   if(s.ball)ball(c,s.ball.x,s.ball.y,13,color,'basketball',special);else{const p=s.team[s.active];ball(c,p.x+28,p.y-20+Math.abs(Math.sin(s.time*9))*16,13,color,'basketball',special);}
  }
 }
 panel(c,18,18,220,74,'#10263bdc',12);text(c,s.sport==='bowling'?`ROUND ${Math.min(5,s.round)} / 5`:s.sport==='tennis'?'FIRST TO FIVE':`${Math.ceil(s.remaining)} SECONDS`,128,45,16,'#a8e6ef');text(c,s.sport==='tennis'?`${s.score} — ${s.opponent.score}`:`${s.score} ${s.sport==='bowling'?'PINS':'POINTS'}`,128,77,25);
 panel(c,190,555,580,34,'#10263bdc',10);text(c,s.message,480,578,16,'#fff0cb');c.restore();
}
export function drawAnimalSportsPreview(canvas){const c=canvas.getContext('2d');if(!c)return;const state={sport:'basketball',time:0,remaining:90,score:0,message:'BOWL · RALLY · SHOOT',active:0,team:[{x:480,y:490},{x:275,y:345},{x:685,y:350}],defenders:[],ball:null};drawSports(c,state,{...SPORTS_DEFAULTS,animal:'dragon',color:'#6aa891'});}
