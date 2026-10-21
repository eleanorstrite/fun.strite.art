import { createMazeAudio } from './maze-audio.js';

export const AIR_WIDTH=900, AIR_HEIGHT=650;
export const AIR_COURSE=[
  [0,0],[-.55,-.25],[.35,-.45],[.65,.2],[-.3,.4],[-.7,-.2],
  [.15,-.5],[.7,-.1],[.2,.45],[-.6,.2],[-.2,-.35],[0,0],
].map(([x,y],index)=>({x,y,z:500+index*400}));
export const HOOP_RADIUS=.38;
const airClamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const formatRaceTime=ms=>ms==null?'—':(ms/1000).toFixed(2)+'s';

export function createAirState(){
  return {x:0,y:0,bank:0,distance:0,time:0,energy:100,passed:0,earned:0,status:'ready',fallTime:0,flash:0,boost:false};
}
export function tickAirRace(s,dt,controls={},emit=()=>{}){
  if(s.status==='falling'){
    s.fallTime=Math.min(1.8,s.fallTime+airClamp(dt,0,.1));
    if(s.fallTime>=1.8)s.status='lost';
    return;
  }
  if(s.status!=='playing')return;
  let remaining=airClamp(dt,0,.1);
  while(remaining>1e-8&&s.status==='playing'){
    const speed=controls.boost?340:220,gate=AIR_COURSE[s.passed];
    // Split exactly at each hoop plane so race times do not depend on frame rate.
    const untilGate=(gate.z-s.distance)/speed;
    const step=Math.min(remaining,1/120,Math.max(0,untilGate));
    const dx=controls.target?airClamp((controls.target.x-s.x)*6,-2.2,2.2):airClamp(controls.x||0,-1,1)*2.2;
    const dy=controls.target?airClamp((controls.target.y-s.y)*6,-2.2,2.2):airClamp(controls.y||0,-1,1)*2.2;
    s.x=airClamp(s.x+dx*step,-1.45,1.45);s.y=airClamp(s.y+dy*step,-.95,.95);
    s.bank=dx*.25;s.boost=Boolean(controls.boost);s.time+=step;s.distance+=speed*step;
    s.energy=Math.max(0,s.energy-(controls.boost?32:14)*step);
    s.flash=Math.max(0,s.flash-step);remaining-=step;
    if(s.distance>=gate.z-1e-7){
      if(Math.hypot(s.x-gate.x,s.y-gate.y)>HOOP_RADIUS){
        s.energy=0;s.status='falling';emit('crash');break;
      }
      s.passed++;s.earned=s.passed;s.energy=100;s.flash=.3;emit('flightCoin');
      if(s.passed===AIR_COURSE.length){s.status='won';emit('win');break;}
    }else if(s.energy<=0){s.status='falling';emit('crash');break;}
  }
}
function shape(ctx,points,color){
  ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
}
export function drawAirplane(ctx,x,y,size,look={},bank=0,time=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(bank);ctx.scale(size/100,size/100);
  const color=look.color||'#ed6e40',jet=look.style==='jet',swept=look.style==='swept',biplane=look.style==='biplane';
  // Chase camera: foreshortened fuselage, broad horizontal wings, and the
  // nearest tail in front of the cabin. The nose points away into the course.
  ctx.strokeStyle='#263b48';ctx.lineWidth=1.4;ctx.lineJoin='round';
  const panel=(points,fill)=>{shape(ctx,points,fill);ctx.stroke();};
  const oval=(cx,cy,rx,ry,fill)=>{
    ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  };
  if(!jet){
    ctx.save();ctx.translate(0,-8);ctx.rotate(time*55);
    ctx.fillStyle='#d8eff766';ctx.fillRect(-17,-1,34,2);ctx.restore();
  }
  // The distant cabin sits above the wings; the nearer tail hides its center.
  oval(0,-3,jet?10:8,12,jet?'#f5f8fa':color);
  oval(0,-10,jet?6:5,4,'#79b8d0');
  const wingColor=jet?'#f5f8fa':color;
  panel(swept||jet?
    [[-7,-2],[-61,8],[-59,13],[-6,6],[6,6],[59,13],[61,8],[7,-2]]:
    [[-7,-1],[-59,1],[-59,7],[-7,6],[7,6],[59,7],[59,1],[7,-1]],wingColor);
  for(const side of [-1,1]){
    panel([[side*48,3],[side*57,4],[side*57,8],[side*48,7]],jet?color:'#fff0cc');
    if(jet){
      // Circular exhausts face the chase camera under each wing.
      oval(side*25,10,7,7,'#e5edf2');
      oval(side*25,10,4.5,4.5,'#344455');
      oval(side*25,10,2,2,'#758b9d');
      panel([[side*58,9],[side*62,-1],[side*64,0],[side*62,12]],color);
    }
  }
  if(biplane){
    for(const side of [-1,1]){
      ctx.beginPath();ctx.moveTo(side*37,3);ctx.lineTo(side*37,-11);ctx.stroke();
    }
    panel([[-56,-13],[56,-13],[56,-8],[-56,-8]],color);
  }
  oval(0,7,7,8,jet?'#e0e9ee':color);
  panel([[-3,6],[-24,11],[-24,15],[0,12],[24,15],[24,11],[3,6]],wingColor);
  // Upright vertical stabilizer, closest to the viewer.
  panel([[-2,10],[-3,-15],[0,-24],[3,-15],[2,10]],color);
  ctx.strokeStyle='#ffffff99';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,-19);ctx.lineTo(0,7);ctx.stroke();
  oval(0,13,2.5,2,'#40586b');
  ctx.restore();
}

