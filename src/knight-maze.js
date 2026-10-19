import { createVictorySequence, drawVictory } from './maze-victory.js';
import { createMazeAudio } from './maze-audio.js';
// Deterministic maze rules, separate from rendering and the shared wallet.
export const MAZE = [
  '###################',
  '#S.......#.......S#',
  '#.##.###.#.###.##.#',
  '#.................#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '####.###.#.###.####',
  '#....#.......#....#',
  '#.##.#.##.##.#.##.#',
  '#......DDDDD......#',
  '#.##.#.#####.#.##.#',
  '#....#.......#....#',
  '####.#.#####.#.####',
  '#.................#',
  '#.##.###.#.###.##.#',
  '#..#.....K.....#..#',
  '##.#.#.#####.#.#.##',
  '#S...#.......#...S#',
  '###################',
];
export const DIRECTIONS = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
export const SWORD_SECONDS = 10;
export const DEATH_PAUSE_SECONDS = 1.5;
const START = { x: 9, y: 15 };
const HOMES = [{x:7,y:9},{x:9,y:9},{x:11,y:9},{x:10,y:9}];
const key = (x,y) => `${x},${y}`;
export const walkable = (x,y) => Boolean(MAZE[y]?.[x] && MAZE[y][x] !== '#');
export function neighbors(x,y) {
  return Object.entries(DIRECTIONS).map(([dir,[dx,dy]])=>({dir,x:x+dx,y:y+dy})).filter(p=>walkable(p.x,p.y));
}
function actor(p) { return { ...p, to: null, dir: 'left' }; }
export function createMazeState(modifiers = {}) {
  const gems = new Set(), swords = new Set();
  MAZE.forEach((row,y)=>[...row].forEach((tile,x)=>{if(tile==='.')gems.add(key(x,y));if(tile==='S')swords.add(key(x,y));}));
  return { player: actor(START), dragons: HOMES.map((p,i)=>({...actor(p),home:p,index:i,respawn:0})), gems, swords, totalGems:gems.size, earned:0, kills:0, lives:3, deathPause:0, sword:0, grace:3, elapsed:0, wanted:null, status:'playing', modifiers:{speed:1,pickupRadius:1,garden:false,...modifiers} };
}
function advance(a, distance, choose, arrived = () => {}) {
  while(distance>0.000001) {
    if(!a.to) {const next=choose(a);if(!next)return;a.to={x:next.x,y:next.y};a.dir=next.dir;}
    const dx=a.to.x-a.x,dy=a.to.y-a.y,len=Math.hypot(dx,dy),step=Math.min(len,distance);
    if(len){a.x+=dx/len*step;a.y+=dy/len*step;}distance-=step;
    if(len<=step+0.000001){a.x=a.to.x;a.y=a.to.y;a.to=null;arrived();}else return;
  }
}
function distancesFrom(player) {
  const start={x:Math.round(player.x),y:Math.round(player.y)}, map=new Map([[key(start.x,start.y),0]]),queue=[start];
  for(let i=0;i<queue.length;i++){const p=queue[i];for(const n of neighbors(p.x,p.y)){const k=key(n.x,n.y);if(!map.has(k)){map.set(k,map.get(key(p.x,p.y))+1);queue.push(n);}}}
  return map;
}
function pickups(s, emit) {
  const x=Math.round(s.player.x),y=Math.round(s.player.y);
  // The magnet reaches only adjacent corridor cells, never through walls.
  const cells=[{x,y},...(s.modifiers.pickupRadius>1?neighbors(x,y):[])];
  let collected=false;
  for(const p of cells)if(s.gems.delete(key(p.x,p.y))){s.earned++;collected=true;}
  if(collected)emit('gem');
  if(s.swords.delete(key(x,y))){s.sword=SWORD_SECONDS;emit('sword');}
}
export function tickMaze(s, dt, direction, emit = () => {}) {
  if(s.status==='dying') {
    s.deathPause=Math.max(0,s.deathPause-Math.max(0,Math.min(dt,.25)));
    if(s.deathPause<=.000001){
      s.deathPause=0;
      if(!s.lives)s.status='lost';
      else {s.status='playing';s.grace=3;s.player=actor(START);s.wanted=null;for(const d of s.dragons)Object.assign(d,actor(d.home),{respawn:0});}
    }
    return;
  }
  if(s.status!=='playing')return;
  if(direction && DIRECTIONS[direction])s.wanted=direction;
  // Substeps prevent tunneling through enemies and preserve timer/collision ordering.
  let left=Math.max(0,Math.min(dt,.25));
  while(left>0.000001 && s.status==='playing') {
    const step=Math.min(left,.02);left-=step;s.elapsed+=step;s.sword=Math.max(0,s.sword-step);s.grace=Math.max(0,s.grace-step);
    advance(s.player,4.2*s.modifiers.speed*step,a=>{const choices=neighbors(a.x,a.y);return choices.find(n=>n.dir===s.wanted)||choices.find(n=>n.dir===a.dir);},()=>pickups(s,emit));
    pickups(s,emit);
    const distances=distancesFrom(s.player);
    for(const dragon of s.dragons) {
      if(dragon.respawn>0){dragon.respawn=Math.max(0,dragon.respawn-step);continue;}
      advance(dragon,(s.sword>0?2.3:2.85+dragon.index*.12)*step,a=>{
        const choices=neighbors(a.x,a.y), reverse={left:'right',right:'left',up:'down',down:'up'}[a.dir];
        const forward=choices.filter(n=>n.dir!==reverse), options=forward.length?forward:choices;
        return options.sort((a,b)=>{const da=distances.get(key(a.x,a.y))??100,db=distances.get(key(b.x,b.y))??100;return (s.sword>0?db-da:da-db)||((Object.keys(DIRECTIONS).indexOf(a.dir)+dragon.index)%4-(Object.keys(DIRECTIONS).indexOf(b.dir)+dragon.index)%4);})[0];
      });
      if(Math.hypot(dragon.x-s.player.x,dragon.y-s.player.y)<.65) {
        if(s.sword>0){s.kills++;s.earned+=10;emit('dragon');Object.assign(dragon,actor(dragon.home),{respawn:8});}
        else if(s.grace<=0){s.lives--;s.status='dying';s.deathPause=DEATH_PAUSE_SECONDS;s.wanted=null;emit('eaten');break;}
      }
    }
    if(!s.gems.size && s.status==='playing'){s.status='won';emit('win');}
  }
}
const KNIGHT = [
  '......pp........','.....pppp.......','....ssssss......','...swwwwsss.....','...swssssss.....','...skkkskss.....','...swwwssss.....','....sssss.......','..ssssss..cc....','.sswwsssscccc...', '.sswwsssccccc...', '..ssssssccccc...', '...sssss.ccc....','...ss.ss........','..sss.sss.......','..kkk.kkk.......',
];
const DRAGON = [
  '...h.......h......','..hh......hh......','..dd.....dd...w...','.dddd...dd..www...', '.deddd.dd.wwwww...', '.ddddd.ddwwwww....','..ddd.dddwww......','...dddddddww......','....ddddddd.......','....dbbddddd...d..','...dbbbbdddd..dd..','...dbbbbddddddd...', '....dbbddddd......','....dd..ddd.......','...dhh..dhh.......','..................',
];
function pixels(ctx,sprite,x,y,size,palette,flip=false) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,1);
  const unit=size/16;ctx.translate(-sprite[0].length*unit/2,-size/2);
  sprite.forEach((row,iy)=>[...row].forEach((c,ix)=>{if(c!=='.'){ctx.fillStyle=palette[c];ctx.fillRect(Math.floor(ix*unit),Math.floor(iy*unit),Math.ceil(unit),Math.ceil(unit));}}));ctx.restore();
}
function sword(ctx,x,y,size) {
  ctx.save();ctx.translate(x,y);ctx.rotate(.55);ctx.fillStyle='#657b96';ctx.fillRect(-size*.11,-size*.47,size*.22,size*.65);ctx.fillStyle='#e0eff2';ctx.fillRect(-size*.09,-size*.47,size*.09,size*.62);ctx.fillStyle='#ecc275';ctx.fillRect(-size*.28,size*.09,size*.56,size*.12);ctx.fillStyle='#9e674e';ctx.fillRect(-size*.07,size*.21,size*.14,size*.24);ctx.restore();
}
export function drawMaze(ctx,s,character,width,height,preview=false) {
  ctx.imageSmoothingEnabled=false;ctx.fillStyle='#10151f';ctx.fillRect(0,0,width,height);
  const board=Math.min(preview?width*.55:width-24,height-76),cell=board/19,ox=preview?width-board-24:(width-board)/2,oy=preview?38:64;
  if(preview){ctx.fillStyle='#e5c68a';ctx.font='600 17px monospace';ctx.textAlign='left';ctx.fillText('THE FIRST QUEST',35,95);ctx.fillStyle='#f5ecd7';ctx.font='bold 42px monospace';ctx.fillText('KNIGHTS AND',35,157);ctx.fillText('DRAGONS',35,207);ctx.font='16px monospace';ctx.fillStyle='#99a9b8';ctx.fillText('Gems. Dragons. Glory.',35,250);pixels(ctx,KNIGHT,100,365,100,{p:character.color,s:'#8294a7',w:'#d8e3e4',k:'#1d2838',c:character.color});sword(ctx,175,360,80);}
  else {ctx.textAlign='left';ctx.font='bold 16px monospace';ctx.fillStyle='#e5c68a';ctx.fillText('KNIGHTS AND DRAGONS',18,29);ctx.textAlign='right';ctx.fillStyle=s.sword>0?'#f4d388':'#b6c4cf';ctx.fillText(s.sword>0?`SWORD  ${s.sword.toFixed(1)}s`:'FIND A SWORD',width-18,29);ctx.fillStyle='#293243';ctx.fillRect(18,42,width-36,5);ctx.fillStyle='#f3c674';ctx.fillRect(18,42,(width-36)*s.sword/SWORD_SECONDS,5);}
  MAZE.forEach((row,y)=>[...row].forEach((t,x)=>{const px=ox+x*cell,py=oy+y*cell;
    if(t==='#'){ctx.fillStyle='#354255';ctx.fillRect(px+1,py+1,cell-2,cell-2);ctx.fillStyle='#53637a';ctx.fillRect(px+2,py+2,cell-4,3);ctx.fillStyle='#222d3d';ctx.fillRect(px+2,py+cell-5,cell-4,3);ctx.fillStyle='#293548';ctx.fillRect(px+cell*.5,py+5,1,cell-10);if(s.modifiers.garden&&(x*7+y)%9===0){ctx.fillStyle='#628b75';ctx.fillRect(px+2,py+2,cell*.6,4);ctx.fillStyle='#bd96ba';ctx.fillRect(px+5,py+4,4,4);}}
    else {ctx.fillStyle=(x+y)%2?'#161e2b':'#182130';ctx.fillRect(px,py,cell,cell);}
  }));
  const gemColors=['#ed6f94','#72dbcb','#b79af5','#f2c875','#76bdf4'];
  for(const gem of s.gems){const [x,y]=gem.split(',').map(Number),px=ox+(x+.5)*cell,py=oy+(y+.5)*cell,r=cell*.14;ctx.fillStyle=gemColors[(x+y*2)%5];ctx.beginPath();ctx.moveTo(px,py-r*1.5);ctx.lineTo(px+r,py);ctx.lineTo(px,py+r*1.5);ctx.lineTo(px-r,py);ctx.closePath();ctx.fill();ctx.fillStyle='#ffffffb0';ctx.fillRect(px-1,py-r,2,3);}
  for(const item of s.swords){const[x,y]=item.split(',').map(Number);const px=ox+(x+.5)*cell,py=oy+(y+.5)*cell;ctx.fillStyle='#f3cd7320';ctx.beginPath();ctx.arc(px,py,cell*.44,0,7);ctx.fill();sword(ctx,px,py,cell*.82);}
  const colors=['#a34b50','#738959','#78609e','#4e8e98'];
  for(const d of s.dragons){if(d.respawn>0)continue;ctx.globalAlpha=s.sword>0?.55:1;pixels(ctx,DRAGON,ox+(d.x+.5)*cell,oy+(d.y+.5)*cell+Math.sin(s.elapsed*10+d.index)*1.2,cell*.93,{h:'#e2d8bd',d:colors[d.index],b:'#e9b47e',w:'#c99373',e:s.sword>0?'#bcecff':'#ffda70'},d.dir==='right');ctx.globalAlpha=1;}
  if(s.grace<=0||Math.floor(s.elapsed*8)%2===0||preview){const px=ox+(s.player.x+.5)*cell,py=oy+(s.player.y+.5)*cell;pixels(ctx,KNIGHT,px,py,cell*.92,{p:character.color,s:'#8294a7',w:'#d8e3e4',k:'#1d2838',c:character.color},s.player.dir==='left');if(s.sword>0)sword(ctx,px+cell*.32,py,cell*.8);}
  if(!preview && s.status==='dying') {
    ctx.fillStyle='#10151fbd';ctx.fillRect(ox,oy,board,board);
    ctx.textAlign='center';ctx.fillStyle='#f4d388';ctx.font='bold 30px monospace';
    ctx.fillText('GOBBLED UP!',width/2,oy+board/2-10);
    ctx.font='18px monospace';ctx.fillStyle='#eef1ef';
    ctx.fillText(s.lives?'Get ready to try again…':'Your last life!',width/2,oy+board/2+28);
  }
}
export function drawKnightPreview(canvas,character,modifiers) { const ctx=canvas.getContext('2d');if(ctx)drawMaze(ctx,createMazeState(modifiers),character,canvas.width,canvas.height,true); }
export function createKnightMaze({canvas,character,modifiers,onHud,onFinish}) {
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Your browser does not support canvas.');
  let state=createMazeState(modifiers),active=false,paused=false,last=0,frame,destroyed=false,victory=null;
  const reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  const controller=new AbortController(),options={signal:controller.signal},audio=createMazeAudio();
  const input={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
  const turn=direction=>{audio.unlock();if(state.status==='playing' && DIRECTIONS[direction])state.wanted=direction;};
  canvas.addEventListener('keydown',e=>{if(e.key==='Enter'&&victory&&active){e.preventDefault();audio.stop();finish();return;}const dir=input[e.key]||input[e.key.toLowerCase()];if(dir){e.preventDefault();turn(dir);}},options);
  let pointer=null;
  canvas.addEventListener('pointerdown',e=>{canvas.focus();if(victory&&active){audio.stop();finish();return;}pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);},options);
  canvas.addEventListener('pointermove',e=>{if(!pointer)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.hypot(dx,dy)>12){turn(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');pointer={x:e.clientX,y:e.clientY};}},options);
  canvas.addEventListener('pointerup',()=>pointer=null,options);canvas.addEventListener('pointercancel',()=>pointer=null,options);
  function finish(){if(!active)return;active=false;onFinish(state.earned,{title:state.status==='won'?'The vault is yours!':state.status==='lost'?'The dragons hold the vault.':'Quest saved.',detail:`${state.totalGems-state.gems.size} gems · ${state.kills} dragons defeated`});}
  function hud(){onHud({lives:state.lives,text:`${state.lives} lives · ${state.gems.size} gems left · ✦ ${state.earned} coins${state.sword>0?` · Sword ${Math.ceil(state.sword)}s`:''}`});}
  function drawWinningKnight(ctx,x,y,size,wave) {
    pixels(ctx,KNIGHT,x,y,size,{p:character.color,s:'#8294a7',w:'#d8e3e4',k:'#1d2838',c:character.color});
    ctx.save();ctx.translate(x+size*.28,y-size*.06);ctx.rotate(wave);
    ctx.fillStyle='#d8e3e4';ctx.fillRect(-10,-49,20,53);sword(ctx,0,-85,115);ctx.restore();
  }
  function tick(now){
    if(destroyed)return;
    const dt=last?Math.min((now-last)/1000,.1):0;last=now;
    if(active&&!paused&&!document.hidden){
      if(victory){
        victory.advance(dt);
        onHud({lives:state.lives,text:victory.time>=3.6?'You win! Your treasure awaits.':'Victory! The treasure chest is opening…'});
        if(victory.complete)finish();
      } else {
        tickMaze(state,dt,undefined,event=>audio.play(event));hud();
        if(state.status==='won')victory=createVictorySequence(audio);
        else if(state.status==='lost')finish();
      }
    }
    if(victory)drawVictory(ctx,victory.time,canvas.width,canvas.height,drawWinningKnight,reducedMotion);
    else drawMaze(ctx,state,character,canvas.width,canvas.height);
    frame=requestAnimationFrame(tick);
  }
  document.addEventListener?.('visibilitychange',()=>{last=0;if(document.hidden)audio.stop();},options);
  frame=requestAnimationFrame(tick);
  return {start(){audio.stop();audio.unlock();victory=null;state=createMazeState(modifiers);active=true;paused=false;last=0;hud();canvas.focus();},pause(value){paused=value;last=0;pointer=null;if(value)audio.stop();else audio.unlock();},setMuted:value=>audio.setMuted(value),input:turn,destroy(){if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);controller.abort();audio.destroy();finish();}};
}
