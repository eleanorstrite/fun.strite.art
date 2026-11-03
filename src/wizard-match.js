import {createStormState,tickStorm,stormMove,stormRotate,stormHardDrop,stormFits,stormBalance,stormSpell,canWizardSpell,WIZARD_SPELLS} from './wizard-rules.js';
export const WIZARD_MATCH_TYPES=['computer','local'];
export function createWizardMatch({random=Math.random,background=0,mode='race',opponent='computer',wizard='sorceress',rivalWizard='blue-mage',blocks='galaxy',rivalBlocks='gold'}={}){
 const players=[0,1].map(i=>{const p=createStormState(random,background,mode);p.wizard=i?rivalWizard:wizard;p.blockStyle=i?rivalBlocks:blocks;p.remaining=Infinity;p.spells=0;p.earnSpells=false;p.inventory={};p.pickup={id:'anchor',serial:0};p.pickupClock=0;return p;});
 return {players,background,mode,opponent:WIZARD_MATCH_TYPES.includes(opponent)?opponent:'computer',remaining:mode==='practice'?Infinity:mode==='survival'?45:30,status:'ready',elapsed:0,clip:0,winner:null,reason:'',ai:{clock:0,step:0,plan:null},random};
}
export function startWizardMatch(match){match.status='playing';for(const p of match.players)p.status='playing';}
function endMatch(match,winner,reason){match.status='ending';match.winner=winner;match.reason=reason;match.clip=0;for(let i=0;i<2;i++){match.players[i].status='ending';match.players[i].won=i===winner;}}
export function collectWizardItem(match,index,emit=()=>{}){
 const p=match.players[index];if(match.status!=='playing'||!p?.pickup||Object.values(p.inventory).reduce((a,b)=>a+b,0)>=5)return false;
 const id=p.pickup.id;p.inventory[id]=(p.inventory[id]||0)+1;p.pickup=null;p.spells=Object.values(p.inventory).reduce((a,b)=>a+b,0);p.spellNotice=id+' collected';p.noticeTime=1.5;emit('bounce');return true;
}
export function castWizardItem(match,index,id,emit=()=>{}){
 const p=match.players[index];if(match.status!=='playing'||!p?.inventory[id]||!canWizardSpell(p,id))return false;
 if(!stormSpell(p,emit,id))return false;p.inventory[id]--;p.spells=Object.values(p.inventory).reduce((a,b)=>a+b,0);return true;
}
export function wizardItemAction(match,index,emit=()=>{}){const p=match.players[index];if(!p)return false;if(p.pickup)return collectWizardItem(match,index,emit);const spell=WIZARD_SPELLS.find(s=>p.inventory[s.id]&&canWizardSpell(p,s.id));return spell?castWizardItem(match,index,spell.id,emit):false;}
export function wizardPlayerAction(match,index,action,emit=()=>{}){
 if(match.status!=='playing'||!match.players[index])return false;const p=match.players[index];
 if(action==='left')return stormMove(p,-1);if(action==='right')return stormMove(p,1);if(action==='rotate')return stormRotate(p);if(action==='drop')return stormHardDrop(p,emit);if(action==='item')return wizardItemAction(match,index,emit);return castWizardItem(match,index,action,emit);
}
export function wizardKeyAction(key){
 const k=key.length===1?key.toLowerCase():key;
 const left={a:'left',d:'right',w:'rotate',s:'down',q:'drop',' ':'item'},right={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rotate',ArrowDown:'down','/':'drop',Enter:'item'};
 return Object.hasOwn(left,k)?{player:0,action:left[k]}:Object.hasOwn(right,k)?{player:1,action:right[k]}:null;
}
export function wizardPickupPosition(index,time=0){return {x:270+index*420+130,y:265+Math.sin(time*2)*7,radius:27};}
export function wizardPickupAt(match,x,y){for(let i=0;i<2;i++){if(!match.players[i].pickup)continue;const p=wizardPickupPosition(i,match.elapsed);if(Math.hypot(x-p.x,y-p.y)<=p.radius+6)return i;}return -1;}
function rotateCells(cells){const r=cells.map(([x,y])=>[-y,x]),minX=Math.min(...r.map(p=>p[0])),minY=Math.min(...r.map(p=>p[1]));return r.map(([x,y])=>[x-minX,y-minY]);}
export function chooseWizardComputerMove(p){
 let best=null,cells=p.piece.cells.map(cell=>[...cell]);
 for(let turn=0;turn<4;turn++){for(let x=0;x<10;x++){if(!stormFits(p,cells,x,0))continue;let y=0;while(stormFits(p,cells,x,y+1))y++;const piece={...p.piece,cells,x,y};if(!stormBalance(p,piece).stable)continue;const top=Math.min(...cells.map(([,dy])=>y+dy)),center=x+cells.reduce((sum,[dx])=>sum+dx,0)/cells.length,score=(24-top)*5-Math.abs(center-4.5)*.8-cells.reduce((sum,[dx,dy])=>sum+(!p.board[y+dy+1]?.[x+dx]&&y+dy<23?1:0),0)*.2;
 if(!best||score>best.score)best={x,y,cells:cells.map(cell=>[...cell]),score};}cells=rotateCells(cells);}
 return best||{x:3,cells:p.piece.cells.map(cell=>[...cell]),score:-Infinity};
}
function tickComputer(match,dt,emit){
 const p=match.players[1],ai=match.ai;if(p.status!=='playing')return;
 ai.clock+=dt;ai.step+=dt;
 if(!ai.plan){ai.plan=chooseWizardComputerMove(p);p.piece.cells=ai.plan.cells;p.piece.x=Math.min(6,p.piece.x);if(!stormFits(p,p.piece.cells,p.piece.x,p.piece.y))p.piece.x=ai.plan.x;}
 if(p.pickup)collectWizardItem(match,1,emit);
 if(p.inventory.slow&&p.slowTime<=0)castWizardItem(match,1,'slow',emit);
 if(p.inventory.transmute&&p.next.kind!==1)castWizardItem(match,1,'transmute',emit);
 if(p.inventory.anchor&&!p.ward&&ai.clock>1.8)castWizardItem(match,1,'anchor',emit);
 if(p.inventory.anchor&&!stormBalance(p,{...p.piece,y:ai.plan.y??p.piece.y}).stable)castWizardItem(match,1,'anchor',emit);
 if(ai.step>=.14){ai.step=0;if(p.piece.x!==ai.plan.x)stormMove(p,Math.sign(ai.plan.x-p.piece.x));}
 if(ai.clock>=2.2){p.piece.x=ai.plan.x;stormHardDrop(p,emit);ai.plan=null;ai.clock=0;}
}
export function tickWizardMatch(match,dt,fast=[false,false],emit=()=>{}){
 dt=Math.max(0,Math.min(.1,dt));if(match.status==='ending'){match.clip+=dt;if(match.clip>=3.5)match.status='finished';return;}if(match.status!=='playing')return;
 match.elapsed+=dt;match.remaining=Math.max(0,match.remaining-dt);
 for(let i=0;i<2;i++){const p=match.players[i];const previous=p.piece;tickStorm(p,dt,!!fast[i],emit);if(i===1&&p.piece!==previous)match.ai.plan=null;p.pickupClock+=dt;if(!p.pickup&&p.pickupClock>=7){const serial=1+Math.floor(p.pickupClock/7);p.pickup={id:WIZARD_SPELLS[(Math.floor(match.elapsed/7)+i)%WIZARD_SPELLS.length].id,serial};p.pickupClock=0;}}
 if(match.opponent==='computer')tickComputer(match,dt,emit);
 const [a,b]=match.players,win=[a.won,b.won],lost=[a.status==='ending'&&!a.won||a.misses>=3,b.status==='ending'&&!b.won||b.misses>=3];
 if(win[0]||win[1]){endMatch(match,win[0]&&win[1]?-1:win[0]?0:1,'Reached the goal');emit('win');return;}
 if(lost[0]||lost[1]){endMatch(match,lost[0]&&lost[1]?-1:lost[0]?1:0,'Tower toppled');emit('bell');return;}
 if(match.remaining<=0){const score=p=>match.mode==='survival'?(3-p.misses)*100+p.height:p.height;endMatch(match,score(a)===score(b)?-1:score(a)>score(b)?0:1,'Time’s up');emit('bell');}
}
