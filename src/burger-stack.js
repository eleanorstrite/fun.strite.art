import { createMazeAudio } from './maze-audio.js';

export const BURGER_INGREDIENTS=['cheese','lettuce','tomato','patty','bun'];
const burgerClamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createBurgerState(){return {status:'ready',score:0,time:0,clip:0,drop:0,camera:0,dir:1,moving:{x:35,width:220,kind:'cheese'},layers:[{x:190,width:220,kind:'bun'}],scraps:[],missTime:0};}
export function dropBurger(s){if(s.status!=='playing')return false;s.status='dropping';s.drop=0;return true;}
export function landBurger(s,emit=()=>{}){
  const top=s.layers.at(-1),piece=s.moving,left=Math.max(top.x,piece.x),right=Math.min(top.x+top.width,piece.x+piece.width),width=right-left;
  if(width<=0){s.scraps.push({...piece,y:600-s.layers.length*25+s.camera,vy:30,vx:piece.x<top.x?-80:80,angle:0});s.status='missed';s.missTime=0;emit('crash');return;}
  for(const [x,w,dir] of [[piece.x,left-piece.x,-1],[right,piece.x+piece.width-right,1]])if(w>0)s.scraps.push({x,width:w,kind:piece.kind,y:600-s.layers.length*25+s.camera,vy:30,vx:dir*85,angle:0});
  s.layers.push({x:left,width,kind:piece.kind});s.score++;s.dir=-s.dir;
  s.moving={x:s.dir>0?30:560-width,width,kind:BURGER_INGREDIENTS[s.score%BURGER_INGREDIENTS.length]};
  s.status='playing';emit('gem');
}
export function tickBurger(s,seconds,emit=()=>{}){
  const dt=burgerClamp(seconds,0,.05);if(s.status==='ready'||s.status==='finished')return;
  s.time+=dt;
  for(const piece of s.scraps){piece.vy+=900*dt;piece.y+=piece.vy*dt;piece.x+=piece.vx*dt;piece.angle+=Math.sign(piece.vx)*dt*1.8;}
  s.scraps=s.scraps.filter(piece=>piece.y<850);
  const target=Math.max(0,s.layers.length-10)*25;s.camera+=(target-s.camera)*Math.min(1,dt*8);
  if(s.status==='playing'){
    const min=30,max=560-s.moving.width;
    s.moving.x+=s.dir*Math.min(285,115+s.score*5)*dt;
    if(s.moving.x>max){s.moving.x=max-(s.moving.x-max);s.dir=-1;}else if(s.moving.x<min){s.moving.x=min+(min-s.moving.x);s.dir=1;}
  }else if(s.status==='dropping'){s.drop=Math.min(1,s.drop+dt/.24);if(s.drop>=1)landBurger(s,emit);}
  else if(s.status==='missed'){s.missTime+=dt;if(s.missTime>=.65){s.status='ending';s.clip=0;s.scraps=[];}}
  else if(s.status==='ending'){
    const before=s.clip;s.clip+=dt;
    if(before<1.3&&s.clip>=1.3)emit('iceChew');if(before<3&&s.clip>=3)emit('whoosh');if(before<5.5&&s.clip>=5.5)emit('bounce');
    if(s.clip>=7.5){s.clip=7.5;s.status='finished';}
  }
}
function burgerPoly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function burgerOval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function burgerRound(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function burgerGradient(c,y1,y2,colors){const g=c.createLinearGradient(0,y1,0,y2);if(!g?.addColorStop)return colors[0];colors.forEach((color,i)=>g.addColorStop(i/(colors.length-1),color));return g;}
export function drawBurgerLayer(c,piece,y){
  const {x,width:w,kind}=piece,depth=58,rise=34;
  const colors={cheese:['#ffdb65','#dda135','#f0b94a'],lettuce:['#a8d97b','#528b4d','#74aa56'],tomato:['#f78a70','#bd4c48','#db5d50'],patty:['#a36b4d','#603b32','#7d4d38'],bun:['#edc086','#b77b42','#d59753']}[kind];
  const top=[[x,y],[x+w,y],[x+w+depth,y-rise],[x+depth,y-rise]];
  burgerPoly(c,[[x,y],[x+w,y],[x+w,y+23],[x,y+23]],colors[1]);burgerPoly(c,[[x+w,y],[x+w+depth,y-rise],[x+w+depth,y-rise+23],[x+w,y+23]],colors[2]);burgerPoly(c,top,colors[0]);
  c.save();c.beginPath();top.forEach(([xx,yy],i)=>i?c.lineTo(xx,yy):c.moveTo(xx,yy));c.closePath();c.clip();
  c.strokeStyle='#ffffff44';c.lineWidth=2;c.beginPath();c.moveTo(x+2,y-2);c.lineTo(x+w,y-2);c.lineTo(x+w+depth-2,y-rise+2);c.stroke();
  if(kind==='bun')for(let i=0;i<16;i++){const px=x+8+(i*47)%(Math.max(1,w+45)),py=y-5-(i*13)%27;c.save();c.translate(px,py);c.rotate(i);burgerOval(c,0,0,3,1.2,'#fff0c8');c.restore();}
  if(kind==='cheese')for(let i=0;i<6;i++)burgerOval(c,x+20+i*43,y-8-(i%2)*15,5,3,'#e7b248');
  if(kind==='lettuce'){c.strokeStyle='#deefb1';c.lineWidth=2;for(let i=0;i<8;i++){c.beginPath();c.moveTo(x+i*38,y);c.quadraticCurveTo(x+i*38-12,y-18,x+i*38+23,y-34);c.stroke();}}
  if(kind==='tomato')for(let i=0;i<6;i++){burgerOval(c,x+20+i*42,y-15,16,10,'#d95e55');burgerOval(c,x+16+i*42,y-17,3,1.5,'#ffe3a4');burgerOval(c,x+24+i*42,y-12,3,1.5,'#ffe3a4');}
  if(kind==='patty'){c.strokeStyle='#593c31';c.lineWidth=3;for(let i=0;i<10;i++){c.beginPath();c.moveTo(x+i*32,y+5);c.lineTo(x+i*32+40,y-40);c.stroke();}}
  c.restore();
  if(kind==='lettuce'){c.save();c.beginPath();c.rect(x,y,w,23);c.clip();for(let i=0;i<w;i+=15)burgerOval(c,x+i+7,y+5,10,6,i%2?'#86b959':'#a6d278');c.restore();}
}
function drawSmallBurger(c,x,y,scale=1,bite=false){
  c.save();c.translate(x,y);c.scale(scale,scale);
  if(bite){c.beginPath();c.rect(-60,-65,120,120);c.moveTo(42,-25);c.arc(32,-25,10,0,Math.PI*2);c.clip('evenodd');}
  burgerRound(c,-29,15,58,12,6,'#dca261');burgerRound(c,-30,6,60,12,5,'#644335');burgerRound(c,-32,3,64,6,3,'#9bc45e');burgerRound(c,-29,-3,58,7,3,'#e56f5e');burgerPoly(c,[[-30,-5],[30,-5],[24,5],[7,0],[-13,7],[-30,0]],'#f9cf59');
  burgerOval(c,0,-8,31,18,'#e4ad69');burgerRound(c,-31,-8,62,12,4,'#e4ad69');
  for(let i=0;i<7;i++)burgerOval(c,-20+i*7,-11-(i%2)*7,2,1,'#ffedbe');c.restore();
}
export function drawBurgerEnding(c,time,width,height,score,best,reduced=false){
  c.save();c.fillStyle='#244d59';c.fillRect(0,0,width,height);const scale=Math.min(width/900,height/650);c.translate((width-900*scale)/2,(height-650*scale)/2);c.scale(scale,scale);
  c.fillStyle=burgerGradient(c,0,650,['#d8eced','#fff0d2']);c.fillRect(0,0,900,650);
  c.fillStyle='#b4cdb5';c.fillRect(0,330,900,170);
  for(let i=0;i<7;i++){c.fillStyle='#8fa997';c.fillRect(i*150+35,270,8,160);burgerOval(c,i*150+40,265,40,65,'#8cb3a0');}
  c.fillStyle='#c7baa4';c.fillRect(0,480,900,170);c.strokeStyle='#a79d8e';c.lineWidth=2;for(let x=0;x<900;x+=150){c.beginPath();c.moveTo(x,480);c.lineTo(x-35,650);c.stroke();}
  burgerOval(c,400,506,75,12,'#78adbd');burgerOval(c,392,502,50,4,'#bedfe4');
  // The open bin is behind the flying burger; its front is drawn afterward.
  burgerOval(c,735,420,43,12,'#263b43');
  const walking=time<3,walkX=100+Math.min(time,3)*100,slip=burgerClamp((time-3)/.7,0,1),land=burgerClamp((time-3.7)/.5,0,1);
  c.save();c.translate(walkX+slip*36,480+land*22);c.rotate(walking?0:slip*-.95);
  const stride=walking&&!reduced?Math.sin(time*10)*15:0;
  c.strokeStyle='#3e526b';c.lineWidth=15;c.lineCap='round';c.beginPath();c.moveTo(-13,-53);c.lineTo(-14-stride,0);c.moveTo(13,-53);c.lineTo(14+stride,0);c.stroke();
  burgerRound(c,-25,-125,50,76,16,'#db786b');burgerOval(c,0,-154,27,31,'#efc5a2');burgerOval(c,-3,-176,27,13,'#604c42');burgerOval(c,13,-156,3,4,'#2d3d4b');
  c.strokeStyle='#a8715c';c.lineWidth=2;c.beginPath();c.arc(16,-144,6,0,Math.PI);c.stroke();
  c.strokeStyle='#efc5a2';c.lineWidth=12;c.beginPath();c.moveTo(-22,-110);c.lineTo(-34,-73);c.moveTo(23,-110);c.lineTo(walking?45:72,walking?-135:-151);c.stroke();
  if(time<3.15)drawSmallBurger(c,47,-143,.65,time>1.3);c.restore();
  if(time>=3.15&&time<5.5){const p=burgerClamp((time-3.15)/2.35,0,1),x=450+(735-450)*p,y=310+110*p-Math.sin(p*Math.PI)*230;c.save();c.translate(x,y);c.rotate(reduced?0:p*Math.PI*3);drawSmallBurger(c,0,0,.75,true);c.restore();}
  burgerPoly(c,[[694,423],[776,423],[765,515],[705,515]],'#526f79');c.strokeStyle='#92adb1';c.lineWidth=4;for(let x=710;x<770;x+=16){c.beginPath();c.moveTo(x,438);c.lineTo(x,501);c.stroke();}
  burgerRound(c,689,420,92,9,4,'#829ea3');c.fillStyle='#e2eece';c.font='bold 15px sans-serif';c.textAlign='center';c.fillText('TRASH',735,474);
  if(time>=5.5){c.fillStyle='#477a8b';c.font='bold 24px sans-serif';c.fillText('Plop!',735,393);}
  c.textAlign='center';c.fillStyle='#344e5d';c.font='bold 34px sans-serif';c.fillText(time<3?'One very tall snack…':'Oops! There goes lunch!',450,85);
  c.font='bold 25px sans-serif';c.fillText(score+' layers stacked · Best '+Math.max(score,best),450,577);c.restore();
}
export function drawBurgerScene(c,s,width,height,best=0,reduced=false){
  if(s.status==='ending'||s.status==='finished'){drawBurgerEnding(c,s.clip,width,height,s.score,best,reduced);return;}
  c.save();c.scale(width/620,height/720);
  c.fillStyle=burgerGradient(c,0,720,['#176d83','#5c9e9f','#b0c6a0']);c.fillRect(0,0,620,720);
  for(let i=0;i<14;i++){const x=(i*97)%620,y=(i*131)%720;c.fillStyle='#ffffff22';c.fillRect(x,y,3,3);}
  c.textAlign='center';c.fillStyle='#fff4d4';c.font='bold 21px sans-serif';c.fillText('STACK THE HAMBURGER',310,48);c.font='64px sans-serif';c.fillText(String(s.score),310,121);c.font='16px sans-serif';c.fillText('Best: '+Math.max(best,s.score)+' layers',310,152);
  burgerOval(c,322,651,205,35,'#25575b44');
  for(let i=Math.max(0,s.layers.length-16);i<s.layers.length;i++){const y=600-i*25+s.camera;if(y<720)drawBurgerLayer(c,s.layers[i],y);}
  for(const piece of s.scraps){c.save();c.translate(piece.x+piece.width/2,piece.y);c.rotate(reduced?0:piece.angle);drawBurgerLayer(c,{...piece,x:-piece.width/2},0);c.restore();}
  if(['playing','dropping','ready'].includes(s.status)){const y=600-s.layers.length*25+s.camera-(s.status==='dropping'?90*(1-s.drop)**2:90);drawBurgerLayer(c,s.moving,y);}
  burgerRound(c,85,666,450,34,17,'#1b566b99');c.fillStyle='#fff4dc';c.font='16px sans-serif';c.fillText(s.status==='missed'?'Missed! Watch what happens to lunch…':'Click / tap / Space to drop the next layer',310,689);c.restore();
}
export function drawBurgerPreview(canvas){const c=canvas.getContext('2d');if(!c)return;const s=createBurgerState();for(let i=0;i<7;i++)s.layers.push({x:190+i*5,width:220-i*9,kind:BURGER_INGREDIENTS[i%5]});s.score=7;drawBurgerScene(c,s,canvas.width,canvas.height,7,true);}
export function createBurgerStack({canvas,onHud,onFinish,bestScore=0,controls=document.querySelector('#burger-controls')}){
  const c=canvas.getContext('2d');if(!c)throw Error('Canvas is unavailable.');
  const audio=createMazeAudio(),controller=new AbortController(),events={signal:controller.signal};
  let s=createBurgerState(),active=false,paused=false,destroyed=false,last=0,frame;
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  const dropButton=document.createElement('button'),skip=document.createElement('button');dropButton.type=skip.type='button';dropButton.className='button dark';skip.className='button outline';dropButton.textContent='Drop layer ↓';skip.textContent='Skip ending';
  const tip=document.createElement('p');tip.textContent='Cheese, lettuce, tomato, patty, bun — repeat! Only the overlapping part stays. Each new layer is exactly as wide as the last. Earn 1 coin per layer, up to 40 per game.';
  controls.replaceChildren(dropButton,skip,tip);
  const drop=()=>{if(!active||paused||document.hidden)return;audio.unlock();dropBurger(s);canvas.focus({preventScroll:true});};
  dropButton.onclick=drop;canvas.addEventListener('pointerdown',e=>{if(e.button>0)return;e.preventDefault();drop();},events);
  canvas.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(!e.repeat)drop();}},events);
  skip.onclick=()=>{if(active&&!paused&&!document.hidden&&s.status==='ending'){s.clip=7.5;s.status='finished';audio.stop();finish();}};
  document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden)audio.stop();},events);
  function finish(){if(!active)return;active=false;bestScore=Math.max(bestScore,s.score);onFinish(Math.min(40,s.score),{title:s.score?'A '+s.score+'-layer hamburger!':'Try another hamburger!',detail:'Best: '+bestScore+' layers. Time your drop to keep more of each layer.',score:s.score});}
  function tick(now){if(destroyed)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(active&&!paused&&!document.hidden){tickBurger(s,dt,cue=>audio.play(cue));if(s.status==='finished')finish();}dropButton.disabled=!active||paused||s.status!=='playing';skip.hidden=s.status!=='ending';skip.disabled=!active||paused;drawBurgerScene(c,s,canvas.width,canvas.height,bestScore,reduced);onHud({text:s.score+' layers · Best '+Math.max(bestScore,s.score)+' · '+(s.status==='ending'?'Watch your hamburger’s adventure!':'Stack as high as you can.')});frame=requestAnimationFrame(tick);}
  frame=requestAnimationFrame(tick);
  return {start(){audio.stop();audio.unlock();s=createBurgerState();s.status='playing';active=true;paused=false;last=0;canvas.focus();},pause(value){paused=value;last=0;if(value)audio.stop();},setMuted:value=>audio.setMuted(value),destroy(){if(destroyed)return;destroyed=true;finish();controller.abort();audio.destroy();cancelAnimationFrame(frame);controls.replaceChildren();}};
}
