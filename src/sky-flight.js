import { FLIGHT_LEVELS, FLIGHT_DEFAULTS, validateFlightSettings } from './flight-settings.js';
import { createMazeAudio } from './maze-audio.js';
export const FLIGHT_WIDTH=540, FLIGHT_HEIGHT=720, FLIGHT_FLOOR=680;
export function createFlightState(settings=FLIGHT_DEFAULTS,random=Math.random){
  const config=validateFlightSettings(settings);
  const state={settings:config,level:FLIGHT_LEVELS[config.difficulty],x:150,y:330,velocity:0,radius:16,pipes:[],passed:0,earned:0,time:0,distance:0,status:'ready',crashTime:0,random};
  addPipe(state,680);addPipe(state,980);addPipe(state,1280);return state;
}
function addPipe(s,x){
  const previous=s.pipes.at(-1),margin=s.level.gap/2+65;
  let center=margin+s.random()*(FLIGHT_FLOOR-2*margin);
  if(previous)center=Math.max(previous.center-105,Math.min(previous.center+105,center));
  s.pipes.push({x,width:70,center,scored:false});
}
export function flapFlight(s){if(s.status==='playing')s.velocity=-340;}
function circleRect(x,y,r,left,top,width,height){
  const nearX=Math.max(left,Math.min(x,left+width)),nearY=Math.max(top,Math.min(y,top+height));
  return (x-nearX)**2+(y-nearY)**2<=r*r;
}
export function tickFlight(s,dt,onPass=()=>{}){
  if(s.status!=='playing')return;
  let remaining=Math.max(0,Math.min(dt,.1));
  while(remaining>1e-7&&s.status==='playing'){
    const step=Math.min(remaining,1/120);remaining-=step;s.time+=step;s.distance+=s.level.speed*step;s.velocity+=1000*step;s.y+=s.velocity*step;
    for(const pipe of s.pipes)pipe.x-=s.level.speed*step;
    if(s.y-s.radius<=0||s.y+s.radius>=FLIGHT_FLOOR){s.status='lost';break;}
    for(const pipe of s.pipes){
      const upper=pipe.center-s.level.gap/2,lower=pipe.center+s.level.gap/2;
      if(circleRect(s.x,s.y,s.radius,pipe.x-7,0,pipe.width+14,upper)||circleRect(s.x,s.y,s.radius,pipe.x-7,lower,pipe.width+14,FLIGHT_FLOOR-lower)){s.status='lost';break;}
      if(!pipe.scored&&pipe.x+pipe.width+7<s.x-s.radius){pipe.scored=true;s.passed++;s.earned=s.passed*s.level.reward;onPass(s.level.reward);}
    }
    if(s.pipes[0]?.x< -100){s.pipes.shift();addPipe(s,s.pipes.at(-1).x+300);}
  }
}
function polygon(ctx,points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
export function drawFlyer(ctx,x,y,size,settings,time=0,tilt=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(tilt);ctx.scale(size/80,size/80);
  const flap=Math.sin(time*(settings.animal==='hummingbird'?34:10)),color=settings.color;
  // Original animated silhouettes inspired by the supplied animal references.
  if(settings.animal==='cat'||settings.animal==='dog'){
    const cat=settings.animal==='cat';
    // A curved cat tail or a wagging dog tail, behind the rocket pack.
    ctx.strokeStyle=color;ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-20,11);
    ctx.quadraticCurveTo(-48,cat?30:5+flap*8,-42,cat?-5:0+flap*8);ctx.stroke();
    polygon(ctx,[[-28,0],[-68,10+flap*6],[-48,-5],[-72,-16-flap*6],[-28,-17]],'#f69945');
    polygon(ctx,[[-28,-3],[-53,-1],[-42,-10],[-28,-13]],'#ffe898');
    ctx.fillStyle='#536b83';ctx.fillRect(-32,-30,22,36);
    ctx.fillStyle='#b9d5df';ctx.fillRect(-29,-27,7,28);
    ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(-1,6,27,19,0,0,7);ctx.ellipse(24,-7,19,18,0,0,7);
    ctx.ellipse(-10,23,8,5,0,0,7);ctx.ellipse(16,22,8,5,0,0,7);ctx.fill();
    if(cat){
      polygon(ctx,[[9,-17],[9,-38],[23,-22]],color);
      polygon(ctx,[[27,-22],[41,-35],[40,-12]],color);
      polygon(ctx,[[12,-22],[12,-31],[19,-23]],'#edabb4');
      polygon(ctx,[[31,-22],[38,-29],[37,-19]],'#edabb4');
      ctx.fillStyle='#fff0dc';ctx.beginPath();ctx.ellipse(35,1,10,7,0,0,7);ctx.fill();
      polygon(ctx,[[36,-2],[42,-2],[39,2]],'#d57e92');
      ctx.strokeStyle='#453e48';ctx.lineWidth=1.5;
      for(const dy of [-4,3]){ctx.beginPath();ctx.moveTo(33,3);ctx.lineTo(20,3+dy);ctx.moveTo(42,3);ctx.lineTo(53,3+dy);ctx.stroke();}
    }else{
      ctx.fillStyle='#ffffff35';ctx.beginPath();ctx.ellipse(39,2,15,10,0,0,7);ctx.fill();
      ctx.fillStyle='#5d4339';ctx.beginPath();ctx.ellipse(11,-10,9,20,-.3,0,7);ctx.fill();
      ctx.fillStyle='#26323d';ctx.beginPath();ctx.ellipse(49,-1,5,4,0,0,7);ctx.fill();
      ctx.fillStyle='#eb9bab';ctx.beginPath();ctx.ellipse(41,13,4,7,-.15,0,7);ctx.fill();
    }
    ctx.strokeStyle='#536b83';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-10,-12);ctx.lineTo(-7,20);ctx.stroke();
    ctx.strokeStyle='#e6b65d';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(16,9);ctx.lineTo(24,12);ctx.stroke();
  }else if(settings.animal==='capybara'){
    // Rounded snout, little ears and paws, with twin metal rocket tanks.
    polygon(ctx,[[-28,5],[-64,12+flap*5],[-43,-2],[-70,-9-flap*5],[-27,-12]],'#f69945');
    polygon(ctx,[[-28,1],[-52,4],[-36,-7],[-27,-8]],'#ffe898');
    ctx.fillStyle='#536b83';ctx.fillRect(-32,-27,21,38);
    ctx.fillStyle='#b9d5df';ctx.fillRect(-29,-24,7,29);
    ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(-1,4,30,22,0,0,7);ctx.ellipse(27,-5,22,19,0,0,7);ctx.fill();
    ctx.beginPath();ctx.ellipse(16,-23,7,8,-.3,0,7);ctx.ellipse(-9,24,8,6,0,0,7);ctx.ellipse(20,22,8,6,0,0,7);ctx.fill();
    ctx.fillStyle='#ffffff35';ctx.beginPath();ctx.ellipse(37,1,12,10,0,0,7);ctx.fill();
    ctx.fillStyle='#41332c';ctx.beginPath();ctx.arc(44,-3,3,0,7);ctx.fill();
    ctx.strokeStyle='#654e40';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(34,8);ctx.lineTo(43,8);ctx.stroke();
    ctx.strokeStyle='#536b83';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-12,-15);ctx.lineTo(-9,18);ctx.stroke();
  }else if(settings.animal==='dragon'){
    polygon(ctx,[[-5,0],[-28,-12],[-69,-35-flap*15],[-48,-34-flap*18],[-22,-60-flap*18],[4,-12]],color);
    polygon(ctx,[[-15,-8],[-53,-32-flap*14],[-36,-27-flap*13],[-21,-48-flap*15],[-1,-12]],'#f7ba737f');
    polygon(ctx,[[-22,5],[-56,18],[-75,8],[-57,26],[-13,13]],color);
    ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,5,29,13,-.1,0,7);ctx.ellipse(29,-1,18,10,.2,0,7);ctx.fill();
    polygon(ctx,[[30,-8],[23,-23],[36,-10]],'#e7dcb8');polygon(ctx,[[41,0],[55,5],[39,8]],color);
    polygon(ctx,[[-8,11],[-13,23],[-3,20],[3,10]],color);polygon(ctx,[[14,10],[12,22],[22,18],[22,8]],color);
  }else{
    const eagle=settings.animal==='eagle';
    polygon(ctx,[[-10,4],[-55,eagle?18:8],[-38,26],[0,13]],eagle?'#f4eee2':color);
    ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,3,28,15,-.16,0,7);ctx.fill();
    polygon(ctx,[[-14,2],[-39,-25-flap*20],[-20,-58-flap*15],[-8,-48-flap*15],[4,-18],[9,3]],color);
    ctx.strokeStyle='#ffffff66';ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-8+i*4,0);ctx.lineTo(-27+i*4,-38-flap*16);ctx.stroke();}
    ctx.fillStyle=eagle?'#fff3db':color;ctx.beginPath();ctx.ellipse(24,-8,16,14,0,0,7);ctx.fill();
    polygon(ctx,eagle?[[34,-10],[48,-5],[42,5],[40,-2],[33,-2]]:[[35,-9],[68,-17],[36,-5]],eagle?'#e9bc51':'#293344');
    if(!eagle){ctx.fillStyle='#3454a699';ctx.beginPath();ctx.ellipse(23,-1,10,9,0,0,7);ctx.fill();}
  }
  ctx.fillStyle='#172939';ctx.beginPath();ctx.arc(29,-9,2.8,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(30,-10,1,0,7);ctx.fill();ctx.restore();
}
function drawPipe(ctx,p,s){
  const top=p.center-s.level.gap/2,bottom=p.center+s.level.gap/2,c=s.settings.pipeColor;
  for(const [y,h,edge] of [[0,top,top-20],[bottom,FLIGHT_FLOOR-bottom,bottom]]){
    ctx.fillStyle=c;ctx.fillRect(p.x,y,p.width,h);ctx.fillStyle='#ffffff26';ctx.fillRect(p.x+8,y,12,h);ctx.fillStyle='#00000020';ctx.fillRect(p.x+p.width-12,y,12,h);
    if(s.settings.pipe==='stone'){ctx.strokeStyle='#25343955';ctx.lineWidth=2;for(let yy=y+28;yy<y+h;yy+=35){ctx.beginPath();ctx.moveTo(p.x,yy);ctx.lineTo(p.x+p.width,yy);ctx.moveTo(p.x+((Math.floor(yy/35)%2)?22:47),yy);ctx.lineTo(p.x+((Math.floor(yy/35)%2)?22:47),Math.min(yy+35,y+h));ctx.stroke();}}
    if(s.settings.pipe==='vines'){ctx.strokeStyle='#234c42';ctx.lineWidth=4;ctx.beginPath();for(let yy=y;yy<y+h;yy+=8){const xx=p.x+35+Math.sin(yy/25)*20;yy===y?ctx.moveTo(xx,yy):ctx.lineTo(xx,yy);}ctx.stroke();ctx.fillStyle='#b9d68b';for(let yy=y+15;yy<y+h;yy+=45){ctx.beginPath();ctx.ellipse(p.x+30+Math.sin(yy/25)*20,yy,10,5,-.6,0,7);ctx.fill();}}
    if(s.settings.pipe==='crystal'){polygon(ctx,[[p.x+20,y],[p.x+50,y+h*.5],[p.x+35,y+h],[p.x+5,y+h*.4]],'#ffffff36');}
    ctx.fillStyle=c;ctx.fillRect(p.x-7,edge,p.width+14,20);ctx.strokeStyle='#26374566';ctx.lineWidth=2;ctx.strokeRect(p.x-7,edge,p.width+14,20);
  }
}
export function drawFlight(ctx,s,width,height,reducedMotion=false){
  ctx.save();ctx.scale(width/FLIGHT_WIDTH,height/FLIGHT_HEIGHT);
  const dragon=s.settings.animal==='dragon',eagle=s.settings.animal==='eagle';
  const sky=ctx.createLinearGradient(0,0,0,FLIGHT_HEIGHT);sky.addColorStop(0,dragon?'#d98883':eagle?'#96b6d3':'#97d3d1');sky.addColorStop(1,dragon?'#ffe4ac':'#e2efd5');ctx.fillStyle=sky;ctx.fillRect(0,0,540,720);
  ctx.fillStyle='#fff0c7';ctx.beginPath();ctx.arc(420,125,53,0,7);ctx.fill();
  for(let i=0;i<5;i++){const x=((i*170-s.distance*.15)%850+850)%850-150;ctx.fillStyle='#ffffff66';ctx.beginPath();ctx.ellipse(x,140+i%3*70,70,18,0,0,7);ctx.fill();}
  polygon(ctx,[[0,560],[100,360],[230,550],[340,330],[540,530],[540,720],[0,720]],dragon?'#ad8c9c':'#93b8ad');
  polygon(ctx,[[0,610],[180,480],[370,600],[540,460],[540,720],[0,720]],dragon?'#8d8799':'#77a597');
  for(const p of s.pipes)drawPipe(ctx,p,s);
  ctx.fillStyle='#e6d8af';ctx.fillRect(0,FLIGHT_FLOOR,540,40);ctx.fillStyle='#688575';ctx.fillRect(0,FLIGHT_FLOOR,540,6);
  const crash=s.status==='lost',t=s.crashTime;
  const flyerY=crash&&!reducedMotion?Math.min(FLIGHT_FLOOR-24,Math.max(30,s.y)+240*t*t-100*t):s.y;
  drawFlyer(ctx,s.x,flyerY,45,s.settings,s.time,crash?(reducedMotion?0:Math.min(1.5,t*3)):Math.max(-.35,Math.min(.8,s.velocity/650)));
  if(crash){
    ctx.strokeStyle='#fff3c8';ctx.lineWidth=4;ctx.globalAlpha=Math.max(0,1-t*2);
    ctx.beginPath();ctx.arc(s.x,s.y,22+(reducedMotion?0:t*120),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    for(let i=0;i<7;i++){
      const angle=i*Math.PI*2/7+(reducedMotion?0:t*2),r=35+(reducedMotion?0:Math.min(t,.5)*40);
      ctx.fillStyle=i%2?'#fff2ba':'#e9ab43';ctx.font='bold 20px sans-serif';
      ctx.fillText('✦',s.x+Math.cos(angle)*r,flyerY+Math.sin(angle)*r);
    }
    ctx.fillStyle='#233747';ctx.font='bold 28px sans-serif';ctx.fillText(t<.65?'BONK!':'What a flight!',270,280);
  }
  ctx.textAlign='center';ctx.font='bold 38px monospace';ctx.fillStyle='#233747';ctx.fillText(String(s.passed),270,62);ctx.font='15px monospace';ctx.fillText(`${s.level.name} · ${s.level.reward} coin${s.level.reward===1?'':'s'} per pipe`,270,90);
  ctx.restore();
}
export function drawFlightPreview(canvas,character){const ctx=canvas.getContext('2d');if(!ctx)return;const s=createFlightState(character.flight);s.pipes=[{x:380,width:70,center:330}];drawFlight(ctx,s,canvas.width,canvas.height);}
export function createSkyFlight({canvas,character,onHud,onFinish}){
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Your browser does not support canvas.');
  let settings=validateFlightSettings(character.flight),state=createFlightState(settings),active=false,paused=false,destroyed=false,last=0,frame;
  const reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  let flapSoundAt=-Infinity;
  const audio=createMazeAudio(),controller=new AbortController(),options={signal:controller.signal};
  function flap(){
    if(!active||paused||document.hidden||state.status!=='playing')return;
    audio.unlock();flapFlight(state);
    if(state.time-flapSoundAt>=.08){
      audio.play({dragon:'flap',hummingbird:'chirp',eagle:'whoosh',capybara:'jet',cat:'jet',dog:'jet'}[state.settings.animal]);
      flapSoundAt=state.time;
    }
  }
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.focus();flap();},options);
  canvas.addEventListener('keydown',e=>{if([' ','ArrowUp','w','W'].includes(e.key)){e.preventDefault();if(!e.repeat)flap();}},options);
  function hud(){onHud({text:`${state.level.name} · ${state.passed} pipes passed · ✦ ${state.earned} coins`});}
  function finish(){if(!active)return;active=false;onFinish(state.earned,{title:state.status==='lost'?'A brave flight!':'Flight saved.',detail:`${state.passed} pipes × ${state.level.reward} coins · ${state.level.name}`});}
  function tick(now){if(destroyed)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
    if(active&&!paused&&!document.hidden){
      if(state.status==='lost'){
        const before=state.crashTime;state.crashTime+=dt;
        if(before<.55&&state.crashTime>=.55)audio.play('bounce');
        if(before<1.15&&state.crashTime>=1.15)audio.play('flightEnd');
        if(state.crashTime>=2)finish();
      }else{
        tickFlight(state,dt,()=>audio.play('flightCoin'));hud();
        if(state.status==='lost'){audio.play('crash');onHud({text:'Bonk! Coming in for a landing…'});}
      }
    }
    drawFlight(ctx,state,canvas.width,canvas.height,reducedMotion);frame=requestAnimationFrame(tick);
  }
  document.addEventListener?.('visibilitychange',()=>{last=0;if(document.hidden)audio.stop();},options);
  frame=requestAnimationFrame(tick);
  return {start(){audio.stop();audio.unlock();state=createFlightState(settings);state.status='playing';active=true;paused=false;last=0;flapSoundAt=-Infinity;flap();hud();canvas.focus();},pause(value){paused=value;last=0;if(value)audio.stop();},input:flap,setMuted:value=>audio.setMuted(value),setCharacter(value){settings=validateFlightSettings(value.flight);if(!active)state=createFlightState(settings);},destroy(){if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);controller.abort();audio.destroy();finish();}};
}
