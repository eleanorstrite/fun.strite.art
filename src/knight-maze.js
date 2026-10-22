import { ARMORS, DRAGON_STYLES } from './system.js';
import { createDefeatSequence, drawDefeat } from './maze-defeat.js';
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
  'P......DDDDD......P',
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
export const KNIGHT_LEVELS = [
  {name:'Stone Keep',maze:MAZE,wall:'#45494b',light:'#737b7e',shadow:'#252c32',floor:'#1d252b',accent:'#e5c68a',design:'brick'},
  {name:"Crystal Caverns",maze:["###################", "#S#...........#..S#", "#.#.###.###.###.#.#", "#.#...#.........#.#", "#.###############.#", "#.#.......#.......#", "#.#.#####.#.#.#.#.#", "#.......#...#.#.#.#", "#.#.#.###.#.#.#.#.#", "P......DDDDD......P", "#####.#.###.#####.#", "#.....#.#.....#...#", "#.###.#.#.#.#.#.###", "#...#...#.#.......#", "###.#####.#.#.###.#", "#.#.#....K#.#...#.#", "#.#.###.###.#.###.#", "#S......#...#....S#", "###################"],wall:"#355e7b",light:"#8dd9ec",shadow:"#223c58",floor:"#152c3d",accent:"#a4eeff",design:"crystal"},
  {name:"Enchanted Ruins",maze:["###################", "#S..#............S#", "###.#########.###.#", "#.#...#.......#...#", "#.###.#.#######.###", "#...#...#.........#", "#.#.#######.#.###.#", "#.#.........#...#.#", "#####.#.#######.#.#", "P......DDDDD......P", "#.#######.#.###.#.#", "#.#.......#...#...#", "#.#.###.#####.#.###", "#...#.........#...#", "#.#######.###.#.#.#", "#...#....K#.#...#.#", "###.#.#.#.#.#####.#", "#S....#...#......S#", "###################"],wall:"#355d49",light:"#8bb77a",shadow:"#203d34",floor:"#14281f",accent:"#cbeba3",design:"vine"},
  {name:"Ember Fortress",maze:["###################", "#S..#...#...#...#S#", "###.#.#.#.#.#.#.#.#", "#...#.#...#.#.#.#.#", "#.###.#####.#.#.#.#", "#.....#.....#.#.#.#", "#.#.###.#####.#.#.#", "#...#.#.......#...#", "#####.#.#####.###.#", "P......DDDDD......P", "#.#.#.#####.###.#.#", "#.#.#.#...#.#...#.#", "#.#.#.#.###.#.#####", "#.#.#...#...#.....#", "#.#.#.#.#.###.###.#", "#.#.#.#..K#.......#", "#.#.###.#########.#", "#S#..............S#", "###################"],wall:"#793d43",light:"#e38d61",shadow:"#4b2634",floor:"#2b1825",accent:"#ffd092",design:"rune"},
];
export const DIRECTIONS = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
export const PORTAL_ROW = 9;
export const SWORD_SECONDS = 10;
export const DEATH_PAUSE_SECONDS = 1.5;
const START = { x: 9, y: 15 };
const HOMES = [{x:7,y:9},{x:9,y:9},{x:11,y:9},{x:10,y:9}];
const key = (x,y) => `${x},${y}`;
export const walkable = (x,y,maze=MAZE) => Boolean(maze[y]?.[x] && maze[y][x] !== '#');
export function neighbors(x,y,maze=MAZE) {
  return Object.entries(DIRECTIONS).map(([dir,[dx,dy]])=>{
    if(y===PORTAL_ROW && ((x===0&&dir==='left')||(x===maze[0].length-1&&dir==='right')))
      return {dir,x:x===0?maze[0].length-1:0,y,portal:true};
    return {dir,x:x+dx,y:y+dy};
  }).filter(p=>walkable(p.x,p.y,maze));
}
function actor(p) { return { ...p, to: null, dir: 'left' }; }
export function createMazeState(modifiers = {},level=0) {
  if(!Number.isInteger(level)||!KNIGHT_LEVELS[level])throw Error('Invalid maze level.');
  const maze=KNIGHT_LEVELS[level].maze;
  const gems = new Set(), swords = new Set();
  maze.forEach((row,y)=>[...row].forEach((tile,x)=>{if(tile==='.')gems.add(key(x,y));if(tile==='S')swords.add(key(x,y));}));
  return { level,maze,player: actor(START), dragons: HOMES.map((p,i)=>({...actor(p),home:p,index:i,respawn:0})), gems, swords, totalGems:gems.size, earned:0, kills:0, lives:3, deathPause:0, boosts:{boots:0,magnet:0,eliminator:0}, sword:0, grace:3, elapsed:0, wanted:null, status:'playing', modifiers:{speed:1,pickupRadius:1,garden:false,...modifiers} };
}
function advance(a, distance, choose, arrived = () => {}) {
  while(distance>0.000001) {
    if(!a.to) {const next=choose(a);if(!next)return;if(next.portal){a.x=next.x;a.y=next.y;a.dir=next.dir;arrived(true);return;}a.to={x:next.x,y:next.y};a.dir=next.dir;}
    const dx=a.to.x-a.x,dy=a.to.y-a.y,len=Math.hypot(dx,dy),step=Math.min(len,distance);
    if(len){a.x+=dx/len*step;a.y+=dy/len*step;}distance-=step;
    if(len<=step+0.000001){a.x=a.to.x;a.y=a.to.y;a.to=null;arrived();}else return;
  }
}
function distancesFrom(player,maze) {
  const start={x:Math.round(player.x),y:Math.round(player.y)}, map=new Map([[key(start.x,start.y),0]]),queue=[start];
  for(let i=0;i<queue.length;i++){const p=queue[i];for(const n of neighbors(p.x,p.y,maze)){const k=key(n.x,n.y);if(!map.has(k)){map.set(k,map.get(key(p.x,p.y))+1);queue.push(n);}}}
  return map;
}
export function calculateMazeReward(totalGems,remainingGems,kills) {
  const collected=totalGems>0?Math.max(0,Math.min(1,(totalGems-remainingGems)/totalGems)):0;
  return Math.min(40,Math.floor(collected*30)+Math.min(10,Math.max(0,kills)*2));
}
function updateReward(s){s.earned=calculateMazeReward(s.totalGems,s.gems.size,s.kills);}
function pickups(s, emit) {
  const x=Math.round(s.player.x),y=Math.round(s.player.y);
  // The magnet reaches only adjacent corridor cells, never through walls.
  const cells=[{x,y},...((s.boosts.magnet>0||s.modifiers.pickupRadius>1)?neighbors(x,y,s.maze).filter(p=>!p.portal):[])];
  let collected=false;
  for(const p of cells)if(s.gems.delete(key(p.x,p.y))){collected=true;}
  if(collected){updateReward(s);emit('gem');}
  if(s.swords.delete(key(x,y))){s.sword=SWORD_SECONDS;emit('sword');}
}
export function activateMazeBoost(state,id,consume=()=>false) {
  if(state.status!=='playing'||!['boots','magnet','eliminator'].includes(id)||state.boosts[id]>0)return false;
  if(!consume(id))return false;
  state.boosts[id]=15;return true;
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
    const dragonsHidden=s.boosts.eliminator>0;
    for(const id of ['boots','magnet','eliminator']){const remaining=s.boosts[id]-step;s.boosts[id]=remaining>1e-8?remaining:0;}
    advance(s.player,4.2*s.modifiers.speed*(s.boosts.boots>0?1.25:1)*step,a=>{const choices=neighbors(a.x,a.y,s.maze);return choices.find(n=>n.dir===s.wanted)||choices.find(n=>n.dir===a.dir);},portal=>{if(portal)emit('portal');pickups(s,emit);});
    pickups(s,emit);
    const distances=distancesFrom(s.player,s.maze);
    for(const dragon of s.dragons) {
      // Freeze position, direction, destination and respawn time until the boost ends.
      if(dragonsHidden)continue;
      if(dragon.respawn>0){dragon.respawn=Math.max(0,dragon.respawn-step);continue;}
      advance(dragon,(s.sword>0?2.3:2.85+dragon.index*.12)*step,a=>{
        const choices=neighbors(a.x,a.y,s.maze), reverse={left:'right',right:'left',up:'down',down:'up'}[a.dir];
        const forward=choices.filter(n=>n.dir!==reverse), options=forward.length?forward:choices;
        return options.sort((a,b)=>{const da=distances.get(key(a.x,a.y))??100,db=distances.get(key(b.x,b.y))??100;return (s.sword>0?db-da:da-db)||((Object.keys(DIRECTIONS).indexOf(a.dir)+dragon.index)%4-(Object.keys(DIRECTIONS).indexOf(b.dir)+dragon.index)%4);})[0];
      });
      if(Math.hypot(dragon.x-s.player.x,dragon.y-s.player.y)<.65) {
        if(s.sword>0){s.kills++;updateReward(s);emit('dragon');Object.assign(dragon,actor(dragon.home),{respawn:8});}
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
function actorShadow(ctx,x,y,cell){
  ctx.fillStyle='#00000055';ctx.beginPath();ctx.ellipse(x,y+cell*.33,cell*.32,cell*.12,0,0,Math.PI*2);ctx.fill();
}
function pixels(ctx,sprite,x,y,size,palette,flip=false) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,1);
  const unit=size/16;ctx.translate(-sprite[0].length*unit/2,-size/2);
  sprite.forEach((row,iy)=>[...row].forEach((c,ix)=>{if(c!=='.'){ctx.fillStyle=palette[c];ctx.fillRect(Math.floor(ix*unit),Math.floor(iy*unit),Math.ceil(unit),Math.ceil(unit));}}));ctx.restore();
}
export function drawKnight(ctx,x,y,size,character,flip=false) {
  const armor=ARMORS[character.armor]||ARMORS.silver,helmet=character.helmet||'plume';
  const sprite=KNIGHT.map(row=>row.replace(/p/g,helmet==='plume'?'p':'.').replace(/c/g,character.cape===false?'.':'c'));
  pixels(ctx,sprite,x,y,size,{p:character.color,s:armor.dark,w:armor.light,k:'#1d2838',c:character.color},flip);
  ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.scale(size/16,size/16);
  if(helmet==='crown'){ctx.fillStyle='#f5cc65';ctx.fillRect(-4,-6,7,2);ctx.fillRect(-4,-9,1.5,4);ctx.fillRect(-1.5,-9,1.5,4);ctx.fillRect(1,-9,1.5,4);ctx.fillStyle=character.color;ctx.fillRect(-1.5,-6,1,1);}
  if(helmet==='winged'){ctx.fillStyle='#e0f3ff';for(const side of [-1,1]){ctx.save();ctx.scale(side,1);ctx.beginPath();ctx.moveTo(3,-4);ctx.lineTo(8,-10);ctx.lineTo(7,-4);ctx.lineTo(4,-2);ctx.closePath();ctx.fill();ctx.restore();}}
  if(helmet==='horns'){ctx.fillStyle='#f3dfb2';ctx.fillRect(-5,-7,2,3);ctx.fillRect(-6,-9,2,3);ctx.fillRect(2,-7,2,3);ctx.fillRect(3,-9,2,3);}
  if(character.shield){ctx.fillStyle=armor.light;ctx.beginPath();ctx.moveTo(-7,-1);ctx.lineTo(-2,-1);ctx.lineTo(-2,3);ctx.lineTo(-4.5,5);ctx.lineTo(-7,3);ctx.closePath();ctx.fill();ctx.fillStyle=character.color;ctx.fillRect(-6,0,3,3);ctx.fillStyle='#f4d27b';ctx.fillRect(-5,0,1,3);}
  ctx.restore();
}
function sword(ctx,x,y,size) {
  ctx.save();ctx.translate(x,y);ctx.rotate(.55);ctx.fillStyle='#657b96';ctx.fillRect(-size*.11,-size*.47,size*.22,size*.65);ctx.fillStyle='#e0eff2';ctx.fillRect(-size*.09,-size*.47,size*.09,size*.62);ctx.fillStyle='#ecc275';ctx.fillRect(-size*.28,size*.09,size*.56,size*.12);ctx.fillStyle='#9e674e';ctx.fillRect(-size*.07,size*.21,size*.14,size*.24);ctx.restore();
}
// Terrain is static within a level; cache its detailed materials separately from actors.
const terrainCache=new WeakMap();
function terrainGradient(ctx,x,y,size,top,bottom){
  const gradient=ctx.createLinearGradient?.(x,y,x+size*.3,y+size);
  if(!gradient?.addColorStop)return top;
  gradient.addColorStop(0,top);gradient.addColorStop(1,bottom);return gradient;
}
function terrainGlow(ctx,x,y,r,color){
  const gradient=ctx.createRadialGradient?.(x,y,0,x,y,r);
  if(!gradient?.addColorStop)return;
  gradient.addColorStop(0,color);gradient.addColorStop(1,'#00000000');
  ctx.fillStyle=gradient;ctx.fillRect(x-r,y-r,r*2,r*2);
}
function paintMazeTerrain(ctx,maze,theme,board){
  const c=board/19;
  ctx.fillStyle=theme.floor;ctx.fillRect(0,0,board,board);
  // Quiet flagstones keep the walkable route legible beneath the gems.
  maze.forEach((row,y)=>[...row].forEach((tile,x)=>{
    if(tile==='#')return;
    const px=x*c,py=y*c,n=(x*37+y*61)%17;
    ctx.fillStyle=n%2?'#ffffff04':'#00000012';ctx.fillRect(px+1,py+1,c-2,c-2);
    ctx.strokeStyle='#ffffff09';ctx.lineWidth=.7;ctx.strokeRect(px+2,py+2,c-4,c-4);
    if(n%4===0){ctx.strokeStyle='#00000035';ctx.beginPath();ctx.moveTo(px+c*.15,py+c*.2);ctx.lineTo(px+c*.35,py+c*.4);ctx.lineTo(px+c*.28,py+c*.6);ctx.stroke();}
    if(maze[y-1]?.[x]==='#'){ctx.fillStyle='#0000003c';ctx.fillRect(px,py,c,c*.18);}
    if(maze[y]?.[x-1]==='#'){ctx.fillStyle='#00000022';ctx.fillRect(px,py,c*.12,c);}
  }));
  maze.forEach((row,y)=>[...row].forEach((tile,x)=>{
    if(tile!=='#')return;
    const px=x*c,py=y*c,n=(x*47+y*83)%29;
    ctx.fillStyle='#00000065';ctx.fillRect(px+2,py+3,c-1,c-1);
    ctx.fillStyle=terrainGradient(ctx,px,py,c,theme.light,theme.wall);ctx.fillRect(px+1,py+1,c-3,c-4);
    // Raised stone edges, mortar joints, and uneven mineral grain.
    ctx.fillStyle='#ffffff28';ctx.fillRect(px+2,py+1,c-5,1.2);
    ctx.fillStyle=theme.shadow;ctx.fillRect(px+1,py+c-5,c-3,4);
    ctx.fillStyle='#ffffff0c';ctx.fillRect(px+2,py+3,1,c-8);
    ctx.strokeStyle='#00000038';ctx.lineWidth=1;ctx.beginPath();
    ctx.moveTo(px+2,py+c*.51);ctx.lineTo(px+c-3,py+c*.51);
    ctx.moveTo(px+c*(y%2?.32:.67),py+2);ctx.lineTo(px+c*(y%2?.32:.67),py+c*.5);ctx.stroke();
    for(let grain=0;grain<5;grain++){
      ctx.fillStyle=grain%2?'#ffffff0c':'#00000014';
      ctx.fillRect(px+3+(n*3+grain*7)%(c-7),py+4+(n+grain*11)%(c-10),1.5,1);
    }
    if(n%4===0){
      ctx.strokeStyle='#00000055';ctx.beginPath();ctx.moveTo(px+c*.7,py+2);ctx.lineTo(px+c*.53,py+c*.28);ctx.lineTo(px+c*.65,py+c*.38);ctx.stroke();
    }
    if(theme.design==='crystal'&&n%4===0){
      for(let shard=0;shard<3;shard++){
        const cx=px+c*(.28+shard*.2),base=py+c*.82,tip=py+c*(.16+((n+shard)%3)*.13),w=c*.13;
        ctx.fillStyle=shard===1?'#b0f1ed':'#6bacce';ctx.beginPath();ctx.moveTo(cx-w,base-c*.12);ctx.lineTo(cx-w*.6,tip+c*.1);ctx.lineTo(cx,tip);ctx.lineTo(cx+w,tip+c*.16);ctx.lineTo(cx+w,base);ctx.closePath();ctx.fill();
        ctx.fillStyle='#ffffff66';ctx.beginPath();ctx.moveTo(cx,tip);ctx.lineTo(cx+w,tip+c*.16);ctx.lineTo(cx,base-c*.04);ctx.closePath();ctx.fill();
      }
    }
    if(theme.design==='vine'){
      if(n%3===0){ctx.fillStyle='#657d4670';ctx.beginPath();ctx.ellipse(px+c*.35,py+c*.25,c*.3,c*.13,-.3,0,7);ctx.fill();}
      if(n%5===0){
        ctx.strokeStyle='#445e35';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px+c*.2,py);ctx.bezierCurveTo(px+c*.8,py+c*.25,px+c*.1,py+c*.6,px+c*.7,py+c);ctx.stroke();
        for(let leaf=0;leaf<4;leaf++){ctx.fillStyle=leaf%2?'#8eac62':'#617e49';ctx.beginPath();ctx.ellipse(px+c*(leaf%2?.6:.36),py+c*(.18+leaf*.18),c*.13,c*.055,leaf%2?-.6:.6,0,7);ctx.fill();}
      }
    }
    if(theme.design==='rune'&&n%4===0){
      ctx.strokeStyle='#8e3e29';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(px+c*.65,py+3);ctx.lineTo(px+c*.4,py+c*.4);ctx.lineTo(px+c*.6,py+c*.58);ctx.lineTo(px+c*.35,py+c-5);ctx.stroke();
      ctx.strokeStyle='#ef9a55';ctx.lineWidth=1.2;ctx.stroke();
    }
    // Lamps are sparse landmarks, rather than a symbol repeated on every wall.
    if(theme.design==='brick'&&n===3&&y>0&&y<18){
      ctx.fillStyle='#25292b';ctx.fillRect(px+c*.42,py+c*.4,c*.16,c*.4);
      ctx.fillStyle='#b18a54';ctx.fillRect(px+c*.34,py+c*.48,c*.32,c*.08);
      ctx.fillStyle='#e59d52';ctx.beginPath();ctx.ellipse(px+c*.5,py+c*.3,c*.1,c*.19,0,0,7);ctx.fill();
      ctx.fillStyle='#ffe4a0';ctx.beginPath();ctx.ellipse(px+c*.5,py+c*.34,c*.045,c*.11,0,0,7);ctx.fill();
    }
  }));
  ctx.save();ctx.beginPath();ctx.rect(0,0,board,board);ctx.clip();
  maze.forEach((row,y)=>[...row].forEach((tile,x)=>{
    if(tile!=='#')return;const n=(x*47+y*83)%29;
    const lit=theme.design==='brick'?n===3:theme.design==='crystal'?n%9===0:theme.design==='rune'?n%8===0:false;
    if(lit)terrainGlow(ctx,(x+.5)*c,(y+.5)*c,c*1.3,theme.design==='crystal'?'#78d6ef25':'#f8a04e20');
  }));
  ctx.restore();
  ctx.strokeStyle=theme.light;ctx.lineWidth=2;ctx.strokeRect(1,1,board-2,board-2);
}
function drawMazeTerrain(ctx,s,theme,board,ox,oy){
  let cached=terrainCache.get(ctx);
  if(!cached||cached.maze!==s.maze||cached.board!==board){
    const canvas=globalThis.document?.createElement?.('canvas');
    const surface=canvas?.getContext?.('2d');
    if(surface){
      canvas.width=canvas.height=Math.ceil(board);
      paintMazeTerrain(surface,s.maze,theme,board);
      cached={maze:s.maze,board,canvas};terrainCache.set(ctx,cached);
    }else cached=null;
  }
  if(cached)ctx.drawImage(cached.canvas,ox,oy);
  else {ctx.save();ctx.translate(ox,oy);paintMazeTerrain(ctx,s.maze,theme,board);ctx.restore();}
}
export function drawMaze(ctx,s,character,width,height,preview=false) {
  const theme=KNIGHT_LEVELS[s.level];
  ctx.imageSmoothingEnabled=false;ctx.fillStyle='#10151f';ctx.fillRect(0,0,width,height);
  const board=Math.min(preview?width*.55:width-24,height-76),cell=board/19,ox=preview?width-board-24:(width-board)/2,oy=preview?38:64;
  if(preview){ctx.fillStyle='#e5c68a';ctx.font='600 17px monospace';ctx.textAlign='left';ctx.fillText('THE FIRST QUEST',35,95);ctx.fillStyle='#f5ecd7';ctx.font='bold 42px monospace';ctx.fillText('KNIGHTS AND',35,157);ctx.fillText('DRAGONS',35,207);ctx.font='16px monospace';ctx.fillStyle='#99a9b8';ctx.fillText('Gems. Dragons. Glory.',35,250);drawKnight(ctx,100,365,100,character);sword(ctx,175,360,80);}
  else {ctx.textAlign='left';ctx.font='bold 16px monospace';ctx.fillStyle='#e5c68a';ctx.fillText(`LEVEL ${s.level+1} · ${theme.name.toUpperCase()}`,18,29);ctx.textAlign='right';ctx.fillStyle=s.sword>0?'#f4d388':'#b6c4cf';ctx.fillText(s.sword>0?`SWORD  ${s.sword.toFixed(1)}s`:'FIND A SWORD',width-18,29);ctx.fillStyle='#293243';ctx.fillRect(18,42,width-36,5);ctx.fillStyle='#f3c674';ctx.fillRect(18,42,(width-36)*s.sword/SWORD_SECONDS,5);}
  drawMazeTerrain(ctx,s,theme,board,ox,oy);
  for(const x of [0,s.maze[0].length-1]){
    const px=ox+(x+.5)*cell,py=oy+(PORTAL_ROW+.5)*cell;
    terrainGlow(ctx,px,py,cell*.75,'#a182ea36');
    ctx.fillStyle='#794dd544';ctx.beginPath();ctx.ellipse(px,py,cell*.45,cell*.48,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#be9cff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(px,py,cell*.3,cell*.42,0,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#73e7ef';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(px,py,cell*.16,cell*.3,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#f4eaff';ctx.font=`bold ${Math.round(cell*.4)}px monospace`;ctx.textAlign='center';ctx.fillText(x===0?'‹':'›',px,py+cell*.13);
  }
  const gemColors=['#ed6f94','#72dbcb','#b79af5','#f2c875','#76bdf4'];
  for(const gem of s.gems){const [x,y]=gem.split(',').map(Number),px=ox+(x+.5)*cell,py=oy+(y+.5)*cell,r=cell*.14;ctx.fillStyle=gemColors[(x+y*2)%5];ctx.beginPath();ctx.moveTo(px,py-r*1.5);ctx.lineTo(px+r,py);ctx.lineTo(px,py+r*1.5);ctx.lineTo(px-r,py);ctx.closePath();ctx.fill();ctx.fillStyle='#ffffff66';ctx.beginPath();ctx.moveTo(px,py-r*1.5);ctx.lineTo(px+r,py);ctx.lineTo(px,py+r*.5);ctx.closePath();ctx.fill();ctx.fillStyle='#ffffffb0';ctx.fillRect(px-1,py-r,2,3);}
  for(const item of s.swords){const[x,y]=item.split(',').map(Number);const px=ox+(x+.5)*cell,py=oy+(y+.5)*cell;ctx.fillStyle='#f3cd7320';ctx.beginPath();ctx.arc(px,py,cell*.44,0,7);ctx.fill();sword(ctx,px,py,cell*.82);}
  const colors=(DRAGON_STYLES[character.dragon]||DRAGON_STYLES.classic).colors;
  for(const d of s.dragons){if(d.respawn>0||s.boosts.eliminator>0)continue;actorShadow(ctx,ox+(d.x+.5)*cell,oy+(d.y+.5)*cell,cell);ctx.globalAlpha=s.sword>0?.55:1;pixels(ctx,DRAGON,ox+(d.x+.5)*cell,oy+(d.y+.5)*cell+Math.sin(s.elapsed*10+d.index)*1.2,cell*.93,{h:'#e2d8bd',d:colors[d.index],b:'#e9b47e',w:'#c99373',e:s.sword>0?'#bcecff':'#ffda70'},d.dir==='right');ctx.globalAlpha=1;}
  if(s.grace<=0||Math.floor(s.elapsed*8)%2===0||preview){const px=ox+(s.player.x+.5)*cell,py=oy+(s.player.y+.5)*cell;actorShadow(ctx,px,py,cell);drawKnight(ctx,px,py,cell*.92,character,s.player.dir==='left');if(s.sword>0)sword(ctx,px+cell*.32,py,cell*.8);}
  if(!preview && s.status==='dying') {
    ctx.fillStyle='#10151fbd';ctx.fillRect(ox,oy,board,board);
    ctx.textAlign='center';ctx.fillStyle='#f4d388';ctx.font='bold 30px monospace';
    ctx.fillText('GOBBLED UP!',width/2,oy+board/2-10);
    ctx.font='18px monospace';ctx.fillStyle='#eef1ef';
    ctx.fillText(s.lives?'Get ready to try again…':'Your last life!',width/2,oy+board/2+28);
  }
}
export const MAZE_WALL_HEIGHT=.35;
export function projectMazePoint(s,x,y,z,width,height,angle=-Math.PI/2){
  const fx=Math.cos(angle),fy=Math.sin(angle),dx=x-s.player.x,dy=y-s.player.y;
  const forward=dx*fx+dy*fy+4,side=-dx*fy+dy*fx;
  const depth=forward*.8+(5-z)*.6;
  if(depth<.6)return null;
  const focal=Math.min(width,height)*.74;
  return {x:width/2+side*focal/depth,y:height*.48+((5-z)*.8-forward*.6)*focal/depth,scale:focal/depth,depth};
}
export function drawMaze3D(ctx,s,character,width,height,angle=-Math.PI/2){
  const theme=KNIGHT_LEVELS[s.level],project=(x,y,z=0)=>projectMazePoint(s,x,y,z,width,height,angle);
  ctx.imageSmoothingEnabled=false;
  const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,theme.shadow);sky.addColorStop(1,theme.floor);
  ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
  const face=(points,color)=>{
    if(points.some(p=>!p))return;
    ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();
    ctx.strokeStyle='#10192355';ctx.lineWidth=.7;ctx.stroke();
  };
  const objects=[];
  for(let y=0;y<s.maze.length;y++)for(let x=0;x<s.maze[y].length;x++){
    const base=[project(x-.5,y-.5),project(x+.5,y-.5),project(x+.5,y+.5),project(x-.5,y+.5)];
    face(base,(x+y)%2?theme.floor:theme.shadow);
    const center=project(x,y);if(!center)continue;
    if(s.maze[y][x]==='#'){
      const top=[project(x-.5,y-.5,MAZE_WALL_HEIGHT),project(x+.5,y-.5,MAZE_WALL_HEIGHT),project(x+.5,y+.5,MAZE_WALL_HEIGHT),project(x-.5,y+.5,MAZE_WALL_HEIGHT)];
      objects.push({depth:center.depth,draw:()=>{
        for(let i=0;i<4;i++){const j=(i+1)%4;face([base[i],base[j],top[j],top[i]],i%2?theme.wall:theme.shadow);}
        face(top,theme.light);
      }});
    }else if(s.gems.has(key(x,y))){
      const p=project(x,y,.14);if(p)objects.push({depth:center.depth,draw:()=>{
        const r=Math.max(2,p.scale*.10);
        face([{x:p.x,y:p.y-r*1.6},{x:p.x+r,y:p.y},{x:p.x,y:p.y+r*1.6},{x:p.x-r,y:p.y}],['#ed6f94','#72dbcb','#b79af5','#f2c875','#76bdf4'][(x+y*2)%5]);
      }});
    }
    if(s.swords.has(key(x,y))){
      const p=project(x,y,.4);if(p)objects.push({depth:center.depth,draw:()=>sword(ctx,p.x,p.y,p.scale*.65)});
    }
    if((x===0||x===18)&&y===PORTAL_ROW){
      const p=project(x,y,.5);if(p)objects.push({depth:center.depth,draw:()=>{
        ctx.strokeStyle='#be9cff';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(p.x,p.y,p.scale*.28,p.scale*.6,0,0,7);ctx.stroke();
      }});
    }
  }
  const colors=(DRAGON_STYLES[character.dragon]||DRAGON_STYLES.classic).colors;
  for(const dragon of s.dragons){
    if(dragon.respawn>0||s.boosts.eliminator>0)continue;
    const foot=project(dragon.x,dragon.y),p=project(dragon.x,dragon.y,.78);if(!foot||!p)continue;
    objects.push({depth:foot.depth,draw:()=>{
      actorShadow(ctx,foot.x,foot.y,p.scale*.8);
      ctx.globalAlpha=s.sword>0?.65:1;
      pixels(ctx,DRAGON,p.x,p.y,p.scale*1.55,{h:'#e2d8bd',d:colors[dragon.index],b:'#e9b47e',w:'#c99373',e:s.sword>0?'#bcecff':'#ffda70'},dragon.dir==='right');ctx.globalAlpha=1;
    }});
  }
  const foot=project(s.player.x,s.player.y),knight=project(s.player.x,s.player.y,.52);
  if(knight&&foot&&(s.grace<=0||Math.floor(s.elapsed*8)%2===0)){
    objects.push({depth:foot.depth,draw:()=>{
      actorShadow(ctx,foot.x,foot.y,knight.scale*.8);
      // Back of helmet and cape, facing into the maze.
      ctx.save();ctx.translate(knight.x,knight.y);ctx.scale(knight.scale/60,knight.scale/60);
      const armor=ARMORS[character.armor]||ARMORS.silver;
      ctx.fillStyle=armor.dark;ctx.fillRect(-16,1,32,24);ctx.fillRect(-15,24,10,10);ctx.fillRect(5,24,10,10);
      if(character.cape!==false){ctx.fillStyle=character.color;ctx.beginPath();ctx.moveTo(-15,-1);ctx.lineTo(15,-1);ctx.lineTo(21,27);ctx.lineTo(-21,27);ctx.closePath();ctx.fill();}
      ctx.fillStyle=armor.light;ctx.beginPath();ctx.roundRect(-16,-24,32,26,8);ctx.fill();ctx.fillStyle=armor.dark;ctx.fillRect(-16,-5,32,5);
      if(character.helmet==='horns'){ctx.fillStyle='#f3dfb2';ctx.fillRect(-23,-29,7,18);ctx.fillRect(16,-29,7,18);}
      else if(character.helmet==='crown'){ctx.fillStyle='#f5cc65';ctx.fillRect(-17,-28,34,9);for(let i=-17;i<=17;i+=14)ctx.fillRect(i,-36,6,12);}
      else if(character.helmet==='winged'){ctx.fillStyle='#e0f3ff';face([{x:-16,y:-18},{x:-29,y:-31},{x:-25,y:-10}],ctx.fillStyle);face([{x:16,y:-18},{x:29,y:-31},{x:25,y:-10}],ctx.fillStyle);}
      else if(character.helmet!=='plain'){ctx.fillStyle=character.color;ctx.fillRect(-4,-37,8,16);}
      if(character.shield){ctx.fillStyle=armor.light;ctx.beginPath();ctx.ellipse(-23,9,9,14,0,0,7);ctx.fill();}
      if(s.sword>0)sword(ctx,27,0,45);
      ctx.restore();
    }});
  }
  objects.sort((a,b)=>b.depth-a.depth);for(const object of objects)object.draw();
  ctx.fillStyle='#10151fe8';ctx.fillRect(10,10,width-20,67);
  ctx.fillStyle=theme.accent;ctx.textAlign='left';ctx.font='bold 17px sans-serif';ctx.fillText('LEVEL '+(s.level+1)+' · '+theme.name+' · 3D',24,35);
  ctx.font='14px sans-serif';ctx.fillText(s.sword>0?'Sword: '+s.sword.toFixed(1)+'s':'Find a sword · '+s.gems.size+' gems left',24,59);
  // Both the camera and minimap stay north-up, including at corners and portals.
  const cell=Math.min(5,width/125),size=cell*19,mx=width-size-18,my=90;
  ctx.fillStyle='#10151fdd';ctx.fillRect(mx-6,my-6,size+12,size+30);
  for(let y=0;y<19;y++)for(let x=0;x<19;x++){ctx.fillStyle=s.maze[y][x]==='#'?theme.light:theme.floor;ctx.fillRect(mx+x*cell,my+y*cell,cell,cell);}
  if(s.boosts.eliminator<=0)for(const d of s.dragons)if(d.respawn<=0){ctx.fillStyle=colors[d.index];ctx.fillRect(mx+d.x*cell,my+d.y*cell,cell+1,cell+1);}
  ctx.fillStyle='#fff3bd';ctx.fillRect(mx+s.player.x*cell,my+s.player.y*cell,cell+1,cell+1);
  ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff3bd';ctx.fillText('↑ NORTH',mx+size/2,my+size+17);
  ctx.fillStyle='#10151fdd';ctx.fillRect(10,height-34,width-20,25);ctx.fillStyle='#f4e7ce';ctx.font='13px sans-serif';ctx.fillText('↑ North · ↓ South · ← West · → East',width/2,height-16);
  if(s.status==='dying'){
    ctx.fillStyle='#10151fc9';ctx.fillRect(0,height*.35,width,130);ctx.fillStyle='#f4d388';ctx.font='bold 30px sans-serif';ctx.fillText('GOBBLED UP!',width/2,height*.35+55);
    ctx.font='18px sans-serif';ctx.fillText(s.lives?'Get ready to try again…':'Your last life!',width/2,height*.35+90);
  }
}
export function drawKnightPreview(canvas,character,modifiers) { const ctx=canvas.getContext('2d');if(ctx)drawMaze(ctx,createMazeState(modifiers),character,canvas.width,canvas.height,true); }
// Fixed compass controls match the steady north-facing camera in both views.
export function mazeInputDirection(direction, facing, view) {
  return DIRECTIONS[direction]?direction:null;
}
export function createKnightMaze({canvas,character,modifiers,consumeBoost,onHud,onFinish,level=0,onLevelChange=()=>{},view='2d'}) {
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Your browser does not support canvas.');
  let state=createMazeState(modifiers,level),active=false,paused=false,last=0,frame,destroyed=false,ending=null;
  let cameraView=view==='3d'?'3d':'2d';
  const reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  const controller=new AbortController(),options={signal:controller.signal},audio=createMazeAudio();
  const input={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
  const turn=direction=>{audio.unlock();if(!active||paused||ending||document.hidden||state.status!=='playing')return;const resolved=mazeInputDirection(direction,state.player.dir,cameraView);if(resolved)state.wanted=resolved;};
  canvas.addEventListener('keydown',e=>{if(e.key==='Enter'&&ending&&active){e.preventDefault();audio.stop();finish();return;}const dir=input[e.key]||input[e.key.toLowerCase()];if(dir){e.preventDefault();turn(dir);}},options);
  let pointer=null;
  canvas.addEventListener('pointerdown',e=>{canvas.focus();if(ending&&active){audio.stop();finish();return;}pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);},options);
  canvas.addEventListener('pointermove',e=>{if(!pointer)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.hypot(dx,dy)>12){turn(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');pointer={x:e.clientX,y:e.clientY};}},options);
  canvas.addEventListener('pointerup',()=>pointer=null,options);canvas.addEventListener('pointercancel',()=>pointer=null,options);
  function finish(){if(!active)return;active=false;onFinish(state.earned,{won:state.status==='won',hasNext:state.status==='won'&&state.level<KNIGHT_LEVELS.length-1,level:state.level,title:state.status==='won'?'The vault is yours!':state.status==='lost'?'The dragons hold the vault.':'Quest saved.',detail:`Level ${state.level+1}: ${KNIGHT_LEVELS[state.level].name} · ${state.status==='won'&&state.level===KNIGHT_LEVELS.length-1?'All levels complete! · ':''}${state.totalGems-state.gems.size} gems · ${state.kills} dragons defeated`});}
  function hud(){onHud({boosts:{...state.boosts},canBoost:active&&!paused&&!ending&&state.status==='playing',lives:state.lives,text:`Level ${state.level+1} · ${KNIGHT_LEVELS[state.level].name} · ${state.lives} lives · ${state.gems.size} gems left · ✦ ${state.earned} coins${state.sword>0?` · Sword ${Math.ceil(state.sword)}s`:''}`});}
  function drawEndingKnight(ctx,x,y,size,wave) {
    drawKnight(ctx,x,y,size,character);
    ctx.save();ctx.translate(x+size*.28,y-size*.06);ctx.rotate(wave);
    ctx.fillStyle=(ARMORS[character.armor]||ARMORS.silver).light;ctx.fillRect(-10,-49,20,53);sword(ctx,0,-85,115);ctx.restore();
  }
  function tick(now){
    if(destroyed)return;
    const dt=last?Math.min((now-last)/1000,.1):0;last=now;
    if(active&&!paused&&!document.hidden){
      if(ending){
        ending.advance(dt);
        onHud({canBoost:false,boosts:{...state.boosts},lives:state.lives,text:state.status==='lost'?(ending.time>=5.4?'You lose. Try another quest!':'The dragon has one last surprise…'):(ending.time>=3.6?'You win! Your treasure awaits.':'Victory! The treasure chest is opening…')});
        if(ending.complete)finish();
      } else {
        tickMaze(state,dt,undefined,event=>audio.play(event));hud();
        if(state.status==='won')ending=createVictorySequence(audio);
        else if(state.status==='lost')ending=createDefeatSequence(audio);
      }
    }
    if(ending)(state.status==='lost'?drawDefeat:drawVictory)(ctx,ending.time,canvas.width,canvas.height,drawEndingKnight,reducedMotion,character.dragon);
    else if(cameraView==='3d')drawMaze3D(ctx,state,character,canvas.width,canvas.height);
    else drawMaze(ctx,state,character,canvas.width,canvas.height);
    frame=requestAnimationFrame(tick);
  }
  document.addEventListener?.('visibilitychange',()=>{last=0;if(document.hidden)audio.stop();},options);
  frame=requestAnimationFrame(tick);
  return {setView(value){if(!['2d','3d'].includes(value)||destroyed)return false;cameraView=value;canvas.focus({preventScroll:true});return true;},selectLevel(value){
    if(destroyed||!Number.isInteger(value)||!KNIGHT_LEVELS[value])return false;
    audio.stop();finish();level=value;state=createMazeState(modifiers,level);
    ending=null;paused=false;last=0;pointer=null;onLevelChange(level);hud();return true;
  },activateBoost(id){if(!active||paused||ending||document.hidden)return false;const used=activateMazeBoost(state,id,consumeBoost);hud();canvas.focus();return used;},selectNextLevel(){if(active||state.status!=='won'||state.level>=KNIGHT_LEVELS.length-1)return false;level=state.level+1;onLevelChange(level);state=createMazeState(modifiers,level);ending=null;return true;},start(){audio.stop();audio.unlock();ending=null;state=createMazeState(modifiers,level);active=true;paused=false;last=0;hud();canvas.focus();},pause(value){paused=value;last=0;pointer=null;if(value)audio.stop();else audio.unlock();hud();},setCharacter(value){character={...value};},setMuted:value=>audio.setMuted(value),input:turn,destroy(){if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);controller.abort();audio.destroy();finish();}};
}
