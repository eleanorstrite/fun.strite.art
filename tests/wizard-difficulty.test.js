import test from 'node:test';
import assert from 'node:assert/strict';
import {WIZARD_DIFFICULTIES,createWizardMatch,startWizardMatch,tickWizardMatch,wizardCameraHeight,wizardPlayerAction,wizardKeyAction} from '../src/wizard-match.js';
import {stormFits} from '../src/wizard-rules.js';
import {wizardArenaField} from '../src/wizard-arena.js';
const advance=(m,seconds)=>{for(let i=0;i<seconds*20;i++)tickWizardMatch(m,.05);};
test('four difficulties increase tower height and bot speed while decreasing block size',()=>{
 const settings=Object.values(WIZARD_DIFFICULTIES);assert.deepEqual(settings.map(s=>s.name),['Easy','Medium','Hard','Expert']);
 for(let i=0;i<settings.length;i++){const [id,s]=Object.entries(WIZARD_DIFFICULTIES)[i],m=createWizardMatch({difficulty:id});assert.equal(m.players[0].target,s.target);assert.equal(m.players[0].board.length,s.target+14);assert.equal(m.remaining,Infinity);assert.ok(stormFits(m.players[0],m.players[0].piece.cells,3,m.players[0].piece.y));if(i){assert.ok(s.target>settings[i-1].target);assert.ok(s.cell<settings[i-1].cell);assert.ok(s.botDelay<settings[i-1].botDelay);}}
});
test('opening camera visits the far finish, counts down, and returns before physics or bot begin',()=>{
 const m=createWizardMatch();startWizardMatch(m,true);const p=m.players[0],y=p.piece.y;advance(m,1);assert.ok(wizardCameraHeight(m,p)>0);assert.equal(m.elapsed,0);advance(m,1);assert.equal(m.status,'intro');assert.equal(wizardCameraHeight(m,p),p.target-8);advance(m,3);assert.ok(wizardCameraHeight(m,p)<p.target-8);assert.equal(p.piece.y,y);assert.equal(m.players[1].locked,0);assert.equal(wizardPlayerAction(m,0,'drop'),false);advance(m,1.4);assert.equal(m.status,'playing');assert.equal(wizardCameraHeight(m,p),0);
});
test('two placed blocks and three misses cannot prematurely end an Easy race',()=>{
 const m=createWizardMatch({random:()=>.42});startWizardMatch(m);const p=m.players[0];for(let i=0;i<2;i++){p.piece={kind:1,cells:[[0,0],[1,0],[0,1],[1,1]],x:4,y:p.spawnY};wizardPlayerAction(m,0,'drop');}p.misses=3;advance(m,5);assert.equal(m.status,'playing');assert.equal(m.winner,null);assert.ok(p.height>=4);assert.equal(m.players[1].locked,0);advance(m,1);assert.ok(m.players[1].locked>=1);
});
test('the camera follows high towers while the finish remains above the starting viewport',()=>{
 const m=createWizardMatch(),p=m.players[0],start=wizardArenaField(0,false,p,m,650);assert.ok(start.y+(p.board.length-p.target)*start.cell<0);p.height=40;const high=wizardArenaField(0,false,p,m,650);assert.ok(high.y>start.y);const top=high.y+(p.board.length-p.height)*high.cell;assert.ok(top>90&&top<high.base);const phone=wizardArenaField(0,false,p,m,1400);assert.ok(phone.cell>start.cell);assert.ok(phone.wizardX>=60);assert.ok(wizardArenaField(1,false,p,m,1400).wizardX>=540);
});
test('C V B select the three bubbles and N chooses the first; arrows still soft-drop',()=>{
 for(const [key,action]of [['c','choice-0'],['V','choice-1'],['b','choice-2'],['N','item'],['ArrowDown','down']])assert.deepEqual(wizardKeyAction(key,'computer'),{player:0,action});assert.equal(wizardKeyAction('x'),null);assert.equal(wizardKeyAction('ArrowDown','local').player,1);
});
test('a tall supported tower can reach the true gold finish and win',()=>{
 const m=createWizardMatch();startWizardMatch(m);const p=m.players[0],rows=p.board.length;for(let y=rows-58;y<rows;y++){p.board[y][4]=2;p.board[y][5]=2;}p.height=58;p.piece={kind:1,cells:[[0,0],[1,0],[0,1],[1,1]],x:4,y:rows-65};wizardPlayerAction(m,0,'drop');tickWizardMatch(m,.01);assert.equal(p.height,60);assert.equal(m.status,'ending');assert.equal(m.winner,0);
});
test('phone power targets stay on their own half after resizing',async()=>{
 const {wizardChoicePosition}=await import('../src/wizard-powers.js');const {wizardPowerChoiceAt}=await import('../src/wizard-match.js');const m=createWizardMatch();for(const p of m.players)p.choices=['ultra','ice','twist'];for(let player=0;player<2;player++)for(let slot=0;slot<3;slot++){const pos=wizardChoicePosition(player,slot,1600);assert.equal(pos.x<480,player===0);assert.deepEqual(wizardPowerChoiceAt(m,pos.x,pos.y,1600),{player,slot});}
});

