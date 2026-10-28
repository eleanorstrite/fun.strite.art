// These tribes follow the same ordering as the photographic matching-card atlas.
export const DRAGON_TRIBE_EFFECTS=['fire','leaves','frost','petals','fire','sunlight','water','petals','water','clouds','stars','mud','frost','leaves','fire','stars','fireball','petals','mud','rainbows'];
export const DRAGON_CELEBRATION_SECONDS=9;
export function dragonCelebrationPhase(time){return time<2?'arrival':time<3.2?'charge':time<6.8?'blast':'good-job';}
const ease=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
const random=i=>{const value=Math.sin(i*127.1+31.7)*43758.5453;return value-Math.floor(value);};
const themes={clouds:['#4b718c','#f4fcff'],fireball:['#2d0f22','#ff9b32'],fire:['#281326','#ffb04a'],leaves:['#132e26','#a1da75'],frost:['#17354b','#d9f8ff'],stars:['#100e32','#e3c9ff'],mud:['#2c211b','#c4a079'],rainbows:['#202044','#ffd5f6'],petals:['#34203e','#ffc6ec'],water:['#102e47','#8ee6ff'],sunlight:['#322544','#ffe39b']};
function leaf(c,petal=false){
 c.beginPath();c.moveTo(0,-47);c.bezierCurveTo(45,-24,35,27,0,45);c.bezierCurveTo(-32,23,-39,-19,0,-47);c.closePath();
 const color=c.createLinearGradient(-30,-30,30,35);color.addColorStop(0,petal?'#ffddeb':'#abc969');color.addColorStop(.38,petal?'#e67fbc':'#588f31');color.addColorStop(.55,petal?'#f5add8':'#82ad40');color.addColorStop(1,petal?'#9f467f':'#234b22');c.fillStyle=color;c.fill();c.save();c.clip();
 c.lineWidth=.65;c.strokeStyle=petal?'#fff2f163':'#c3d88b99';for(let y=-33;y<35;y+=8){for(const side of [-1,1]){c.beginPath();c.moveTo(0,y+12);c.quadraticCurveTo(side*14,y+4,side*32,y-12);c.stroke();}}
 c.strokeStyle=petal?'#fcd7e4':'#c3cf86';c.lineWidth=1.3;c.beginPath();c.moveTo(0,-43);c.quadraticCurveTo(-3,3,0,45);c.stroke();c.restore();if(!petal){c.strokeStyle='#7a783d';c.lineWidth=2;c.beginPath();c.moveTo(0,43);c.quadraticCurveTo(2,51,7,55);c.stroke();}
}
function particle(effect){
 const sprite=document.createElement('canvas');sprite.width=sprite.height=144;const c=sprite.getContext('2d');c.translate(72,72);
 if(effect==='leaves'||effect==='petals')leaf(c,effect==='petals');
 else if(effect==='clouds'){
  // Layer rounded volumes with bright tops and soft blue-grey undersides.
  for(const [x,y,r]of [[-31,9,24],[-13,-10,29],[16,-17,32],[38,7,23],[8,16,32]]){const g=c.createRadialGradient(x-5,y-r*.4,2,x,y,r);g.addColorStop(0,'#ffffffff');g.addColorStop(.5,'#f0f7fce8');g.addColorStop(.83,'#bacddbd0');g.addColorStop(1,'#a5bdcf00');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
 }
 else if(effect==='frost'){c.strokeStyle='#e5faff';c.shadowColor='#71cafa';c.shadowBlur=6;c.lineWidth=2;for(let arm=0;arm<6;arm++){c.save();c.rotate(arm*Math.PI/3);c.beginPath();c.moveTo(0,0);c.lineTo(0,-52);for(const y of [-22,-36]){c.moveTo(-10,y-10);c.lineTo(0,y);c.lineTo(10,y-10);}c.stroke();c.restore();}}
 else if(effect==='mud'){const g=c.createRadialGradient(-12,-18,1,0,0,60);g.addColorStop(0,'#ac7951');g.addColorStop(.4,'#705039');g.addColorStop(1,'#38251c');c.fillStyle=g;c.beginPath();for(let i=0;i<40;i++){const a=i/40*Math.PI*2,r=30+random(i)*26;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.fillStyle='#dbb08055';c.beginPath();c.ellipse(-12,-16,12,5,-.5,0,Math.PI*2);c.fill();for(let i=0;i<12;i++){c.fillStyle=i%2?'#30241c60':'#dab28450';c.beginPath();c.arc((random(i+30)-.5)*55,(random(i+60)-.5)*55,1+random(i)*3,0,Math.PI*2);c.fill();}}
 else if(effect==='water'){const g=c.createRadialGradient(-10,-10,2,0,0,52);g.addColorStop(0,'#e2ffffe0');g.addColorStop(.4,'#4cc1eac0');g.addColorStop(1,'#1669b450');c.fillStyle=g;c.beginPath();c.moveTo(0,-55);c.bezierCurveTo(10,-25,40,0,33,25);c.bezierCurveTo(20,58,-30,50,-33,20);c.bezierCurveTo(-35,0,-8,-29,0,-55);c.fill();c.strokeStyle='#e4ffffb0';c.lineWidth=3;c.beginPath();c.ellipse(-13,12,7,17,.3,0,Math.PI);c.stroke();}
 else if(effect==='fire'){const g=c.createRadialGradient(0,15,1,0,0,65);g.addColorStop(0,'#fff5bb');g.addColorStop(.25,'#ffd54ae0');g.addColorStop(.55,'#ff691cbb');g.addColorStop(1,'#f3230000');c.fillStyle=g;c.beginPath();c.moveTo(0,-66);c.bezierCurveTo(24,-35,-3,-20,33,0);c.bezierCurveTo(66,54,-55,70,-35,5);c.bezierCurveTo(-20,-20,-3,-23,0,-66);c.fill();}
 else{c.shadowColor=effect==='sunlight'?'#ffc148':'#a9a4ff';c.shadowBlur=15;c.fillStyle=effect==='sunlight'?'#ffe9a7':'#fff5e3';c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?17:48;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();}
 return sprite;
}
export function createDragonCelebration(board,kind=0,name='Your dragon'){
 if(!Number.isInteger(kind)||kind<0||kind>=20)kind=0;
 const effect=DRAGON_TRIBE_EFFECTS[kind],effectName=effect==='sunlight'?'sun rays':effect==='fireball'?'one giant fireball':effect,theme=themes[effect],stage=document.createElement('section');stage.className='dragon-celebration';stage.dataset.dragon=String(kind);stage.dataset.effect=effect;stage.setAttribute('aria-label',`${name} victory celebration`);
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=720;canvas.setAttribute('aria-hidden','true');const caption=document.createElement('p');caption.className='dragon-celebration-caption';caption.setAttribute('role','status');stage.append(canvas,caption);board.before(stage);board.hidden=true;
 const ctx=canvas.getContext('2d'),art=new Image(),reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches,projectile=particle(effect);let sprite=null,previous='';
 art.onload=()=>{sprite=document.createElement('canvas');sprite.width=sprite.height=512;const c=sprite.getContext('2d');c.drawImage(art,(kind%5)*art.naturalWidth/5,Math.floor(kind/5)*art.naturalHeight/4,art.naturalWidth/5,art.naturalHeight/4,0,0,512,512);c.globalCompositeOperation='destination-in';const mask=c.createRadialGradient(256,256,180,256,256,350);mask.addColorStop(0,'#000');mask.addColorStop(1,'#0000');c.fillStyle=mask;c.fillRect(0,0,512,512);};art.src='./assets/dragon-memory-colors.png';
 function draw(time){
  const phase=dragonCelebrationPhase(time);stage.dataset.phase=phase;if(previous!==phase){caption.textContent={arrival:`${name} — your last matched dragon!`,charge:`${name} is gathering ${effectName}…`,blast:effect==='fireball'?'One giant fireball!':`A blast of ${effectName}!`,'good-job':'Good job!'}[phase];previous=phase;}if(!ctx)return;
  const sky=ctx.createRadialGradient(480,300,40,480,360,700);sky.addColorStop(0,theme[1]);sky.addColorStop(.6,theme[0]);sky.addColorStop(1,'#0c1527');ctx.fillStyle=sky;ctx.fillRect(0,0,960,720);
  const arrival=reduced?1:ease(time/2),size=400+arrival*170,x=480,y=350+(1-arrival)*180+(reduced?0:Math.sin(time*1.8)*3);
  if(sprite)ctx.drawImage(sprite,x-size/2,y-size/2,size,size);
  const mouth={x:x+size*.36,y:y-size*.22},charge=ease((time-2)/1.2)*(1-ease((time-3.2)/.6));
  if(charge>0){const glow=ctx.createRadialGradient(mouth.x,mouth.y,0,mouth.x,mouth.y,65);glow.addColorStop(0,theme[1]);glow.addColorStop(1,theme[1]+'00');ctx.globalAlpha=charge*.75;ctx.fillStyle=glow;ctx.fillRect(mouth.x-65,mouth.y-65,130,130);ctx.globalAlpha=1;}
  const age=time-3.2,envelope=ease(age/.5)*(1-ease((time-6.1)/.7));
  if(envelope>0){
   ctx.save();ctx.globalAlpha=envelope;
   if(effect==='fireball'){
    // Exactly one projectile, growing toward the camera for the entire blast.
    const flight=ease(age/2.6),cx=mouth.x+(480-mouth.x)*flight,cy=mouth.y+(360-mouth.y)*flight,r=18+flight*(reduced?220:450);
    const glow=ctx.createRadialGradient(cx-r*.15,cy-r*.2,0,cx,cy,r);glow.addColorStop(0,'#fffce8');glow.addColorStop(.28,'#fff29c');glow.addColorStop(.58,'#ffc12c');glow.addColorStop(.8,'#f65116ed');glow.addColorStop(1,'#e5250000');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();

   }else if(effect==='sunlight'){
    const reach=ease(age/1.8);ctx.save();ctx.globalCompositeOperation='screen';
    for(let ray=0;ray<18;ray++){const a=ray*Math.PI*2/18+(reduced?0:Math.sin(age*.5)*.08),length=1100*reach,half=.018+(ray%3)*.012;const g=ctx.createLinearGradient(mouth.x,mouth.y,mouth.x+Math.cos(a)*length,mouth.y+Math.sin(a)*length);g.addColorStop(0,'#fffcebc0');g.addColorStop(.25,'#ffe7a78f');g.addColorStop(.75,'#ffc75245');g.addColorStop(1,'#ffbc3400');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(mouth.x,mouth.y);ctx.lineTo(mouth.x+Math.cos(a-half)*length,mouth.y+Math.sin(a-half)*length);ctx.lineTo(mouth.x+Math.cos(a+half)*length,mouth.y+Math.sin(a+half)*length);ctx.closePath();ctx.fill();}
    const halo=ctx.createRadialGradient(mouth.x,mouth.y,0,mouth.x,mouth.y,150);halo.addColorStop(0,'#fffdebe0');halo.addColorStop(.25,'#ffecaa80');halo.addColorStop(1,'#ffdb6000');ctx.fillStyle=halo;ctx.fillRect(mouth.x-150,mouth.y-150,300,300);ctx.restore();
   }else if(effect==='rainbows'){
    const colors=['#ff5b68','#ffab44','#ffe66a','#77e695','#63d5ff','#9e8cff','#ed8fe7'];ctx.lineCap='round';for(let ribbon=0;ribbon<5;ribbon++)for(let band=0;band<7;band++){ctx.strokeStyle=colors[band];ctx.lineWidth=9+ease(age/2)*10;ctx.beginPath();ctx.moveTo(mouth.x,mouth.y);const endX=80+ribbon*200,endY=600+band*14;ctx.bezierCurveTo(mouth.x-300,50+band*18,endX+Math.sin(reduced?0:time*2+ribbon)*80,200+band*18,endX,endY);ctx.stroke();}
   }else for(let i=0;i<(reduced?25:100);i++){
    const birth=random(i+200)*1.7,travel=(age-birth)/1.65;if(travel<0||travel>1.5)continue;const p=Math.min(travel,1),spread=p*p;
    const endX=-170+random(i+5)*1300,endY=-140+random(i+80)*1000,px=mouth.x+(endX-mouth.x)*spread,py=mouth.y+(endY-mouth.y)*spread;
    const r=(8+spread*(effect==='mud'?180:135))*(reduced?.55:1);ctx.save();ctx.translate(px,py);if(effect!=='clouds')ctx.rotate(random(i)*Math.PI*2+(reduced?0:travel*(random(i+40)-.5)*5));if(effect==='leaves'||effect==='petals')ctx.scale(.65+.35*Math.abs(Math.cos(travel*3+i)),1);ctx.globalAlpha=envelope*(travel>1?1-ease((travel-1)/.5):1);ctx.drawImage(projectile,-r,-r,r*2,r*2);ctx.restore();
   }ctx.restore();
  }
  if(time>=6.8){const reveal=ease((time-6.8)/.6);ctx.fillStyle=`rgba(10,20,38,${reveal*.72})`;ctx.fillRect(0,0,960,720);ctx.save();ctx.globalAlpha=reveal;ctx.textAlign='center';ctx.shadowColor=theme[1];ctx.shadowBlur=25;ctx.fillStyle='#fff1b6';ctx.font='bold 100px Georgia,serif';ctx.fillText('Good job!',480,345);ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.font='26px sans-serif';ctx.fillText(`${name} celebrates with you!`,480,397);ctx.restore();}
 }
 draw(0);return {draw,destroy(){art.onload=null;sprite=null;stage.remove();board.hidden=false;}};
}
