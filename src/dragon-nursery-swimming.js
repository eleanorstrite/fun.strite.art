const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const WATERFALL={x:-20,z:-55,rx:11.8,rz:13,surface:.24,height:13.5,base:{x:-20,z:-62},crest:{x:-20,z:-73},entry:{x:-11.7,z:-49},shore:{x:-9.5,z:-48}};
export const SWIM_HOOPS=[{x:-15,z:-49},{x:-18,z:-46},{x:-23,z:-47},{x:-25,z:-53},{x:-23,z:-58},{x:-19,z:-60}];
export function inNurseryWater(x,z,padding=0){return Math.hypot((x-WATERFALL.x)/(WATERFALL.rx+padding),(z-WATERFALL.z)/(WATERFALL.rz+padding))<=1;}
export function nurseryWaterCliffBlocked(x,z){return !inNurseryWater(x,z)&&x> -31&&x< -9&&z< -63&&z> -81;}
export function nurseryWaterClearing(x,z){return inNurseryWater(x,z,2)||x> -32&&x< -8&&z< -62&&z> -81;}
// Shared by the visible cascades and the swimmers: three drops with gentler pool shelves.
export const WATERFALL_PROFILE=[{height:0,z:-62},{height:3.8,z:-63.2},{height:4.6,z:-66},{height:8.4,z:-67.2},{height:9.2,z:-70},{height:13.5,z:-72}];
export function waterfallPoint(height){const h=clamp(height,0,WATERFALL.height);for(let i=1;i<WATERFALL_PROFILE.length;i++){const a=WATERFALL_PROFILE[i-1],b=WATERFALL_PROFILE[i];if(h<=b.height){const t=(h-a.height)/(b.height-a.height);return {x:WATERFALL.x,y:WATERFALL.surface+h,z:a.z+(b.z-a.z)*t};}}return {x:WATERFALL.x,y:WATERFALL.surface+WATERFALL.height,z:-72};}
export function beginNurserySwimming(s){
 if(s.swimming)return true;
 if(!s.hatched||s.inside||s.sleep||s.training||s.riding||s.activity||s.careEffect||s.farewell||!inNurseryWater(s.player.x,s.player.z))return false;
 s.swimming={mode:'swim',height:0,velocity:0,cooldown:0,seconds:0,dive:0,slideFrom:0,slideTime:0};s.walking=false;
 if(!s.care.includes('swim')){s.routeTask='swim';s.routeActive=true;s.routeOrigin={...s.player};}
 s.message='You and your dragon are swimming! Follow the six golden hoops. At the falls, press Space or tap repeatedly to jump up. At the top, tap the waterfall to slide down.';return true;
}
export function leaveNurserySwimming(s,toShore=true){if(!s.swimming)return false;s.swimming=null;if(toShore)s.player={...WATERFALL.shore};s.heading=Math.PI/2;s.touchCameraHeading=null;if(s.routeTask==='swim'){s.routeOrigin={...s.player};s.routeActive=!s.care.includes('swim');if(!s.routeActive)s.routeTask=null;}s.message='Back on the shore. Your dragon shakes off the water.';return true;}
export function jumpNurseryWaterfall(s){const w=s.swimming;if(!w||w.cooldown>0||w.mode==='slide'||w.mode==='summit')return false;w.cooldown=.14;
 if(w.mode==='swim'&&Math.hypot(s.player.x-WATERFALL.base.x,s.player.z-WATERFALL.base.z)>3.6){w.dive=.75;s.message='Splash! Swim to the glowing waterfall, then press Space or keep tapping to climb it.';return true;}
 w.mode='climb';w.height=Math.max(.08,w.height);w.velocity=5.4;s.heading=Math.PI;s.message='Jump and dive up the waterfall! Keep pressing Space or tapping. Tap the falls to slide back down.';return true;
}
export function slideNurseryWaterfall(s){const w=s.swimming;if(!w||!['summit','climb'].includes(w.mode)||w.height<1)return false;w.mode='slide';w.slideFrom=w.height;w.slideTime=0;w.slideStart={...s.player};w.velocity=0;s.heading=0;s.message='Wheee! You and your dragon slide down the flowing waterfall together.';return true;}
function segmentDistance(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}
export function tickNurserySwimming(s,dt,input={}){const w=s.swimming;if(!w)return;dt=clamp(dt||0,0,.1);w.seconds+=dt;w.cooldown=Math.max(0,w.cooldown-dt);w.dive=Math.max(0,w.dive-dt);
 if(w.mode==='climb'){
  w.velocity-=6*dt;w.height=clamp(w.height+w.velocity*dt,0,WATERFALL.height);const p=waterfallPoint(w.height);s.player={x:p.x,z:p.z};
  if(w.height>=WATERFALL.height){w.mode='summit';w.summitAt=w.seconds;w.velocity=0;s.heading=0;s.player={...WATERFALL.crest};s.message='You reached the magical mountain pool! Tap the waterfall, press Space, or choose Slide down to ride it back to the bottom.';}
  else if(w.height<=0){w.mode='swim';w.velocity=0;s.message='Splash! Back in the pool. Keep tapping faster or press Space repeatedly to reach the top.';}
  return;
 }
 if(w.mode==='slide'){
  w.slideTime+=dt;const t=clamp((w.slideTime-.35)/3,0,1);w.height=w.slideFrom*(1-t*t);const p=waterfallPoint(w.height);const approach=clamp(w.slideTime/.35,0,1);s.player={x:w.slideStart.x+(p.x-w.slideStart.x)*approach,z:w.slideStart.z+(p.z-w.slideStart.z)*approach};
  if(t===1){w.mode='swim';w.height=0;w.dive=.8;s.player={x:WATERFALL.x,z:WATERFALL.base.z+1.2};s.message='Splashdown! Swim through the hoops, climb again, or head back to shore.';}
  return;
 }
 const dx=clamp(input.x||0,-1,1),dz=clamp(input.z||0,-1,1),length=Math.max(1,Math.hypot(dx,dz)),old={...s.player},next={x:old.x+dx/length*dt*3.2,z:old.z+dz/length*dt*3.2};
 if(w.mode==='swim')next.z=old.z< -61?Math.min(-61,old.z+dt*4):Math.max(-61,next.z);
 if(w.mode==='summit'){const dx=next.x-WATERFALL.x,dz=next.z+76,r=Math.max(1,Math.hypot(dx,dz)/3.7);s.player={x:WATERFALL.x+dx/r,z:-76+dz/r};if(next.z> -72.25)slideNurseryWaterfall(s);return;}
 if(nurseryWaterCliffBlocked(next.x,next.z)){s.message='Press Space or tap repeatedly to jump up the waterfall.';return;}
 if(!inNurseryWater(next.x,next.z)){s.player=next;leaveNurserySwimming(s,false);return;}
 s.player=next;const ring=SWIM_HOOPS[s.swimRings||0];if(ring&&segmentDistance(ring,old,next)<1.05){s.swimRings=(s.swimRings||0)+1;s.routeOrigin={...s.player};s.message='Swimming hoop '+s.swimRings+'/'+SWIM_HOOPS.length+'!';
  if(s.swimRings===SWIM_HOOPS.length&&!s.care.includes('swim')){s.care.push('swim');s.bond+=2;s.energy=Math.max(0,s.energy-10);if(s.routeTask==='swim'){s.routeActive=false;s.routeTask=null;}s.message='Swimming quest complete! Your golden trail is gone. You can still climb and slide down the waterfall.';}
 }
}
export function nurserySwimStatus(s){const w=s.swimming;if(!w)return '';const base='Swimming quest · '+(s.swimRings||0)+'/'+SWIM_HOOPS.length+' hoops';return w.mode==='climb'?base+' · Climbing '+Math.floor(w.height)+'/'+WATERFALL.height+' m · Space / tap repeatedly':w.mode==='summit'?'Mountain pool · Tap the waterfall or Slide down':w.mode==='slide'?'Waterfall slide! · Splashdown ahead':base+' · Swipe to swim · Space / tap to jump · Swim to the falls to climb';}
