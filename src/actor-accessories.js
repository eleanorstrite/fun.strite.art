function shade(c,x,y,w,color){const g=c.createLinearGradient?.(x-w,y-w,x+w,y+w);if(!g?.addColorStop)return color;g.addColorStop(0,'#fff1d4');g.addColorStop(.22,color);g.addColorStop(.65,color);g.addColorStop(1,'#253349');return g;}
function oval(c,x,y,rx,ry,fill){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
// Head landmarks are measured on the actual sprite, so gear shares its scale, pose and facing.
export function actorHead(group,index,maxW,maxH,{x=.6,y=.15,w=.43,h=.26}={}){
 return importHead(group,index,maxW,maxH,x,y,w,h);
}
import {PLAY_ART} from './play-art-bounds.js';
function importHead(group,index,maxW,maxH,x,y,w,h){const b=PLAY_ART[group].bounds[index],s=Math.min(maxW/b.w,maxH/b.h),width=b.w*s,height=b.h*s;return {x:(x-.5)*width,y:(y-1)*height,w:w*width,h:h*height};}
export function drawActorAccessories(c,look,head,time=0,layer='front'){
 const {x,y,w,h}=head,color=look.color||'#6289a3';c.save();c.lineJoin='round';c.lineCap='round';
 if(layer==='back'){
  if(look.accessory==='wings'){for(const side of [-1,1]){c.fillStyle=shade(c,x,y,w,'#ded5ee');c.beginPath();c.moveTo(x+side*w*.25,y+h*.65);c.bezierCurveTo(x+side*w*1.3,y+h*.1,x+side*w*1.35,y-h*.2,x+side*w*1.15,y-h*.3);c.quadraticCurveTo(x+side*w*.6,y-h*.2,x+side*w*.22,y+h*.4);c.fill();c.strokeStyle='#9f91b5';c.lineWidth=w*.025;c.stroke();}}
  c.restore();return;
 }
 const roof=y-h*.42;
 if(look.hat==='cap'){c.fillStyle=shade(c,x,roof,w,color);c.beginPath();c.ellipse(x,roof,w*.56,h*.39,0,Math.PI,Math.PI*2);c.lineTo(x+w*.56,roof+h*.07);c.quadraticCurveTo(x,roof+h*.2,x-w*.56,roof+h*.06);c.closePath();c.fill();c.strokeStyle='#ffffff66';c.lineWidth=w*.025;c.beginPath();c.moveTo(x,roof-h*.36);c.quadraticCurveTo(x+w*.13,roof-h*.18,x+w*.12,roof);c.stroke();oval(c,x+w*.33,roof+h*.065,w*.48,h*.065,shade(c,x,roof,w,color));}
 if(look.hat==='beanie'){c.fillStyle=shade(c,x,roof,w,color);c.beginPath();c.ellipse(x,roof,w*.56,h*.44,0,Math.PI,Math.PI*2);c.lineTo(x+w*.56,roof+h*.12);c.lineTo(x-w*.56,roof+h*.12);c.fill();c.strokeStyle='#ffffff55';c.lineWidth=w*.025;for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(x+i*w*.13,roof-h*.27);c.lineTo(x+i*w*.15,roof+h*.09);c.stroke();}oval(c,x,roof-h*.48,w*.13,h*.14,'#fff2d4');}
 if(look.hat==='crown'){c.fillStyle=shade(c,x,roof,w,'#e8b750');c.beginPath();c.moveTo(x-w*.48,roof+h*.08);for(const [xx,yy]of [[-.53,-.33],[-.25,-.14],[0,-.46],[.25,-.14],[.53,-.33],[.48,.08]])c.lineTo(x+xx*w,roof+yy*h);c.closePath();c.fill();c.strokeStyle='#fff1ad';c.lineWidth=w*.035;c.stroke();for(const side of [-1,0,1])oval(c,x+side*w*.27,roof-h*.02,w*.045,h*.055,color);}
 if(look.accessory==='headband'){c.strokeStyle=shade(c,x,y,w,color);c.lineWidth=h*.14;c.beginPath();c.ellipse(x,y-h*.22,w*.49,h*.12,0,Math.PI*.96,Math.PI*2.04);c.stroke();}
 if(look.accessory==='glasses'){c.strokeStyle=shade(c,x,y,w,'#4b5c6d');c.lineWidth=w*.055;for(const side of [-1,1]){const xx=x+side*w*.24;c.fillStyle='#add8e51c';c.beginPath();c.roundRect(xx-w*.2,y-h*.14,w*.4,h*.31,w*.1);c.fill();c.stroke();c.strokeStyle='#edf8ff9c';c.lineWidth=w*.025;c.beginPath();c.moveTo(xx-w*.1,y-h*.06);c.lineTo(xx+w*.02,y-h*.06);c.stroke();c.strokeStyle='#4b5c6d';c.lineWidth=w*.055;}c.beginPath();c.moveTo(x-w*.035,y-h*.02);c.lineTo(x+w*.035,y-h*.02);c.stroke();}
 if(look.accessory==='scarf'){c.strokeStyle=shade(c,x,y+h*.45,w,color);c.lineWidth=h*.16;c.beginPath();c.ellipse(x,y+h*.47,w*.4,h*.12,0,0,Math.PI);c.stroke();c.fillStyle=shade(c,x,y,w,color);c.beginPath();c.moveTo(x+w*.15,y+h*.52);c.quadraticCurveTo(x+w*.7,y+h*.7,x+w*.65+Math.sin(time*4)*w*.12,y+h*1.08);c.lineTo(x+w*.39,y+h*.96);c.lineTo(x+w*.06,y+h*.62);c.closePath();c.fill();c.strokeStyle='#ffffff55';c.lineWidth=w*.018;c.stroke();}
 c.restore();
}
