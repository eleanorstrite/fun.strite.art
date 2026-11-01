import {drawJumper} from './platform-jump-person.js';
export {drawJumper} from './platform-jump-person.js';
import {drawJumpSurface} from './platform-jump-surfaces.js';
import {drawRealJumpPet} from './platform-jump-pets.js';
import {JUMP_DEFAULTS,createJumpState} from './platform-jump-rules.js';
const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
function box(c,x,y,w,h,color,r=8){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function text(c,t,x,y,size=18,color='#fff'){c.fillStyle=color;c.font=`700 ${size}px system-ui`;c.textAlign='center';c.fillText(t,x,y);}
export function drawJumpPet(c,x,y,s,time=0,moving=false,facing=1,pose='idle'){if(drawRealJumpPet(c,x,y,s,time,moving,facing,pose))return;c.save();c.translate(x,y);const breed=s.breed,kind=s.pet,dark=/Black|Chocolate/.test(breed),white=/White|Frost/.test(breed),coat=dark?'#443431':white?'#f4eee1':breed==='Emerald'?'#43ad82':breed==='Fire'?'#db7056':breed==='Rainbow'?'#9c7ce5':breed==='Brindle'?'#a87444':breed==='Golden Retriever'?'#dfb66c':'#b99568';const stride=moving?Math.sin(time*15)*3:0;const long=breed==='Dachshund';
 if(kind==='dragon'){for(const side of [-1,1]){c.save();c.rotate(Math.sin(time*5)*.12*side);c.fillStyle='#8bd4c7';c.beginPath();c.moveTo(side*10,-19);c.lineTo(side*40,-45);c.lineTo(side*33,-10);c.lineTo(side*15,-8);c.fill();c.restore();}}
 if(kind!=='guinea pig'&&kind!=='capybara')oval(c,-25,-16,15,5,coat);for(const side of [-1,1])oval(c,side*14,side*stride,7,5,coat);oval(c,0,-15,long?31:23,kind==='guinea pig'?18:20,coat);
 if(/Tricolor|Calico|Black and white/.test(breed)){oval(c,-10,-19,10,13,breed==='Black and white'?'#faf5e9':'#e2ae64');oval(c,10,-22,8,11,'#f5f1e7');}if(breed==='Brindle'||breed==='Tabby')for(let i=0;i<4;i++){c.save();c.translate(-17+i*10,-19);c.rotate(.3);box(c,-2,-11,4,20,'#50372c',2);c.restore();}
 const headX=kind==='guinea pig'?8:12;oval(c,headX,-32,kind==='capybara'?17:15,15,coat);
 if(kind==='cat'||kind==='dragon'){for(const side of [-1,1]){c.fillStyle=kind==='dragon'?'#efd69c':coat;c.beginPath();c.moveTo(headX+side*5,-41);c.lineTo(headX+side*14,-57);c.lineTo(headX+side*17,-36);c.fill();}}
 else if(kind==='rabbit'){for(const side of [-1,1])oval(c,headX+side*10,breed==='Tan lop'?-30:-55,5,breed==='Tan lop'?19:21,coat);}
 else for(const side of [-1,1])oval(c,headX+side*13,kind==='dog'?-29:-42,kind==='dog'?6:5,kind==='dog'?14:6,coat);
 oval(c,headX+7,-33,3,3,'#1e2227');oval(c,headX+8,-34,1,1,'white');oval(c,headX+13,-25,5,3,'#332c31');if(kind==='dragon')oval(c,headX-3,-38,3,3,'#e3d391');
 c.font='700 14px system-ui';const width=c.measureText(s.petName).width;if(s.petName){box(c,-width/2-7,-79,width+14,23,'#ffffffdd',8);text(c,s.petName,0,-62,14,'#000');}c.restore();}
export function drawPlatformJump(c,state,s=JUMP_DEFAULTS){const w=c.canvas.width,h=c.canvas.height;c.save();c.scale(w/900,h/650);const palettes={'Blue sky':['#4e9bd5','#d9f3ff'],'Sunset':['#8559a5','#ffc68c'],'Aurora':['#142b51','#3d858c'],'Candy clouds':['#b49ee9','#ffe0ee']},colors=palettes[s.background];const g=c.createLinearGradient(0,0,0,650);g.addColorStop(0,colors[0]);g.addColorStop(1,colors[1]);c.fillStyle=g;c.fillRect(0,0,900,650);
 if(s.background==='Aurora')for(let i=0;i<70;i++)oval(c,(i*137)%900,(i*73-state.camera*.05)%650,1.5,1.5,'#d5fff4');
 for(let i=0;i<12;i++){const x=((i*213+state.time*(4+i%3))%1100)-100,y=((i*131-state.camera*.25)%800+800)%800-80;for(let j=0;j<4;j++)oval(c,x+j*27,y-Math.sin(j)*15,38,23,'#ffffff66');}
 for(let i=0;i<state.platforms.length;i++){const p=state.platforms[i],y=p.y-state.camera;if(y< -80||y>690)continue;drawJumpSurface(c,p,i,y);if(i===48){for(const side of [-1,1]){box(c,p.x+side*75-3,y-110,6,110,'#f7e7ad',2);}box(c,p.x-80,y-110,160,36,'#fff1bc',4);text(c,'FINISH!',p.x,y-85,24,'#725126');}}
 drawJumpPet(c,state.pet.x,state.pet.y-state.camera,s,state.time,Math.abs(state.vx)>0||!state.grounded,state.pet.facing||state.facing,state.pet.pose||'idle');drawJumper(c,state.x,state.y-state.camera,s,state.time,Math.abs(state.vx)>0,false,{pose:state.grounded?(Math.abs(state.vx)>0?'walk':'stand'):state.vy<0?'jump':'land',facing:state.facing});box(c,18,18,240,64,'#153651cc');text(c,`PLATFORM JUMP · ${state.difficulty}`,138,43,16);text(c,`${Math.max(0,Math.round(560-state.y))} m / ${state.summit} m`,138,68,17,'#d1f4ff');if(state.done){box(c,240,220,420,130,'#17324ce8',20);text(c,'You reached the sky summit!',450,272,25);text(c,`${s.petName||'Your pet'} made it with you!`,450,312,19,'#ffeab1');}c.restore();}
const previewFrames=new WeakMap();
export function drawPlatformJumpPreview(canvas){
 if(previewFrames.has(canvas))cancelAnimationFrame(previewFrames.get(canvas));
 const settings={...JUMP_DEFAULTS,pet:'dog',breed:'Brindle',petName:'Davina'};
 function paint(now=0){const c=canvas.getContext('2d'),t=now/1000;c.save();c.scale(canvas.width/900,canvas.height/650);const g=c.createLinearGradient(0,0,0,650);g.addColorStop(0,'#6bb6dc');g.addColorStop(1,'#e0f6ff');c.fillStyle=g;c.fillRect(0,0,900,650);for(let i=0;i<7;i++)for(let j=0;j<3;j++)oval(c,80+i*145+j*30,140+(i%3)*100,55,25,'#ffffff9c');box(c,170,510,560,28,'#fff6df',12);box(c,180,532,540,22,'#8bb9c1',9);c.save();c.translate(320,500);c.scale(2.2,2.2);drawJumper(c,0,0,settings,t,false,true);c.restore();c.save();c.translate(590,500);c.scale(2.4,2.4);drawJumpPet(c,0,0,settings,t,false,1,'idle');c.restore();c.restore();}
 paint();function frame(now){if(!canvas.isConnected){previewFrames.delete(canvas);return;}if(!document.hidden&&!document.querySelector('dialog[open]'))paint(now);previewFrames.set(canvas,requestAnimationFrame(frame));}previewFrames.set(canvas,requestAnimationFrame(frame));
}
