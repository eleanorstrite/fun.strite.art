import {inNurseryWater} from './dragon-nursery-swimming.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const smooth=(a,b,rate,dt)=>a+(b-a)*(1-Math.exp(-rate*dt));
export function petPositionBlocked(x,z,inside=false){
 if(inside)return x< -5||x>5||z< -4.2||z>3.7||x< -1.4&&z< -.1||x>2.8&&z< -1.8||x>3.3&&z>.1||x< -3&&z>.7;
 return inNurseryWater(x,z)||x< -30||x>30||z< -255||z>15||Math.abs(x)<10.8&&z< -3.1&&z> -14.6||x>5.3&&x<8.7&&z> -2.2&&z<.25;
}
export function createDragonPetBehavior(){
 let p=null,inside=null,mode='look',clock=0,index=0,anchor=null,speed=0,heading=0,jump=0,vy=0,wasForced=false,attention=0;
 function nearby(s){for(const [x,z]of [[1.5,0],[-1.5,0],[0,1.2],[0,-1.2],[1,1],[-1,-1]]){const q={x:s.player.x+x,z:s.player.z+z};if(!petPositionBlocked(q.x,q.z,s.inside))return q;}return s.inside?{x:0,z:2}:{...s.player};}
 const sequence=['look','hop','pant','circle','grin','chase','sit'];
 function reset(point,h=0,room=false){p={x:point.x,z:point.z};inside=room;heading=h;anchor={...p};clock=0;mode='look';speed=0;jump=vy=0;}
 return {reset,attend(seconds=8){attention=seconds;mode='look';clock=0;},update(s,dt,playerMoving=false){
  dt=clamp(dt||0,0,.08);if(!p||inside!==s.inside){reset(nearby(s),s.heading,s.inside);}
  const forced=!!(s.swimming||s.riding||s.training||s.careEffect||s.activity||s.sleep||s.farewell);
  if(forced){wasForced=true;speed=0;jump=vy=0;return {position:{...p},heading,moving:false,speed:0,mood:'attentive',jump:0,lookYaw:0};}
  if(wasForced){wasForced=false;reset(nearby(s),s.heading,s.inside);}
  clock+=dt;attention=Math.max(0,attention-dt);const distance=Math.hypot(s.player.x-p.x,s.player.z-p.z),leash=s.inside?1.7:2.8;let target=null,mood=mode;
  if(!attention&&(distance>leash||mode==='follow'&&distance>1.7)){mode='follow';clock=0;target={x:s.player.x-Math.sin(s.heading||0)*1.3,z:s.player.z-Math.cos(s.heading||0)*1.3};mood=distance>5?'run':'follow';}
  else if(mode==='follow'){mode='look';clock=0;anchor={...p};}
  if(mode!=='follow'){
   if(!attention&&playerMoving&&distance>2.2){mode='follow';target={...s.player};mood='follow';}
   else{const duration=mode==='circle'?3.8:mode==='chase'?3:mode==='hop'?1.6:mode==='look'?1.8:2.6;
    if(!attention&&clock>duration){index=(index+1)%sequence.length;mode=sequence[index];clock=0;anchor={...p};if(mode==='hop')vy=2.1;}
    mood=mode;if(mode==='circle'||mode==='chase'){const radius=s.inside?.4:mode==='chase'?.65:.95,angle=clock*(mode==='chase'?3.2:1.65);target={x:anchor.x+Math.sin(angle)*radius,z:anchor.z+(Math.cos(angle)-1)*radius};const dx=target.x-s.player.x,dz=target.z-s.player.z,d=Math.hypot(dx,dz),limit=s.inside?1.6:2.6;if(d>limit){target.x=s.player.x+dx/d*limit;target.z=s.player.z+dz/d*limit;}}
   }
  }
  let wantedSpeed=0;if(target){
   // Route around the cottage, rather than walking through its walls to catch up.
   if(!s.inside&&(p.z> -3&&target.z< -3||p.z< -14&&target.z> -14)&&Math.abs(target.x)<11){target=Math.abs(p.x)<11?{x:p.x<0?-12:12,z:p.z}:{x:p.x,z:target.z};}
   const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);wantedSpeed=d>.12?(s.inside?.8:mode==='chase'?2.1:mode==='circle'?1.5:distance>6?4.6:2.4):0;speed=smooth(speed,wantedSpeed,5,dt);const step=Math.min(d,speed*dt);
   if(d>.001){const nx=p.x+dx/d*step,nz=p.z+dz/d*step;if(!petPositionBlocked(nx,nz,s.inside)){p.x=nx;p.z=nz;}else if(!petPositionBlocked(nx,p.z,s.inside))p.x=nx;else if(!petPositionBlocked(p.x,nz,s.inside))p.z=nz;else{speed=0;mode='look';clock=0;}
    const desired=Math.atan2(dx,dz);heading+=wrap(desired-heading)*(1-Math.exp(-dt*7));}
  }else speed=smooth(speed,0,8,dt);
  if(vy||jump){vy-=4.8*dt;jump=Math.max(0,jump+vy*dt);if(!jump&&vy<0)vy=0;}
  const towards=Math.atan2(s.player.x-p.x,s.player.z-p.z);if(!target&&['look','pant','grin'].includes(mode))heading+=wrap(towards-heading)*(1-Math.exp(-dt*1.8));
  const lookYaw=['look','pant','grin'].includes(mode)?clamp(wrap(towards-heading)*.65+Math.sin(clock*1.6)*.2,-.5,.5):mode==='chase'?.35:Math.sin(clock*.7)*.15;
  return {position:{...p},heading,moving:speed>.12,speed,mood,jump,lookYaw,grin:mode==='grin'||mode==='hop'||mode==='chase'?1:mode==='pant'?.6:.25};
 }};
}
