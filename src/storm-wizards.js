import {drawCustomWizard,loadCustomWizard} from './wizard-custom.js';
import {STORM_WIZARD_BOUNDS} from './storm-wizard-bounds.js';
export const STORM_WIZARDS=[
 {id:'sorceress',name:'Star sorceress',color:'#ffd887',column:0,row:0},
 {id:'blue-mage',name:'Azure wizard',color:'#79e9ff',column:1,row:0},
 {id:'wand-apprentice',name:'Wand apprentice',color:'#ffcb70',column:2,row:0},
 {id:'star-sage',name:'Starlight sage',color:'#99c7ff',column:0,row:1},
 {id:'ice-sorceress',name:'Ice sorceress',color:'#d1f9ff',column:1,row:1},
 {id:'spellkeeper',name:'Flame spellkeeper',color:'#ffb06c',column:2,row:1}
];
export const STORM_WIZARD_KEY='sidequest.storm.wizard';
export function stormWizard(id){return id==='custom'?{id:'custom',name:'Your custom wizard',color:'#ffe2a0'}:STORM_WIZARDS.find(w=>w.id===id)||STORM_WIZARDS[0];}
export function loadStormWizard(storage){try{return stormWizard((storage??globalThis.localStorage)?.getItem(STORM_WIZARD_KEY)).id;}catch{return STORM_WIZARDS[0].id;}}
export function saveStormWizard(id,storage){const selected=stormWizard(id).id;try{(storage??globalThis.localStorage)?.setItem(STORM_WIZARD_KEY,selected);}catch{}return selected;}
let atlas;
export function stormWizardAtlas(){if(typeof Image==='undefined')return null;if(!atlas){atlas=new Image();atlas.src=new URL('../assets/storm-wizards.png',import.meta.url).href;}return atlas;}
export function drawStormWizard(c,id,x,baseline,time=0,casting=false,custom){
 if(id==='custom')return drawCustomWizard(c,custom||loadCustomWizard(),x,baseline,time);
 const image=stormWizardAtlas();if(!image?.complete||!image.naturalWidth)return false;
 const wizard=stormWizard(id),b=STORM_WIZARD_BOUNDS[wizard.id];if(!b)return false;
 const size=Math.min(104/b.w,190/b.h),width=b.w*size,height=b.h*size;
 c.save();c.translate(x,baseline+Math.sin(time*2)*2);c.rotate(casting?Math.sin(time*3)*.025:0);
 c.drawImage(image,b.x,b.y,b.w,b.h,-width/2,-height,width,height);
 if(casting){c.strokeStyle=wizard.color;c.lineWidth=2;c.globalAlpha=.8;c.beginPath();c.ellipse(0,-height*.38,49+Math.sin(time*4)*3,12,0,0,Math.PI*2);c.stroke();}
 c.restore();return true;
}
export function mountStormWizardChoices(container,selected,onChoose){
 const group=document.createElement('fieldset');group.className='storm-wizards';const legend=document.createElement('legend');legend.textContent='Choose your wizard · All free';group.append(legend);
 const choices=[];
 function refresh(id){for(const [wizard,button]of choices)button.setAttribute?.('aria-pressed',String(wizard.id===id));}
 for(const wizard of STORM_WIZARDS){
  const button=document.createElement('button');button.type='button';button.className='storm-wizard-choice';button.setAttribute?.('data-wizard',wizard.id);
  const picture=document.createElement('span');picture.className='storm-wizard-picture';picture.setAttribute?.('aria-hidden','true');picture.setAttribute?.('style',`background-position:${wizard.column*50}% ${wizard.row*100}%`);
  const name=document.createElement('span');name.textContent=wizard.name;button.append(picture,name);button.onclick=()=>{if(button.disabled)return;onChoose(wizard.id);refresh(wizard.id);};group.append(button);choices.push([wizard,button]);
 }
 refresh(selected);container.append(group);return {select:refresh,setDisabled(value){for(const [,button]of choices)button.disabled=value;}};
}
