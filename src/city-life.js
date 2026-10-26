export const cityBedReaction=(theme,resting)=>theme&&resting?.pose==='lie'?(theme==='dog'?'dog':theme==='cat'?'cat':'owner'):null;
export function citySip(time,phase=0){
  const t=((time+phase)%7+7)%7,smooth=x=>x*x*(3-2*x);
  return t<1.5?0:t<2.5?smooth(t-1.5):t<4?1:t<5?1-smooth(t-4):0;
}
export function cityRoomClear(p,obstacles,radius=.24){return Math.abs(p.x)<6.5&&p.z> -5.5&&p.z<5.3&&!obstacles.some(o=>!o.actor&&Math.abs(p.x-o.x)<o.w/2+radius&&Math.abs(p.z-o.z)<o.d/2+radius);}
// A small room navigation grid keeps walkers and pets out of furniture.
export function cityRoomRoute(from,to,obstacles,radius=.24){
  const step=.4,nx=33,nz=28,point=i=>({x:-6.4+(i%nx)*step,z:-5.4+Math.floor(i/nx)*step});
  const nearest=p=>{let best=-1,distance=Infinity;for(let i=0;i<nx*nz;i++){const q=point(i),d=Math.hypot(q.x-p.x,q.z-p.z);if(d<distance&&cityRoomClear(q,obstacles,radius)){best=i;distance=d;}}return best;};
  const start=nearest(from),end=nearest(to);if(start<0||end<0||!cityRoomClear(to,obstacles,radius))return [];
  const previous=new Int32Array(nx*nz).fill(-1),queue=[start];previous[start]=start;
  for(let head=0;head<queue.length&&previous[end]===-1;head++){const at=queue[head],x=at%nx,z=Math.floor(at/nx);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,zz=z+dz,next=zz*nx+xx;if(xx<0||zz<0||xx>=nx||zz>=nz||previous[next]!==-1||!cityRoomClear(point(next),obstacles,radius))continue;previous[next]=at;queue.push(next);}}
  if(previous[end]===-1)return [];const route=[to];for(let i=end;i!==start;i=previous[i])route.push(point(i));route.push(point(start));return route.reverse();
}
export function cityAdvanceWalker(walker,dt,obstacles,blockers=[],speed=1){
  walker.moving=false;if(!walker.path?.length)return false;
  let budget=speed*dt;
  while(budget>0&&walker.path.length){const target=walker.path[0],dx=target.x-walker.x,dz=target.z-walker.z,d=Math.hypot(dx,dz);if(d<.015){walker.path.shift();continue;}
    const amount=Math.min(budget,d),p={x:walker.x+dx/d*amount,z:walker.z+dz/d*amount};
    if(!cityRoomClear(p,obstacles,walker.radius??.24)||blockers.some(b=>Math.hypot(b.x-p.x,b.z-p.z)<(b.radius??.45))){
      walker.stuckTime=(walker.stuckTime??0)+dt;
      if(walker.stuckTime>1){const route=cityRoomRoute(walker,walker.path.at(-1),[...obstacles,...blockers.map(b=>({x:b.x,z:b.z,w:.7,d:.7}))],walker.radius??.24);if(route.length)walker.path=route;walker.stuckTime=0;}
      return false;
    }
    walker.stuckTime=0;
    walker.x=p.x;walker.z=p.z;walker.angle=Math.atan2(dx,dz);walker.moving=true;budget-=amount;if(amount===d)walker.path.shift();
  }
  return !walker.path.length;
}
export function createCityRoamer(seed=1){return {x:.25,z:0,angle:0,path:[],wait:1,seed:Math.floor(seed*997)+1,radius:.3,moving:false};}
export function cityRoam(walker,dt,obstacles,blockers=[]){
  if(dt<=0)return;
  if(walker.wait>0){walker.wait-=dt;walker.moving=false;return;}
  if(walker.path.length){const oldX=walker.x,oldZ=walker.z;cityAdvanceWalker(walker,dt,obstacles,blockers,.85);walker.blocked=Math.hypot(walker.x-oldX,walker.z-oldZ)<.001?(walker.blocked??0)+dt:0;if(walker.blocked>2){walker.path=[];walker.wait=.5;}return;}
  const random=()=>{walker.seed=(Math.imul(walker.seed,1664525)+1013904223)>>>0;return walker.seed/4294967296;};
  for(let i=0;i<50;i++){const target={x:-5.5+random()*11,z:-4.5+random()*8.5};if(Math.hypot(target.x-walker.x,target.z-walker.z)<2.5||!cityRoomClear(target,obstacles,.3))continue;const route=cityRoomRoute(walker,target,obstacles,.3);if(route.length){walker.path=route;walker.wait=.8+random()*2.5;break;}}
}
export function createCityRoutine(kind,origin,phase=0){return {...origin,origin:{...origin},kind,stage:'seated',clock:phase%4,path:[],angle:origin.angle||0,moving:false,radius:.24};}
export function cityTickRoutine(actor,dt,obstacles,blockers=[],seatTaken=false){
  if(dt<=0)return;
  actor.clock+=dt;actor.moving=false;if(actor.stage==='seated'&&actor.clock>5)actor.hasSnack=false;
  const go=(stage,target)=>{actor.path=cityRoomRoute(actor,target,obstacles);if(actor.path.length){actor.stage=stage;actor.clock=0;return true;}return false;};
  if(actor.stage==='seated'&&actor.clock>9){
    if(actor.kind==='laptop'){actor.stage='typing';actor.clock=0;return;}
    const candidates=[{x:actor.origin.x+.85,z:actor.origin.z},{x:actor.origin.x-.85,z:actor.origin.z},{x:actor.origin.x,z:actor.origin.z+.98},{x:actor.origin.x,z:actor.origin.z-.98}];
    actor.egress=candidates.find(p=>cityRoomClear(p,obstacles)&&!blockers.some(b=>Math.hypot(p.x-b.x,p.z-b.z)<.5));if(!actor.egress)return;
    actor.stage='standing';actor.clock=0;
  }else if(actor.stage==='typing'&&actor.clock>14){actor.stage='seated';actor.clock=0;}
  else if(actor.stage==='standing'){
    const u=Math.min(1,actor.clock/.8);actor.x=actor.origin.x+(actor.egress.x-actor.origin.x)*u;actor.z=actor.origin.z+(actor.egress.z-actor.origin.z)*u;
    if(u===1)go('outbound',actor.kind==='home'?{x:4,z:-.3}:{x:0,z:5.1});
  }else if(actor.stage==='outbound'){
    if(cityAdvanceWalker(actor,dt,obstacles,blockers,1.05)){actor.stage=actor.kind==='home'?'fridge':'away';actor.clock=0;}
  }else if((actor.stage==='fridge'&&actor.clock>3)||(actor.stage==='away'&&actor.clock>7)){if(actor.stage==='fridge')actor.hasSnack=true;go('returning',actor.egress);}
  else if(actor.stage==='returning'){
    if(cityAdvanceWalker(actor,dt,obstacles,blockers,1.05)){actor.stage='waiting';actor.clock=0;}
  }else if(actor.stage==='waiting'&&!seatTaken){actor.stage='sitting';actor.clock=0;}
  else if(actor.stage==='sitting'){
    if(seatTaken){actor.stage='waiting';actor.clock=0;return;}
    const u=Math.min(1,actor.clock/.8);actor.x=actor.egress.x+(actor.origin.x-actor.egress.x)*u;actor.z=actor.egress.z+(actor.origin.z-actor.egress.z)*u;
    if(u===1){actor.stage='seated';actor.clock=0;actor.angle=actor.origin.angle;}
  }
}
