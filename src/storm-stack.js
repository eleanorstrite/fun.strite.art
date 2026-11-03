import {drawWizardBackground,drawWizardBlock,wizardBackground,wizardBlock,loadWizardSetting,saveWizardSetting,mountWizardBlocks} from './wizard-themes.js';
import {drawStormWizard,loadStormWizard,saveStormWizard,mountStormWizardChoices} from './storm-wizards.js';
import {animateStormCover} from './storm-cover.js';
import { createMazeAudio } from './maze-audio.js';
export const STORM_WIDTH=10,STORM_ROWS=24,STORM_TARGET=18,STORM_SECONDS=30;
export const STORM_MODES={race:{name:'Sky race',seconds:30,target:18},survival:{name:'Balance survival',seconds:45,target:24},practice:{name:'Magic practice',seconds:Infinity,target:18}};
export const WIZARD_SPELLS=[{id:'anchor',name:'Anchor',key:'X',detail:'Save your next wobbly landing'},{id:'slow',name:'Slow Time',key:'C',detail:'Slow the piece and clock for 8 seconds'},{id:'transmute',name:'Transmute',key:'V',detail:'Turn the next piece into a square'},{id:'levitate',name:'Levitate',key:'B',detail:'Lift your falling piece 3 rows'},{id:'undo',name:'Undo',key:'Z',detail:'Remove your last landed piece'}];
const SHAPES=[[[0,0],[1,0],[2,0],[3,0]],[[0,0],[1,0],[0,1],[1,1]],[[1,0],[0,1],[1,1],[2,1]],[[1,0],[2,0],[0,1],[1,1]],[[0,0],[1,0],[1,1],[2,1]],[[0,0],[0,1],[1,1],[2,1]],[[2,0],[0,1],[1,1],[2,1]]];
const COLORS=['#70dce8','#f9d65c','#bc8bea','#8fce73','#f092b4','#789ee5','#f6a465'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function stormFits(s,cells,x,y){return cells.every(([dx,dy])=>x+dx>=0&&x+dx<STORM_WIDTH&&y+dy>=0&&y+dy<STORM_ROWS&&!s.board[y+dy][x+dx]);}
function nextPiece(s){
  if(!s.bag.length){s.bag=[0,1,2,3,4,5,6];for(let i=6;i>0;i--){const j=Math.floor(s.random()*(i+1));[s.bag[i],s.bag[j]]=[s.bag[j],s.bag[i]];}}
  const kind=s.bag.pop();return {kind,cells:SHAPES[kind].map(p=>[...p]),x:3,y:0};
}
export function createStormState(random=Math.random,roundBackground=0,mode='race'){
  const s={board:Array.from({length:STORM_ROWS},()=>Array(STORM_WIDTH).fill(0)),random,bag:[],piece:null,next:null,status:'ready',remaining:STORM_SECONDS,fall:0,height:0,locked:0,tumbling:[],balanceNotice:0,clip:0,won:false,background:Math.max(0,Number.isInteger(roundBackground)?roundBackground:0)%8,blockStyle:'galaxy',slowTime:0,spellNotice:'',noticeTime:0,lastPlacement:null};
  s.wizard='sorceress';s.mode=Object.hasOwn(STORM_MODES,mode)?mode:'race';s.remaining=STORM_MODES[s.mode].seconds;s.target=STORM_MODES[s.mode].target;s.elapsed=0;s.misses=0;s.combo=0;s.spells=3;s.ward=false;s.particles=[];
  s.piece=nextPiece(s);s.next=nextPiece(s);return s;
}
function endStorm(s,won,emit){s.won=won;s.status='ending';s.clip=0;emit(won?'win':'bell');}
export function stormMove(s,dx){if(s.status!=='playing')return false;const p=s.piece;if(!stormFits(s,p.cells,p.x+dx,p.y))return false;p.x+=dx;return true;}
export function stormRotate(s){
  if(s.status!=='playing'||s.piece.kind===1)return false;
  const p=s.piece,rotated=p.cells.map(([x,y])=>[-y,x]),minX=Math.min(...rotated.map(p=>p[0])),minY=Math.min(...rotated.map(p=>p[1]));
  const cells=rotated.map(([x,y])=>[x-minX,y-minY]);
  for(const dx of [0,-1,1,-2,2])if(stormFits(s,cells,p.x+dx,p.y)){p.cells=cells;p.x+=dx;return true;}return false;
}
// A piece balances only when its center of mass rests over its supporting cells.
export function stormBalance(s,p){
  const cells=p.cells.map(([x,y])=>[p.x+x,p.y+y]),own=new Set(cells.map(([x,y])=>`${x},${y}`));
  const supports=cells.filter(([x,y])=>!own.has(`${x},${y+1}`)&&(y===STORM_ROWS-1||s.board[y+1]?.[x]));
  const center=cells.reduce((sum,[x])=>sum+x+.5,0)/cells.length;
  if(!supports.length)return {stable:false,direction:1,pivotX:center,pivotY:p.y+p.cells.length};
  const left=Math.min(...supports.map(([x])=>x)),right=Math.max(...supports.map(([x])=>x+1));
  const stable=center>=left+.08&&center<=right-.08,direction=center<(left+right)/2?-1:1;
  const edge=supports.find(([x])=>direction<0?x===left:x+1===right);
  return {stable,direction,pivotX:direction<0?left:right,pivotY:edge[1]+1};
}
export function canWizardSpell(s,id='anchor'){
 if(s.status!=='playing'||s.spells<=0)return false;
 if(id==='anchor')return !s.ward;if(id==='slow')return s.slowTime<=0;
 if(id==='transmute')return s.next.kind!==1;
 if(id==='undo')return !!s.lastPlacement;
 if(id==='levitate')return s.piece.y>=3&&stormFits(s,s.piece.cells,s.piece.x,s.piece.y-3);
 return false;
}
export function stormSpell(s,emit=()=>{},id='anchor'){
 if(!canWizardSpell(s,id))return false;
 if(id==='anchor')s.ward=true;
 if(id==='slow')s.slowTime=8;
 if(id==='transmute')s.next={kind:1,cells:SHAPES[1].map(p=>[...p]),x:3,y:0};
 if(id==='levitate')s.piece.y-=3;
 if(id==='undo'){for(const [x,y]of s.lastPlacement)s.board[y][x]=0;s.lastPlacement=null;const top=s.board.findIndex(row=>row.some(Boolean));s.height=top<0?0:STORM_ROWS-top;s.combo=0;}
 s.spells--;s.spellNotice=WIZARD_SPELLS.find(spell=>spell.id===id).name+'!';s.noticeTime=1.5;emit('bounce');return true;
}
export function stormHardDrop(s,emit=()=>{}){
  if(s.status!=='playing')return false;
  while(stormFits(s,s.piece.cells,s.piece.x,s.piece.y+1))s.piece.y++;
  s.fall=0;dropRow(s,emit);return true;
}
function dropRow(s,emit){
  const p=s.piece;
  if(stormFits(s,p.cells,p.x,p.y+1)){p.y++;return;}
  const balance=stormBalance(s,p);
  if(balance.stable||s.ward){
    for(const [dx,dy] of p.cells)s.board[p.y+dy][p.x+dx]=p.kind+1;
    s.lastPlacement=p.cells.map(([x,y])=>[p.x+x,p.y+y]);s.ward=false;s.combo=balance.stable?s.combo+1:0;if(s.combo>0&&s.combo%3===0)s.spells=Math.min(5,s.spells+1);
    for(const [dx,dy] of p.cells)s.particles.push({x:p.x+dx+.5,y:p.y+dy+.5,age:0,color:COLORS[p.kind]});
    s.locked++;const top=s.board.findIndex(row=>row.some(Boolean));s.height=top<0?0:STORM_ROWS-top;emit('bounce');
    if(s.mode!=='survival'&&s.height>=s.target){endStorm(s,true,emit);return;}
  }else{
    s.tumbling.push({...balance,kind:p.kind,cells:p.cells.map(([x,y])=>[p.x+x,p.y+y]),age:0});
    s.balanceNotice=2;s.combo=0;s.misses++;emit('whoosh');
    if(s.mode==='survival'&&s.misses>=3){endStorm(s,false,emit);return;}
  }
  s.piece=s.next;s.next=nextPiece(s);
  if(!stormFits(s,s.piece.cells,s.piece.x,s.piece.y))endStorm(s,false,emit);
}
export function tickStorm(s,dt,fast=false,emit=()=>{}){
  dt=clamp(dt,0,.1);
  if(s.status==='ending'){
    const before=s.clip;s.clip+=dt;
    if(before<1&&s.clip>=1)emit(s.won?'sayWin':'sayLose');
    if(s.clip>=3.5)s.status='finished';return;
  }
  if(s.status!=='playing')return;
  s.elapsed+=dt;s.noticeTime=Math.max(0,s.noticeTime-dt);
  const slow=s.slowTime>0;s.slowTime=Math.max(0,s.slowTime-dt);
  for(const particle of s.particles)particle.age+=dt;
  s.particles=s.particles.filter(p=>p.age<.8);
  s.balanceNotice=Math.max(0,s.balanceNotice-dt);
  for(const piece of s.tumbling)piece.age+=dt;
  s.tumbling=s.tumbling.filter(piece=>piece.age<3.2);
  s.remaining=Math.max(0,s.remaining-dt*(slow?.4:1));
  if(s.remaining<=1e-7){s.remaining=0;endStorm(s,s.mode==='survival',emit);return;}
  s.fall+=dt*(slow?.4:1);const interval=fast?.032:.48;
  while(s.fall>=interval&&s.status==='playing'){s.fall-=interval;dropRow(s,emit);}
}
function rect(c,x,y,w,h,color,r=0){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function label(c,text,x,y,size=20,color='#f6edd9'){c.fillStyle=color;c.font=`600 ${size}px system-ui`;c.textAlign='center';c.fillText(text,x,y);}
function renderTower(c,s,time=0,ending=false){
 const ox=340,oy=78,cell=21;
 rect(c,ox-12,oy-8,234,516,'#08142d80',16);
 const collapse=ending&&!s.won?Math.min(1,s.clip/2):0;
 for(let y=0;y<24;y++)for(let x=0;x<10;x++)if(s.board[y][x]){c.save();c.translate(ox+x*cell+Math.sin(x+y)*collapse*100,oy+y*cell+collapse*collapse*(650-y*12));c.rotate(collapse*(x-4)*.2);drawWizardBlock(c,0,0,cell,s.board[y][x]-1,s.blockStyle,time);c.restore();}
 rect(c,ox-28,oy+504,266,18,'#a58bd4',7);rect(c,ox-21,oy+501,252,7,'#e3d3ff',3);
 c.fillStyle='#4f3e75';c.beginPath();c.moveTo(ox-22,oy+522);c.lineTo(ox+109,oy+558);c.lineTo(ox+228,oy+522);c.fill();
 if(!ending){
 const p=s.piece;let gy=p.y;while(stormFits(s,p.cells,p.x,gy+1))gy++;
 const stable=stormBalance(s,{...p,y:gy}).stable||s.ward;
 c.globalAlpha=.38;for(const [x,y]of p.cells){drawWizardBlock(c,ox+(p.x+x)*cell,oy+(gy+y)*cell,cell,p.kind,s.blockStyle,time);if(!stable)rect(c,ox+(p.x+x)*cell+2,oy+(gy+y)*cell+2,17,17,'#ff78557a',3);}c.globalAlpha=1;
 for(const [x,y]of p.cells)drawWizardBlock(c,ox+(p.x+x)*cell,oy+(p.y+y)*cell,cell,p.kind,s.blockStyle,time);
 for(const piece of s.tumbling){const t=piece.age,fall=Math.max(0,t-.4);c.save();c.translate(ox+piece.pivotX*cell+piece.direction*150*fall*fall,oy+piece.pivotY*cell+280*fall*fall);c.rotate(piece.direction*(Math.min(.65,t*t*2)+fall*2.2));for(const [x,y]of piece.cells)drawWizardBlock(c,(x-piece.pivotX)*cell,(y-piece.pivotY)*cell,cell,piece.kind,s.blockStyle,time);c.restore();}
 if(s.mode!=='survival'){const y=oy+(24-s.target)*cell;c.strokeStyle='#ffde8e';c.lineWidth=2;c.setLineDash([7,6]);c.beginPath();c.moveTo(ox-10,y);c.lineTo(ox+222,y);c.stroke();c.setLineDash([]);label(c,'GOAL',ox-45,y+4,12,'#fff2c4');}
 for(const particle of s.particles){c.globalAlpha=1-particle.age/.8;rect(c,ox+particle.x*cell+Math.sin(particle.x*5)*particle.age*65,oy+particle.y*cell-particle.age*65,4,4,'#ffe9a3',2);}c.globalAlpha=1;
 if(s.ward){c.strokeStyle='#fff3a6';c.lineWidth=3;c.beginPath();c.ellipse(ox+(p.x+1.5)*cell,oy+(p.y+1)*cell,50,13,0,0,Math.PI*2);c.stroke();}
 }
}
export function drawStormEnding(c,s,reduced=false){
 drawWizardBackground(c,s.background,reduced?0:s.elapsed,reduced);renderTower(c,s,reduced?0:s.elapsed,true);drawStormWizard(c,s.wizard,180,560,reduced?0:s.clip,s.won);
 rect(c,220,148,520,190,'#101d3aee',26);label(c,s.won?'MAGNIFICENT MAGIC!':'ONE MORE TRY?',480,211,30,'#ffe8a0');label(c,s.won?'Your tower reaches the clouds.':'Every wizard starts with a wobble.',480,255,20);label(c,s.height+' blocks high · '+STORM_MODES[s.mode].name,480,295,16,'#c7d5f7');
 if(s.won)for(let i=0;i<50;i++){const t=reduced?1:s.clip,x=(i*97)%960,y=(i*41+t*70)%650;rect(c,x,y,4,8,COLORS[i%7],1);}
}
export function drawStorm(c,s,width,height,reduced=false){
 c.save();c.fillStyle='#071327';c.fillRect(0,0,width,height);const scale=Math.min(width/960,height/650);c.translate((width-960*scale)/2,(height-650*scale)/2);c.scale(scale,scale);
 if(s.status==='ending'||s.status==='finished'){drawStormEnding(c,s,reduced);c.restore();return;}
 const time=reduced?0:s.elapsed;drawWizardBackground(c,s.background,time,reduced);
 rect(c,20,14,920,47,'#08142dc9',15);label(c,'WIZARD TETRIS',480,46,27,'#ffe8a0');
 rect(c,28,90,240,485,'#08142db8',22);label(c,'YOUR WIZARD',148,122,13,'#c7d5f7');
 c.save();c.translate(155,551);c.scale(1.7,1.7);drawStormWizard(c,s.wizard,0,0,time,s.ward||s.slowTime>0);c.restore();
 label(c,wizardBackground(s.background).name,148,155,16);label(c,'✦ '+s.spells+' magic charges',148,185,17,'#ffe8a0');
 label(c,s.slowTime>0?'Slow Time · '+Math.ceil(s.slowTime)+'s':s.ward?'Anchor armed':s.combo>1?s.combo+' steady landings!':'Stack. Balance. Cast.',148,215,15,'#aee9ed');
 renderTower(c,s,time);
 rect(c,650,90,280,485,'#08142ddc',22);label(c,STORM_MODES[s.mode].name,790,126,19,'#b7d4ff');
 label(c,Number.isFinite(s.remaining)?Math.ceil(s.remaining)+'s':'∞',790,184,45,'#ffe8a0');label(c,s.mode==='survival'?(3-s.misses)+' lives remaining':s.height+' / '+s.target+' high',790,221,22);
 label(c,'NEXT PIECE',790,275,13,'#c7d5f7');for(const [x,y]of s.next.cells)drawWizardBlock(c,737+x*26,294+y*26,26,s.next.kind,s.blockStyle,time);
 label(c,wizardBlock(s.blockStyle).name+' blocks',790,383,17,'#b7d4ff');
 for(let i=0;i<WIZARD_SPELLS.length;i++){const spell=WIZARD_SPELLS[i];label(c,spell.key+' · '+spell.name,790,417+i*27,16,canWizardSpell(s,spell.id)?'#ffe8a0':'#aeb9d2');}
 if(s.noticeTime>0){rect(c,342,320,207,55,'#243559ed',16);label(c,s.spellNotice,446,355,22,'#ffe8a0');}
 label(c,s.balanceNotice>0?'Too much overhang! Try an Anchor.':'← → Move   ↑ Rotate   ↓ Faster   Space Drop',480,625,17,s.balanceNotice>0?'#ffd7b5':'#f1f0ff');c.restore();
}
export function drawStormPreview(canvas){animateStormCover(canvas);}
export function createStormStack({canvas,onHud,onFinish,controls=document.querySelector('#storm-controls')}){
 const c=canvas.getContext('2d');if(!c)throw Error('Canvas is unavailable.');
 const audio=createMazeAudio(),controller=new AbortController(),options={signal:controller.signal};
 let roundIndex=Math.max(0,Math.floor(Number(loadWizardSetting('next-background',0))||0))%8,selectedMode='race',selectedWizard=loadStormWizard(),selectedBlocks=wizardBlock(loadWizardSetting('blocks','galaxy')).id;
 let s=newState(),active=false,paused=false,destroyed=false,last=0,frame;const held=new Set();
 function newState(){const state=createStormState(Math.random,roundIndex,selectedMode);state.wizard=selectedWizard;state.blockStyle=selectedBlocks;return state;}
 const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
 const clear=()=>held.clear(),canPlay=()=>active&&!paused&&!document.hidden&&s.status==='playing';
 const cue=name=>{if(name==='sayWin')audio.sayWin();else if(name==='sayLose')audio.sayLose();else audio.play(name);};
 const act=name=>{if(!canPlay())return;audio.unlock();if(name==='left')stormMove(s,-1);if(name==='right')stormMove(s,1);if(name==='rotate')stormRotate(s);if(name==='drop')stormHardDrop(s,cue);if(WIZARD_SPELLS.some(spell=>spell.id===name))stormSpell(s,cue,name);syncControls();render();};
 canvas.addEventListener('keydown',e=>{const name={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rotate',ArrowDown:'down',' ':'drop',x:'anchor',c:'slow',v:'transmute',b:'levitate',z:'undo'}[e.key.length===1?e.key.toLowerCase():e.key];if(!name)return;e.preventDefault();if(name==='down'){if(canPlay())held.add('keyboard');}else if(!e.repeat||['left','right'].includes(name))act(name);},options);
 globalThis.window?.addEventListener('keyup',e=>{if(e.key==='ArrowDown')held.delete('keyboard');},options);canvas.addEventListener('blur',clear,options);
 document.addEventListener('visibilitychange',()=>{last=0;clear();if(document.hidden)audio.stop();},options);
 controls.replaceChildren();const wizardChoices=mountStormWizardChoices(controls,selectedWizard,id=>{if(active)return;selectedWizard=saveStormWizard(id);s.wizard=selectedWizard;});
 const blockChoices=mountWizardBlocks(controls,selectedBlocks,id=>{if(active)return;selectedBlocks=id;saveWizardSetting('blocks',id);s.blockStyle=id;});
 const modes=document.createElement('div');modes.className='storm-modes';controls.append(modes);const modeButtons=[];
 for(const [id,mode]of Object.entries(STORM_MODES)){const b=document.createElement('button');b.type='button';b.className='button outline';b.textContent=mode.name;b.setAttribute?.('aria-pressed',String(id===selectedMode));b.onclick=()=>{if(active)return;selectedMode=id;s=newState();for(const [key,button]of modeButtons)button.setAttribute?.('aria-pressed',String(key===id));};modes.append(b);modeButtons.push([id,b]);}
 const scene=document.createElement('p');scene.className='wizard-scene-note';controls.append(scene);
 const row=document.createElement('div');row.className='storm-buttons';controls.append(row);const buttons=[];
 for(const [name,title]of [['left','← Left'],['rotate','↻ Rotate'],['right','Right →'],['down','Hold ↓ Faster'],['drop','↓ Drop now'],...WIZARD_SPELLS.map(spell=>[spell.id,spell.key+' · '+spell.name])]){
 const b=document.createElement('button');b.type='button';b.className='button outline';b.textContent=title;b.setAttribute?.('data-action',name);if(WIZARD_SPELLS.some(spell=>spell.id===name))b.title=WIZARD_SPELLS.find(spell=>spell.id===name).detail;row.append(b);buttons.push([name,b]);
 if(name==='down'){
 b.addEventListener('pointerdown',e=>{e.preventDefault();if(canPlay()){b.setPointerCapture?.(e.pointerId);held.add('touch'+e.pointerId);}},options);
 for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>held.delete('touch'+e.pointerId),options);
 b.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();if(canPlay())held.add('button');}},options);b.addEventListener('keyup',()=>held.delete('button'),options);b.addEventListener('blur',clear,options);
 }else b.onclick=()=>{act(name);canvas.focus({preventScroll:true});};
 }
 const tip=document.createElement('p');tip.textContent='Sky race: reach 18 high in 30 seconds. Balance survival: last 45 seconds with 3 lives. Practice: no timer. Start with 3 magic charges; earn one every 3 steady landings, up to 5. Spells: Anchor saves a wobble; Slow Time slows the clock and piece for 8 seconds; Transmute makes the next piece a square; Levitate lifts the piece 3 rows; Undo removes your last landed piece. Rows stay stacked. New scenery every round! Complete for 5 coins, win for 25.';controls.append(tip);
 const skip=document.createElement('button');skip.type='button';skip.className='button outline';skip.textContent='Continue';skip.hidden=true;controls.append(skip);
 function finish(){if(!active)return;active=false;clear();audio.stop();const completed=s.status==='finished';onFinish(completed?(s.won?25:5):0,{title:completed?(s.won?'Wizard victory!':'Your next tower awaits!'):'Tower saved.',detail:STORM_MODES[s.mode].name+' · '+s.height+' high · '+wizardBackground(s.background).name,score:s.height});}
 skip.onclick=()=>{if(active&&!paused&&!document.hidden&&s.status==='ending'){s.status='finished';finish();}};
 function syncControls(){wizardChoices.setDisabled(active);blockChoices.setDisabled(active);for(const [,b]of modeButtons)b.disabled=active;for(const [name,b]of buttons)b.disabled=!canPlay()||(WIZARD_SPELLS.some(spell=>spell.id===name)&&!canWizardSpell(s,name));}
 function render(){drawStorm(c,s,canvas.width,canvas.height,reduced);onHud({text:s.status==='ending'?'A little tower magic!':`${STORM_MODES[s.mode].name} · ${Number.isFinite(s.remaining)?Math.ceil(s.remaining)+'s':'No timer'} · ${s.height} high · ${s.spells} spells · ${wizardBackground(s.background).name}${s.mode==='survival'?' · '+(3-s.misses)+' lives':''}`});}
 function tick(now){if(destroyed)return;const dt=last?Math.min(.1,(now-last)/1000):0;last=now;if(active&&!paused&&!document.hidden){tickStorm(s,dt,held.size>0,cue);if(s.status!=='playing')clear();if(s.status==='finished')finish();}
 syncControls();
 scene.textContent=wizardBackground(s.background).name+' · Next round: '+wizardBackground(roundIndex).name;skip.hidden=s.status!=='ending';skip.disabled=paused;render();frame=requestAnimationFrame(tick);}
 frame=requestAnimationFrame(tick);
 return {start(){audio.stop();audio.unlock();clear();s=newState();roundIndex=(roundIndex+1)%8;saveWizardSetting('next-background',roundIndex);s.status='playing';active=true;wizardChoices.setDisabled(true);blockChoices.setDisabled(true);paused=false;last=0;syncControls();render();canvas.focus();},pause(value){paused=value;last=0;clear();if(value)audio.stop();},setMuted:value=>audio.setMuted(value),destroy(){if(destroyed)return;destroyed=true;finish();controller.abort();cancelAnimationFrame(frame);audio.destroy();controls.replaceChildren();}};
}
