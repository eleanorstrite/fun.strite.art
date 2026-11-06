import test from 'node:test';
import assert from 'node:assert/strict';
import{createSystem}from'../src/system.js';
import{WIZARD_GOWNS,WIZARD_GOWN_SHOP_ITEMS,wizardGownUnlocked,loadWizardGownUnlocks}from'../src/wizard-gown-shop.js';
import{loadCustomWizard,saveCustomWizard,validateCustomWizard}from'../src/wizard-custom.js';
import{mountWizardStudio}from'../src/wizard-studio.js';
function memory(){const m=new Map();return{getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};}
test('four gown purchases debit the shared wallet once and permanently unlock both ages for either player',()=>{
 const storage=memory(),system=createSystem(storage);assert.equal(WIZARD_GOWNS.length,4);assert.equal(new Set(WIZARD_GOWNS.map(g=>g.id)).size,4);assert.throws(()=>system.buy(WIZARD_GOWNS[0].id));assert.equal(wizardGownUnlocked(8,[]),false);system.beginSession('gown-test').finish(200);
 for(const [index,gown]of WIZARD_GOWNS.entries()){assert.equal(WIZARD_GOWN_SHOP_ITEMS[index].cost,50);const before=system.snapshot().coins;system.buy(gown.id);assert.equal(system.snapshot().coins,before-50);assert.equal(wizardGownUnlocked(gown.outfit,loadWizardGownUnlocks(storage)),true);assert.throws(()=>system.buy(gown.id));for(const age of['kid','adult'])for(const player of[0,1]){const look={age,hair:12,outfit:gown.outfit};saveCustomWizard(look,player,storage);assert.deepEqual(loadCustomWizard(player,storage),look);}}
 assert.equal(system.snapshot().coins,0);assert.deepEqual(createSystem(storage).snapshot().upgrades,system.snapshot().upgrades);
});
test('locked saved gowns cannot be equipped until purchased, including malformed storage',()=>{
 const storage=memory(),look={age:'kid',hair:9,outfit:11};assert.equal(validateCustomWizard(look).outfit,11);assert.equal(saveCustomWizard(look,0,storage).outfit,0);storage.setItem('sidequest.wizard.custom.0',JSON.stringify(look));assert.equal(loadCustomWizard(0,storage).outfit,0);storage.setItem('sidequest.save.v1','bad');assert.deepEqual(loadWizardGownUnlocks(storage),[]);assert.equal(wizardGownUnlocked(0,[]),true);
});
test('the creator shows four locked gown choices, then enables a purchased choice without losing the editor state',t=>{
 const previous={document:globalThis.document,localStorage:globalThis.localStorage};t.after(()=>Object.assign(globalThis,previous));class El{children=[];attributes={};append(...n){this.children.push(...n);}setAttribute(k,v){this.attributes[k]=v;}}globalThis.document={createElement:()=>new El()};globalThis.localStorage=memory();let owned=[];const chosen=[],parent=new El(),studio=mountWizardStudio(parent,{getUpgrades:()=>owned,onChange:v=>chosen.push(v)});const find=(n,key,value)=>n.attributes?.[key]===value?n:n.children.map(c=>find(c,key,value)).find(Boolean);studio.open();const button=find(parent,'data-custom-outfit','8');assert.equal(button.disabled,true);button.onclick();assert.equal(chosen.length,0);owned=[WIZARD_GOWNS[0].id];studio.paint(0);assert.equal(button.disabled,false);button.onclick();assert.equal(chosen.at(-1).look.outfit,8);
});
