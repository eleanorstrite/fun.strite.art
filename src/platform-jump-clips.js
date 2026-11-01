import {FLYOVER_SECONDS} from './platform-jump-flyover.js';
import {drawJumper,drawJumpPet} from './platform-jump-art.js';
import {JUMP_DEFAULTS} from './platform-jump-rules.js';
import {jumpPetAtlas} from './platform-jump-pets.js';
import {dogMotionAtlas} from './platform-dog-motion.js';
export const JUMP_CLIP_LENGTH={intro:9,win:16,flyover:FLYOVER_SECONDS};
export const JUMP_INTRO_LOOK={...JUMP_DEFAULTS,pet:'dog',breed:'Brindle',petName:'Davina'};
export function jumpClipReady(){return [jumpPetAtlas(),dogMotionAtlas()].every(image=>image?.complete);}
const clamp=n=>Math.max(0,Math.min(1,n)),lerp=(a,b,t)=>a+(b-a)*clamp(t),ease=t=>{t=clamp(t);return t*t*(3-2*t);};
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function line(c,x,y,x2,y2,color,width=3){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
function text(c,t,x,y,size=25,color='#19384b'){c.fillStyle=color;c.font=`800 ${size}px system-ui`;c.textAlign='center';c.fillText(t,x,y);}
function panel(c,x,y,w,h,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,18);c.fill();}
function speak(c,t,x,y){c.font='800 28px system-ui';const w=c.measureText(t).width+44;panel(c,x-w/2,y-34,w,53,'#fffbedee');text(c,t,x,y,28);}
function sky(c,t,mountains=false){const g=c.createLinearGradient(0,0,0,650);g.addColorStop(0,'#549bd3');g.addColorStop(1,'#e6f6ef');c.fillStyle=g;c.fillRect(0,0,900,650);oval(c,760,90,44,44,'#fff1b5');for(let i=0;i<9;i++){const x=((i*177-t*12)%1100+1100)%1100-100,y=80+(i%3)*65;for(let j=0;j<3;j++)oval(c,x+j*29,y-j%2*12,42,19,'#ffffff9c');}
 if(mountains){for(let layer=0;layer<3;layer++){for(let i=-1;i<7;i++){const x=i*240-((t*(12+layer*15))%240),peak=290+layer*100+(i%2)*55;c.fillStyle=['#91afc8','#618da5','#3f776f'][layer];c.beginPath();c.moveTo(x-140,650);c.lineTo(x+70,peak);c.lineTo(x+260,650);c.fill();c.fillStyle=layer===0?'#e4f2f7':'#c2e2dc';c.beginPath();c.moveTo(x+70,peak);c.lineTo(x+30,peak+70);c.lineTo(x+70,peak+54);c.lineTo(x+113,peak+70);c.fill();}}c.strokeStyle='#8ee4f3';c.lineWidth=14;c.beginPath();c.moveTo(760,500);c.bezierCurveTo(560,520,740,600,490,650);c.stroke();}}
