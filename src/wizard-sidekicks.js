import {WIZARD_SIDEKICK_BOUNDS} from './wizard-sidekick-bounds.js';
export const WIZARD_SIDEKICKS={
 cat:['Flame-point cat','Black kitten','White kitten','Chocolate kitten','Tuxedo kitten','Black-and-white cat','Spotted wildcat'],
 dog:['Yellow Labrador','Black Labrador','Chocolate Labrador','Fox-red Labrador','Dalmatian','Bernese mountain dog','Brindle Boxer','Dachshund'],
 dragon:['Blossom dragon','Midnight dragon','Ivory dragon','Amethyst dragon','Emerald dragon','Sapphire dragon','Golden dragon','Ember dragon']
};
export const WIZARD_SIDEKICK_TYPES=['cat','dog','dragon'];
export function validateWizardSidekick(value){
 const result={type:'cat',variants:{cat:0,dog:0,dragon:0}};if(!value||typeof value!=='object')return result;
 if(WIZARD_SIDEKICK_TYPES.includes(value.type))result.type=value.type;
 for(const type of WIZARD_SIDEKICK_TYPES){const index=value.variants?.[type];if(Number.isInteger(index)&&index>=0&&index<WIZARD_SIDEKICKS[type].length)result.variants[type]=index;}
 return result;
}
export function cycleWizardSidekick(value,type){const next=validateWizardSidekick(value);if(!WIZARD_SIDEKICK_TYPES.includes(type))return next;if(next.type===type)next.variants[type]=(next.variants[type]+1)%WIZARD_SIDEKICKS[type].length;next.type=type;return next;}
export function loadWizardSidekick(player=0,storage){try{return validateWizardSidekick(JSON.parse((storage??globalThis.localStorage)?.getItem('sidequest.wizard.sidekick.'+player)||'null'));}catch{return validateWizardSidekick();}}
export function saveWizardSidekick(value,player=0,storage){const selection=validateWizardSidekick(value);try{(storage??globalThis.localStorage)?.setItem('sidequest.wizard.sidekick.'+player,JSON.stringify(selection));}catch{}return selection;}
const atlases=new Map();
export function wizardSidekickAtlas(type){if(!WIZARD_SIDEKICK_TYPES.includes(type)||typeof Image==='undefined')return null;if(!atlases.has(type)){const image=new Image();image.src=new URL('../assets/wizard-sidekicks-'+type+'.png',import.meta.url).href;atlases.set(type,image);}return atlases.get(type);}
export function wizardSidekickSprite(value,time=0,perked=false){
 const selection=validateWizardSidekick(value),type=selection.type,index=selection.variants[type],image=wizardSidekickAtlas(type),frames=WIZARD_SIDEKICK_BOUNDS[type];if(!image?.complete||!image.naturalWidth||!frames)return null;
 const pose=perked||Math.sin(time*2.7)>.4?1:0,poses=[frames[index],frames[8+index]];if(poses.some(p=>!p))return null;
 return {image,bounds:poses[pose],maxW:Math.max(...poses.map(p=>p.w)),maxH:Math.max(...poses.map(p=>p.h)),type,index,name:WIZARD_SIDEKICKS[type][index]};
}
export function drawWizardSidekick(c,value,x,baseline,time=0,{celebrate=false,reduced=false,maxW,maxH}={}){
 const selection=validateWizardSidekick(value),type=selection.type,t=reduced?0:time,sprite=wizardSidekickSprite(selection,t,celebrate&&!reduced);if(!sprite)return false;
 const width=maxW??(type==='dragon'?62:type==='dog'?55:48),height=maxH??(type==='dragon'?52:43),scale=Math.min(width/sprite.maxW,height/sprite.maxH),b=sprite.bounds,lift=reduced?0:celebrate?Math.abs(Math.sin(t*5))*5:Math.sin(t*2)*1.2;
 c.save();c.translate(x,baseline-lift);c.scale(1,reduced?1:1+Math.sin(t*2.2)*.012);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(sprite.image,b.x,b.y,b.w,b.h,-b.w*scale/2,-b.h*scale,b.w*scale,b.h*scale);c.restore();return true;
}
export function nextWizardSidekick(value){
 const next=validateWizardSidekick(value),type=next.type,index=next.variants[type]+1;
 if(index<WIZARD_SIDEKICKS[type].length)next.variants[type]=index;
 else{next.type=WIZARD_SIDEKICK_TYPES[(WIZARD_SIDEKICK_TYPES.indexOf(type)+1)%3];next.variants[next.type]=0;}
 return next;
}
export function mountWizardSidekicks(container,{player=0,selection,onChoose,isOpen=()=>true}={}){
 let current=validateWizardSidekick(selection),disabled=false;const group=document.createElement('fieldset');group.className='wizard-sidekicks';const legend=document.createElement('legend');legend.textContent=(player?'Opponent':'Your')+' sidekick · All 23 looks in one card';group.append(legend);
 const button=document.createElement('button');button.type='button';button.className='wizard-sidekick-choice';button.setAttribute?.('data-sidekick','all');button.setAttribute?.('data-player',String(player));const picture=document.createElement('canvas');picture.width=240;picture.height=170;picture.setAttribute?.('aria-hidden','true');const title=document.createElement('strong'),name=document.createElement('span'),hint=document.createElement('small');button.append(picture,title,name,hint);group.append(button);container.append(group);
 button.onclick=()=>{if(disabled)return;current=nextWizardSidekick(current);onChoose?.(validateWizardSidekick(current));paint(0);};
 function paint(time=0){if(!isOpen())return;const type=current.type,index=current.variants[type],label=WIZARD_SIDEKICKS[type][index],offset=WIZARD_SIDEKICK_TYPES.slice(0,WIZARD_SIDEKICK_TYPES.indexOf(type)).reduce((n,t)=>n+WIZARD_SIDEKICKS[t].length,0);button.disabled=disabled;button.setAttribute?.('aria-label',`${label}, ${offset+index+1} of 23. Tap for next pet, across cats, dogs and dragons.`);title.textContent=type[0].toUpperCase()+type.slice(1)+' · '+(offset+index+1)+' / 23';name.textContent=label;hint.textContent='Tap for next pet · Cats → Dogs → Dragons';const c=picture.getContext?.('2d');if(c){c.clearRect(0,0,240,170);c.fillStyle='#ebe8f3';c.fillRect(0,0,240,170);const sprite=wizardSidekickSprite(current,time);if(sprite){const b=sprite.bounds,scale=Math.min(220/sprite.maxW,154/sprite.maxH);c.drawImage(sprite.image,b.x,b.y,b.w,b.h,120-b.w*scale/2,163-b.h*scale,b.w*scale,b.h*scale);}}}
 paint();return {paint,setDisabled(value){disabled=value;button.disabled=value;},getSelection:()=>validateWizardSidekick(current)};
}
