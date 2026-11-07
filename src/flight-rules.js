import {FLIGHT_LEVELS,FLIGHT_DEFAULTS,validateFlightSettings} from './flight-settings.js';
export const FLIGHT_WIDTH=540, FLIGHT_HEIGHT=720, FLIGHT_FLOOR=680;
export function createFlightState(settings=FLIGHT_DEFAULTS,random=Math.random){
  const config=validateFlightSettings(settings);
  const state={settings:config,level:FLIGHT_LEVELS[config.difficulty],x:150,y:330,velocity:0,radius:16,pipes:[],passed:0,earned:0,time:0,distance:0,status:'ready',crashTime:0,random};
  addPipe(state,680);addPipe(state,980);addPipe(state,1280);return state;
}
function addPipe(s,x){
  const previous=s.pipes.at(-1),margin=s.level.gap/2+65;
  let center=margin+s.random()*(FLIGHT_FLOOR-2*margin);
  if(previous)center=Math.max(previous.center-105,Math.min(previous.center+105,center));
  s.pipes.push({x,width:70,center,scored:false});
}
export function flapFlight(s){if(s.status==='playing')s.velocity=-340;}
function circleRect(x,y,r,left,top,width,height){
  const nearX=Math.max(left,Math.min(x,left+width)),nearY=Math.max(top,Math.min(y,top+height));
  return (x-nearX)**2+(y-nearY)**2<=r*r;
}
export function tickFlight(s,dt,onPass=()=>{}){
  if(s.status!=='playing')return;
  let remaining=Math.max(0,Math.min(dt,.1));
  while(remaining>1e-7&&s.status==='playing'){
    const step=Math.min(remaining,1/120);remaining-=step;s.time+=step;s.distance+=s.level.speed*step;s.velocity+=1000*step;s.y+=s.velocity*step;
    for(const pipe of s.pipes)pipe.x-=s.level.speed*step;
    if(s.y-s.radius<=0||s.y+s.radius>=FLIGHT_FLOOR){s.status='lost';break;}
    for(const pipe of s.pipes){
      const upper=pipe.center-s.level.gap/2,lower=pipe.center+s.level.gap/2;
      if(circleRect(s.x,s.y,s.radius,pipe.x-7,0,pipe.width+14,upper)||circleRect(s.x,s.y,s.radius,pipe.x-7,lower,pipe.width+14,FLIGHT_FLOOR-lower)){s.status='lost';break;}
      if(!pipe.scored&&pipe.x+pipe.width+7<s.x-s.radius){pipe.scored=true;s.passed++;s.earned=s.passed*s.level.reward;onPass(s.level.reward);}
    }
    if(s.pipes[0]?.x< -100){s.pipes.shift();addPipe(s,s.pipes.at(-1).x+300);}
  }
}
