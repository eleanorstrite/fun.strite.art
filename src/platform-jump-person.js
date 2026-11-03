import {drawJumpFacialHair} from './platform-jump-facial-hair.js';
import {drawJumpOutfit,drawOutfitBody,outfitHeadOffset,outfitReady} from './platform-jump-clothes.js';
import {drawJumpHair} from './platform-jump-hair.js';
const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
function box(c,x,y,w,h,color,r=8){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function drawClassicBody(c,s,time,moving,waving){const stride=moving?Math.sin(time*13)*7:0;for(const side of [-1,1]){box(c,side*9-6,-22,12,23+(side*stride/2),s.pants,5);oval(c,side*9,side*stride/2,9,5,'#f6f1e8');if(waving==='clap'){const handX=side*(5+Math.abs(Math.sin(time*8))*13);c.strokeStyle=s.skin;c.lineWidth=9;c.lineCap='round';c.beginPath();c.moveTo(side*17,-40);c.lineTo(side*28,-66);c.lineTo(handX,-105);c.stroke();oval(c,handX,-108,6,7,s.skin);}else if(waving&&side===1){const handX=33+Math.sin(time*5)*5;c.strokeStyle=s.skin;c.lineWidth=9;c.lineCap='round';c.beginPath();c.moveTo(17,-40);c.lineTo(29,-55);c.lineTo(handX,-77);c.stroke();oval(c,handX,-79,6,7,s.skin);}else oval(c,side*20,-35+side*stride,5,14,s.skin);}box(c,-17,-51,34,33,s.shirt,10);}
export function drawJumper(c,x,y,s,time=0,moving=false,waving=false){
 c.save();c.translate(x,y);
 const dressed=outfitReady(s.outfit),headY=dressed?outfitHeadOffset(s.outfit):0;
 c.save();c.translate(0,headY);drawJumpHair(c,s.hairstyle,s.hair,'back',time);c.restore();
 if(dressed){drawOutfitBody(c,s,time,moving,waving);drawJumpOutfit(c,s.outfit,time,moving,waving);}else drawClassicBody(c,s,time,moving,waving);
 c.translate(0,headY);oval(c,0,-66,20,23,s.skin);
 drawJumpHair(c,s.hairstyle,s.hair,'front',time);
 for(const side of [-1,1]){oval(c,side*7,-66,2.5,3.5,'#202435');oval(c,side*7-1,-67,1,1,'white');}c.strokeStyle='#894b44';c.lineWidth=2;c.beginPath();c.arc(0,-59,5,.15,Math.PI-.15);c.stroke();drawJumpFacialHair(c,s.facialHair);c.restore();}
