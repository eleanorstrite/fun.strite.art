import { createMazeAudio } from './maze-audio.js';

export const BURGER_BACKGROUNDS={kitchen:'House kitchen',diner:'Burger diner',picnic:'Garden picnic',classic:'Classic sky'};
export const BURGER_HOVER=28;
export const BURGER_INGREDIENTS=['cheese','lettuce','tomato','patty','bun'];
const burgerClamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createBurgerState(background='kitchen'){return {background:Object.hasOwn(BURGER_BACKGROUNDS,background)?background:'kitchen',status:'ready',score:0,time:0,clip:0,drop:0,camera:0,dir:1,moving:{x:35,width:220,kind:'cheese'},layers:[{x:190,width:220,kind:'bun'}],scraps:[],missTime:0};}
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
    s.moving.x+=s.dir*Math.min(440,230+s.score*8)*dt;
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
export function burgerPersonPose(time){
  const fall=burgerClamp((time-3)/1.1,0,1),ease=fall*fall*(3-2*fall);
  return {x:100+Math.min(time,3)*100+ease*40,y:430+ease*50-Math.sin(fall*Math.PI)*14,angle:ease===0?0:-Math.PI/2*ease,fall,surprised:time>=3};
}
function drawBurgerPerson(c,time,reduced){
  const pose=burgerPersonPose(time),{fall,surprised}=pose;
  const stride=time<3&&!reduced?Math.sin(time*9)*15:0,kick=Math.sin(fall*Math.PI)*30;
  burgerOval(c,pose.x-(fall*50),510,35+fall*85,8,'#4c51422b');
  c.save();c.translate(pose.x,pose.y);c.rotate(pose.angle);c.lineCap='round';c.lineJoin='round';
  // Jointed legs, trouser seams, cuffs, and shoes keep the silhouette human.
  for(const side of [-1,1]){
    const kneeX=side*10+stride*side+kick*side,kneeY=32-kick*.3,footX=side*12-stride*side+kick*side,footY=68-kick;
    c.strokeStyle=side<0?'#3b506a':'#506c89';c.lineWidth=18;c.beginPath();c.moveTo(side*10,-2);c.lineTo(kneeX,kneeY);c.lineTo(footX,footY);c.stroke();
    c.strokeStyle='#90a2b266';c.lineWidth=2;c.beginPath();c.moveTo(side*10+4,3);c.lineTo(kneeX+4,kneeY);c.lineTo(footX+4,footY-5);c.stroke();
    burgerRound(c,footX-9,footY-3,27,11,5,'#323a46');c.fillStyle='#ece6d5';c.fillRect(footX-8,footY+5,25,3);
  }
  // Arms are drawn once, with elbows unfolding during the slip.
  for(const side of [-1,1]){
    const elbowX=side<0?-32-kick:36+kick,elbowY=side<0?-42:-65-kick;
    const handX=side<0?-28-kick:40+kick,handY=side<0?-15:-100-kick;
    const rest=burgerClamp((fall-.65)/.35,0,1),ex=elbowX+(side*20-elbowX)*rest,ey=elbowY+(-42-elbowY)*rest,hx=handX+(side*18-handX)*rest,hy=handY+(-10-handY)*rest;
    c.strokeStyle=side<0?'#d6a47e':'#edc39c';c.lineWidth=11;c.beginPath();c.moveTo(side*19,-74);c.lineTo(ex,ey);c.lineTo(hx,hy);c.stroke();
    burgerOval(c,hx,hy,6,8,'#efc5a2');
    burgerOval(c,hx-4,hy+2,3,4,'#f6d6b6');
  }
  burgerPoly(c,[[-21,-83],[18,-83],[24,-60],[20,1],[-20,1],[-25,-60]],burgerGradient(c,-83,2,['#df8c7b','#b9635c']));
  burgerPoly(c,[[-20,-82],[-31,-70],[-24,-56],[-12,-63]],'#cc796b');burgerPoly(c,[[17,-82],[29,-69],[24,-57],[12,-65]],'#e39884');
  burgerRound(c,-10,-100,20,23,5,'#e7b48e');
  burgerPoly(c,[[-13,-86],[0,-77],[-5,-65],[-19,-82]],'#efb19a');burgerPoly(c,[[0,-77],[12,-88],[20,-82],[7,-65]],'#efb19a');
  c.strokeStyle='#f1b8a466';c.lineWidth=2;c.beginPath();c.moveTo(2,-67);c.lineTo(2,-7);c.moveTo(-18,-17);c.lineTo(-7,-22);c.moveTo(7,-36);c.lineTo(18,-31);c.stroke();
  for(const y of [-57,-39,-21])burgerOval(c,2,y,1.7,1.7,'#683f43');
  c.fillStyle='#514543';c.fillRect(-20,-3,40,6);c.strokeStyle='#cab88e';c.lineWidth=2;c.strokeRect(-4,-3,8,6);
  // Sculpted face, ear, hair, nose, and an unmistakable startled expression.
  burgerOval(c,0,-119,23,29,burgerGradient(c,-148,-90,['#f7d6b4','#dfaa83']));burgerOval(c,-22,-117,5,8,'#d7a37f');burgerOval(c,-22,-117,2,4,'#bd876c');
  burgerPoly(c,[[14,-119],[26,-110],[16,-108]],'#e4b08c');
  c.fillStyle='#58463d';c.beginPath();c.moveTo(-23,-118);c.bezierCurveTo(-34,-147,-11,-158,10,-148);c.bezierCurveTo(28,-148,24,-132,17,-133);c.lineTo(7,-139);c.quadraticCurveTo(-6,-126,-20,-133);c.closePath();c.fill();
  c.strokeStyle='#81634e';c.lineWidth=3;c.beginPath();c.moveTo(-18,-143);c.quadraticCurveTo(-4,-152,13,-141);c.stroke();
  for(const x of [-4,12]){
    burgerOval(c,x,-119,4.5,surprised?6:3.5,'#fff9eb');burgerOval(c,x+1,-118,2.2,surprised?3.2:2.5,'#354450');burgerOval(c,x,-120,1,1,'#fff');
    c.strokeStyle='#624c40';c.lineWidth=2;c.beginPath();c.moveTo(x-5,surprised?-132:-127);c.quadraticCurveTo(x,surprised?-136:-129,x+4,surprised?-132:-127);c.stroke();
  }
  if(surprised){burgerOval(c,8,-102,6,8,'#703e40');burgerOval(c,8,-99,3,2,'#dc8c83');}
  else{c.strokeStyle='#a56c59';c.lineWidth=2;c.beginPath();c.arc(8,-106,6,0,Math.PI);c.stroke();}
  if(time<3.15)drawSmallBurger(c,43+kick,-111-kick,.65,time>1.3);
  c.restore();
  if(time>=3&&time<3.7&&!reduced)for(let i=0;i<8;i++){const age=(time-3),x=400+(i-3.5)*age*70,y=503-Math.sin(Math.min(1,age/.7)*Math.PI)*(18+i%3*12);burgerOval(c,x,y,2,4,'#83b9c9');}
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
  drawBurgerPerson(c,time,reduced);
  if(time>=3.15&&time<5.5){
    const release=burgerPersonPose(3.15),kick=Math.sin(release.fall*Math.PI)*30,lx=43+kick,ly=-111-kick;
    const fromX=release.x+lx*Math.cos(release.angle)-ly*Math.sin(release.angle),fromY=release.y+lx*Math.sin(release.angle)+ly*Math.cos(release.angle);
    const p=burgerClamp((time-3.15)/2.35,0,1),x=fromX+(735-fromX)*p,y=fromY+(420-fromY)*p-Math.sin(p*Math.PI)*230;
    c.save();c.translate(x,y);c.rotate(reduced?0:p*Math.PI*3);drawSmallBurger(c,0,0,.65,true);c.restore();
  }
  burgerPoly(c,[[694,423],[776,423],[765,515],[705,515]],'#526f79');c.strokeStyle='#92adb1';c.lineWidth=4;for(let x=710;x<770;x+=16){c.beginPath();c.moveTo(x,438);c.lineTo(x,501);c.stroke();}
  burgerRound(c,689,420,92,9,4,'#829ea3');c.fillStyle='#e2eece';c.font='bold 15px sans-serif';c.textAlign='center';c.fillText('TRASH',735,474);
  if(time>=5.5){c.fillStyle='#477a8b';c.font='bold 24px sans-serif';c.fillText('Plop!',735,393);}
  c.textAlign='center';c.fillStyle='#344e5d';c.font='bold 34px sans-serif';c.fillText(time<3?'One very tall snack…':'Oops! There goes lunch!',450,85);
  c.font='bold 25px sans-serif';c.fillText(score+' layers stacked · Best '+Math.max(score,best),450,577);c.restore();
}
function drawBurgerBackdrop(c,background){
  if(background==='classic'){
    c.fillStyle=burgerGradient(c,0,720,['#176d83','#5c9e9f','#b0c6a0']);c.fillRect(0,0,620,720);
    for(let i=0;i<14;i++){c.fillStyle='#ffffff22';c.fillRect((i*97)%620,(i*131)%720,3,3);}return;
  }
  const kitchen=background==='kitchen',diner=background==='diner';
  c.fillStyle=burgerGradient(c,0,720,kitchen?['#f5e6ce','#d7c7ae']:diner?['#f5d9cc','#f8eddb']:['#a8d9dc','#e5edbd']);c.fillRect(0,0,620,720);
  if(kitchen){
    // A home kitchen with a garden window, crockery, and wooden cupboards.
    burgerRound(c,355,190,210,235,8,'#b99b79');burgerRound(c,365,200,190,215,4,'#bee0e4');
    burgerOval(c,510,239,25,25,'#fff0bd');burgerOval(c,450,403,130,70,'#8ab397');burgerOval(c,560,425,110,78,'#6d9d81');
    c.fillStyle='#fff5df';c.fillRect(456,200,8,215);c.fillRect(365,300,190,8);c.fillRect(348,415,224,12);
    for(const x of [32,180]){
      burgerRound(c,x,210,129,160,5,'#b89974');burgerRound(c,x+6,216,117,146,3,'#d5b58d');
      c.strokeStyle='#ac8962';c.lineWidth=2;c.strokeRect(x+15,225,99,126);burgerRound(c,x+102,277,5,26,2,'#795d47');
    }
    c.fillStyle='#b5936b';c.fillRect(28,449,277,12);
    for(let i=0;i<3;i++){burgerOval(c,75+i*56,439,21,8,'#fff7e7');burgerRound(c,55+i*56,411,40,27,5,['#829c9b','#d78c78','#d3ad61'][i]);}
    burgerRound(c,471,465,49,45,5,'#c88d67');c.strokeStyle='#638b62';c.lineWidth=4;c.beginPath();c.moveTo(495,468);c.lineTo(495,426);c.stroke();burgerOval(c,482,437,16,6,'#79a076');burgerOval(c,510,447,18,7,'#638f6b');
  }else if(diner){
    for(let y=180;y<520;y+=40)for(let x=0;x<620;x+=40){c.fillStyle=(x/40+y/40)%2?'#fff4e2':'#d9b9a8';c.fillRect(x,y,39,39);}
    burgerRound(c,65,200,490,78,16,'#b95454');c.fillStyle='#fff0c8';c.textAlign='center';c.font='bold 28px sans-serif';c.fillText('THE STACK SHACK',310,248);
    burgerRound(c,35,355,550,170,24,'#bd6561');for(let x=65;x<580;x+=55){c.strokeStyle='#de9083';c.lineWidth=3;c.beginPath();c.moveTo(x,370);c.lineTo(x,505);c.stroke();}
    for(const x of [92,528]){c.strokeStyle='#665651';c.lineWidth=4;c.beginPath();c.moveTo(x,175);c.lineTo(x,310);c.stroke();burgerPoly(c,[[x-35,343],[x+35,343],[x+18,309],[x-18,309]],'#e6b55f');burgerOval(c,x,344,32,5,'#ffe6a1');}
  }else{
    burgerOval(c,510,228,43,43,'#fff1ba');for(let i=0;i<4;i++)burgerOval(c,i*220,510,210,100+i%2*40,['#a7c78e','#89b181'][i%2]);
    c.fillStyle='#efe6c8';for(let x=10;x<620;x+=38){burgerRound(c,x,423,18,102,4,'#efe6c8');}c.fillRect(0,446,620,9);c.fillRect(0,489,620,9);
    for(let i=0;i<9;i++){const x=25+i*72;c.strokeStyle='#648c5e';c.lineWidth=3;c.beginPath();c.moveTo(x,530);c.lineTo(x,489-i%3*14);c.stroke();burgerOval(c,x,489-i%3*14,7,7,i%2?'#eeb981':'#dc8ca2');burgerOval(c,x,489-i%3*14,2,2,'#fff0b4');}
  }
  c.fillStyle=burgerGradient(c,530,720,diner?['#e8ded0','#bfb4a5']:['#d4a578','#a97652']);c.fillRect(0,530,620,190);c.fillStyle='#f0cda3';c.fillRect(0,530,620,9);
  if(!diner){c.strokeStyle='#8f62462c';c.lineWidth=2;for(let y=558;y<720;y+=34){c.beginPath();c.moveTo(0,y);c.bezierCurveTo(150,y-9,330,y+9,620,y-3);c.stroke();}}
  if(background==='picnic'){c.save();c.beginPath();c.rect(35,548,125,150);c.clip();for(let y=548;y<710;y+=18)for(let x=35;x<165;x+=18){c.fillStyle=(x+y)%36?'#d7756b':'#f7e4d2';c.fillRect(x,y,18,18);}c.restore();}
}
function drawBurgerPlate(c,camera){
  const y=614+camera;if(y>780)return;
  burgerOval(c,330,y+24,205,39,'#483f352c');burgerOval(c,330,y+9,202,48,'#a5b9bc');
  burgerOval(c,330,y,202,48,'#f5f6e9');burgerOval(c,330,y,177,36,'#bed5d7');burgerOval(c,330,y+2,168,31,'#e8f0e7');
  c.strokeStyle='#ffffffaa';c.lineWidth=3;c.beginPath();c.ellipse(330,y,192,43,0,0,Math.PI*2);c.stroke();
}
export function drawBurgerScene(c,s,width,height,best=0,reduced=false){
  if(s.status==='ending'||s.status==='finished'){drawBurgerEnding(c,s.clip,width,height,s.score,best,reduced);return;}
  c.save();c.scale(width/620,height/720);
  drawBurgerBackdrop(c,s.background);
  burgerRound(c,112,18,396,147,22,'#234653de');
  c.textAlign='center';c.fillStyle='#fff4d4';c.font='bold 21px sans-serif';c.fillText('STACK THE HAMBURGER',310,48);c.font='64px sans-serif';c.fillText(String(s.score),310,121);c.font='16px sans-serif';c.fillText('Best: '+Math.max(best,s.score)+' layers',310,152);
  drawBurgerPlate(c,s.camera);
  for(let i=Math.max(0,s.layers.length-16);i<s.layers.length;i++){const y=600-i*25+s.camera;if(y<720)drawBurgerLayer(c,s.layers[i],y);}
  for(const piece of s.scraps){c.save();c.translate(piece.x+piece.width/2,piece.y);c.rotate(reduced?0:piece.angle);drawBurgerLayer(c,{...piece,x:-piece.width/2},0);c.restore();}
  if(['playing','dropping','ready'].includes(s.status)){const y=600-s.layers.length*25+s.camera-(s.status==='dropping'?BURGER_HOVER*(1-s.drop)**2:BURGER_HOVER);drawBurgerLayer(c,s.moving,y);}
  burgerRound(c,85,666,450,34,17,'#1b566b99');c.fillStyle='#fff4dc';c.font='16px sans-serif';c.fillText(s.status==='missed'?'Missed! Watch what happens to lunch…':'Click / tap / Space to drop the next layer',310,689);c.restore();
}
export function drawBurgerPreview(canvas){const c=canvas.getContext('2d');if(!c)return;const s=createBurgerState();for(let i=0;i<7;i++)s.layers.push({x:190+i*5,width:220-i*9,kind:BURGER_INGREDIENTS[i%5]});s.score=7;drawBurgerScene(c,s,canvas.width,canvas.height,7,true);}
export function createBurgerStack({canvas,onHud,onFinish,bestScore=0,controls=document.querySelector('#burger-controls')}){
  const c=canvas.getContext('2d');if(!c)throw Error('Canvas is unavailable.');
  const audio=createMazeAudio(),controller=new AbortController(),events={signal:controller.signal};
  let background='kitchen';try{const saved=localStorage.getItem('sidequest.burger.background.v1');if(Object.hasOwn(BURGER_BACKGROUNDS,saved))background=saved;}catch{}
  let s=createBurgerState(background),active=false,paused=false,destroyed=false,last=0,frame;
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  const dropButton=document.createElement('button'),skip=document.createElement('button');dropButton.type=skip.type='button';dropButton.className='button dark';skip.className='button outline';dropButton.textContent='Drop layer ↓';skip.textContent='Skip ending';
  const tip=document.createElement('p');tip.textContent='Cheese, lettuce, tomato, patty, bun — repeat! Only the overlapping part stays. Each new layer is exactly as wide as the last. Earn 1 coin per layer, up to 40 per game.';
  const label=document.createElement('label');label.textContent='Choose your background ';const backgroundSelect=document.createElement('select');
  for(const [id,name] of Object.entries(BURGER_BACKGROUNDS)){const option=document.createElement('option');option.value=id;option.textContent=name;backgroundSelect.append(option);}
  backgroundSelect.value=background;backgroundSelect.onchange=()=>{if(!Object.hasOwn(BURGER_BACKGROUNDS,backgroundSelect.value))return;background=backgroundSelect.value;s.background=background;try{localStorage.setItem('sidequest.burger.background.v1',background);}catch{}};
  label.append(backgroundSelect);controls.replaceChildren(dropButton,skip,tip,label);
  const drop=()=>{if(!active||paused||document.hidden)return;audio.unlock();dropBurger(s);canvas.focus({preventScroll:true});};
  dropButton.onclick=drop;canvas.addEventListener('pointerdown',e=>{if(e.button>0)return;e.preventDefault();drop();},events);
  canvas.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(!e.repeat)drop();}},events);
  skip.onclick=()=>{if(active&&!paused&&!document.hidden&&s.status==='ending'){s.clip=7.5;s.status='finished';audio.stop();finish();}};
  document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden)audio.stop();},events);
  function finish(){if(!active)return;active=false;bestScore=Math.max(bestScore,s.score);onFinish(Math.min(40,s.score),{title:s.score?'A '+s.score+'-layer hamburger!':'Try another hamburger!',detail:'Best: '+bestScore+' layers. Time your drop to keep more of each layer.',score:s.score});}
  function tick(now){if(destroyed)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(active&&!paused&&!document.hidden){tickBurger(s,dt,cue=>audio.play(cue));if(s.status==='finished')finish();}dropButton.disabled=!active||paused||s.status!=='playing';skip.hidden=s.status!=='ending';skip.disabled=!active||paused;drawBurgerScene(c,s,canvas.width,canvas.height,bestScore,reduced);onHud({text:s.score+' layers · Best '+Math.max(bestScore,s.score)+' · '+(s.status==='ending'?'Watch your hamburger’s adventure!':'Stack as high as you can.')});frame=requestAnimationFrame(tick);}
  frame=requestAnimationFrame(tick);
  return {start(){audio.stop();audio.unlock();s=createBurgerState(background);s.status='playing';active=true;paused=false;last=0;canvas.focus();},pause(value){paused=value;last=0;if(value)audio.stop();},setMuted:value=>audio.setMuted(value),destroy(){if(destroyed)return;destroyed=true;finish();controller.abort();audio.destroy();cancelAnimationFrame(frame);controls.replaceChildren();}};
}
