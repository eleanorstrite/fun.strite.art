import test from 'node:test';
import assert from 'node:assert/strict';
import {STORM_WIZARDS,STORM_WIZARD_KEY,stormWizard,loadStormWizard,saveStormWizard,drawStormWizard,mountStormWizardChoices} from '../src/storm-wizards.js';
import {STORM_WIZARD_BOUNDS} from '../src/storm-wizard-bounds.js';
test('all six reference wizards have distinct identities and saved choices survive reopening',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 assert.equal(new Set(STORM_WIZARDS.map(w=>w.id)).size,6);
 for(const wizard of STORM_WIZARDS){assert.equal(saveStormWizard(wizard.id,storage),wizard.id);assert.equal(values.get(STORM_WIZARD_KEY),wizard.id);assert.equal(loadStormWizard(storage),wizard.id);}
 values.set(STORM_WIZARD_KEY,'unknown');assert.equal(loadStormWizard(storage),STORM_WIZARDS[0].id);
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 assert.equal(loadStormWizard(blocked),STORM_WIZARDS[0].id);assert.equal(saveStormWizard('ice-sorceress',blocked),'ice-sorceress');assert.equal(stormWizard('__proto__').id,STORM_WIZARDS[0].id);
});
test('wizard picture choices show selection and lock while a round is active',()=>{
 const original=globalThis.document;
 class Element{children=[];attributes={};append(...nodes){this.children.push(...nodes);}setAttribute(k,v){this.attributes[k]=v;}}
 globalThis.document={createElement:()=>new Element()};
 try{const container=new Element(),selections=[],gallery=mountStormWizardChoices(container,'sorceress',id=>selections.push(id));const buttons=container.children[0].children.slice(1);assert.equal(buttons.length,6);assert.ok(buttons.every(b=>b.children.length===2));buttons[4].onclick();assert.deepEqual(selections,['ice-sorceress']);assert.equal(buttons[4].attributes['aria-pressed'],'true');assert.equal(buttons[0].attributes['aria-pressed'],'false');gallery.setDisabled(true);buttons[2].onclick();assert.equal(selections.length,1);gallery.setDisabled(false);buttons[2].onclick();assert.equal(selections[1],'wand-apprentice');}finally{globalThis.document=original;}
});
test('every wizard sprite has complete bounds and draws within the space beside the tower',()=>{
 const original=globalThis.Image;
 globalThis.Image=class{complete=true;naturalWidth=1536;};
 try{const draws=[],c=new Proxy({drawImage:(...args)=>draws.push(args)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 for(const wizard of STORM_WIZARDS){const bounds=STORM_WIZARD_BOUNDS[wizard.id];assert.ok(bounds?.w>0&&bounds.h>0);assert.equal(drawStormWizard(c,wizard.id,57,713,1,true),true);const args=draws.at(-1);assert.equal(args[1],bounds.x);assert.ok(args[7]<=104+1e-8);assert.ok(args[8]<=190+1e-8);}
 }finally{globalThis.Image=original;}
});