export function drawAirRace(ctx,s,look,width,height,bestMs=null,reducedMotion=false){
  ctx.save();ctx.scale(width/AIR_WIDTH,height/AIR_HEIGHT);
  const sky=ctx.createLinearGradient(0,0,0,AIR_HEIGHT);sky.addColorStop(0,'#77b8d4');sky.addColorStop(.65,'#d9e9d9');sky.addColorStop(1,'#f4dfb5');
  ctx.fillStyle=sky;ctx.fillRect(0,0,900,650);
  ctx.fillStyle='#fff2c8';ctx.beginPath();ctx.arc(740,130,48,0,7);ctx.fill();
  for(let i=0;i<7;i++){
    const x=((i*173-s.distance*.025)%1100+1100)%1100-100,y=130+(i%3)*63;
    ctx.fillStyle='#ffffff88';ctx.beginPath();ctx.ellipse(x,y,65,14,0,0,7);ctx.ellipse(x+20,y-8,32,18,0,0,7);ctx.fill();
  }
  shape(ctx,[[0,490],[100,340],[250,490],[410,350],[600,495],[770,370],[900,460],[900,650],[0,650]],'#739c9c');
  shape(ctx,[[0,550],[170,450],[350,560],[570,450],[770,530],[900,480],[900,650],[0,650]],'#638f7b');
  shape(ctx,[[390,470],[480,470],[720,650],[220,650]],'#7eb5bf');
  const next=AIR_COURSE[s.passed];
  // Far hoops are smaller; their centers converge toward the horizon.
  for(let index=AIR_COURSE.length-1;index>=s.passed;index--){
    const gate=AIR_COURSE[index],z=gate.z-s.distance;if(z>1900)continue;
    const scale=420/(420+Math.max(0,z)),x=450+gate.x*230*scale,y=315+gate.y*230*scale,r=HOOP_RADIUS*230*scale;
    ctx.strokeStyle=index===s.passed?'#fce494':'#d6ecda99';ctx.lineWidth=Math.max(2,10*scale);
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=index===s.passed?'#b87b38':'#648a8e';ctx.lineWidth=Math.max(1,3*scale);
    ctx.beginPath();ctx.arc(x,y,r+5*scale,0,Math.PI*2);ctx.stroke();
    if(index===s.passed){ctx.font=`bold ${Math.max(11,19*scale)}px sans-serif`;ctx.textAlign='center';ctx.fillStyle='#2b4652';ctx.fillText(String(index+1),x,y-r-12);}
  }
  if(next&&s.status!=='falling'&&s.status!=='lost'){
    const aligned=Math.hypot(s.x-next.x,s.y-next.y)<=HOOP_RADIUS;
    ctx.fillStyle='#203f4dd9';ctx.fillRect(245,92,410,34);
    ctx.fillStyle=aligned?'#c0f0b4':'#fff1ce';ctx.textAlign='center';ctx.font='15px sans-serif';
    ctx.fillText(aligned?'LINED UP — keep your heading!':'Steer toward the gold hoop',450,114);
  }
  const falling=s.status==='falling'||s.status==='lost';
  const drop=falling?(reducedMotion?s.fallTime*90:s.fallTime*s.fallTime*135):0;
  drawAirplane(ctx,450+s.x*230,315+s.y*230+drop,90,look,falling?(reducedMotion?0:s.fallTime*1.8):s.bank,s.time+s.fallTime);
  ctx.fillStyle='#183e51e8';ctx.fillRect(20,18,860,61);ctx.fillStyle='#f2f0d8';ctx.font='bold 23px sans-serif';ctx.textAlign='left';
  ctx.fillText(formatRaceTime(Math.round(s.time*1000)),38,46);
  ctx.font='13px sans-serif';ctx.fillText('BEST '+formatRaceTime(bestMs),38,65);
  ctx.textAlign='center';ctx.font='bold 18px sans-serif';ctx.fillText(`HOOPS ${s.passed} / ${AIR_COURSE.length}`,450,44);
  ctx.font='12px sans-serif';ctx.fillText(s.boost?'BOOSTING':'CRUISING',450,65);
  ctx.textAlign='right';ctx.font='13px sans-serif';ctx.fillText('ENERGY',858,39);
  ctx.fillStyle='#102e3e';ctx.fillRect(698,49,160,12);
  ctx.fillStyle=s.energy>30?'#9cdaa5':'#ef9870';ctx.fillRect(698,49,160*s.energy/100,12);
  if(s.flash>0){ctx.fillStyle='#163f4f';ctx.textAlign='center';ctx.font='bold 20px sans-serif';ctx.fillText('ENERGY RESTORED +1 COIN',450,560);}
  if(falling){ctx.fillStyle='#213d50';ctx.textAlign='center';ctx.font='bold 28px sans-serif';ctx.fillText('MISSED HOOP — OUT OF ENERGY!',450,205);}
  if(s.status==='won'){ctx.fillStyle='#183e51e8';ctx.fillRect(210,190,480,100);ctx.fillStyle='#ffeba7';ctx.font='bold 32px sans-serif';ctx.textAlign='center';ctx.fillText('FINISH!',450,232);ctx.font='22px sans-serif';ctx.fillText(formatRaceTime(Math.round(s.time*1000)),450,270);}
  ctx.restore();
}
export function drawAirPreview(canvas,character){
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const s=createAirState();s.distance=300;drawAirRace(ctx,s,character.plane,canvas.width,canvas.height);
}
export function createAirRace({canvas,character,bestTimeMs=null,onHud,onFinish}){
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Your browser does not support canvas.');
  const audio=createMazeAudio(),controller=new AbortController(),options={signal:controller.signal},keys=new Set();
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  let state=createAirState(),active=false,paused=false,destroyed=false,frame,last=0,target=null,touchBoost=false,pointer=null;
  let look={...character.plane},best=bestTimeMs;
  function clearInput(){keys.clear();target=null;pointer=null;touchBoost=false;state.boost=false;}
  function hud(){onHud({raceBoost:state.boost&&state.status==='playing',text:`Hoops ${state.passed}/${AIR_COURSE.length} · ${formatRaceTime(Math.round(state.time*1000))} · Best ${formatRaceTime(best)} · Energy ${Math.ceil(state.energy)}%`});}
  function finish(){
    if(!active)return;active=false;
    const timeMs=state.status==='won'?Math.max(1,Math.round(state.time*1000)):null,newBest=timeMs!==null&&(best===null||timeMs<best);
    if(newBest)best=timeMs;
    onFinish(state.earned,{title:state.status==='won'?(newBest?'New personal best!':'Course complete!'):state.status==='lost'?'Your plane ran out of energy.':'Flight saved.',
      timeMs,detail:`${state.passed}/${AIR_COURSE.length} hoops · ${state.status==='won'?'Finish':'Attempt'} ${formatRaceTime(Math.round(state.time*1000))} · Best ${formatRaceTime(best)}`});
  }
  canvas.addEventListener('keydown',e=>{
    const key=e.key.length===1?e.key.toLowerCase():e.key;
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d',' '].includes(key))return;
    e.preventDefault();if(active&&!paused&&state.status==='playing'){keys.add(key);if(key!==' ')target=null;audio.unlock();}
  },options);
  globalThis.window?.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key),options);
  canvas.addEventListener('blur',clearInput,options);
  const aim=e=>{const rect=canvas.getBoundingClientRect();target={x:airClamp(((e.clientX-rect.left)/rect.width*900-450)/230,-1.45,1.45),y:airClamp(((e.clientY-rect.top)/rect.height*650-315)/230,-.95,.95)};};
  canvas.addEventListener('pointerdown',e=>{
    if(!active||paused||state.status!=='playing')return;
    e.preventDefault();canvas.focus();audio.unlock();pointer=e.pointerId;canvas.setPointerCapture?.(e.pointerId);aim(e);
  },options);
  canvas.addEventListener('pointermove',e=>{if(e.pointerId===pointer)aim(e);},options);
  canvas.addEventListener('pointerup',()=>{pointer=null;target=null;},options);
  canvas.addEventListener('pointercancel',()=>{pointer=null;target=null;},options);
  document.addEventListener?.('visibilitychange',()=>{last=0;clearInput();if(document.hidden)audio.stop();},options);
  function tick(now){
    if(destroyed)return;const dt=last?Math.min(.1,(now-last)/1000):0;last=now;
    if(active&&!paused&&!document.hidden){
      const controls={x:Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a')),y:Number(keys.has('ArrowDown')||keys.has('s'))-Number(keys.has('ArrowUp')||keys.has('w')),target,boost:keys.has(' ')||touchBoost};
      tickAirRace(state,dt,controls,event=>audio.play(event));hud();
      if(state.status==='won'||state.status==='lost')finish();
    }
    drawAirRace(ctx,state,look,canvas.width,canvas.height,best,reduced);frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
  return {
    start(){audio.stop();audio.unlock();clearInput();state=createAirState();state.status='playing';active=true;paused=false;last=0;hud();canvas.focus();},
    pause(value){paused=value;last=0;clearInput();if(value)audio.stop();},
    setBoost(value){if(active&&!paused&&state.status==='playing'){touchBoost=Boolean(value);canvas.focus({preventScroll:true});}},
    setCharacter(value){look={...value.plane};},
    setMuted:value=>audio.setMuted(value),
    destroy(){if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);controller.abort();audio.destroy();finish();}
  };
}
