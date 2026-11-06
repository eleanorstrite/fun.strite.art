import {drawPlayBackdrop,drawPlaySprite} from './play-art.js';
import {drawJumper} from './platform-jump-person.js';
export {drawJumper} from './platform-jump-person.js';
import {drawJumpSurface} from './platform-jump-surfaces.js';
import {drawRealJumpPet} from './platform-jump-pets.js';
import {JUMP_DEFAULTS,createJumpState} from './platform-jump-rules.js';
const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
function box(c,x,y,w,h,color,r=8){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function text(c,t,x,y,size=18,color='#fff'){c.fillStyle=color;c.font=`700 ${size}px system-ui`;c.textAlign='center';c.fillText(t,x,y);}
export function drawJumpPet(c,x,y,s,time=0,moving=false,facing=1,pose='idle'){if(drawRealJumpPet(c,x,y,s,time,moving,facing,pose))return;c.save();c.translate(x,y);const breed=s.breed,kind=s.pet,dark=/Black|Chocolate/.test(breed),white=/White|Frost/.test(breed),coat=dark?'#443431':white?'#f4eee1':breed==='Emerald'?'#43ad82':breed==='Fire'?'#db7056':breed==='Rainbow'?'#9c7ce5':breed==='Brindle'?'#a87444':breed==='Golden Retriever'?'#dfb66c':'#b99568';const stride=moving?Math.sin(time*15)*3:0;const long=breed==='Dachshund';
 if(kind==='bird'){
  const feathers={'Golden songbird':'#eeb64a','White songbird':'#ecebe4','Green-and-yellow songbird':'#78b23c','Blue songbird':'#258ed5','Rainbow lorikeet':'#58aa46'},color=feathers[breed]||'#4b9fc6';
  c.fillStyle=color;c.beginPath();c.moveTo(-9,-12);c.lineTo(-31,-2);c.lineTo(-22,-25);c.fill();oval(c,0,-24,16,21,color);oval(c,8,-43,12,13,breed==='Rainbow lorikeet'?'#354a92':color);
  if(breed==='Rainbow lorikeet'||breed==='Green-and-yellow songbird')oval(c,6,-27,9,13,breed==='Rainbow lorikeet'?'#eead3d':'#e5d343');
  c.save();c.translate(-5,-26);c.rotate(moving?Math.sin(time*12)*.65:.3);oval(c,0,0,9,17,'#36596f');c.restore();c.fillStyle=breed==='Rainbow lorikeet'?'#dc6e38':'#e4b756';c.beginPath();c.moveTo(17,-46);c.lineTo(28,-42);c.lineTo(17,-39);c.fill();oval(c,12,-47,2,2,'#1d2530');
  c.strokeStyle='#8f7555';c.lineWidth=2;for(const side of [-1,1]){c.beginPath();c.moveTo(side*6,-7);c.lineTo(side*6,0);c.lineTo(side*6+5,0);c.stroke();}
  if(s.petName){box(c,-42,-81,84,22,'#ffffffdd',8);text(c,s.petName,0,-65,12,'#000');}c.restore();return;
 }
 if(kind==='dragon'){for(const side of [-1,1]){c.save();c.rotate(Math.sin(time*5)*.12*side);c.fillStyle='#8bd4c7';c.beginPath();c.moveTo(side*10,-19);c.lineTo(side*40,-45);c.lineTo(side*33,-10);c.lineTo(side*15,-8);c.fill();c.restore();}}
 if(kind!=='guinea pig'&&kind!=='capybara')oval(c,-25,-16,15,5,coat);for(const side of [-1,1])oval(c,side*14,side*stride,7,5,coat);oval(c,0,-15,long?31:23,kind==='guinea pig'?18:20,coat);
 if(/Tricolor|Calico|Black and white/.test(breed)){oval(c,-10,-19,10,13,breed==='Black and white'?'#faf5e9':'#e2ae64');oval(c,10,-22,8,11,'#f5f1e7');}if(breed==='Brindle'||breed==='Tabby')for(let i=0;i<4;i++){c.save();c.translate(-17+i*10,-19);c.rotate(.3);box(c,-2,-11,4,20,'#50372c',2);c.restore();}
 const headX=kind==='guinea pig'?8:12;oval(c,headX,-32,kind==='capybara'?17:15,15,coat);
 if(kind==='cat'||kind==='dragon'){for(const side of [-1,1]){c.fillStyle=kind==='dragon'?'#efd69c':coat;c.beginPath();c.moveTo(headX+side*5,-41);c.lineTo(headX+side*14,-57);c.lineTo(headX+side*17,-36);c.fill();}}
 else if(kind==='rabbit'){for(const side of [-1,1])oval(c,headX+side*10,breed==='Tan lop'?-30:-55,5,breed==='Tan lop'?19:21,coat);}
 else for(const side of [-1,1])oval(c,headX+side*13,kind==='dog'?-29:-42,kind==='dog'?6:5,kind==='dog'?14:6,coat);
 oval(c,headX+7,-33,3,3,'#1e2227');oval(c,headX+8,-34,1,1,'white');oval(c,headX+13,-25,5,3,'#332c31');if(kind==='dragon')oval(c,headX-3,-38,3,3,'#e3d391');
 c.font='700 14px system-ui';const width=c.measureText(s.petName).width;if(s.petName){box(c,-width/2-7,-79,width+14,23,'#ffffffdd',8);text(c,s.petName,0,-62,14,'#000');}c.restore();}
export function drawPlatformJump(c,state,s=JUMP_DEFAULTS){const w=c.canvas.width,h=c.canvas.height;c.save();c.scale(w/900,h/650);const palettes={'Blue sky':['#4e9bd5','#d9f3ff'],'Sunset':['#8559a5','#ffc68c'],'Aurora':['#142b51','#3d858c'],'Candy clouds':['#b49ee9','#ffe0ee']},colors=palettes[s.background];const g=c.createLinearGradient(0,0,0,650);g.addColorStop(0,colors[0]);g.addColorStop(1,colors[1]);c.fillStyle=g;c.fillRect(0,0,900,650);const detailedSky=s.background==='Blue sky'&&drawPlayBackdrop(c,0,900,650);
 if(!detailedSky&&s.background==='Aurora')for(let i=0;i<70;i++)oval(c,(i*137)%900,(i*73-state.camera*.05)%650,1.5,1.5,'#d5fff4');
 if(!detailedSky)for(let i=0;i<12;i++){const x=((i*213+state.time*(4+i%3))%1100)-100,y=((i*131-state.camera*.25)%800+800)%800-80;for(let j=0;j<4;j++)oval(c,x+j*27,y-Math.sin(j)*15,38,23,'#ffffff66');}
 for(let i=0;i<state.platforms.length;i++){const p=state.platforms[i],y=p.y-state.camera;if(y< -80||y>690)continue;drawJumpSurface(c,p,i,y);if(i===48){for(const side of [-1,1]){box(c,p.x+side*75-3,y-110,6,110,'#f7e7ad',2);}box(c,p.x-80,y-110,160,36,'#fff1bc',4);text(c,'FINISH!',p.x,y-85,24,'#725126');}}
 for(const coin of state.coins??[]){if(coin.collected)continue;const y=coin.y-state.camera;if(y< -25||y>675)continue;const bob=Math.sin(state.time*2+coin.x)*3;if(drawPlaySprite(c,'details',9,coin.x,y+bob,22,28,{anchor:.5}))continue;oval(c,coin.x,y+bob,11,15,'#c88b2b');oval(c,coin.x-1,y-2+bob,8,12,'#ffe18a');c.strokeStyle='#fff6cd';c.lineWidth=2;c.beginPath();c.moveTo(coin.x-1,y-8+bob);c.lineTo(coin.x-1,y+4+bob);c.stroke();}
 drawJumpPet(c,state.pet.x,state.pet.y-state.camera,s,state.time,Math.abs(state.vx)>0||!state.grounded,state.pet.facing||state.facing,state.pet.pose||'idle');drawJumper(c,state.x,state.y-state.camera,s,state.time,Math.abs(state.vx)>0,false,{pose:state.grounded?(Math.abs(state.vx)>0?'walk':'stand'):state.vy<0?'jump':'land',facing:state.facing});box(c,18,18,240,64,'#153651cc');text(c,`PLATFORM JUMP · ${state.difficulty}`,138,43,16);text(c,`${Math.max(0,Math.round(560-state.y))} m · ✦ ${state.collectedCoins??0} coins`,138,68,17,'#d1f4ff');if(state.done){box(c,240,220,420,130,'#17324ce8',20);text(c,'You reached the sky summit!',450,272,25);text(c,`${s.petName||'Your pet'} made it with you!`,450,312,19,'#ffeab1');}c.restore();}
export const JUMP_COVER_LOOK={...JUMP_DEFAULTS};
const previewFrames=new WeakMap();
export function drawPlatformJumpPreview(canvas){
 if(previewFrames.has(canvas))cancelAnimationFrame(previewFrames.get(canvas));
 const settings=JUMP_COVER_LOOK;
 function island(c,x,y,w){
  oval(c,x,y+46,w*.42,16,'#315b8030');
  c.fillStyle='#648ca3';c.beginPath();c.moveTo(x-w/2+7,y+5);c.lineTo(x-w*.22,y+54);c.lineTo(x+w*.12,y+73);c.lineTo(x+w/2-7,y+5);c.closePath();c.fill();
  c.fillStyle='#95bbbd';c.beginPath();c.moveTo(x-w*.22,y+11);c.lineTo(x+w*.12,y+73);c.lineTo(x+w*.3,y+13);c.closePath();c.fill();
  box(c,x-w/2,y-5,w,22,'#f7f4db',11);box(c,x-w/2+6,y-7,w-12,9,'#b3dca4',5);
 }
 function paint(now=0){
  const c=canvas.getContext('2d'),t=now/1000;c.save();c.scale(canvas.width/960,canvas.height/540);
  const sky=c.createLinearGradient(0,0,850,540);sky.addColorStop(0,'#3e8dcc');sky.addColorStop(.55,'#9bd9ed');sky.addColorStop(1,'#fff0cd');c.fillStyle=sky;c.fillRect(0,0,960,540);
  const glow=c.createRadialGradient(825,75,10,825,75,210);glow.addColorStop(0,'#fff5c6b0');glow.addColorStop(1,'#fff5c600');c.fillStyle=glow;c.fillRect(600,0,360,300);oval(c,825,75,43,43,'#fff6d4');
  for(let layer=0;layer<2;layer++){
   c.fillStyle=layer?'#83b6c7':'#a5cbd5';c.beginPath();c.moveTo(0,540);
   for(let i=-1;i<7;i++){const x=i*195+layer*70,y=365+layer*65+(i%2)*32;c.lineTo(x,y+130);c.lineTo(x+95,y);c.lineTo(x+195,y+130);}c.lineTo(960,540);c.closePath();c.fill();
  }
  for(const [x,y,size] of [[60,255,1.1],[540,160,.7],[905,405,1.1],[120,510,1.5]]){
   c.save();c.translate(x+Math.sin(t*.2+x)*6,y);c.scale(size,size);
   for(let j=0;j<4;j++)oval(c,(j-1.5)*35,-Math.sin(j)*16,47,24,'#ffffffa0');c.restore();
  }
  c.save();c.setLineDash([3,13]);c.lineWidth=3;c.strokeStyle='#fff8dfb0';c.beginPath();c.moveTo(510,405);c.bezierCurveTo(620,290,680,340,730,260);c.bezierCurveTo(785,180,820,220,876,156);c.stroke();c.restore();
  island(c,360,454,410);island(c,655,370,145);island(c,795,270,125);island(c,893,170,110);
  for(const [i,x,y] of [[0,605,297],[1,742,200],[2,858,102]]){
   const bob=Math.sin(t*2+i)*5;oval(c,x,y+bob,12,16,'#d69a34');oval(c,x-1,y-2+bob,9,13,'#ffe08a');c.strokeStyle='#fff5c9';c.lineWidth=2;c.beginPath();c.moveTo(x-1,y-8+bob);c.lineTo(x-1,y+5+bob);c.stroke();
  }
  box(c,909,92,4,75,'#fff7df',2);c.fillStyle='#ee795d';c.beginPath();c.moveTo(913,92);c.lineTo(947,103);c.lineTo(913,117);c.closePath();c.fill();
  // Feature the shop's orange-haired girl and her companion at thumbnail size.
  oval(c,294,454,52,9,'#426c7640');oval(c,458,454,54,9,'#426c7640');
  c.save();c.translate(294,448-Math.sin(t*1.5)*3);c.scale(2.55,2.55);drawJumper(c,0,0,settings,t,false,false);c.restore();
  c.save();c.translate(460,449);c.scale(2.35,2.35);drawJumpPet(c,0,0,{...settings,petName:''},t,false,1,'idle');c.restore();
  box(c,50,55,247,34,'#ffffffde',17);text(c,'YOU + YOUR BEST FRIEND',173,78,16,'#286583');
  c.save();c.shadowColor='#28608255';c.shadowBlur=12;c.shadowOffsetY=3;c.font='800 48px system-ui';c.textAlign='left';c.fillStyle='#fffcef';c.fillText('Up, up & away!',50,144);c.restore();
  c.restore();
 }
 paint();function frame(now){if(!canvas.isConnected){previewFrames.delete(canvas);return;}if(!document.hidden&&!document.querySelector('dialog[open]'))paint(now);previewFrames.set(canvas,requestAnimationFrame(frame));}previewFrames.set(canvas,requestAnimationFrame(frame));
}
