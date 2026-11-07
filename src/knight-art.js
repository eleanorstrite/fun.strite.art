import {playSprite} from './play-art.js';
import {ARMORS} from './system.js';
const variants=new Map();
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
function knightSprite(character){
 const original=playSprite('knight',0);if(!original)return null;
 const key=[character.armor||'silver',character.color,character.cape!==false,character.helmet||'plume'].join(':');if(variants.has(key))return variants.get(key);
 if(!globalThis.document?.createElement)return original;const canvas=document.createElement('canvas'),b=original.bounds,scale=512/b.h;canvas.width=Math.round(b.w*scale);canvas.height=512;const c=canvas.getContext?.('2d');if(!c?.getImageData)return original;
 c.drawImage(original.image,b.x,b.y,b.w,b.h,0,0,canvas.width,canvas.height);const image=c.getImageData(0,0,canvas.width,canvas.height),d=image.data,cloth=rgb(character.color||'#ed6e40'),armor=rgb((ARMORS[character.armor]||ARMORS.silver).dark);
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4;if(!d[i+3])continue;const r=d[i],g=d[i+1],blue=d[i+2],nx=x/canvas.width,ny=y/canvas.height,red=r>g*1.45&&r>blue*1.2;
  if(character.cape===false&&ny>.35&&(nx<.25||red&&nx<.47)){d[i+3]=0;continue;}
  if(character.helmet!=='plume'&&character.helmet&&ny<.23&&nx<.61&&r>g*.9&&g>blue*1.35){d[i+3]=0;continue;}
  const metal=Math.max(r,g,blue)-Math.min(r,g,blue)<42&&r+g+blue>120;
  if(red||metal&&character.armor&&character.armor!=='silver'){const target=red?cloth:armor,light=(red?Math.max(r,g,blue):.2126*r+.7152*g+.0722*blue)/180;for(let j=0;j<3;j++)d[i+j]=Math.min(255,target[j]*light+(metal?Math.max(0,light-1)*90:0));}
 }
 c.putImageData(image,0,0);const result={image:canvas,bounds:{x:0,y:0,w:canvas.width,h:canvas.height}};if(variants.size>=32)variants.delete(variants.keys().next().value);variants.set(key,result);return result;
}
function gradient(c,stops){const g=c.createLinearGradient(-.25,-.4,.25,.3);for(const [at,color]of stops)g.addColorStop(at,color);return g;}
export function drawDetailedKnight(c,x,y,size,character={},flip=false){
 const sprite=knightSprite(character);if(!sprite)return false;const b=sprite.bounds,scale=Math.min(size*1.1/b.w,size*1.1/b.h),helmet=character.helmet||'plume';c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.drawImage(sprite.image,b.x,b.y,b.w,b.h,-b.w*scale/2,-b.h*scale/2,b.w*scale,b.h*scale);c.scale(size,size);
 if(helmet==='crown'){c.fillStyle=gradient(c,[[0,'#b97823'],[.45,'#fff4b1'],[.7,'#e8bc56'],[1,'#85531a']]);c.beginPath();c.moveTo(-.12,-.34);c.lineTo(-.15,-.5);c.lineTo(-.055,-.435);c.lineTo(.015,-.54);c.lineTo(.075,-.435);c.lineTo(.16,-.49);c.lineTo(.14,-.33);c.closePath();c.fill();c.strokeStyle='#fff0ac';c.lineWidth=.008;c.stroke();for(const xx of [-.075,.015,.1]){c.fillStyle=character.color||'#8c48ab';c.beginPath();c.ellipse(xx,-.365,.014,.018,0,0,7);c.fill();}}
 if(helmet==='horns'||helmet==='winged'){c.fillStyle=gradient(c,[[0,'#ad8f68'],[.4,'#fff4d3'],[.7,'#d8c7a2'],[1,'#8f7454']]);for(const side of [-1,1]){c.save();c.scale(side,1);c.beginPath();c.moveTo(.1,-.34);c.bezierCurveTo(.23,-.41,.26,-.53,.23,-.57);c.bezierCurveTo(.25,-.43,.15,-.44,.08,-.38);c.closePath();c.fill();c.restore();}}
 if(character.shield){c.save();c.translate(-.16,.08);c.fillStyle=gradient(c,[[0,'#dce8ee'],[.3,'#fff9df'],[.5,(ARMORS[character.armor]||ARMORS.silver).dark],[.72,'#f4ead0'],[1,'#47596d']]);c.beginPath();c.moveTo(-.13,-.13);c.quadraticCurveTo(0,-.18,.13,-.13);c.lineTo(.11,.11);c.quadraticCurveTo(.06,.19,0,.23);c.quadraticCurveTo(-.1,.17,-.12,.09);c.closePath();c.fill();c.strokeStyle='#cba15a';c.lineWidth=.018;c.stroke();c.fillStyle=character.color||'#9a3544';c.beginPath();c.moveTo(-.09,-.09);c.lineTo(.09,-.09);c.lineTo(.07,.09);c.lineTo(0,.16);c.lineTo(-.08,.08);c.closePath();c.fill();c.strokeStyle='#fff0ae';c.lineWidth=.014;c.beginPath();c.moveTo(0,-.07);c.lineTo(0,.12);c.moveTo(-.055,-.01);c.lineTo(.055,-.01);c.stroke();c.restore();}
 c.restore();return true;
}
