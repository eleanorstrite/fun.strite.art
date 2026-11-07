export const STORM_WIDTH=10,STORM_ROWS=24,STORM_TARGET=18,STORM_SECONDS=30;
export const STORM_MODES={race:{name:'Sky race',seconds:30,target:18},survival:{name:'Balance survival',seconds:45,target:24},practice:{name:'Magic practice',seconds:Infinity,target:18}};
export const WIZARD_SPELLS=[{id:'anchor',name:'Anchor',key:'X',detail:'Save your next wobbly landing'},{id:'slow',name:'Slow Time',key:'C',detail:'Slow your falling piece for 8 seconds'},{id:'transmute',name:'Transmute',key:'V',detail:'Turn the next piece into a square'},{id:'levitate',name:'Levitate',key:'B',detail:'Lift your falling piece 3 rows'},{id:'undo',name:'Undo',key:'Z',detail:'Remove your last landed piece'}];
const SHAPES=[[[0,0],[1,0],[2,0],[3,0]],[[0,0],[1,0],[0,1],[1,1]],[[1,0],[0,1],[1,1],[2,1]],[[1,0],[2,0],[0,1],[1,1]],[[0,0],[1,0],[1,1],[2,1]],[[0,0],[0,1],[1,1],[2,1]],[[2,0],[0,1],[1,1],[2,1]]];
const COLORS=['#70dce8','#f9d65c','#bc8bea','#8fce73','#f092b4','#789ee5','#f6a465'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function wizardSolidAt(s,x,y){return !!s.board[y]?.[x]||(s.supports||[]).some(platform=>y===platform.row&&x>=platform.x&&x<platform.x+platform.width);}
export function stormFits(s,cells,x,y){return cells.every(([dx,dy])=>x+dx>=0&&x+dx<STORM_WIDTH&&y+dy>=0&&y+dy<s.board.length&&!wizardSolidAt(s,x+dx,y+dy));}
function nextPiece(s){
  if(!s.bag.length){s.bag=[0,1,2,3,4,5,6];for(let i=6;i>0;i--){const j=Math.floor(s.random()*(i+1));[s.bag[i],s.bag[j]]=[s.bag[j],s.bag[i]];}}
  const kind=s.bag.pop();return {kind,cells:SHAPES[kind].map(p=>[...p]),x:3,y:s.spawnY||0};
}
export function createStormState(random=Math.random,roundBackground=0,mode='race'){
  const s={supports:[],surfaceEffects:{},attacks:{},board:Array.from({length:STORM_ROWS},()=>Array(STORM_WIDTH).fill(0)),random,bag:[],piece:null,next:null,status:'ready',remaining:STORM_SECONDS,fall:0,height:0,locked:0,tumbling:[],balanceNotice:0,clip:0,won:false,background:Math.max(0,Number.isInteger(roundBackground)?roundBackground:0)%8,blockStyle:'galaxy',slowTime:0,spellNotice:'',noticeTime:0,lastPlacement:null};
  s.wizard='sorceress';s.mode=Object.hasOwn(STORM_MODES,mode)?mode:'race';s.remaining=STORM_MODES[s.mode].seconds;s.target=STORM_MODES[s.mode].target;s.elapsed=0;s.misses=0;s.combo=0;s.spells=3;s.ward=false;s.particles=[];
  s.piece=nextPiece(s);s.next=nextPiece(s);return s;
}
function endStorm(s,won,emit){s.won=won;s.status='ending';s.clip=0;emit(won?'win':'bell');}
export function stormMove(s,dx){if(s.status!=='playing')return false;const p=s.piece;if(!stormFits(s,p.cells,p.x+dx,p.y))return false;p.x+=dx;return true;}
export function stormRotate(s){
  if(s.status!=='playing'||s.piece.kind===1||s.piece.effects?.twist)return false;
  const p=s.piece,rotated=p.cells.map(([x,y])=>[-y,x]),minX=Math.min(...rotated.map(p=>p[0])),minY=Math.min(...rotated.map(p=>p[1]));
  const cells=rotated.map(([x,y])=>[x-minX,y-minY]);
  for(const dx of [0,-1,1,-2,2])if(stormFits(s,cells,p.x+dx,p.y)){p.cells=cells;p.x+=dx;return true;}return false;
}
// Allow a small contact tolerance in tower matches; a centered single-cell support
// can hold a wide piece. Real overhangs and missing supports still topple.
export function stormBalance(s,p){
  const cells=p.cells.map(([x,y])=>[p.x+x,p.y+y]),own=new Set(cells.map(([x,y])=>`${x},${y}`));
  const supports=cells.filter(([x,y])=>!own.has(`${x},${y+1}`)&&(y===s.board.length-1||wizardSolidAt(s,x,y+1)));
  const center=cells.reduce((sum,[x])=>sum+x+.5,0)/cells.length;
  if(!supports.length)return {stable:false,direction:1,pivotX:center,pivotY:p.y+p.cells.length};
  const left=Math.min(...supports.map(([x])=>x)),right=Math.max(...supports.map(([x])=>x+1));
  const margin=s.wobbly?-.08:.08;const stable=center>=left+margin&&center<=right-margin,direction=center<(left+right)/2?-1:1;
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
 if(id==='transmute')s.next={kind:1,cells:SHAPES[1].map(p=>[...p]),x:3,y:s.spawnY||0};
 if(id==='levitate')s.piece.y-=3;
 if(id==='undo'){for(const [x,y]of s.lastPlacement)s.board[y][x]=0;s.lastPlacement=null;const top=s.board.findIndex(row=>row.some(Boolean));s.height=top<0?0:s.board.length-top;s.combo=0;}
 s.spells--;s.spellNotice=WIZARD_SPELLS.find(spell=>spell.id===id).name+'!';s.noticeTime=1.5;emit('bounce');return true;
}
export function stormHardDrop(s,emit=()=>{}){
  if(s.status!=='playing'||s.piece.effects?.balloon)return false;
  while(stormFits(s,s.piece.cells,s.piece.x,s.piece.y+1))s.piece.y++;
  s.fall=0;dropRow(s,emit);return true;
}
function dropRow(s,emit){
  const p=s.piece;
  if(stormFits(s,p.cells,p.x,p.y+1)){p.y++;return;}
  const onIce=p.effects?.ice||p.cells.some(([x,y])=>s.surfaceEffects?.[`${p.x+x},${p.y+y+1}`]?.ice);
  if(onIce&&!p.iceSlid){p.iceSlid=true;const direction=s.random()<.5?-1:1;for(const dx of [direction,-direction])if(stormFits(s,p.cells,p.x+dx,p.y)){p.x+=dx;return;}}
  const balance=stormBalance(s,p);
  if(balance.stable||s.ward){
    for(const [dx,dy] of p.cells){s.board[p.y+dy][p.x+dx]=p.kind+1;if(p.effects?.ice||p.effects?.ultra)s.surfaceEffects[`${p.x+dx},${p.y+dy}`]={ice:!!p.effects.ice,...(p.effects.ultra?{largeX:p.x+2*Math.floor(dx/2),largeY:p.y+2*Math.floor(dy/2)}:{})};}
    if(s.wobbly){s.settled.push({kind:p.kind,cells:p.cells.map(([x,y])=>[p.x+x,p.y+y]),age:0,angle:.055*balance.direction});s.settleClock=.65;}
    s.lastPlacement=p.cells.map(([x,y])=>[p.x+x,p.y+y]);s.ward=false;s.combo=balance.stable?s.combo+1:0;if(s.earnSpells!==false&&s.combo>0&&s.combo%3===0)s.spells=Math.min(5,s.spells+1);
    for(const [dx,dy] of p.cells)s.particles.push({x:p.x+dx+.5,y:p.y+dy+.5,age:0,color:COLORS[p.kind]});
    s.locked++;const top=s.board.findIndex(row=>row.some(Boolean));s.height=top<0?0:s.board.length-top;emit('bounce');
    if(s.mode!=='survival'&&s.height>=s.target){endStorm(s,true,emit);return;}
  }else{
    s.tumbling.push({...balance,kind:p.kind,cells:p.cells.map(([x,y])=>[p.x+x,p.y+y]),age:0});
    s.balanceNotice=2;s.combo=0;s.misses++;emit('whoosh');
    if(!s.unlimitedFalls&&s.mode==='survival'&&s.misses>=(s.lifeLimit||3)){endStorm(s,false,emit);return;}
  }
  if(s.scrollTower)s.spawnY=Math.max(0,s.board.length-Math.max(s.height+6,12));s.piece=s.next;s.piece.y=s.spawnY||0;s.next=nextPiece(s);prepareWizardPiece(s,s.piece);
  if(!stormFits(s,s.piece.cells,s.piece.x,s.piece.y)){
    if(s.unlimitedFalls){let found=false;for(let y=s.piece.y;y>=0&&!found;y--)for(const x of [3,4,2,5,1,6,0,7,8,9])if(stormFits(s,s.piece.cells,x,y)){s.piece.x=x;s.piece.y=y;found=true;break;}if(!found&&s.height>=s.target)endStorm(s,true,emit);}
    else endStorm(s,false,emit);
  }
}
export function tickStorm(s,dt,fast=false,emit=()=>{}){
  dt=clamp(dt,0,.1);
  if(s.status==='ending'){
    const before=s.clip;s.clip+=dt;
    if(before<1&&s.clip>=1)emit(s.won?'sayWin':'sayLose');
    if(s.clip>=3.5)s.status='finished';return;
  }
  if(s.status!=='playing')return;
  if(s.piece.effects?.twist){s.piece.twistClock=(s.piece.twistClock||0)+dt;if(s.piece.twistClock>=1.1){s.piece.twistClock=0;twistWizardPiece(s);}}
  if(s.wobbly)tickWizardTower(s,dt,emit);s.powerFlash=Math.max(0,(s.powerFlash||0)-dt);
  s.elapsed+=dt;s.noticeTime=Math.max(0,s.noticeTime-dt);
  const slow=s.slowTime>0;s.slowTime=Math.max(0,s.slowTime-dt);
  for(const particle of s.particles)particle.age+=dt;
  s.particles=s.particles.filter(p=>p.age<.8);
  s.balanceNotice=Math.max(0,s.balanceNotice-dt);
  for(const piece of s.tumbling)piece.age+=dt;
  s.tumbling=s.tumbling.filter(piece=>piece.age<3.2);
  s.remaining=Math.max(0,s.remaining-dt*(slow?.4:1));
  if(s.remaining<=1e-7){s.remaining=0;endStorm(s,s.mode==='survival',emit);return;}
  s.fall+=dt*(slow?.4:1);
  while(s.status==='playing'){const interval=s.piece.effects?.balloon?.8:fast?.032:(s.fallInterval||.48);if(s.fall<interval)break;s.fall-=interval;dropRow(s,emit);}
}

export function reshapeWizardPiece(s,cells){
 const p=s.piece;
 for(let y=p.y;y>=0;y--)for(const offset of [0,-1,1,-2,2,-3,3,-4,4])if(stormFits(s,cells,p.x+offset,y)){p.cells=cells;p.x+=offset;p.y=y;p.shapeVersion=(p.shapeVersion||0)+1;return true;}
 return false;
}
export function enlargeWizardPiece(s){const p=s.piece;if(p.effects?.ultra)return true;const cells=p.cells.flatMap(([x,y])=>[[x*2,y*2],[x*2+1,y*2],[x*2,y*2+1],[x*2+1,y*2+1]]);if(!reshapeWizardPiece(s,cells))return false;p.effects={...p.effects,ultra:true};return true;}
export function prepareWizardPiece(s,p){
 p.effects={};for(const id of ['ultra','ice','twist','balloon'])if(s.attacks[id]>0){s.attacks[id]--;if(id==='ultra'){if(!enlargeWizardPiece(s))s.attacks[id]++;}else p.effects[id]=true;}
}
export function twistWizardPiece(s){
 const p=s.piece,rotate=s.random()<.5,cells=p.cells.map(([x,y])=>rotate?[-y,x]:[-x,y]),minX=Math.min(...cells.map(([x])=>x)),minY=Math.min(...cells.map(([,y])=>y));
 return reshapeWizardPiece(s,cells.map(([x,y])=>[x-minX,y-minY]));
}

// Landed pieces keep their own balance. A shifted load can pull its support out,
// after which the unsupported pieces above it fall as a chain.
export function tickWizardTower(s,dt,emit=()=>{}){
 for(const piece of s.settled||[])piece.age+=dt;
 if(!s.settleClock)return;s.settleClock-=dt;if(s.settleClock>0)return;s.settleClock=0;
 const groups=s.settled.filter(p=>p.cells.every(([x,y])=>s.board[y]?.[x]===p.kind+1));s.settled=groups;
 for(const group of [...groups].sort((a,b)=>Math.max(...a.cells.map(p=>p[1]))-Math.max(...b.cells.map(p=>p[1])))){
  for(const [x,y]of group.cells)s.board[y][x]=0;
  const balance=stormBalance(s,{x:0,y:0,cells:group.cells});
  const above=groups.filter(p=>p!==group&&p.cells.some(([x,y])=>group.cells.some(([gx,gy])=>x===gx&&y===gy-1)));
  const all=[...group.cells,...above.flatMap(p=>p.cells)],center=all.reduce((n,[x])=>n+x+.5,0)/all.length;
  const bottom=group.cells.filter(([x,y])=>!group.cells.some(([gx,gy])=>gx===x&&gy===y+1)&&(y===s.board.length-1||wizardSolidAt(s,x,y+1)));
  const loaded=bottom.length&&center>=Math.min(...bottom.map(p=>p[0]))-.08&&center<=Math.max(...bottom.map(p=>p[0]))+1.08;
  if(balance.stable&&loaded){for(const [x,y]of group.cells)s.board[y][x]=group.kind+1;continue;}
  s.tumbling.push({...balance,kind:group.kind,cells:group.cells,age:0});s.settled=s.settled.filter(p=>p!==group);s.balanceNotice=2;s.spellNotice='Tower slipping! Balance your next block';s.noticeTime=2;s.misses++;s.settleClock=.3;emit('whoosh');
  for(const [x,y]of group.cells)delete s.surfaceEffects[`${x},${y}`];
 }
 const top=s.board.findIndex(row=>row.some(Boolean));s.height=top<0?0:s.board.length-top;
}
