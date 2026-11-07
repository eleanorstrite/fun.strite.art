import {drawPlaySprite,playAtlas} from './play-art.js';
import {drawJumpFacialHair} from './platform-jump-facial-hair.js';
import {drawJumpOutfit,drawOutfitBody,outfitReady} from './platform-jump-clothes.js';
import {drawJumpHair} from './platform-jump-hair.js';
const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
function box(c,x,y,w,h,color,r=8){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function drawClassicBody(c,s,time,moving,waving){const stride=moving?Math.sin(time*13)*7:0;for(const side of [-1,1]){box(c,side*9-6,-22,12,23+(side*stride/2),s.pants,5);oval(c,side*9,side*stride/2,9,5,'#f6f1e8');if(waving==='clap'){const handX=side*(5+Math.abs(Math.sin(time*8))*13);c.strokeStyle=s.skin;c.lineWidth=9;c.lineCap='round';c.beginPath();c.moveTo(side*17,-40);c.lineTo(side*28,-66);c.lineTo(handX,-105);c.stroke();oval(c,handX,-108,6,7,s.skin);}else if(waving&&side===1){const handX=33+Math.sin(time*5)*5;c.strokeStyle=s.skin;c.lineWidth=9;c.lineCap='round';c.beginPath();c.moveTo(17,-40);c.lineTo(29,-55);c.lineTo(handX,-77);c.stroke();oval(c,handX,-79,6,7,s.skin);}else oval(c,side*20,-35+side*stride,5,14,s.skin);}box(c,-17,-51,34,33,s.shirt,10);}
// This face is sampled from the starter girl's standing artwork, not a different
// male/female portrait selected by hairstyle. Hair and clothes share one body scale.
export function drawStarterGirlFace(c){
 const image=playAtlas('characters');if(!image?.complete||!image.naturalWidth)return false;
 c.save();c.beginPath();c.ellipse(0,-66,20,23,0,0,Math.PI*2);c.clip();
 c.beginPath();c.moveTo(-13,-89);c.bezierCurveTo(-24,-80,-20,-65,-16,-57);c.bezierCurveTo(-12,-49,-5,-44,0,-44);c.bezierCurveTo(7,-44,14,-54,14,-62);c.bezierCurveTo(22,-68,20,-82,11,-89);c.closePath();c.clip();
 c.drawImage(image,157,20,49,54,-20,-89,40,46);c.restore();return true;
}
export function drawJumper(c,x,y,s,time=0,moving=false,waving=false,pose={}){
 const starter=s.hairstyle==='Sunset blossom waves'&&s.outfit==='Lace collar & skirt'&&(!s.facialHair||s.facialHair==='None');if(starter&&drawPlaySprite(c,'characters',waving==='clap'?3:waving?2:['jump','land'].includes(pose.pose)?1:moving&&Math.sin(time*12)>0?1:0,x,y+(!waving&&moving?Math.sin(time*12)*1.2:0),82,94,{flip:pose.facing<0}))return;
 c.save();c.translate(x+6,y);if(pose.facing<0)c.scale(-1,1);
 const dressed=outfitReady(s.outfit);
 // Match the starter's roughly 94px height: a smaller head and longer torso/legs.
 c.save();c.translate(0,-39);c.scale(.48,.5);drawJumpHair(c,s.hairstyle,s.hair,'back',time);c.restore();
 c.save();c.translate(0,-4);c.scale(.68,1.25);
 if(dressed){drawOutfitBody(c,s,time,moving,waving);drawJumpOutfit(c,s.outfit,time,moving,waving);}else drawClassicBody(c,s,time,moving,waving);
 c.restore();c.translate(0,-39);c.scale(.48,.5);const face=drawStarterGirlFace(c);if(!face)oval(c,0,-66,20,23,s.skin);
 drawJumpHair(c,s.hairstyle,s.hair,'front',time);
 if(!face){for(const side of [-1,1]){oval(c,side*7,-66,2.5,3.5,'#202435');oval(c,side*7-1,-67,1,1,'white');}c.strokeStyle='#894b44';c.lineWidth=2;c.beginPath();c.arc(0,-59,5,.15,Math.PI-.15);c.stroke();}drawJumpFacialHair(c,s.facialHair);c.restore();}
