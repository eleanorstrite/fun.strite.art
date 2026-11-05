import test from 'node:test';
import assert from 'node:assert/strict';
import {createWizardMatch,startWizardMatch,wizardKeyAction,wizardPlayerAction,updateWizardLevels} from '../src/wizard-match.js';
import {stormBalance,tickWizardTower} from '../src/wizard-rules.js';
import {createWizardGestures} from '../src/wizard-input.js';
test('computer matches give arrow controls to the human and local matches keep both players separate',()=>{
 for(const [key,action]of [['ArrowLeft','left'],['ArrowRight','right'],['ArrowUp','rotate'],['ArrowDown','down']]){assert.deepEqual(wizardKeyAction(key,'computer'),{player:0,action});assert.deepEqual(wizardKeyAction(key,'local'),{player:1,action});}
 const m=createWizardMatch({opponent:'computer'});assert.equal(m.players[0].target,22);assert.equal(m.remaining,90);startWizardMatch(m);const x=m.players[1].piece.x;wizardPlayerAction(m,wizardKeyAction('ArrowRight','computer').player,'right');assert.equal(m.players[1].piece.x,x);
});
test('a narrow support no longer holds a wide piece and lost supports topple the blocks above them',()=>{
 const m=createWizardMatch(),s=m.players[0];s.board[23][4]=1;
 assert.equal(stormBalance(s,{x:3,y:22,cells:[[0,0],[1,0],[2,0]]}).stable,false);
 assert.equal(stormBalance(s,{x:4,y:20,cells:[[0,0],[0,1],[0,2]]}).stable,true);
 s.board[23][4]=0;s.settled=[{kind:1,cells:[[3,20],[4,20],[3,21],[4,21]],age:0},{kind:1,cells:[[3,18],[4,18],[3,19],[4,19]],age:0}];for(const p of s.settled)for(const[x,y]of p.cells)s.board[y][x]=2;s.settleClock=.1;tickWizardTower(s,.1);tickWizardTower(s,.3);assert.equal(s.settled.length,0);assert.equal(s.tumbling.length,2);assert.equal(s.height,0);assert.equal(s.board.flat().filter(Boolean).length,0);
});
test('broad supported landings remain intact while new pieces visibly rock',()=>{
 const s=createWizardMatch().players[0];s.status='playing';s.piece={kind:1,cells:[[0,0],[1,0],[0,1],[1,1]],x:4,y:0};const m={status:'playing',players:[s]};wizardPlayerAction(m,0,'drop');assert.equal(s.settled.length,1);assert.ok(Math.abs(s.settled[0].angle)>.05);tickWizardTower(s,.7);assert.equal(s.board.flat().filter(Boolean).length,4);assert.equal(s.misses,0);
});
test('phone swipes move and speed up their owning player while a tap rotates once',()=>{
 const actions=[],fast=[],g=createWizardGestures({playerAt:x=>x<200?0:1,onAction:(...a)=>actions.push(a),onFaster:p=>fast.push(p)});
 g.begin(1,80,40);g.begin(2,300,40);g.move(1,140,40);g.move(2,300,80);g.end(2);g.end(1);assert.deepEqual(actions,[[0,'right'],[0,'right']]);assert.deepEqual(fast,[1]);g.begin(3,300,40);g.end(3);assert.deepEqual(actions.at(-1),[1,'rotate']);g.begin(4,80,40);g.move(4,300,40);g.end(4);assert.ok(actions.slice(3).every(a=>a[0]===0));g.begin(5,10,10);g.end(5,true);assert.equal(actions.filter(a=>a[1]==='rotate').length,1);
});
test('rainbow level-ups trigger a sustained visible announcement without retriggering on the same height',()=>{
 const m=createWizardMatch();startWizardMatch(m);m.players[0].height=4;updateWizardLevels(m,0);assert.equal(m.players[0].powerFlash,3);assert.match(m.players[0].spellNotice,/LEVEL UP/);m.players[0].powerFlash=1;updateWizardLevels(m,0);assert.equal(m.players[0].powerFlash,1);
});
