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
test('realistic block materials render the correct atlas face at gameplay and preview sizes',async t=>{
 const {wizardBlockTextureCell,drawWizardBlock}=await import('../src/wizard-themes.js');const original=globalThis.Image;t.after(()=>globalThis.Image=original);globalThis.Image=class{complete=true;naturalWidth=1024;naturalHeight=1024;};
 const draws=[],c=new Proxy({drawImage:(...args)=>draws.push(args),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 for(const [i,id]of ['galaxy','gold','lightning','rainbow'].entries()){const cell=wizardBlockTextureCell(id);assert.equal(cell.column,i%2);assert.equal(cell.row,Math.floor(i/2));for(const size of [21,200]){drawWizardBlock(c,10,10,size,0,id);const args=draws.at(-1);assert.ok(args[0].src.endsWith('wizard-block-materials.png'));assert.deepEqual(args.slice(1,5),[cell.column*512,cell.row*512,512,512]);assert.ok(args.slice(1).every(Number.isFinite));assert.ok(args[7]<size&&args[8]<size);}}
 assert.equal(draws.length,8);assert.equal(wizardBlockTextureCell('crystal'),null);drawWizardBlock(c,10,10,21,0,'crystal');assert.equal(draws.length,8);
});
