import {COSTUME_PET_TYPES,COSTUME_PET_BREEDS,costumePetSprite} from './platform-costume-pets.js';
export function drawCostumePreviewFrame(canvas,time=0){
 const c=canvas.getContext('2d');if(!c)return false;c.save();c.scale(canvas.width/960,canvas.height/800);c.fillStyle='#f0eaf7';c.fillRect(0,0,960,800);c.textAlign='center';c.fillStyle='#4c3c68';c.font='700 28px system-ui';c.fillText('Rainbow, tutu & tuxedo pets',480,38);
 c.font='600 18px system-ui';for(let col=0;col<3;col++)c.fillText(['Rainbow','Pink tutu','Tuxedo'][col],170+col*310,76);
 const stage=time%3,pose=stage<.7?'idle':stage<1.8?'walk':'jump',moving=pose==='walk';
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){
  const x=20+col*310,y=95+row*230;c.fillStyle='#ffffff';c.beginPath();c.roundRect(x,y,300,217,18);c.fill();
  const sprite=costumePetSprite(COSTUME_PET_TYPES[row],COSTUME_PET_BREEDS[col],pose,time,moving);
  c.fillStyle='#665276';c.font='600 14px system-ui';c.fillText(COSTUME_PET_TYPES[row][0].toUpperCase()+COSTUME_PET_TYPES[row].slice(1),x+150,y+23);
  if(sprite){const b=sprite.bounds,scale=Math.min(258/sprite.maxW,168/sprite.maxH),jump=pose==='jump'?Math.sin((stage-1.8)/1.2*Math.PI)*18:0;c.drawImage(sprite.image,b.x,b.y,b.w,b.h,x+150-b.w*scale/2,y+202-b.h*scale-jump,b.w*scale,b.h*scale);}
 }
 c.fillStyle='#665276';c.font='14px system-ui';c.fillText('Animated game artwork · 50 coins per look in the Platform Jump shop',480,795);c.restore();return true;
}
