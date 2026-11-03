import test from 'node:test';
import assert from 'node:assert/strict';
import {createWizardMatch,startWizardMatch,tickWizardMatch,wizardPlayerAction,updateWizardLevels,chooseWizardPower,applyWizardPower,wizardPowerChoiceAt} from '../src/wizard-match.js';
import {stormFits,stormRotate,stormHardDrop,tickStorm,wizardSolidAt} from '../src/wizard-rules.js';
import {WIZARD_POWERS,wizardChoicePosition,wizardPower} from '../src/wizard-powers.js';
const ready=(opponent='local')=>{const m=createWizardMatch({random:()=>.42,opponent,mode:'practice'});startWizardMatch(m);return m;};
function square(m,index=0){m.players[index].piece={kind:1,cells:[[0,0],[1,0],[0,1],[1,1]],x:4,y:0};wizardPlayerAction(m,index,'drop');}
function level(m,index=0){square(m,index);square(m,index);return m.players[index];}
test('rainbow thresholds award exactly three unique choices, with clear Helping and Attack categories',()=>{
 const m=ready(),p=m.players[0];assert.deepEqual(p.choices,[]);square(m);assert.equal(p.choices.length,0);square(m);assert.equal(p.height,4);assert.equal(p.level,1);assert.equal(p.nextPowerHeight,8);assert.equal(new Set(p.choices).size,3);assert.ok(p.choices.some(id=>wizardPower(id).type==='Helping'));assert.ok(p.choices.some(id=>wizardPower(id).type==='Attack'));assert.equal(WIZARD_POWERS.length,6);
 for(let i=0;i<10;i++)updateWizardLevels(m,0);assert.equal(p.level,1);assert.equal(p.pendingLevels,0);
 const id=p.choices[1];assert.equal(chooseWizardPower(m,0,1),true);assert.deepEqual(p.choices,[]);assert.equal(chooseWizardPower(m,0,1),false);assert.ok(wizardPower(id));
});
test('each on-screen power bubble selects its own player and slot',()=>{
 const m=ready();level(m,0);level(m,1);for(let player=0;player<2;player++)for(let slot=0;slot<3;slot++){const pos=wizardChoicePosition(player,slot);assert.deepEqual(wizardPowerChoiceAt(m,pos.x,pos.y),{player,slot});}assert.equal(wizardPowerChoiceAt(m,480,600),null);
});
test('Floating Island creates a real sky support that the next piece can land on',()=>{
 const m=ready(),p=level(m);assert.equal(applyWizardPower(m,0,'island'),true);assert.equal(p.supports.length,1);const platform=p.supports[0];assert.ok(platform.row<20);assert.equal(wizardSolidAt(p,4,platform.row),true);assert.equal(p.board[platform.row][4],0);assert.equal(stormFits(p,[[0,0]],4,platform.row),false);square(m);assert.ok(p.height>4);assert.ok(p.board[platform.row-1].some(Boolean));
});
test('Lightning removes the last placed piece and cannot farm the same level-up again',()=>{
 const m=ready(),p=level(m);p.choices=['lightning','ultra','ice'];assert.equal(chooseWizardPower(m,0,0),true);assert.equal(p.height,2);assert.equal(p.board.flat().filter(Boolean).length,4);assert.equal(p.lastPlacement,null);square(m);assert.equal(p.height,4);assert.equal(p.choices.length,0);assert.equal(p.nextPowerHeight,8);
});
test('Ultra doubles opponent piece dimensions without changing the caster, then expires after three pieces',()=>{
 const m=ready(),[a,b]=m.players;assert.equal(applyWizardPower(m,0,'ultra'),true);assert.equal(b.piece.cells.length,16);assert.equal(a.piece.cells.length,4);assert.ok(stormFits(b,b.piece.cells,b.piece.x,b.piece.y));for(let i=0;i<3;i++){assert.equal(b.piece.effects.ultra,true);stormHardDrop(b);}assert.equal(b.piece.effects.ultra,undefined);assert.ok(b.board.flat().filter(Boolean).length>=16);
});
test('Ice causes a sideways slide on contact and leaves slippery surfaces behind',()=>{
 const m=ready(),p=m.players[1];p.piece={kind:1,cells:[[0,0],[1,0],[0,1],[1,1]],x:4,y:22};applyWizardPower(m,0,'ice');tickStorm(p,.04,true);assert.notEqual(p.piece.x,4);assert.equal(p.locked,0);tickStorm(p,.04,true);assert.equal(p.locked,1);assert.ok(Object.values(p.surfaceEffects).some(effect=>effect.ice));assert.equal(m.players[0].piece.effects,undefined);
});
test('Twisty flips the piece automatically and blocks attempts to rotate it back manually',()=>{
 const m=ready(),p=m.players[1];p.piece={kind:2,cells:[[1,0],[0,1],[1,1],[2,1]],x:3,y:2};applyWizardPower(m,0,'twist');const cells=JSON.stringify(p.piece.cells);assert.equal(stormRotate(p),false);for(let i=0;i<12;i++)tickStorm(p,.1);assert.notEqual(JSON.stringify(p.piece.cells),cells);assert.ok(stormFits(p,p.piece.cells,p.piece.x,p.piece.y));
});
test('Balloon blocks ignore both instant drop and held fast-drop input',()=>{
 const m=ready(),p=m.players[1];applyWizardPower(m,0,'balloon');assert.equal(stormHardDrop(p),false);assert.equal(p.piece.y,0);for(let i=0;i<10;i++)tickStorm(p,.1,true);assert.ok(p.piece.y<=1);assert.equal(p.locked,0);assert.equal(m.players[0].piece.effects,undefined);
});
test('queued crossed lines are awarded once each and computer powers target the human opponent',()=>{
 const m=ready('computer'),p=level(m,1);p.choices=['ultra','lightning','ice'];tickWizardMatch(m,.1);assert.equal(m.players[0].piece.effects.ultra,true);assert.equal(p.piece.effects?.ultra,undefined);assert.equal(p.choices.length,0);
 const local=ready(),a=local.players[0];a.height=13;updateWizardLevels(local,0);assert.equal(a.nextPowerHeight,16);assert.equal(a.pendingLevels,2);assert.equal(a.choices.length,3);let used=0;while(a.choices.length&&used<5){const slot=a.choices.findIndex(id=>wizardPower(id).type==='Attack');assert.ok(slot>=0);assert.equal(chooseWizardPower(local,0,slot),true);used++;}assert.equal(used,3);assert.equal(a.level,3);assert.equal(a.pendingLevels,0);updateWizardLevels(local,0);assert.equal(a.choices.length,0);
});