test('unlimited actual fallen blocks never award a win or cause damage on any difficulty or mode',()=>{
 for(const difficulty of Object.keys(WIZARD_DIFFICULTIES))for(const mode of ['race','survival','practice']){
  const m=createWizardMatch({difficulty,mode,opponent:'local',random:()=>.42});startWizardMatch(m);
  for(let n=0;n<40;n++)for(let i=0;i<2;i++){const p=m.players[i];p.board.forEach(row=>row.fill(0));p.board.at(-1)[4]=1;p.height=1;p.settled=[];p.piece={kind:0,cells:[[0,0],[1,0],[2,0],[3,0]],x:4,y:p.board.length-2};wizardPlayerAction(m,i,'drop');tickWizardMatch(m,.001);assert.equal(p.status,'playing');assert.equal(m.status,'playing');assert.equal(m.winner,null);}
  for(const p of m.players){assert.equal(p.misses,40);assert.equal(p.lifeLimit,Infinity);assert.equal(p.remaining,Infinity);}assert.equal(m.remaining,Infinity);
 }
});
test('even Expert can choose an imperfect landing, while difficulty increases accuracy and reaction speed',()=>{
 const settings=Object.values(WIZARD_DIFFICULTIES);assert.ok(settings.every(s=>s.accuracy<1));for(let i=1;i<settings.length;i++){assert.ok(settings[i].accuracy>settings[i-1].accuracy);assert.ok(settings[i].botStep<settings[i-1].botStep);}
 for(const difficulty of Object.keys(WIZARD_DIFFICULTIES)){const m=createWizardMatch({difficulty,random:()=>.99});startWizardMatch(m);const p=m.players[1];p.board.at(-1)[6]=1;p.height=1;p.piece={kind:0,cells:[[0,0],[1,0],[2,0],[3,0]],x:3,y:p.spawnY};advance(m,WIZARD_DIFFICULTIES[difficulty].botDelay+.15);assert.ok(p.misses>=1,difficulty+' bot can misjudge an overhang');assert.equal(m.status,'playing');}
});
test('a crowded spawn retries above the tower instead of awarding the opponent a win',()=>{
 const m=createWizardMatch({opponent:'local'});startWizardMatch(m);const p=m.players[0];p.next={kind:1,cells:[[0,0],[1,0],[0,1],[1,1]],x:3,y:0};p.board[p.board.length-12][3]=3;p.piece={kind:1,cells:[[0,0],[1,0],[0,1],[1,1]],x:0,y:p.board.length-2};wizardPlayerAction(m,0,'drop');tickWizardMatch(m,.001);assert.equal(m.status,'playing');assert.ok(stormFits(p,p.piece.cells,p.piece.x,p.piece.y));
});
