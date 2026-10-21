import { createMazeAudio } from './maze-audio.js';

export const PUMPKINS={
  classic:{name:'Classic orange',color:'#ed8b32',shade:'#bf5b28',width:1,height:1},
  tall:{name:'Tall harvest',color:'#df9b39',shade:'#a9612c',width:.85,height:1.15},
  white:{name:'Moonlight white',color:'#eee3c2',shade:'#b9ae91',width:1,height:1},
  green:{name:'Enchanted green',color:'#98b879',shade:'#557b58',width:1.12,height:.88},
};
export const CARVING_TOOLS={knife:{name:'Fine carving knife',width:7},scoop:{name:'Wide carving scoop',width:19},triangle:{name:'Triangle cutter'},circle:{name:'Round cutter'}};
export const PUMPKIN_CLIP_SECONDS=7;
export function createPumpkin(){return {kind:'classic',cuts:[]};}
export function pumpkinContains(x,y){return (x/175)**2+(y/145)**2<=1;}
function pumpkinPolygon(ctx,points,fill){
  ctx.fillStyle=fill;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
}
export function drawCarvedPumpkin(ctx,pumpkin,x,y,size=1,lit=false){
  const look=PUMPKINS[pumpkin.kind];
  ctx.save();ctx.translate(x,y);ctx.scale(size*look.width,size*look.height);
  pumpkinPolygon(ctx,[[-12,-135],[-18,-189],[6,-202],[16,-191],[4,-146]],'#567346');
  ctx.strokeStyle='#839351';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(9,-161);ctx.bezierCurveTo(60,-205,82,-142,38,-151);ctx.stroke();
  const color=ctx.createLinearGradient(-180,-100,150,150);color.addColorStop(0,look.color);color.addColorStop(1,look.shade);
  ctx.fillStyle=color;
  ctx.beginPath();ctx.ellipse(0,0,180,150,0,0,Math.PI*2);ctx.fill();
  for(const width of [140,88,34]){
    ctx.strokeStyle=look.shade+'80';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,width,148,0,0,Math.PI*2);ctx.stroke();
  }
  ctx.save();ctx.beginPath();ctx.ellipse(0,0,175,145,0,0,Math.PI*2);ctx.clip();
  ctx.fillStyle=lit?'#ffe397':'#392d33';ctx.strokeStyle=ctx.fillStyle;
  if(lit){ctx.shadowColor='#ffb847';ctx.shadowBlur=15;}
  for(const cut of pumpkin.cuts){
    const first=cut.points[0];ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=CARVING_TOOLS[cut.tool].width||7;
    if(cut.tool==='triangle')pumpkinPolygon(ctx,[[first.x,first.y-25],[first.x-24,first.y+20],[first.x+24,first.y+20]],lit?'#ffe397':'#392d33');
    else if(cut.tool==='circle'){ctx.beginPath();ctx.arc(first.x,first.y,20,0,Math.PI*2);ctx.fill();}
    else if(cut.points.length===1){ctx.beginPath();ctx.arc(first.x,first.y,ctx.lineWidth/2,0,Math.PI*2);ctx.fill();}
    else{ctx.beginPath();cut.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}
  }
  ctx.restore();ctx.restore();
}
export function drawPumpkinScene(ctx,pumpkin,width,height,clip=null,reduced=false,cursor=null){
  ctx.save();ctx.scale(width/900,height/620);
  if(clip===null){
    ctx.fillStyle='#e8dcc8';ctx.fillRect(0,0,900,620);
    ctx.fillStyle='#b88d68';ctx.fillRect(0,440,900,180);
    for(let i=0;i<6;i++){ctx.strokeStyle='#9c7355';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,450+i*35);ctx.lineTo(900,450+i*35);ctx.stroke();}
    ctx.fillStyle='#463c42';ctx.font='bold 29px sans-serif';ctx.textAlign='center';ctx.fillText('YOUR PUMPKIN WORKSHOP',450,55);
    drawCarvedPumpkin(ctx,pumpkin,450,330);
    if(cursor){
      const look=PUMPKINS[pumpkin.kind];
      ctx.strokeStyle='#fff9df';ctx.lineWidth=2;ctx.beginPath();ctx.arc(450+cursor.x*look.width,330+cursor.y*look.height,12,0,Math.PI*2);ctx.stroke();
    }
  }else{
    const sky=ctx.createLinearGradient(0,0,0,620);sky.addColorStop(0,'#22233d');sky.addColorStop(1,'#655075');ctx.fillStyle=sky;ctx.fillRect(0,0,900,620);
    ctx.fillStyle='#eee3ae';ctx.beginPath();ctx.arc(755,100,47,0,7);ctx.fill();
    for(let i=0;i<35;i++){ctx.fillStyle='#c3b6d5';ctx.fillRect((i*137)%900,25+(i*71)%260,2,2);}
    // Crooked house, towers, glowing windows, fence, and a winding garden path.
    pumpkinPolygon(ctx,[[290,430],[290,203],[485,185],[510,430]],'#29293b');
    pumpkinPolygon(ctx,[[250,211],[378,111],[518,198]],'#191c2b');
    pumpkinPolygon(ctx,[[465,430],[455,138],[555,126],[578,430]],'#343044');
    pumpkinPolygon(ctx,[[432,143],[490,52],[575,131]],'#1c1d30');
    pumpkinPolygon(ctx,[[335,143],[331,82],[356,78],[362,127]],'#272637');
    ctx.fillStyle='#efc56c';
    for(const [x,y] of [[320,245],[413,235],[485,184],[492,275]]){
      ctx.fillRect(x,y,28,42);ctx.fillStyle='#29293b';ctx.fillRect(x+12,y,4,42);ctx.fillRect(x,y+20,28,4);ctx.fillStyle='#efc56c';
    }
    ctx.fillStyle='#171e2c';ctx.fillRect(365,343,52,90);
    ctx.fillStyle='#2a3b40';ctx.fillRect(0,424,900,196);
    pumpkinPolygon(ctx,[[365,430],[419,430],[655,620],[250,620]],'#756676');
    ctx.strokeStyle='#151f2c';ctx.lineWidth=5;
    for(let x=0;x<900;x+=35){if(x>290&&x<600)continue;ctx.beginPath();ctx.moveTo(x,430);ctx.lineTo(x,380);ctx.stroke();}
    for(const x of [130,790]){
      ctx.beginPath();ctx.moveTo(x,440);ctx.lineTo(x-10,240);ctx.lineTo(x-65,195);
      ctx.moveTo(x-10,315);ctx.lineTo(x+50,260);ctx.lineTo(x+65,207);ctx.stroke();
    }
    // Two widely separated lightning strikes; reduced motion uses a steady bolt.
    const flash=!reduced&&((clip>1.2&&clip<1.38)||(clip>4.4&&clip<4.58));
    if(flash||reduced){
      pumpkinPolygon(ctx,[[160,0],[115,105],[149,100],[90,215],[180,80],[147,85],[194,0]],'#e4e6ff');
      if(flash){ctx.fillStyle='#e4ddff35';ctx.fillRect(0,0,900,620);}
    }
    const laugh=clip>2.2&&clip<5.6;
    ctx.save();ctx.translate(450,478);if(laugh&&!reduced)ctx.rotate(Math.sin(clip*16)*.025);
    drawCarvedPumpkin(ctx,pumpkin,0,0,.66,true);ctx.restore();
    if(laugh){ctx.fillStyle='#fff0b5';ctx.font='bold 29px sans-serif';ctx.textAlign='center';ctx.fillText('Hee hee hee! Ha ha ha!',450,590);}
  }
  ctx.restore();
}
export function drawPumpkinPreview(canvas){
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const pumpkin=createPumpkin();pumpkin.cuts=[
    {tool:'triangle',points:[{x:-65,y:-38}]},{tool:'triangle',points:[{x:65,y:-38}]},
    {tool:'scoop',points:[{x:-85,y:45},{x:-45,y:75},{x:0,y:86},{x:45,y:75},{x:85,y:45}]}
  ];drawPumpkinScene(ctx,pumpkin,canvas.width,canvas.height,3,true);
}
export function createPumpkinGame({canvas,onHud,onFinish,controls=document.querySelector('#pumpkin-controls')}){
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Your browser does not support canvas.');
  const audio=createMazeAudio(),controller=new AbortController(),events={signal:controller.signal};
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  let pumpkin=createPumpkin(),tool='knife',active=false,paused=false,destroyed=false,clip=null,last=0,frame,pointer=null,currentCut=null,cursor=null,laughed=false,thunder=0;
  const title=document.createElement('h3');title.textContent='Choose a pumpkin and a tool, then carve on the picture';
  const pumpkins=document.createElement('div'),toolsRow=document.createElement('div'),actions=document.createElement('div'),help=document.createElement('p');
  pumpkins.className=toolsRow.className=actions.className='pumpkin-buttons';
  help.textContent='Drag to carve with the knife or scoop. Tap to cut triangles or circles. Keyboard: focus the picture, move with arrows, and press Space to carve. Undo removes your last cut.';
  const makeButton=(text,parent,fn)=>{const b=document.createElement('button');b.type='button';b.className='button outline';b.textContent=text;b.onclick=fn;parent.append(b);return b;};
  const editable=()=>active&&!paused&&clip===null&&!document.hidden;
  const stop=()=>{pointer=null;currentCut=null;};
  const pumpkinButtons=Object.entries(PUMPKINS).map(([id,look])=>makeButton(look.name,pumpkins,()=>{if(editable()){stop();pumpkin.kind=id;refresh();}}));
  const toolButtons=Object.entries(CARVING_TOOLS).map(([id,look])=>makeButton(look.name,toolsRow,()=>{if(editable()){stop();tool=id;refresh();}}));
  const undo=makeButton('Undo last cut',actions,()=>{if(editable()){stop();pumpkin.cuts.pop();refresh();}});
  const clear=makeButton('Clear carving',actions,()=>{if(editable()){stop();pumpkin.cuts=[];refresh();}});
  const done=makeButton('Done — light my pumpkin!',actions,()=>{if(editable()&&pumpkin.cuts.length){stop();clip=0;laughed=false;thunder=0;audio.unlock();refresh();canvas.focus({preventScroll:true});}});
  done.className='button dark';controls.replaceChildren(title,pumpkins,toolsRow,help,actions);
  function refresh(){
    pumpkinButtons.forEach((b,i)=>{b.disabled=!editable();b.setAttribute('aria-pressed',String(Object.keys(PUMPKINS)[i]===pumpkin.kind));});
    toolButtons.forEach((b,i)=>{b.disabled=!editable();b.setAttribute('aria-pressed',String(Object.keys(CARVING_TOOLS)[i]===tool));});
    undo.disabled=clear.disabled=done.disabled=!editable()||!pumpkin.cuts.length;
    onHud({text:clip===null?'Carve a face · '+pumpkin.cuts.length+' cuts · Earn 5 coins when finished':'Your pumpkin is haunting the house!'});
  }
  function startCut(p){
    if(!pumpkinContains(p.x,p.y)||pumpkin.cuts.length>=250)return;
    currentCut={tool,points:[p]};pumpkin.cuts.push(currentCut);audio.play('gem');refresh();
  }
  const point=e=>{const rect=canvas.getBoundingClientRect(),look=PUMPKINS[pumpkin.kind];return {x:((e.clientX-rect.left)/rect.width*900-450)/look.width,y:((e.clientY-rect.top)/rect.height*620-330)/look.height};};
  canvas.addEventListener('pointerdown',e=>{
    if(!editable()||pointer!==null||e.button>0)return;
    const p=point(e);if(!pumpkinContains(p.x,p.y))return;
    e.preventDefault();canvas.focus();audio.unlock();canvas.setPointerCapture?.(e.pointerId);pointer=e.pointerId;cursor=null;startCut(p);
  },events);
  canvas.addEventListener('pointermove',e=>{
    if(!editable()||e.pointerId!==pointer||!currentCut||!CARVING_TOOLS[currentCut.tool].width)return;
    e.preventDefault();const p=point(e),prev=currentCut.points.at(-1);
    if(Math.hypot(p.x-prev.x,p.y-prev.y)>2&&currentCut.points.length<1500)currentCut.points.push(p);
  },events);
  for(const name of ['pointerup','pointercancel','lostpointercapture','blur'])canvas.addEventListener(name,stop,events);
  canvas.addEventListener('keydown',e=>{
    if(!editable()||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))return;
    e.preventDefault();cursor??={x:0,y:0};
    if(e.key===' '){startCut({...cursor});return;}
    const p={x:cursor.x+(e.key==='ArrowLeft'?-8:e.key==='ArrowRight'?8:0),y:cursor.y+(e.key==='ArrowUp'?-8:e.key==='ArrowDown'?8:0)};
    if(pumpkinContains(p.x,p.y)){cursor=p;if(currentCut&&CARVING_TOOLS[currentCut.tool].width&&currentCut.points.length<1500)currentCut.points.push({...p});}
  },events);
  globalThis.window?.addEventListener('keyup',e=>{if(e.key===' ')stop();},events);
  document.addEventListener?.('visibilitychange',()=>{last=0;stop();if(document.hidden)audio.stop();},{signal:controller.signal});
  function tick(now){
    if(destroyed)return;const dt=last?Math.min(.1,(now-last)/1000):0;last=now;
    if(active&&!paused&&!document.hidden&&clip!==null){
      clip=Math.min(PUMPKIN_CLIP_SECONDS,clip+dt);
      if((thunder===0&&clip>=1.2)||(thunder===1&&clip>=4.4)){thunder++;audio.play('thunder');}
      if(!laughed&&clip>=2.2){laughed=true;audio.play('cackle');audio.say('Hee hee hee! Ha ha ha!',.8);}
      if(clip>=PUMPKIN_CLIP_SECONDS){active=false;onFinish(5,{title:'A spook-tacular pumpkin!',detail:'Your carving lit up the haunted house.'});}
    }
    drawPumpkinScene(ctx,pumpkin,canvas.width,canvas.height,clip,reduced,cursor);frame=requestAnimationFrame(tick);
  }
  refresh();frame=requestAnimationFrame(tick);
  return {
    start(){audio.stop();audio.unlock();pumpkin=createPumpkin();tool='knife';active=true;paused=false;clip=null;cursor=null;last=0;stop();refresh();},
    pause(value){paused=value;last=0;stop();if(value)audio.stop();refresh();},
    setMuted:value=>audio.setMuted(value),
    destroy(){if(destroyed)return;destroyed=true;active=false;stop();controller.abort();audio.destroy();cancelAnimationFrame(frame);controls.replaceChildren();}
  };
}
