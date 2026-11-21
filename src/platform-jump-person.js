import {jumpBoyFrame} from './platform-jump-boy.js';
import {playAtlas} from './play-art.js';
import {drawJumpFacialHair} from './platform-jump-facial-hair.js';
import {drawJumpHair} from './platform-jump-hair.js';
import {jumpGirlFrame,drawGirlBase,drawGirlClothes} from './platform-jump-wardrobe.js';
const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
export function drawStarterGirlFace(c){const image=playAtlas('characters');if(!image?.complete||!image.naturalWidth)return false;c.drawImage(image,157,20,49,54,-20,-89,40,40*54/49);return true;}
export function drawJumper(c,x,y,s,time=0,moving=false,waving=false,pose={}){
 const index=waving==='clap'?3:waving?2:['jump','land'].includes(pose.pose)?1:moving&&Math.sin(time*12)>0?1:0,frame=s.face==='Boy'?jumpBoyFrame(index):jumpGirlFrame(index),changeClothes=s.outfit!=='Lace collar & skirt',changeHair=s.face==='Boy'||s.hairstyle!=='Sunset blossom waves';
 if(frame){c.save();c.translate(x,y+(!waving&&moving?Math.sin(time*12)*1.2:0));if(pose.facing<0)c.scale(-1,1);
  const head=()=>{c.translate(frame.face.x,frame.face.y+66*.36);c.scale(.36,.36);};
  if(changeHair){c.save();head();drawJumpHair(c,s.hairstyle,s.hair,'back',time);c.restore();}
  drawGirlBase(c,frame,index,s,changeClothes,changeHair);if(changeClothes){c.save();c.beginPath();c.rect(-200,-200,400,400);c.rect(frame.face.x-49*frame.scale/2-1,frame.face.y-54*frame.scale/2-1,49*frame.scale+2,54*frame.scale+2);c.clip('evenodd');drawGirlClothes(c,frame,s);c.restore();}
  c.save();head();if(changeHair)drawJumpHair(c,s.hairstyle,s.hair,'front',time);drawJumpFacialHair(c,s.facialHair);c.restore();c.restore();return;
 }
 // Loading fallback keeps one fixed, unclipped head and body for every outfit.
 c.save();c.translate(x,y);if(pose.facing<0)c.scale(-1,1);c.fillStyle=s.shirt;c.fillRect(-9,-58,18,29);c.fillStyle=s.pants;for(const side of [-1,1])c.fillRect(side*6-4,-30,8,30);c.save();c.translate(0,-44);c.scale(.5,.5);drawJumpHair(c,s.hairstyle,s.hair,'back',time);oval(c,0,-66,20,23,s.skin);for(const side of [-1,1])oval(c,side*7,-66,2.5,3.5,'#202435');drawJumpHair(c,s.hairstyle,s.hair,'front',time);drawJumpFacialHair(c,s.facialHair);c.restore();c.restore();
}
