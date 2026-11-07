import {WIZARD_BOY_ART} from './wizard-boy-art.js';
import {WIZARD_GOWN_ART} from './wizard-gown-art.js';
import {WIZARD_GOWNS,wizardGownUnlocked,loadWizardGownUnlocks} from './wizard-gown-shop.js';
import {CUSTOM_WIZARD_NECKS} from './wizard-custom-necks.js';
import {CUSTOM_WIZARD_BOUNDS} from './wizard-custom-bounds.js';
export const CUSTOM_HAIRS=['Chestnut sweep','Blonde quiff','Brown fringe','Textured quiff','Blonde side part','Dark side sweep','Black crop','Tall quiff','Ash brown sweep','Long black waves','Side braid','Black bob','Long pink waves','Auburn waves','Silver hair','Dark curls'];
export const CUSTOM_OUTFITS=['Silver dragon gown','Butterfly sequin gown','Emerald leaf gown','Blue celestial gown','Ivory forest gown','Chemistry shirt & jeans','Axolotl scientist shirt','Frog scientist shirt',...WIZARD_GOWNS.map(g=>g.name),'Navy wizard coat & trousers','Emerald adventurer & boots','Black-gold sorcerer suit','Burgundy sweater & jeans'];
export function validateCustomWizard(value){return {age:value?.age==='kid'?'kid':'adult',hair:Number.isInteger(value?.hair)&&value.hair>=0&&value.hair<16?value.hair:9,outfit:Number.isInteger(value?.outfit)&&value.outfit>=0&&value.outfit<CUSTOM_OUTFITS.length?value.outfit:0};}
export function suggestWizardOutfit(look,hair){return hair<9&&(look.outfit<5||look.outfit>=8&&look.outfit<12)?12+(look.outfit%4):look.outfit;}
export function loadCustomWizard(player=0,storage){try{const saved=JSON.parse((storage??globalThis.localStorage)?.getItem('sidequest.wizard.custom.'+player)||'null'),look=validateCustomWizard(saved);if(saved&&saved.wardrobeVersion!==2)look.outfit=suggestWizardOutfit(look,look.hair);if(!wizardGownUnlocked(look.outfit,loadWizardGownUnlocks(storage)))look.outfit=0;return look;}catch{return validateCustomWizard();}}
export function saveCustomWizard(value,player=0,storage,owned=loadWizardGownUnlocks(storage)){const result=validateCustomWizard(value);if(!wizardGownUnlocked(result.outfit,owned))result.outfit=0;try{(storage??globalThis.localStorage)?.setItem('sidequest.wizard.custom.'+player,JSON.stringify({...result,wardrobeVersion:2}));}catch{}return result;}
const atlases=new Map();
export function customWizardAtlas(kind){if(typeof Image==='undefined')return null;if(!atlases.has(kind)){const image=new Image();image.src=new URL('../assets/wizard-custom-'+kind+'.png',import.meta.url).href;atlases.set(kind,image);}return atlases.get(kind);}
export function customOutfitSprite(value){
 const look=validateCustomWizard(value),boy=look.outfit>=12,shop=look.outfit>=8&&!boy,index=boy?look.outfit-12+(look.age==='kid'?4:0):shop?look.outfit-8+(look.age==='kid'?4:0):look.outfit+(look.age==='kid'?8:0),image=customWizardAtlas(boy?'boy-outfits':shop?'shop-gowns':'outfits');if(!image?.complete||!image.naturalWidth)return null;
 return {image,index,cellWidth:image.naturalWidth/4,cellHeight:image.naturalHeight/(shop||boy?2:4),bounds:boy?WIZARD_BOY_ART.bounds[index]:shop?WIZARD_GOWN_ART.bounds[index]:CUSTOM_WIZARD_BOUNDS.outfits[index],neck:boy?WIZARD_BOY_ART.necks[index]:shop?WIZARD_GOWN_ART.necks[index]:CUSTOM_WIZARD_NECKS.outfits[index]};
}
export function drawCustomWizard(c,value,x,baseline,time=0,{height=190,reduced=false}={}){
 const look=validateCustomWizard(value),outfit=customOutfitSprite(look),body=outfit?.image,head=customWizardAtlas(look.age+'-heads');if(!body?.complete||!body.naturalWidth||!head?.complete||!head.naturalWidth)return false;
 const {index,cellWidth:bw,cellHeight:bh}=outfit,hw=head.naturalWidth/4,hh=head.naturalHeight/4,bodyHeight=height*(look.age==='kid'?.78:.84),bodyScale=bodyHeight/bh,bodyWidth=bw*bodyScale,headHeight=height*(look.age==='kid'?.21:.19),headScale=headHeight/hh;
 const bodyNeck=outfit.neck,headNeck=CUSTOM_WIZARD_NECKS[look.age+'-heads'][look.hair];
 // Attach the actual portrait neck to the actual outfit neck, including tile offsets.
 const neckInset=look.outfit>=5?9:6;
 const neckX=-bodyWidth/2+(bodyNeck.x-index%4*bw)*bodyScale,neckY=-bodyHeight+(bodyNeck.y+neckInset-Math.floor(index/4)*bh)*bodyScale;
 const headX=neckX-(headNeck.x-look.hair%4*hw)*headScale,headY=neckY-(headNeck.y-Math.floor(look.hair/4)*hh)*headScale;
 c.save();c.translate(x,baseline+(reduced?0:Math.sin(time*2)*1.5));
 const backIndex=({9:0,10:1,12:2,13:3,14:4,15:5})[look.hair],back=backIndex===undefined?null:customWizardAtlas('hair-back');if(back?.complete&&back.naturalWidth){const sw=back.naturalWidth/3,sh=back.naturalHeight/2,hairScale=look.age==='kid'?7/9:1,w=height*.35*hairScale,h=height*(look.hair===15?.39:.62)*hairScale;c.drawImage(back,backIndex%3*sw,Math.floor(backIndex/3)*sh,sw,sh,neckX-w/2,headY,w,h);}
 const b=outfit.bounds;c.drawImage(body,b.x,b.y,b.w,b.h,-bodyWidth/2+(b.x-index%4*bw)*bodyScale,-bodyHeight+(b.y-Math.floor(index/4)*bh)*bodyScale,b.w*bodyScale,b.h*bodyScale);
 // Carry the portrait's own skin into the outfit neck stub, so the seam does not look pasted on.
 const stubDepth=look.outfit>=12?25:look.outfit>=8?22:look.outfit>=5?17:9,joinWidth=(bodyNeck.width||(look.outfit>=12?27:25))*bodyScale,joinHeight=Math.max(1,(stubDepth-neckInset)*bodyScale);
 c.save();c.beginPath();c.moveTo(neckX-joinWidth/2,neckY-1);c.lineTo(neckX+joinWidth/2,neckY-1);c.lineTo(neckX+joinWidth*.43,neckY+joinHeight);c.quadraticCurveTo(neckX,neckY+joinHeight+1,neckX-joinWidth*.43,neckY+joinHeight);c.closePath();c.clip();
 c.drawImage(head,headNeck.x-headNeck.width/2,headNeck.y-10,headNeck.width,7,neckX-joinWidth/2,neckY-1,joinWidth,joinHeight+2);c.restore();
 const face=CUSTOM_WIZARD_BOUNDS[look.age+'-heads'][look.hair];c.drawImage(head,face.x,face.y,face.w,face.h,headX+(face.x-look.hair%4*hw)*headScale,headY+(face.y-Math.floor(look.hair/4)*hh)*headScale,face.w*headScale,face.h*headScale);
 c.restore();return true;
}
