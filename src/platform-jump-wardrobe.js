import {playSprite} from './play-art.js';
import {drawJumpOutfit,outfitReady,outfitUsesPants,outfitAtlas,outfitCell} from './platform-jump-clothes.js';
const layers=new Map(),garments=new Map();
const landmarks=[
 {neck:[178,83],waist:[167,136],face:[181.5,47],arms:[[[149,94],[130,194]],[[195,90],[202,156]]],legs:[[[156,150],[145,222]],[[177,150],[187,222]]]},
 {neck:[514,84],waist:[492,139],face:[540,47],arms:[[[488,100],[439,164]],[[528,100],[578,94]]],legs:[[[489,149],[463,201]],[[502,149],[537,204]]]},
 {neck:[804,87],waist:[795,137],face:[809,49],arms:[[[784,91],[730,18]],[[813,92],[817,163]]],legs:[[[790,153],[785,229]],[[810,153],[817,229]]]},
 {neck:[1110,83],waist:[1096,137],face:[1114,45],arms:[[[1091,92],[1123,90]],[[1115,94],[1142,102]]],legs:[[[1090,153],[1081,229]],[[1109,153],[1115,229]]]}
];
export function jumpGirlFrame(index){const sprite=playSprite('characters',index);if(!sprite)return null;const b=sprite.bounds,scale=Math.min(82/b.w,94/b.h),point=([x,y])=>({x:(x-b.x-b.w/2)*scale,y:(y-b.y-b.h)*scale}),l=landmarks[index];return {...sprite,index,scale,width:b.w*scale,height:b.h*scale,neck:point(l.neck),waist:point(l.waist),face:point(l.face),arms:l.arms.map(a=>a.map(point)),legs:l.legs.map(a=>a.map(point))};}
// Keep the original girl frame; replace fabric beneath fitted clothing and retain her original face and poses.
function nearSegment(p,a,b,r){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)<r;}
function dressedBase(frame,index,s,changeClothes,changeHair){
 if(!globalThis.document?.createElement)return frame.image;
 const clothColor=/Peach|Sunset/.test(s.outfit)?'#edb17c':/Daisy|Duck/.test(s.outfit)?'#7899b0':/Sage/.test(s.outfit)?'#a1a375':/Cocoa/.test(s.outfit)?'#87654a':/Lilac/.test(s.outfit)?'#b5a7b8':/Cosmos/.test(s.outfit)?'#172b51':/Atomic/.test(s.outfit)?'#18bdb4':s.outfit==='Classic colors'?s.shirt:'#444950',clothRgb=clothColor.match(/[a-f\d]{2}/gi).map(h=>parseInt(h,16));
 const pants=changeClothes&&(s.outfit==='Classic colors'||outfitUsesPants(s.outfit)),key=[frame.isBoy?'boy':'girl',index,changeClothes,changeHair,clothColor,pants?s.pants:''].join(':');if(layers.has(key))return layers.get(key);
 const b=frame.bounds,canvas=document.createElement('canvas');canvas.width=b.w;canvas.height=b.h;const c=canvas.getContext('2d');if(!c?.getImageData)return frame.image;c.drawImage(frame.image,b.x,b.y,b.w,b.h,0,0,b.w,b.h);const data=c.getImageData(0,0,b.w,b.h),rgb=pants?s.pants.match(/[a-f\d]{2}/gi).map(h=>parseInt(h,16)):null;
 for(let y=0;y<b.h;y++)for(let x=0;x<b.w;x++){const i=(y*b.w+x)*4,r=data.data[i],g=data.data[i+1],blue=data.data[i+2],v=y/b.h,hair=r>g*1.3&&g>blue*1.7&&r-g>45;
  if(changeClothes&&v>.23&&v<.70&&Math.abs(r-g)<35&&Math.abs(g-blue)<35){const tint=pants&&v>(frame.isBoy ? .49 : .43)?rgb:clothRgb,shade=.65+(r+g+blue)/1000;for(let k=0;k<3;k++)data.data[i+k]=Math.min(255,tint[k]*shade);}
  if(pants&&!frame.isBoy&&v>.4&&v<.7&&r<180&&Math.abs(r-g)<55&&Math.abs(g-blue)<45&&!hair){const p={x:(x-b.w/2)*frame.scale,y:(y-b.h)*frame.scale},hip={x:(frame.legs[0][0].x+frame.legs[1][0].x)/2,y:(frame.legs[0][0].y+frame.legs[1][0].y)/2},body=nearSegment(p,frame.waist,hip,6)||frame.legs.some(([a,z])=>nearSegment(p,a,z,3.5)),arm=frame.arms.some(([a,z])=>nearSegment(p,a,z,3.6));if(!body&&!arm)data.data[i+3]=0;}
  if(changeHair&&!frame.isBoy&&v<.61&&hair)data.data[i+3]=0;
  if(pants&&!frame.isBoy&&v>.40&&v<.82&&!hair&&r>g*1.15&&g>blue*1.08&&frame.legs.some(([a,z])=>nearSegment({x:(x-b.w/2)*frame.scale,y:(y-b.h)*frame.scale},a,z,4.5))){const shade=Math.max(.55,Math.min(1.25,(r+g+blue)/480));for(let k=0;k<3;k++)data.data[i+k]=Math.min(255,rgb[k]*shade);}
 }
 c.putImageData(data,0,0);if(layers.size>40)layers.clear();layers.set(key,canvas);return canvas;
}
export function drawGirlBase(c,frame,index,s,changeClothes,changeHair){const image=dressedBase(frame,index,s,changeClothes,changeHair),b=frame.bounds;if(image===frame.image)c.drawImage(image,b.x,b.y,b.w,b.h,-frame.width/2,-frame.height,frame.width,frame.height);else c.drawImage(image,-frame.width/2,-frame.height,frame.width,frame.height);}
function garment(c,style){
 const cell=outfitCell(style),image=outfitAtlas(style);if(!cell||!image?.complete||!image.naturalWidth)return false;
 if(!globalThis.document?.createElement)return drawJumpOutfit(c,style);
 if(!garments.has(style)){const w=image.naturalWidth/cell.columns,h=image.naturalHeight/cell.rows,col=cell.index%cell.columns,row=Math.floor(cell.index/cell.columns),canvas=document.createElement('canvas');canvas.width=Math.floor(w);canvas.height=Math.floor(h);const g=canvas.getContext('2d');if(!g?.getImageData)return drawJumpOutfit(c,style);g.drawImage(image,col*w,row*h,w,h,0,0,w,h);const data=g.getImageData(0,0,canvas.width,canvas.height).data;let minX=canvas.width,minY=canvas.height,maxX=0,maxY=0;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){if(x<w*.04||x>w*.96||y<h*.025||y>h*.975)continue;if(data[(y*canvas.width+x)*4+3]<24)continue;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}garments.set(style,{image:canvas,x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1});}
 const g=garments.get(style);c.drawImage(g.image,g.x,g.y,g.w,g.h,-31,-55,62,outfitUsesPants(style)?36:58);return true;
}
function sleeve(c,side,endY){c.moveTo(side*9,-47);c.lineTo(side*18,-50);c.lineTo(side*31,-40);c.lineTo(side*34,endY);c.lineTo(side*20,endY);c.lineTo(side*14,Math.min(-27,endY-3));c.lineTo(side*11,-35);c.closePath();}
function coreTransform(c,frame){const dx=frame.waist.x-frame.neck.x,dy=frame.waist.y-frame.neck.y;c.translate(frame.neck.x,frame.neck.y);c.rotate(-Math.atan2(dx,dy));c.scale(.58,frame.isBoy?1.02:.75);c.translate(0,55);}
export function drawGirlClothes(c,frame,s){
 const classic=s.outfit==='Classic colors',pants=classic||outfitUsesPants(s.outfit);
 if(!classic&&!outfitReady(s.outfit))return;
 // The torso and wardrobe use fixed landmarks on the unmodified girl.
 if(pants){c.save();c.strokeStyle=s.pants;c.lineWidth=6.3;c.lineCap='round';for(const[a,b]of frame.legs){c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}c.restore();}
 c.save();coreTransform(c,frame);c.fillStyle=s.skin;c.beginPath();c.moveTo(-4,-54);c.lineTo(4,-54);c.quadraticCurveTo(13,-47,12,-34);c.lineTo(9,-18);c.lineTo(-9,-18);c.lineTo(-12,-34);c.quadraticCurveTo(-13,-47,-4,-54);c.fill();
 if(pants){c.fillStyle=s.pants;c.beginPath();c.moveTo(-9,-31);c.lineTo(9,-31);c.quadraticCurveTo(12,-16,9,0);c.lineTo(2,0);c.lineTo(0,-11);c.lineTo(-2,0);c.lineTo(-9,0);c.quadraticCurveTo(-12,-16,-9,-31);c.fill();}
 if(classic){c.fillStyle=s.shirt;c.beginPath();c.moveTo(-4,-54);c.lineTo(-17,-51);c.lineTo(-15,-38);c.lineTo(-11,-40);c.lineTo(-10,-28);c.lineTo(10,-28);c.lineTo(11,-40);c.lineTo(15,-38);c.lineTo(17,-51);c.lineTo(4,-54);c.closePath();c.fill();c.restore();return;}
 if(frame.index===0){garment(c,s.outfit);c.restore();return;}
 const sleeveless=s.outfit.endsWith('butterfly dress'),shortSleeve=['Lace collar & skirt','Lilac shirt & shorts','Peach tie-waist dress','Sage jacket & pleated skirt','Duck bag & denim shorts','Atomic Energy tee','Bio-Logic DNA tee'].includes(s.outfit),endY=shortSleeve?-14:-3;
 c.save();if(!sleeveless){c.beginPath();c.rect(-100,-160,200,220);for(const side of [-1,1])sleeve(c,side,endY);c.clip('evenodd');}garment(c,s.outfit);c.restore();c.restore();
 if(sleeveless)return;
 for(let i=0;i<2;i++){const side=i===0?-1:1,[joint,wrist]=frame.arms[i],ref={x:side*15,y:-43},vx=side*24-ref.x,vy=(shortSleeve?-14:-3)-ref.y,dx=wrist.x-joint.x,dy=wrist.y-joint.y,scale=Math.hypot(dx,dy)/Math.hypot(vx,vy),angle=Math.atan2(dy,dx)-Math.atan2(vy,vx);
  c.save();c.translate(joint.x,joint.y);c.rotate(angle);c.scale(scale,scale);c.translate(-ref.x,-ref.y);c.beginPath();sleeve(c,side,endY);c.clip();garment(c,s.outfit);c.restore();
 }
}
