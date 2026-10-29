import {drawSportsAnimal,drawBowlingBall,ball,court,stands,racket} from './animal-sports-art.js';
import {SPORTS_EQUIPMENT} from './animal-sports-settings.js';
export const SPORTS_VICTORY_DURATION=10;
export function sportsWon(s){if(!s.done)return false;if(s.sport==='bowling')return s.score>Math.max(...s.rivals.map(r=>r.frames.reduce((a,b)=>a+b,0)));if(s.sport==='tennis')return s.score>=5;return s.score>s.enemyScore;}
const clamp=t=>Math.max(0,Math.min(1,t)),mix=(a,b,t)=>a+(b-a)*clamp(t);
function line(c,x,y,x2,y2,color,width=5){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function label(c,t,x,y,size=28,color='#fff'){c.font=`800 ${size}px system-ui`;c.textAlign='center';c.fillStyle=color;c.fillText(t,x,y);}
function bubble(c,t,x,y){c.font='800 30px system-ui';const w=c.measureText(t).width+48;c.fillStyle='#fff9df';c.beginPath();c.roundRect(x-w/2,y-42,w,60,18);c.fill();label(c,t,x,y,30,'#213349');}
function pin(c,x,y,angle=0,face=false,run=0,highFive=false){c.save();c.translate(x,y);c.rotate(angle);if(face){line(c,-8,-8,-13+Math.sin(run)*6,12,'#f6f3e9',5);line(c,8,-8,13-Math.sin(run)*6,12,'#f6f3e9',5);line(c,-8,-25,highFive?-47:-24,highFive?-70:-17,'#fff5dc',6);line(c,8,-25,25,-18,'#fff5dc',6);}const g=c.createLinearGradient(-14,0,14,0);g.addColorStop(0,'#a5bac6');g.addColorStop(.4,'#fff');g.addColorStop(1,'#d1dfe9');oval(c,0,-15,14,25,g);oval(c,0,-48,9,11,g);line(c,0,-30,0,-45,'#fafaff',12);line(c,-6,-35,6,-35,'#e75f6e',5);if(face){oval(c,-3,-51,1.8,2.5,'#24394b');oval(c,4,-51,1.8,2.5,'#24394b');c.strokeStyle='#24394b';c.lineWidth=2;c.beginPath();c.arc(0,-46,4,0,Math.PI);c.stroke();}c.restore();}
function stars(c,t,cx,cy){for(let i=0;i<32;i++){const a=i*2.4,d=35+((t*40+i*17)%230),x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d;c.save();c.translate(x,y);c.rotate(t*.4+i);c.fillStyle=['#fff1a6','#a9f3ff','#e9bdff'][i%3];c.beginPath();for(let k=0;k<10;k++){const r=k%2?3:8,angle=k*Math.PI/5;c.lineTo(Math.cos(angle)*r,Math.sin(angle)*r);}c.closePath();c.fill();c.restore();}}
function hoop(c){c.fillStyle='#e6f5ffc9';c.fillRect(430,104,100,62);c.strokeStyle='#fff';c.lineWidth=3;c.strokeRect(455,128,50,30);for(let i=0;i<6;i++)line(c,455+i*10,171,466+i*6,200,'#f9f3da',1.5);oval(c,480,169,28,7,'#ef8643');}
export function drawSportsVictory(c,s,settings,time){c.save();c.scale(c.canvas.width/960,c.canvas.height/600);const t=Math.min(time,10),equipment=SPORTS_EQUIPMENT[s.sport][settings[s.sport]],jump=t>=6?Math.sin(clamp((t-6)/4)*Math.PI)*100:0;
 if(s.sport==='bowling'){
  stands(c,'bowling');c.fillStyle='#dfa65c';c.beginPath();c.moveTo(380,140);c.lineTo(580,140);c.lineTo(760,600);c.lineTo(200,600);c.fill();for(let i=-3;i<=3;i++)line(c,480+i*25,140,480+i*70,600,'#fff0ce30',2);
  for(let i=0;i<10;i++){const row=Math.floor((Math.sqrt(8*i+1)-1)/2),x=480+(i-row*(row+1)/2-row/2)*34,y=230-row*25;if(i===0&&t>=4.4)continue;pin(c,x+(t>4?Math.sin(i*3)*clamp(t-4)*70:0),y,t>4?clamp((t-4)*3)*(i%2?1.5:-1.5):0);}
  const y=510-jump;drawSportsAnimal(c,260,y,90,settings,t<6?t:t*.2,t<2);
  if(t<2){drawBowlingBall(c,300,465,28,settings.bowling,t);line(c,285,477,300,465,settings.color,12);}else if(t<4.4){const p=clamp((t-2)/2);drawBowlingBall(c,mix(300,480,p),mix(465,195,p),mix(28,14,p),settings.bowling,t*6);line(c,285,477,326,452,settings.color,12);}
  if(t>=4.4){const p=clamp((t-4.4)/1.6),px=mix(480,345,p),py=mix(230,500,p)-Math.sin(p*Math.PI)*30-jump;pin(c,px,py,0,true,t*12,t>=6);if(t>=6){line(c,290,y-32,298,y-80,settings.color,13);oval(c,298,y-80,8,8,settings.color);stars(c,(t-6)*.35,299,y-80);bubble(c,'You win!',440,240);}}
 }else if(s.sport==='tennis'){
  court(c,'tennis');line(c,190,325,770,325,'#edfaff',5);const px=t<4?480+Math.sin(t*4)*100:480,py=500-jump,ox=350+Math.sin(Math.min(t,4)*4)*55;drawSportsAnimal(c,ox,225,50,{...settings,animal:'dog',jersey:'#e97892',color:'#ad8b6b'},t,t<5);racket(c,ox+28,195,'#f590b4',t<4?.3:0,true,'comet');drawSportsAnimal(c,px,py,75,settings,t<6?t:t*.15,t<4);racket(c,px+45,py-30,equipment.color,t<5?.3:0,false,settings.tennis);
  if(t<4){for(let i=0;i<6;i++){const p=(t*1.7+i*.13)%1;ball(c,480+Math.sin(p*6+i)*140,mix(205,450,p),9,'#d9ec58','tennis',false,settings.tennis,t);}}
  else if(t<6){const p=clamp((t-4)/1.2);ball(c,mix(525,740,p),mix(450,125,p),10,'#d9ec58','tennis',false,settings.tennis,t);label(c,'WINNING SHOT!',480,115,24,'#fff3b0');}
  else{stars(c,(t-6)*.4,480,300);bubble(c,'I win!',480,180);line(c,px-33,py-38,px-55,py-100,settings.color,12);}
 }else{
  court(c,'basketball');hoop(c);const px=t<4.5?350:mix(350,480,(t-4.5)/1.5),py=510-jump;drawSportsAnimal(c,px,py,80,settings,t<6?t:t*.15,t<2);
  if(t<2)ball(c,390,475+Math.abs(Math.sin(t*10))*35,23,equipment.color,'basketball',false,settings.basketball,t);
  else if(t<4.5){const p=clamp((t-2)/2.5);ball(c,mix(390,480,p),mix(460,172,p)-Math.sin(p*Math.PI)*165,22,equipment.color,'basketball',false,settings.basketball,t);line(c,378,460,405,414,settings.color,13);}
  else if(t<6){ball(c,480,mix(172,450,(t-4.5)/1.5),22,equipment.color,'basketball',false,settings.basketball,t);hoop(c);}
  else{const p=clamp((t-6)/4);line(c,510,py-35,530,py-100,settings.color,13);oval(c,530,py-100,9,9,settings.color);ball(c,530,mix(410,70,p),24,equipment.color,'basketball',false,settings.basketball,t*.2);stars(c,(t-6)*.4,520,285);bubble(c,'we win!',480,115);}
 }
 c.fillStyle='#0c2034d9';c.fillRect(0,0,960,52);label(c,t>=6?'S L O W   M O T I O N':'VICTORY REPLAY',480,34,22,'#ffedb6');c.fillStyle='#fff3b7';c.fillRect(0,594,960*clamp(t/10),6);c.restore();}
