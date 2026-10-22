import { createMazeAudio } from './maze-audio.js';
export const STORM_WIDTH=10,STORM_ROWS=24,STORM_TARGET=18,STORM_SECONDS=30;
export const STORM_HAZARDS=['Hurricane','Tornado','Tsunami','Wildfire'];
const SHAPES=[[[0,0],[1,0],[2,0],[3,0]],[[0,0],[1,0],[0,1],[1,1]],[[1,0],[0,1],[1,1],[2,1]],[[1,0],[2,0],[0,1],[1,1]],[[0,0],[1,0],[1,1],[2,1]],[[0,0],[0,1],[1,1],[2,1]],[[2,0],[0,1],[1,1],[2,1]]];
const COLORS=['#70dce8','#f9d65c','#bc8bea','#8fce73','#f092b4','#789ee5','#f6a465'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function stormFits(s,cells,x,y){return cells.every(([dx,dy])=>x+dx>=0&&x+dx<STORM_WIDTH&&y+dy>=0&&y+dy<STORM_ROWS&&!s.board[y+dy][x+dx]);}
function nextPiece(s){
  if(!s.bag.length){s.bag=[0,1,2,3,4,5,6];for(let i=6;i>0;i--){const j=Math.floor(s.random()*(i+1));[s.bag[i],s.bag[j]]=[s.bag[j],s.bag[i]];}}
  const kind=s.bag.pop();return {kind,cells:SHAPES[kind].map(p=>[...p]),x:3,y:0};
}
export function createStormState(random=Math.random){
  const s={board:Array.from({length:STORM_ROWS},()=>Array(STORM_WIDTH).fill(0)),random,bag:[],piece:null,next:null,status:'ready',remaining:STORM_SECONDS,fall:0,height:0,locked:0,clip:0,won:false,hazard:null};
  s.piece=nextPiece(s);s.next=nextPiece(s);return s;
}
function endStorm(s,won,emit){s.won=won;s.status='ending';s.clip=0;if(!won){s.hazard=STORM_HAZARDS[Math.min(3,Math.floor(s.random()*4))];emit('bell');}else emit('win');}
export function stormMove(s,dx){if(s.status!=='playing')return false;const p=s.piece;if(!stormFits(s,p.cells,p.x+dx,p.y))return false;p.x+=dx;return true;}
export function stormRotate(s){
  if(s.status!=='playing'||s.piece.kind===1)return false;
  const p=s.piece,rotated=p.cells.map(([x,y])=>[-y,x]),minX=Math.min(...rotated.map(p=>p[0])),minY=Math.min(...rotated.map(p=>p[1]));
  const cells=rotated.map(([x,y])=>[x-minX,y-minY]);
  for(const dx of [0,-1,1,-2,2])if(stormFits(s,cells,p.x+dx,p.y)){p.cells=cells;p.x+=dx;return true;}return false;
}
function dropRow(s,emit){
  const p=s.piece;
  if(stormFits(s,p.cells,p.x,p.y+1)){p.y++;return;}
  for(const [dx,dy] of p.cells)s.board[p.y+dy][p.x+dx]=p.kind+1;
  s.locked++;s.height=STORM_ROWS-s.board.findIndex(row=>row.some(Boolean));emit('bounce');
  if(s.height>=STORM_TARGET){endStorm(s,true,emit);return;}
  s.piece=s.next;s.next=nextPiece(s);
  if(!stormFits(s,s.piece.cells,s.piece.x,s.piece.y))endStorm(s,false,emit);
}
export function tickStorm(s,dt,fast=false,emit=()=>{}){
  dt=clamp(dt,0,.1);
  if(s.status==='ending'){
    const before=s.clip;s.clip+=dt;
    const speech=s.won?4.3:6.3;
    if(before<speech&&s.clip>=speech)emit(s.won?'sayWin':'sayLose');
    if(s.won&&before<2.2&&s.clip>=2.2)emit('crash');
    if(!s.won&&before<.8&&s.clip>=.8)emit('whoosh');
    for(const at of s.won?[1,1.5]:[5,5.5,6])if(before<at&&s.clip>=at)emit('clap');
    if(s.clip>=(s.won?7:9))s.status='finished';return;
  }
  if(s.status!=='playing')return;
  s.remaining=Math.max(0,s.remaining-dt);
  if(s.remaining<=1e-7){s.remaining=0;endStorm(s,false,emit);return;}
  s.fall+=dt;const interval=fast?.032:.48;
  while(s.fall>=interval&&s.status==='playing'){s.fall-=interval;dropRow(s,emit);}
}
function rect(c,x,y,w,h,color,r=0){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function block(c,x,y,size,color){rect(c,x+1,y+1,size-2,size-2,color,3);rect(c,x+3,y+3,size-6,3,'#ffffff70',1);rect(c,x+size-5,y+6,2,size-10,'#152c4b33',1);}
function label(c,text,x,y,size=20,color='#f6edd9'){c.fillStyle=color;c.font=`bold ${size}px sans-serif`;c.textAlign='center';c.fillText(text,x,y);}
function hazard(c,type,x,y,size,time,clap=false){
  c.save();c.translate(x,y);c.scale(size/100,size/100);
  if(type==='Tornado'){
    for(let i=0;i<7;i++)oval(c,Math.sin(time*3+i)*3,-60+i*12,40-i*5,8,['#b7c6d4','#7e92ab'][i%2]);
  }else if(type==='Hurricane'){
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5+time*.5;oval(c,Math.cos(a)*22,-22+Math.sin(a)*21,26,15,'#9eb7d0');}oval(c,0,-22,14,14,'#d3e8f4');
  }else if(type==='Tsunami'){
    c.fillStyle='#4bb7d9';c.beginPath();c.moveTo(-44,22);c.bezierCurveTo(-48,-75,48,-88,38,-35);c.bezierCurveTo(8,-64,0,-9,46,22);c.closePath();c.fill();c.strokeStyle='#bdf6ef';c.lineWidth=6;c.beginPath();c.moveTo(-39,-9);c.bezierCurveTo(-31,-61,17,-78,32,-44);c.stroke();
  }else{
    c.fillStyle='#ef7954';c.beginPath();c.moveTo(0,24);c.bezierCurveTo(-65,12,-29,-44,-26,-55);c.lineTo(-8,-26);c.lineTo(9,-78);c.bezierCurveTo(57,-31,57,20,0,24);c.fill();oval(c,4,-6,17,28,'#ffca67');
  }
  // Each hazard has exactly two arms, joining hands on the clap beat.
  const meet=clap?(1+Math.sin(time*Math.PI*4))/2:0;
  c.lineWidth=7;c.lineCap='round';c.strokeStyle='#e8d7c4';
  for(const side of [-1,1]){const hx=side*(48-41*meet),hy=28-meet*14;c.beginPath();c.moveTo(side*26,0);c.lineTo(side*39,16);c.lineTo(hx,hy);c.stroke();oval(c,hx,hy,7,8,'#f3e1c9');}
  for(const ex of [-11,11]){oval(c,ex,-20,5,7,'#fff');oval(c,ex+1,-19,2,3,'#203349');}
  c.strokeStyle='#203349';c.lineWidth=3;c.beginPath();c.arc(0,-9,10,0,Math.PI);c.stroke();c.restore();
}
function scenery(c){const g=c.createLinearGradient(0,0,0,780);g.addColorStop(0,'#172b4a');g.addColorStop(.65,'#345a78');g.addColorStop(1,'#73919b');c.fillStyle=g;c.fillRect(0,0,600,780);for(let i=0;i<30;i++)oval(c,(i*139)%600,30+(i*71)%430,1,1,'#b9dfdf88');}
export function drawStormEnding(c,s,reduced=false){
  const t=s.clip;scenery(c);rect(c,0,680,600,100,'#243d50');
  if(!s.won&&t<4.5){
    label(c,'DING! TIME’S UP',300,65,30);label(c,s.hazard+' incoming!',300,100,20,'#ffd88d');
    const p=clamp((t-.7)/3,0,1);
    for(let y=0;y<24;y++)for(let x=0;x<10;x++)if(s.board[y][x]){
      const seed=(x*17+y*31)%19,age=clamp(p*1.6-seed*.025,0,1);let bx=170+x*26,by=670-(24-y)*26;
      c.save();
      if(s.hazard==='Wildfire'){by+=age*age*80;c.globalAlpha=1-age;}
      else if(s.hazard==='Tsunami'){bx+=age*650;by+=Math.sin(age*6+seed)*age*30;}
      else {bx+=Math.sin(seed+age*4)*age*420;by-=age*450;}
      c.translate(bx,by);c.rotate(reduced?0:age*(seed-9));block(c,0,0,26,s.hazard==='Wildfire'&&age>.2?'#f39658':COLORS[s.board[y][x]-1]);c.restore();
    }
    if(s.hazard==='Tsunami'){c.fillStyle='#3dadd4aa';c.beginPath();c.moveTo(-600+p*1100,780);c.lineTo(-600+p*1100,540);for(let x=0;x<=600;x+=30)c.lineTo(-600+p*1100+x,540+Math.sin(x*.03+t*2)*30);c.lineTo(p*1100,780);c.fill();hazard(c,s.hazard,-100+p*650,610,170,t);}
    else if(s.hazard==='Wildfire'){for(let i=0;i<8;i++)hazard(c,s.hazard,70+i*65,710-p*90,75+p*35,reduced?0:t+i);}
    else {hazard(c,s.hazard,80+p*420,510,200,t);c.strokeStyle='#c5e6ef88';c.lineWidth=3;for(let i=0;i<18;i++){const x=((i*113+t*260)%800)-100,y=160+i*29;c.beginPath();c.moveTo(x,y);c.lineTo(x+95,y-15);c.stroke();}}
    return;
  }
  const sceneTime=s.won?t:t-4.5;
  label(c,s.won?(t<2.2?'The hazards think they won…':'One block saves the day!'):'The disaster club celebrates!',300,75,25);
  for(let i=0;i<4;i++){
    const hit=s.won?clamp((t-2.2)/.75,0,1):0;
    c.save();c.translate(85+i*145+(i<2?-1:1)*hit*650,510-hit*300);c.rotate(reduced?0:(i%2?1:-1)*hit*5);hazard(c,STORM_HAZARDS[i],0,0,100,sceneTime,true);c.restore();
    if(!s.won)label(c,STORM_HAZARDS[i],85+i*145,585,14);
  }
  if(s.won){
    const y=t<2.2?-140+clamp((t-1.3)/.9,0,1)**2*600:460;
    c.save();c.translate(300,y);
    if(t>2.5){c.fillStyle='#ed648b';c.beginPath();c.moveTo(-39,-24);c.lineTo(39,-24);c.lineTo(95,100);c.lineTo(-75,85);c.closePath();c.fill();}
    block(c,-52,-52,104,'#f7cf5e');
    if(t>2.5){rect(c,-40,-27,33,22,'#17283d',5);rect(c,7,-27,33,22,'#17283d',5);rect(c,-10,-22,20,5,'#17283d');rect(c,-32,-24,12,3,'#ffffff88');rect(c,15,-24,12,3,'#ffffff88');}
    else {oval(c,-17,-14,6,8,'#263b53');oval(c,17,-14,6,8,'#263b53');}
    c.strokeStyle='#263b53';c.lineWidth=4;c.beginPath();c.arc(0,10,16,0,Math.PI);c.stroke();
    for(const side of [-1,1]){const punch=t>3?Math.max(0,Math.sin((t-3)*4))*40:0;c.strokeStyle='#f7cf5e';c.lineWidth=14;c.beginPath();c.moveTo(side*48,4);c.lineTo(side*70,-12);c.lineTo(side*72,-30-punch);c.stroke();oval(c,side*72,-32-punch,12,12,'#ffdf80');}c.restore();
  }
  if(sceneTime>=(s.won?4.3:1.8)){rect(c,95,120,410,90,'#14253de8',20);label(c,s.won?'YOU WIN!':'YOU LOSE',300,179,46,s.won?'#ffe594':'#f5b0c8');}
}
export function drawStorm(c,s,width,height,reduced=false){
  c.save();c.fillStyle='#172b4a';c.fillRect(0,0,width,height);const scale=Math.min(width/600,height/780);c.translate((width-600*scale)/2,(height-780*scale)/2);c.scale(scale,scale);
  if(s.status==='ending'||s.status==='finished'){drawStormEnding(c,s,reduced);c.restore();return;}
  scenery(c);label(c,'STORM STACK',300,43,30);label(c,'Build high. Beat the weather.',300,68,15,'#b7d8df');
  const ox=120,oy=116,cell=24;
  rect(c,ox-8,oy-8,256,592,'#8ba5b8',9);rect(c,ox,oy,240,576,'#12243b');
  for(let y=0;y<24;y++)for(let x=0;x<10;x++){c.strokeStyle='#9bd2dc12';c.lineWidth=.5;c.strokeRect(ox+x*cell,oy+y*cell,cell,cell);if(s.board[y][x])block(c,ox+x*cell,oy+y*cell,cell,COLORS[s.board[y][x]-1]);}
  if(s.piece){let gy=s.piece.y;while(stormFits(s,s.piece.cells,s.piece.x,gy+1))gy++;
    c.globalAlpha=.22;for(const [x,y] of s.piece.cells)block(c,ox+(s.piece.x+x)*cell,oy+(gy+y)*cell,cell,COLORS[s.piece.kind]);c.globalAlpha=1;
    for(const [x,y] of s.piece.cells)block(c,ox+(s.piece.x+x)*cell,oy+(s.piece.y+y)*cell,cell,COLORS[s.piece.kind]);
  }
  const targetY=oy+(24-STORM_TARGET)*cell;c.strokeStyle='#ffe296';c.lineWidth=3;c.setLineDash([8,6]);c.beginPath();c.moveTo(ox-12,targetY);c.lineTo(ox+250,targetY);c.stroke();c.setLineDash([]);label(c,'GOAL',68,targetY+6,15,'#ffe296');
  label(c,Math.ceil(s.remaining)+'s',470,156,40,s.remaining<=10?'#ffb39b':'#ffe296');label(c,'TIME LEFT',470,182,13);rect(c,404,199,132,7,'#15283f',3);rect(c,404,199,132*s.remaining/STORM_SECONDS,7,'#8cd4ca',3);
  label(c,s.height+' / '+STORM_TARGET,470,254,28);label(c,'STACK HEIGHT',470,279,12);label(c,'NEXT',470,340,15);
  for(const [x,y] of s.next.cells)block(c,420+x*23,363+y*23,23,COLORS[s.next.kind]);
  hazard(c,'Tornado',470,520,80,0);label(c,'Beat the bell!',470,577,15,'#c2dce2');
  label(c,'← → Move   ↑ Rotate   Hold ↓ Fast drop',300,735,17);label(c,'Rows stay — build up to the gold line.',300,761,14,'#c2dce2');c.restore();
}
export function drawStormPreview(canvas){const c=canvas.getContext('2d');if(!c)return;const s=createStormState(()=>.45);for(let y=12;y<24;y++)for(let x=0;x<10;x++)if(y>21||x>=3&&x<=6&&y>14||x===4)s.board[y][x]=1+(x+y)%7;s.height=12;drawStorm(c,s,canvas.width,canvas.height);}
export function createStormStack({canvas,onHud,onFinish,controls=document.querySelector('#storm-controls')}){
  const c=canvas.getContext('2d');if(!c)throw Error('Canvas is unavailable.');
  const audio=createMazeAudio(),controller=new AbortController(),options={signal:controller.signal};
  let s=createStormState(),active=false,paused=false,destroyed=false,last=0,frame;const held=new Set();
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  const clear=()=>held.clear(),canPlay=()=>active&&!paused&&!document.hidden&&s.status==='playing';
  const act=name=>{if(!canPlay())return;audio.unlock();if(name==='left')stormMove(s,-1);if(name==='right')stormMove(s,1);if(name==='rotate')stormRotate(s);};
  canvas.addEventListener('keydown',e=>{const name={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rotate',ArrowDown:'down'}[e.key];if(!name)return;e.preventDefault();if(name==='down'){if(canPlay())held.add('keyboard');}else if(!e.repeat||name!=='rotate')act(name);},options);
  globalThis.window?.addEventListener('keyup',e=>{if(e.key==='ArrowDown')held.delete('keyboard');},options);canvas.addEventListener('blur',clear,options);
  document.addEventListener('visibilitychange',()=>{last=0;clear();if(document.hidden)audio.stop();},options);
  const buttons=[];controls.replaceChildren();
  const row=document.createElement('div');row.className='storm-buttons';controls.append(row);
  for(const [name,title] of [['left','← Left'],['rotate','↻ Rotate'],['right','Right →'],['down','Hold ↓ Drop faster']]){
    const b=document.createElement('button');b.type='button';b.className='button outline';b.textContent=title;row.append(b);buttons.push(b);
    if(name==='down'){
      b.addEventListener('pointerdown',e=>{e.preventDefault();if(canPlay()){b.setPointerCapture?.(e.pointerId);held.add('touch'+e.pointerId);}},options);
      for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>held.delete('touch'+e.pointerId),options);
      b.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();if(canPlay())held.add('button');}},options);
      b.addEventListener('keyup',()=>held.delete('button'),options);b.addEventListener('blur',clear,options);
    }else b.onclick=()=>{act(name);canvas.focus({preventScroll:true});};
  }
  const tip=document.createElement('p');tip.textContent='Reach 18 blocks high in 30 seconds. Stack pieces rather than clearing rows. Finish a round for 5 coins, or win for 25 coins.';controls.append(tip);
  const skip=document.createElement('button');skip.type='button';skip.className='button outline';skip.textContent='Skip ending';controls.append(skip);skip.hidden=true;
  function finish(){if(!active)return;active=false;clear();audio.stop();const completed=s.status==='finished';onFinish(completed?(s.won?25:5):0,{title:completed?(s.won?'You beat the storm!':'The hazards win this round!'):'Stack saved.',detail:s.height+' / 18 blocks high'+(s.hazard?' · '+s.hazard:''),score:s.height});}
  skip.onclick=()=>{if(active&&!paused&&!document.hidden&&s.status==='ending'){s.status='finished';finish();}};
  const cue=name=>{if(name==='sayWin')audio.sayWin();else if(name==='sayLose')audio.sayLose();else audio.play(name);};
  function tick(now){if(destroyed)return;const dt=last?Math.min(.1,(now-last)/1000):0;last=now;if(active&&!paused&&!document.hidden){tickStorm(s,dt,held.size>0,cue);if(s.status!=='playing')clear();if(s.status==='finished')finish();}for(const b of buttons)b.disabled=!canPlay();skip.hidden=s.status!=='ending';skip.disabled=paused;drawStorm(c,s,canvas.width,canvas.height,reduced);onHud({text:s.status==='ending'?'Watch the storm showdown!':`${Math.ceil(s.remaining)} seconds · ${s.height} / 18 blocks high`});frame=requestAnimationFrame(tick);}
  frame=requestAnimationFrame(tick);
  return {start(){audio.stop();audio.unlock();clear();s=createStormState();s.status='playing';active=true;paused=false;last=0;canvas.focus();},pause(value){paused=value;last=0;clear();if(value)audio.stop();},setMuted:value=>audio.setMuted(value),destroy(){if(destroyed)return;destroyed=true;finish();controller.abort();cancelAnimationFrame(frame);audio.destroy();controls.replaceChildren();}};
}
