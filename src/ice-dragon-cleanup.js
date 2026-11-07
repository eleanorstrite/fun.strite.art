import {ICE_DRAGON_CLEANUP_ART as ART} from './ice-dragon-cleanup-art.js';
import {PLAY_ART} from './play-art-bounds.js';
import {drawPlaySprite} from './play-art.js';
const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
export const ICE_SAUCE_FLOOR_Y=307+162*1.15;
let atlas;
export function iceDragonCleanupAtlas(){if(typeof Image==='undefined')return null;if(!atlas){atlas=new Image();atlas.src=new URL('../assets/ice-dragon-cleanup.png',import.meta.url).href;}return atlas;}
export function iceDragonCleanupFacing(recipe){const xs=(recipe.saucePuddles||[]).map(p=>450+p.x*1.15);if(!xs.length)return 1;return Math.max(0,Math.max(...xs)+280-900)<=Math.max(0,280-Math.min(...xs))?1:-1;}
export function iceDragonCleanupMotion(time,targetX,{reduced=false,direction=1}={}){
 const enter=ease((time-5)/.5),leave=ease((time-8.5)/.45),licking=time>=5.5&&time<8.5,phase=((time-5.5)% .5+.5)% .5/.5,reach=licking?(reduced?1:Math.sin(Math.PI*phase)**2):0;
 const cw=ART.width/2,scale=ART.worldWidth/cw,low=ART.poses[1],targetFoot=targetX+direction*18-direction*(low.mouth.x-low.foot.x)*scale;
 const b=PLAY_ART.objects.bounds[14],standingScale=Math.min(245/b.w,260/b.h),standingWidth=b.w*standingScale,standingHeight=b.h*standingScale,startFoot=598+(.64-.5)*standingWidth;
 const footX=startFoot+(targetFoot-startFoot)*enter,baseline=474+(ICE_SAUCE_FLOOR_Y-474)*enter;
 let pieces;
 if(time<5.5){const q=reduced?1:enter;pieces=q<.5?[{frame:-1,alpha:1-q*2},{frame:0,alpha:q*2}]:[{frame:0,alpha:2-q*2},{frame:1,alpha:q*2-1}];}
 else if(time<8.5)pieces=reduced?[{frame:1,alpha:1}]:[{frame:1,alpha:1-reach},{frame:2,alpha:reach}];
 else{const q=reduced?1:leave;pieces=q<.5?[{frame:1,alpha:1-q*2},{frame:3,alpha:q*2}]:[{frame:3,alpha:2-q*2},{frame:-1,alpha:q*2-1}];}
 pieces=pieces.filter(p=>p.alpha>0);let mouthX=0,mouthY=0;
 for(const p of pieces){const a=p.frame<0?null:ART.poses[p.frame];mouthX+=p.alpha*(a?footX+direction*(a.mouth.x-a.foot.x)*scale:footX+direction*(.16-.64)*standingWidth);mouthY+=p.alpha*(a?baseline+(a.mouth.y-a.foot.y)*scale:baseline+(.29-1)*standingHeight);}
 return {footX,baseline,mouth:{x:mouthX,y:mouthY},floorY:ICE_SAUCE_FLOOR_Y,reach,licking,direction,scale,pieces,bend:enter*(1-leave),standingWidth};
}
export function iceDragonTongueShape(motion){const {mouth,floorY,reach,direction}=motion;return {base:{...mouth},tip:{x:mouth.x-direction*(2+18*reach),y:mouth.y+2+(floorY-mouth.y-2)*reach},reach,baseWidth:8,tipWidth:3.4+reach*1.5};}
function drawTongue(c,m){if(!m.licking)return;const s=iceDragonTongueShape(m),{base,tip}=s,d=m.direction,half=s.baseWidth/2,tipHalf=s.tipWidth/2,curveX=base.x-d*(5+7*s.reach),curveY=base.y+3+s.reach*3;
 c.save();const g=c.createLinearGradient(base.x,base.y,tip.x,tip.y+3);g.addColorStop(0,'#df7899');g.addColorStop(.45,'#f4a8b9');g.addColorStop(1,'#d66d90');c.fillStyle=g;c.strokeStyle='#bf6082';c.lineWidth=.65;
 c.beginPath();c.moveTo(base.x,base.y-half);c.bezierCurveTo(curveX,curveY-half,tip.x+d*4,tip.y-tipHalf,tip.x,tip.y-tipHalf);c.quadraticCurveTo(tip.x-d*tipHalf,tip.y,tip.x,tip.y+tipHalf);c.bezierCurveTo(tip.x+d*4,tip.y+tipHalf,curveX,curveY+half,base.x,base.y+half);c.closePath();c.fill();c.stroke();
 c.strokeStyle='#b95f7e99';c.lineWidth=.6;c.beginPath();c.moveTo(base.x-d*2,base.y);c.bezierCurveTo(curveX,curveY,tip.x+d*5,tip.y,tip.x+d*2,tip.y);c.stroke();c.strokeStyle='#ffd0dbb3';c.lineWidth=1;c.beginPath();c.moveTo(base.x-d*2,base.y-1.5);c.quadraticCurveTo(curveX,curveY-1.5,tip.x+d*3,tip.y-.6);c.stroke();c.restore();
}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function fallbackCrouch(c,m){const x=m.footX,y=m.baseline,d=m.direction;c.save();c.translate(x,y);c.scale(d,1);oval(c,-18,-39,66,37,'#ae8acc');oval(c,1,-23,29,24,'#be9bdf');oval(c,-64,-10,26,9,'#b993d5');oval(c,0,-4,25,8,'#c7a7df');c.strokeStyle='#a981c5';c.lineWidth=24;c.lineCap='round';c.beginPath();c.moveTo(-47,-50);c.quadraticCurveTo(-105,-54,-132,-29);c.stroke();oval(c,-132,-24,41,27,'#c4a2df');oval(c,-151,-11,27,15,'#cdb0e5');oval(c,-143,-31,9,12,'#fff8ec');oval(c,-146,-30,4,7,'#54436e');c.strokeStyle='#e3cba9';c.lineWidth=9;c.beginPath();c.moveTo(-110,-45);c.lineTo(-99,-65);c.stroke();c.restore();}
export function drawIceDragonCleanup(c,time,targetX,{reduced=false,direction=1}={}){
 const m=iceDragonCleanupMotion(time,targetX,{reduced,direction}),image=iceDragonCleanupAtlas(),ready=image?.complete&&image.naturalWidth;
 if(ready){const cw=ART.width/2,ch=ART.height/2;for(const p of m.pieces){c.save();c.globalAlpha=p.alpha;if(p.frame<0){drawPlaySprite(c,'objects',14,m.footX-direction*(.64-.5)*m.standingWidth,m.baseline,245,260,{flip:direction<0});}else{const a=ART.poses[p.frame],col=p.frame%2,row=Math.floor(p.frame/2);c.translate(m.footX,m.baseline);c.scale(direction*m.scale,m.scale);c.drawImage(image,col*cw,row*ch,cw,ch,-(a.foot.x-col*cw),-(a.foot.y-row*ch),cw,ch);}c.restore();}}
 else{fallbackCrouch(c,m);m.mouth={x:m.footX-direction*152,y:m.baseline-10};}
 drawTongue(c,m);return m;
}
