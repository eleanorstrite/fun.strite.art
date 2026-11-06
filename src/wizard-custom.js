import {CUSTOM_WIZARD_NECKS} from './wizard-custom-necks.js';
import {CUSTOM_WIZARD_BOUNDS} from './wizard-custom-bounds.js';
export const CUSTOM_HAIRS=['Chestnut sweep','Blonde quiff','Brown fringe','Textured quiff','Blonde side part','Dark side sweep','Black crop','Tall quiff','Ash brown sweep','Long black waves','Side braid','Black bob','Long pink waves','Auburn waves','Silver hair','Dark curls'];
export const CUSTOM_OUTFITS=['Silver dragon gown','Butterfly sequin gown','Emerald leaf gown','Blue celestial gown','Ivory forest gown','Chemistry shirt & jeans','Axolotl scientist shirt','Frog scientist shirt'];
export function validateCustomWizard(value){return {age:value?.age==='kid'?'kid':'adult',hair:Number.isInteger(value?.hair)&&value.hair>=0&&value.hair<16?value.hair:9,outfit:Number.isInteger(value?.outfit)&&value.outfit>=0&&value.outfit<8?value.outfit:0};}
export function loadCustomWizard(player=0,storage){try{return validateCustomWizard(JSON.parse((storage??globalThis.localStorage)?.getItem('sidequest.wizard.custom.'+player)||'null'));}catch{return validateCustomWizard();}}
export function saveCustomWizard(value,player=0,storage){const result=validateCustomWizard(value);try{(storage??globalThis.localStorage)?.setItem('sidequest.wizard.custom.'+player,JSON.stringify(result));}catch{}return result;}
const atlases=new Map();
export function customWizardAtlas(kind){if(typeof Image==='undefined')return null;if(!atlases.has(kind)){const image=new Image();image.src=new URL('../assets/wizard-custom-'+kind+'.png',import.meta.url).href;atlases.set(kind,image);}return atlases.get(kind);}
export function drawCustomWizard(c,value,x,baseline,time=0,{height=190,reduced=false}={}){
 const look=validateCustomWizard(value),body=customWizardAtlas('outfits'),head=customWizardAtlas(look.age+'-heads');if(!body?.complete||!body.naturalWidth||!head?.complete||!head.naturalWidth)return false;
 const index=look.outfit+(look.age==='kid'?8:0),bw=body.naturalWidth/4,bh=body.naturalHeight/4,hw=head.naturalWidth/4,hh=head.naturalHeight/4,bodyHeight=height*(look.age==='kid'?.78:.84),bodyScale=bodyHeight/bh,bodyWidth=bw*bodyScale,headHeight=height*(look.age==='kid'?.27:.19),headScale=headHeight/hh;
 const bodyNeck=CUSTOM_WIZARD_NECKS.outfits[index],headNeck=CUSTOM_WIZARD_NECKS[look.age+'-heads'][look.hair];
 // Attach the actual portrait neck to the actual outfit neck, including tile offsets.
 const neckX=-bodyWidth/2+(bodyNeck.x-index%4*bw)*bodyScale,neckY=-bodyHeight+(bodyNeck.y+3-Math.floor(index/4)*bh)*bodyScale;
 const headX=neckX-(headNeck.x-look.hair%4*hw)*headScale,headY=neckY-(headNeck.y-Math.floor(look.hair/4)*hh)*headScale;
 c.save();c.translate(x,baseline+(reduced?0:Math.sin(time*2)*1.5));
 const backIndex=({9:0,10:1,12:2,13:3,14:4,15:5})[look.hair],back=backIndex===undefined?null:customWizardAtlas('hair-back');if(back?.complete&&back.naturalWidth){const sw=back.naturalWidth/3,sh=back.naturalHeight/2,w=height*.35,h=height*(look.hair===15?.39:.62);c.drawImage(back,backIndex%3*sw,Math.floor(backIndex/3)*sh,sw,sh,neckX-w/2,headY,w,h);}
 const b=CUSTOM_WIZARD_BOUNDS.outfits[index];c.drawImage(body,b.x,b.y,b.w,b.h,-bodyWidth/2+(b.x-index%4*bw)*bodyScale,-bodyHeight+(b.y-Math.floor(index/4)*bh)*bodyScale,b.w*bodyScale,b.h*bodyScale);
 const face=CUSTOM_WIZARD_BOUNDS[look.age+'-heads'][look.hair];c.drawImage(head,face.x,face.y,face.w,face.h,headX+(face.x-look.hair%4*hw)*headScale,headY+(face.y-Math.floor(look.hair/4)*hh)*headScale,face.w*headScale,face.h*headScale);
 c.restore();return true;
}