function platform(c,x,y,w,finish=false){panel(c,x-w/2,y,w,25,'#fff7dc');panel(c,x-w/2+10,y+20,w-20,18,'#8aafb1');if(finish){line(c,x-140,y,x-140,y-180,'#fbf6e3',7);line(c,x+140,y,x+140,y-180,'#fbf6e3',7);panel(c,x-148,y-180,296,48,'#f3c769');text(c,'FINISH',x,y-147,30);}}
function person(c,x,y,s,t,scale=1.7,pose=false){c.save();c.translate(x,y);c.scale(scale,scale);drawJumper(c,0,0,s,t,false,pose);c.restore();}
function pet(c,x,y,s,t,scale=1.65,pose='idle',facing=1){c.save();c.translate(x,y);c.scale(scale,scale);if(s.pet!=='dog')c.rotate(pose==='jump'?-.13:pose==='land'?.1:0);drawJumpPet(c,0,0,s,t,pose!=='idle',facing,pose);c.restore();}
function bird(c,x,y,t,size=1){c.save();c.translate(x,y);c.scale(size,size);const flap=Math.sin(t*7)*13;c.strokeStyle='#344b65';c.lineWidth=4;c.beginPath();c.moveTo(-28,-flap);c.quadraticCurveTo(-13,-18,0,0);c.quadraticCurveTo(13,-18,28,-flap);c.stroke();oval(c,0,0,5,10,'#e9ede6');c.restore();}
export function drawJumpClip(c,kind,time,custom){const t=Math.max(0,time),s=kind==='intro'?JUMP_INTRO_LOOK:custom;c.save();c.scale(c.canvas.width/900,c.canvas.height/650);
 if(kind==='intro'){
  sky(c,t);platform(c,450,510,620);let px=310,dx=590,py=500,dy=500,pose='idle',arms=false;
  if(t<3){const phase=t*Math.PI*2/1.1;px+=Math.sin(phase)*45;dx+=Math.sin(phase+.3)*45;py-=Math.abs(Math.sin(phase))*28;dy-=Math.abs(Math.sin(phase+.3))*25;pose='walk';}
  else if(t<5){const p=(t-3)/2,h=Math.sin(p*Math.PI)*115;py-=h;dy-=h;pose=p<.5?'jump':'land';arms='clap';}
  else if(t<7){arms='clap';speak(c,"We're ready! Let's go!",450,180);}
  else{const p=ease((t-7)/2);px=lerp(310,1120,p);dx=lerp(590,1390,p);py-=Math.sin(p*Math.PI)*150;dy-=Math.sin(p*Math.PI)*145;pose=p<.5?'jump':'land';arms=true;}
  person(c,px,py,s,t,1.9,arms);pet(c,dx,dy,s,t,1.8,pose);text(c,'SKY-HIGH ADVENTURES TOGETHER',450,74,25);
 }else if(t<5){
  sky(c,t);platform(c,450,510,460,true);const p=clamp(t/2),h=Math.sin(p*Math.PI)*110;let px=350,dx=550,py=500-h,dy=500-h;
  if(t>3){const q=ease((t-3)/2);px=lerp(350,720,q);dx=lerp(550,855,q);py=500-Math.sin(q*Math.PI)*100;dy=500-Math.sin(q*Math.PI)*90;}
  person(c,px,py,s,t,1.7,t<3?'clap':true);pet(c,dx,dy,s,t,1.5,t<1?'jump':t<2?'land':t<3?'idle':'jump');if(t>=2&&t<3.5)speak(c,'We made it!',450,225);
 }else{
  const flight=t-5;sky(c,flight,true);const cx=450+Math.sin(flight*.55)*45,cy=350+Math.sin(flight*.8)*18;
  c.save();c.translate(cx,cy);c.rotate(Math.sin(flight*.55)*.035);
  // Shared paraglider with visible suspension lines and a secure pet sling.
  for(let i=0;i<7;i++)line(c,-210+i*70,-155,i<3?-50:65,40,'#f4f5e3',1.5);
  c.save();c.beginPath();c.ellipse(0,-145,230,100,0,Math.PI,Math.PI*2);c.lineTo(230,-145);c.quadraticCurveTo(0,-205,-230,-145);c.closePath();c.clip();for(let i=0;i<7;i++){c.fillStyle=['#eb6779','#f39d5c','#f6d573','#7bc5a1','#66b8dc','#8e8aca','#c991c9'][i];c.fillRect(-235+i*68,-250,70,130);}c.restore();
  person(c,-55,98,s,t,1.2,false);pet(c,78,106,s,t,1.1,'idle');line(c,-75,49,-36,70,'#293d53',8);line(c,-36,70,-41,95,'#293d53',8);panel(c,31,88,96,27,'#354c69');line(c,36,90,45,57,'#354c69',5);line(c,121,90,113,57,'#354c69',5);
  if(flight>2){line(c,-35,45,25,10,s.skin,9);oval(c,25,10,7,7,s.skin);}c.restore();
  for(let i=0;i<4;i++)bird(c,680+i*60-flight*12,220+i%2*36,flight+i,.8);
  if(flight>2&&flight<5)speak(c,'Look at those birds!',450,93);else if(flight>=5&&flight<8)speak(c,'Snowy peaks and a sparkling river!',450,93);else if(flight>=8){panel(c,285,46,330,80,'#fff8deef');text(c,'You win.',450,101,43);}
 }
 c.fillStyle='#fff0b5';c.fillRect(0,644,900*clamp(t/JUMP_CLIP_LENGTH[kind]),6);c.restore();}
