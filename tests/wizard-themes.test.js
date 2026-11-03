import test from 'node:test';
import assert from 'node:assert/strict';
import {createStormState,stormSpell,stormHardDrop,tickStorm,canWizardSpell} from '../src/storm-stack.js';
import {WIZARD_BACKGROUNDS,WIZARD_BLOCKS,wizardBackground,wizardBlock,loadWizardSetting,saveWizardSetting} from '../src/wizard-themes.js';
const state=()=>{const s=createStormState(()=>.42);s.status='playing';return s;};
test('worlds cycle without repetition and block finishes validate saved choices',()=>{
 assert.equal(new Set(WIZARD_BACKGROUNDS.map(b=>b.id)).size,8);assert.equal(wizardBackground(8).id,wizardBackground(0).id);assert.equal(WIZARD_BLOCKS.length,6);assert.equal(wizardBlock('bad').id,'galaxy');
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};saveWizardSetting('blocks','lightning',storage);assert.equal(loadWizardSetting('blocks','galaxy',storage),'lightning');const blocked={getItem(){throw Error();},setItem(){throw Error();}};assert.equal(loadWizardSetting('blocks','galaxy',blocked),'galaxy');assert.doesNotThrow(()=>saveWizardSetting('blocks','gold',blocked));
});
test('Slow Time slows both clock and falling piece and cannot stack repeatedly',()=>{
 const slow=state(),normal=state();assert.equal(stormSpell(slow,()=>{},'slow'),true);assert.equal(stormSpell(slow,()=>{},'slow'),false);
 for(let i=0;i<10;i++){tickStorm(slow,.1);tickStorm(normal,.1);}
 assert.ok(slow.remaining>normal.remaining);assert.ok(slow.piece.y<normal.piece.y);assert.ok(slow.slowTime<8&&slow.slowTime>6);
 slow.status='ready';const time=slow.slowTime;tickStorm(slow,.1);assert.equal(slow.slowTime,time);
});
test('Transmute, Levitate and Undo have real effects and consume charges only when usable',()=>{
 const s=state();s.next.kind=2;assert.equal(stormSpell(s,()=>{},'transmute'),true);assert.equal(s.next.kind,1);const charges=s.spells;assert.equal(stormSpell(s,()=>{},'transmute'),false);assert.equal(s.spells,charges);
 assert.equal(canWizardSpell(s,'levitate'),false);s.piece.y=6;assert.equal(stormSpell(s,()=>{},'levitate'),true);assert.equal(s.piece.y,3);
 stormHardDrop(s);assert.ok(s.height>0);assert.equal(stormSpell(s,()=>{},'undo'),true);assert.equal(s.height,0);assert.ok(s.board.every(row=>row.every(v=>!v)));assert.equal(canWizardSpell(s,'undo'),false);assert.equal(stormSpell(s,()=>{},'bogus'),false);
});
