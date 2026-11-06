export const WIZARD_GOWNS=[
 {id:'wizard-gown-rose-dragon',name:'Rose dragon gown',outfit:8,detail:'Ivory rose embroidery, sculpted dragon shoulders, and floral wing sleeves.'},
 {id:'wizard-gown-blue-garden',name:'Blue garden gown',outfit:9,detail:'Dusty blue chiffon with dimensional flowers and flowing sleeves.'},
 {id:'wizard-gown-starlight',name:'Ice-blue starlight gown',outfit:10,detail:'A luminous ice-blue ball gown with silver leaves, feathers and crystals.'},
 {id:'wizard-gown-midnight-rose',name:'Midnight rose gown',outfit:11,detail:'Midnight navy ruffles, sculpted blue roses, and silver star embroidery.'}
];
export const WIZARD_GOWN_SHOP_ITEMS=WIZARD_GOWNS.map(({outfit,...g})=>({...g,wizardOutfit:outfit,group:'appearance',category:'WIZARD TETRIS · CLOTHING',icon:'✦',cost:50,action:'Unlock gown',description:g.detail+' Permanently unlocks kid and adult versions in Wizard Tetris → Create your own character.'}));
export function loadWizardGownUnlocks(storage){try{const value=JSON.parse((storage??globalThis.localStorage)?.getItem('sidequest.save.v1')||'null');return Array.isArray(value?.upgrades)?value.upgrades:[];}catch{return [];}}
export function wizardGownUnlocked(outfit,owned=loadWizardGownUnlocks()){const item=WIZARD_GOWNS.find(g=>g.outfit===outfit);return !item||owned.includes(item.id);}
