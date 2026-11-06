import test from 'node:test';
import assert from 'node:assert/strict';
import {createWizardMatch,startWizardMatch,tickWizardMatch,wizardKeyAction,wizardPlayerAction,collectWizardItem,castWizardItem,wizardPickupAt,wizardPickupPosition,chooseWizardComputerMove} from '../src/wizard-match.js';
import {stormFits,stormHardDrop} from '../src/wizard-rules.js';
import {createWizardTouchInput} from '../src/wizard-input.js';
const ready=(options={})=>{const m=createWizardMatch({random:()=>.42,opponent:'local',...options});startWizardMatch(m);return m;};
test('WASD and arrows stay independent and each player has distinct power keys',()=>{
 const m=ready(),[a,b]=m.players;assert.deepEqual(wizardKeyAction('c'),{player:0,action:'choice-0'});assert.deepEqual(wizardKeyAction('v'),{player:0,action:'choice-1'});assert.deepEqual(wizardKeyAction('b'),{player:0,action:'choice-2'});assert.equal(wizardKeyAction('b').player,0);assert.equal(wizardKeyAction('2').player,1);assert.equal(wizardKeyAction('ArrowUp').player,1);
 wizardPlayerAction(m,0,'left');assert.equal(a.piece.x,2);assert.equal(b.piece.x,3);wizardPlayerAction(m,1,'right');assert.equal(a.piece.x,2);assert.equal(b.piece.x,4);assert.equal(wizardPlayerAction(m,0,'choice-0'),false);
});
test('phone pointer release and cancellation affect only the owning player',()=>{
 const input=createWizardTouchInput();input.begin(0,'down',11);input.begin(1,'down',22);input.begin(0,'left',33);input.begin(1,'right',44);input.release(0,11);input.release(0,33);assert.equal(input.fast[0].size,0);assert.equal(input.fast[1].size,1);assert.equal(input.moves[0].size,0);assert.equal(input.moves[1].get(44),'right');input.clear();assert.ok(input.fast.every(set=>set.size===0));assert.ok(input.moves.every(map=>map.size===0));
});
test('landing releases the held piece and the next piece becomes the new magic target',()=>{
 const m=ready(),p=m.players[0],held=p.piece,next=p.next;wizardPlayerAction(m,0,'drop');assert.notEqual(p.piece,held);assert.equal(p.piece,next);assert.equal(p.locked,1);assert.equal(p.board.flat().filter(Boolean).length,4);assert.ok(m.players[1].board.every(row=>row.every(cell=>cell===0)));
});
test('computer plans legal supported placements and plays actual blocks without overwriting cells',()=>{
 for(let seed=1;seed<=8;seed++){let r=seed;const random=()=>((r=(r*1664525+1013904223)>>>0)/4294967296),m=ready({random,opponent:'computer'}),p=m.players[1];const plan=chooseWizardComputerMove(p);assert.ok(stormFits(p,plan.cells,plan.x,0));
 for(let i=0;i<650&&m.status==='playing';i++){tickWizardMatch(m,.05);assert.ok(p.board.flat().filter(Boolean).length<=p.locked*4);assert.equal(p.board.flat().filter(Boolean).length%4,0);if(p.status==='playing')assert.ok(stormFits(p,p.piece.cells,p.piece.x,p.piece.y));}assert.ok(p.locked>0);assert.notEqual(m.status,'ready');}
});
test('matches decide winners, finish once, and do not advance after finishing',()=>{
 const m=ready();m.players[0].board.at(-1)[4]=1;m.players[0].misses=m.players[0].lifeLimit-1;m.players[0].piece={kind:0,cells:[[0,0],[1,0],[2,0],[3,0]],x:4,y:m.players[0].board.length-2};stormHardDrop(m.players[0]);tickWizardMatch(m,.01);assert.equal(m.winner,1);assert.equal(m.status,'ending');for(let i=0;i<36;i++)tickWizardMatch(m,.1);assert.equal(m.status,'finished');const frozen=JSON.stringify(m);tickWizardMatch(m,.1);assert.equal(JSON.stringify(m),frozen);
 const tie=ready();tie.remaining=.01;tickWizardMatch(tie,.02);assert.equal(tie.winner,-1);
});
test('golden magic follows the movable piece and stops drawing when the match ends',async()=>{
 const {drawWizardTether,wizardArenaField}=await import('../src/wizard-arena.js');const m=ready(),p=m.players[0],field=wizardArenaField(0),rings=[];const c=new Proxy({ellipse:(...args)=>rings.push(args)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 drawWizardTether(c,p,field,0);const x=rings[0][0];rings.length=0;wizardPlayerAction(m,0,'left');drawWizardTether(c,p,field,1);assert.equal(rings[0][0],x-field.cell);p.status='ending';rings.length=0;drawWizardTether(c,p,field,2);assert.equal(rings.length,0);
});
