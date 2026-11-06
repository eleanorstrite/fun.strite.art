import {validateCustomWizard} from './wizard-custom.js';
import {validateWizardSidekick} from './wizard-sidekicks.js';
import {WIZARD_POWERS,WIZARD_LEVEL_STEP,wizardPower,wizardChoicePosition} from './wizard-powers.js';
import {createStormState,tickStorm,stormMove,stormRotate,stormHardDrop,stormFits,stormBalance,enlargeWizardPiece,reshapeWizardPiece,twistWizardPiece} from './wizard-rules.js';
export const WIZARD_DIFFICULTIES={easy:{name:'Easy',target:60,cell:28,botDelay:5.5,botStep:.4,fall:.65,lives:8,accuracy:.45},medium:{name:'Medium',target:76,cell:25,botDelay:4,botStep:.28,fall:.55,lives:6,accuracy:.7},hard:{name:'Hard',target:96,cell:22,botDelay:3,botStep:.2,fall:.48,lives:5,accuracy:.9},expert:{name:'Expert',target:120,cell:19,botDelay:2.2,botStep:.14,fall:.4,lives:4,accuracy:1}};
export const WIZARD_MATCH_TYPES=['computer','local'];
export function createWizardMatch({random=Math.random,background=0,mode='race',opponent='computer',difficulty='easy',wizard='sorceress',rivalWizard='blue-mage',blocks='galaxy',rivalBlocks='gold',sidekick,rivalSidekick,customWizard,rivalCustomWizard}={}){
 difficulty=Object.hasOwn(WIZARD_DIFFICULTIES,difficulty)?difficulty:'easy';const settings=WIZARD_DIFFICULTIES[difficulty];
 const players=[0,1].map(i=>{const p=createStormState(random,background,mode);p.wizard=i?rivalWizard:wizard;p.blockStyle=i?rivalBlocks:blocks;p.customWizard=validateCustomWizard(i?rivalCustomWizard:customWizard);p.sidekick=validateWizardSidekick(i?rivalSidekick:sidekick);p.remaining=Infinity;p.wobbly=true;p.settled=[];p.target=settings.target;p.board=Array.from({length:p.target+14},()=>Array(10).fill(0));p.cellSize=settings.cell;p.lifeLimit=settings.lives;p.fallInterval=settings.fall;p.scrollTower=true;p.spawnY=p.board.length-12;p.piece.y=p.next.y=p.spawnY;p.spells=0;p.earnSpells=false;p.inventory={};p.choices=[];p.level=0;p.nextPowerHeight=WIZARD_LEVEL_STEP;p.pendingLevels=0;p.highWater=0;return p;});
 return {players,background,mode,difficulty,introTime:0,opponent:WIZARD_MATCH_TYPES.includes(opponent)?opponent:'computer',remaining:mode==='race'||mode==='practice'?Infinity:240,status:'ready',elapsed:0,clip:0,winner:null,reason:'',ai:{clock:0,step:0,plan:null},random};
}
export function startWizardMatch(match,tour=false){match.status=tour?'intro':'playing';match.introTime=0;for(const p of match.players)p.status=tour?'ready':'playing';}
export function wizardCameraHeight(match,p){const top=p.target-8,t=match.introTime||0,ease=v=>v*v*(3-2*v);if(match.status==='intro'){if(t<1.8)return top*ease(t/1.8);if(t<4.8)return top;return top*(1-ease(Math.min(1,(t-4.8)/1.5)));}return Math.max(0,p.height-6);}
function endMatch(match,winner,reason){match.status='ending';match.winner=winner;match.reason=reason;match.clip=0;for(let i=0;i<2;i++){match.players[i].status='ending';match.players[i].won=i===winner;}}
export function canUseWizardPower(match,index,id){
 const p=match.players[index];if(match.status!=='playing'||!p||!wizardPower(id))return false;
 if(id==='lightning')return !!p.lastPlacement;
 if(id==='island'){const row=p.board.length-p.height-3;return row>=Math.max(...p.piece.cells.map(([,y])=>y))+2&&row<p.board.length-1;}
 return match.players[1-index]?.status==='playing';
}
function offerPowers(match,index){
 const p=match.players[index];if(p.choices.length||!p.pendingLevels)return;
 const available=WIZARD_POWERS.filter(power=>canUseWizardPower(match,index,power.id)),help=available.filter(power=>power.type==='Helping'),attack=available.filter(power=>power.type==='Attack');
 const pick=items=>items[Math.min(items.length-1,Math.floor(match.random()*items.length))];const choices=[];if(help.length)choices.push(pick(help));if(attack.length)choices.push(pick(attack));
 while(choices.length<3){const remaining=available.filter(power=>!choices.includes(power));if(!remaining.length)break;choices.push(pick(remaining));}
 // Shuffle the three slots so each key can offer either Helping or Attack.
 for(let i=choices.length-1;i>0;i--){const j=Math.floor(match.random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
 p.choices=choices.map(power=>power.id);p.powerFlash=3;p.spellNotice='LEVEL UP! Choose your magic';p.noticeTime=3;p.pendingLevels--;p.level++;
}
export function updateWizardLevels(match,index){
 const p=match.players[index];p.highWater=Math.max(p.highWater,p.height);
 while(p.highWater>=p.nextPowerHeight&&p.nextPowerHeight<p.target){p.pendingLevels++;p.nextPowerHeight+=WIZARD_LEVEL_STEP;}
 offerPowers(match,index);
}
export function applyWizardPower(match,index,id,emit=()=>{}){
 if(!canUseWizardPower(match,index,id))return false;const p=match.players[index],power=wizardPower(id);
 if(id==='island'){const row=p.board.length-p.height-3;p.supports.push({row,x:2,width:6});if(!stormFits(p,p.piece.cells,p.piece.x,p.piece.y))reshapeWizardPiece(p,p.piece.cells);p.spellNotice='Helping · Floating Island!';}
 else if(id==='lightning'){for(const [x,y]of p.lastPlacement){p.board[y][x]=0;delete p.surfaceEffects[`${x},${y}`];}p.lastPlacement=null;p.settleClock=.1;const top=p.board.findIndex(row=>row.some(Boolean));p.height=top<0?0:p.board.length-top;p.combo=0;p.spellNotice='Helping · Lightning undo!';}
 else{const target=match.players[1-index];target.attacks[id]=2;
  if(id==='ultra'){if(!enlargeWizardPiece(target))target.attacks[id]=3;}
  else{target.piece.effects={...target.piece.effects,[id]:true};if(id==='ice')target.piece.iceSlid=false;if(id==='twist'){target.piece.twistClock=0;twistWizardPiece(target);}if(id==='balloon')target.fall=0;}
  target.spellNotice='Attacked · '+power.name+'!';target.noticeTime=3;p.spellNotice='Attack sent · '+power.name+'!';if(1-index===1)match.ai.plan=null;
 }
 p.noticeTime=2;emit('bounce');return true;
}
export function chooseWizardPower(match,index,slot,emit=()=>{}){
 const p=match.players[index],id=p?.choices[slot];if(!id||!applyWizardPower(match,index,id,emit))return false;
 p.choices=[];offerPowers(match,index);return true;
}
export function collectWizardItem(match,index,emit=()=>{}){return chooseWizardPower(match,index,0,emit);}
export function castWizardItem(match,index,id,emit=()=>{}){const slot=match.players[index]?.choices.indexOf(id);return slot>=0?chooseWizardPower(match,index,slot,emit):false;}
export function wizardItemAction(match,index,emit=()=>{}){return chooseWizardPower(match,index,0,emit);}
export function wizardPlayerAction(match,index,action,emit=()=>{}){
 if(match.status!=='playing'||!match.players[index])return false;const p=match.players[index];let result;
 if(action==='left')return stormMove(p,-1);if(action==='right')return stormMove(p,1);if(action==='rotate')return stormRotate(p);if(action==='drop'){result=stormHardDrop(p,emit);updateWizardLevels(match,index);return result;}if(action==='item')return wizardItemAction(match,index,emit);if(action.startsWith('choice-'))return chooseWizardPower(match,index,Number(action.slice(7)),emit);return castWizardItem(match,index,action,emit);
}
export function wizardKeyAction(key,opponent='local'){
 const k=key.length===1?key.toLowerCase():key;
 const left={a:'left',d:'right',w:'rotate',s:'down',q:'drop',' ':'item',c:'choice-0',v:'choice-1',b:'choice-2',n:'item'},right={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rotate',ArrowDown:'down','/':'drop',Enter:'item','1':'choice-0','2':'choice-1','3':'choice-2'};
 return Object.hasOwn(left,k)?{player:0,action:left[k]}:Object.hasOwn(right,k)?{player:opponent==='computer'?0:1,action:right[k]}:null;
}
export function wizardPickupPosition(index,time=0){return wizardChoicePosition(index,0);}
export function wizardPowerChoiceAt(match,x,y,height=650){for(let player=0;player<2;player++)for(let slot=0;slot<match.players[player].choices.length;slot++){const p=wizardChoicePosition(player,slot,height);if(Math.hypot(x-p.x,y-p.y)<=p.radius+6)return {player,slot};}return null;}
export function wizardPickupAt(match,x,y){return wizardPowerChoiceAt(match,x,y)?.player??-1;}
function rotateCells(cells){const r=cells.map(([x,y])=>[-y,x]),minX=Math.min(...r.map(p=>p[0])),minY=Math.min(...r.map(p=>p[1]));return r.map(([x,y])=>[x-minX,y-minY]);}
export function chooseWizardComputerMove(p){
 let best=null,cells=p.piece.cells.map(cell=>[...cell]);
 for(let turn=0;turn<(p.piece.effects?.twist?1:4);turn++){for(let x=0;x<10;x++){if(!stormFits(p,cells,x,p.piece.y))continue;let y=p.piece.y;while(stormFits(p,cells,x,y+1))y++;const piece={...p.piece,cells,x,y};if(!stormBalance(p,piece).stable)continue;const heights=Array.from({length:10},(_,col)=>{const first=p.board.findIndex(row=>row[col]);const occupied=cells.filter(([dx])=>x+dx===col).map(([,dy])=>y+dy);const top=Math.min(first<0?p.board.length:first,...occupied);return p.board.length-top;}),holes=cells.reduce((sum,[dx,dy])=>sum+(!p.board[y+dy+1]?.[x+dx]&&y+dy<p.board.length-1&&!cells.some(([cx,cy])=>cx===dx&&cy===dy+1)?1:0),0),score=-Math.max(...heights)*4-heights.reduce((sum,h,i)=>sum+(i?Math.abs(h-heights[i-1]):0),0)*.7-holes*3;
 if(!best||score>best.score)best={x,y,cells:cells.map(cell=>[...cell]),score};}cells=rotateCells(cells);}
 return best||{x:3,cells:p.piece.cells.map(cell=>[...cell]),score:-Infinity};
}
function tickComputer(match,dt,emit){
 const p=match.players[1],ai=match.ai;if(p.status!=='playing')return;
 const settings=WIZARD_DIFFICULTIES[match.difficulty]||WIZARD_DIFFICULTIES.easy;ai.clock+=dt;ai.step+=dt;
 if(!ai.plan){ai.plan=chooseWizardComputerMove(p);if(match.random()>settings.accuracy){const x=ai.plan.x+(match.random()<.5?-1:1);if(stormFits(p,ai.plan.cells,x,p.piece.y))ai.plan.x=x;}p.piece.cells=ai.plan.cells;p.piece.x=Math.min(6,p.piece.x);if(!stormFits(p,p.piece.cells,p.piece.x,p.piece.y))p.piece.x=ai.plan.x;}
 if(p.choices.length){const slot=p.choices.findIndex(id=>canUseWizardPower(match,1,id));if(slot>=0){chooseWizardPower(match,1,slot,emit);ai.plan=null;return;}}
 if(ai.step>=settings.botStep){ai.step=0;if(p.piece.x!==ai.plan.x)stormMove(p,Math.sign(ai.plan.x-p.piece.x));}
 if(ai.clock>=settings.botDelay&&!p.piece.effects?.balloon){if(stormFits(p,p.piece.cells,ai.plan.x,p.piece.y))p.piece.x=ai.plan.x;stormHardDrop(p,emit);updateWizardLevels(match,1);ai.plan=null;ai.clock=0;}
}
export function tickWizardMatch(match,dt,fast=[false,false],emit=()=>{}){
 dt=Math.max(0,Math.min(.1,dt));if(match.status==='intro'){match.introTime+=dt;if(match.introTime>=6.3){match.status='playing';for(const p of match.players)p.status='playing';}return;}if(match.status==='ending'){match.clip+=dt;if(match.clip>=3.5)match.status='finished';return;}if(match.status!=='playing')return;
 match.elapsed+=dt;match.remaining=Math.max(0,match.remaining-dt);
 for(let i=0;i<2;i++){const p=match.players[i],previous=p.piece,version=p.piece.shapeVersion;tickStorm(p,dt,!!fast[i],emit);const level=p.level;updateWizardLevels(match,i);if(p.level>level)emit('bell');if(i===1&&(p.piece!==previous||p.piece.shapeVersion!==version))match.ai.plan=null;}
 if(match.opponent==='computer')tickComputer(match,dt,emit);
 const [a,b]=match.players,win=[a.won||a.height>=a.target,b.won||b.height>=b.target],lost=[a.status==='ending'&&!a.won||a.misses>=(a.lifeLimit||3),b.status==='ending'&&!b.won||b.misses>=(b.lifeLimit||3)];
 if(win[0]||win[1]){endMatch(match,win[0]&&win[1]?-1:win[0]?0:1,'Reached the goal');emit('win');return;}
 if(lost[0]||lost[1]){endMatch(match,lost[0]&&lost[1]?-1:lost[0]?1:0,'Tower toppled');emit('bell');return;}
 if(match.remaining<=0){const score=p=>match.mode==='survival'?((p.lifeLimit||3)-p.misses)*100+p.height:p.height;endMatch(match,score(a)===score(b)?-1:score(a)>score(b)?0:1,'Time’s up');emit('bell');}
}
