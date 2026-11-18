// Ground footprints, shared by keyboard movement, touch movement and tap navigation.
export function createNurseryCollisions(){
 const shapes=[],cells=new Map(),cellSize=4;
 const bounds=inside=>inside?{left:-5,right:5,back:-4,front:4}:{left:-30,right:30,back:-255,front:16};
 const key=(x,z,inside)=>`${inside?1:0}:${x}:${z}`;
 function add(shape){const s={inside:false,...shape};s.rx=s.rx??s.radius;s.rz=s.rz??s.radius;
  const left=s.left??s.x-s.rx,right=s.right??s.x+s.rx,back=s.back??s.z-s.rz,front=s.front??s.z+s.rz;
  Object.assign(s,{left,right,back,front});shapes.push(s);
  for(let x=Math.floor(left/cellSize);x<=Math.floor(right/cellSize);x++)for(let z=Math.floor(back/cellSize);z<=Math.floor(front/cellSize);z++){const k=key(x,z,s.inside);if(!cells.has(k))cells.set(k,[]);cells.get(k).push(s);}return s;
 }
 function blocked(p,inside=false,radius=.28){const b=bounds(inside);if(p.x<b.left||p.x>b.right||p.z<b.back||p.z>b.front)return true;const nearby=new Set();
  for(let x=Math.floor((p.x-radius)/cellSize);x<=Math.floor((p.x+radius)/cellSize);x++)for(let z=Math.floor((p.z-radius)/cellSize);z<=Math.floor((p.z+radius)/cellSize);z++)for(const s of cells.get(key(x,z,inside))||[])nearby.add(s);
  for(const s of nearby){if(s.rx!==undefined){if(((p.x-s.x)/(s.rx+radius))**2+((p.z-s.z)/(s.rz+radius))**2<1)return true;}
   else{const dx=Math.max(s.left-p.x,0,p.x-s.right),dz=Math.max(s.back-p.z,0,p.z-s.front);if(dx*dx+dz*dz<radius*radius)return true;}}
  return false;
 }
 function nearestOpen(p,inside=false,radius=.28){if(!blocked(p,inside,radius))return {...p};for(let d=.1;d<=4;d+=.1)for(let i=0;i<48;i++){const a=i*Math.PI/24,q={x:p.x+Math.cos(a)*d,z:p.z+Math.sin(a)*d};if(!blocked(q,inside,radius))return q;}return null;}
 function clear(a,b,inside=false,radius=.28){const count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.12));for(let i=0;i<=count;i++)if(blocked({x:a.x+(b.x-a.x)*i/count,z:a.z+(b.z-a.z)*i/count},inside,radius))return false;return true;}
 function move(from,delta,inside=false,radius=.28){const p=nearestOpen(from,inside,radius)||{...from},n=Math.max(1,Math.ceil(Math.hypot(delta.x,delta.z)/.08)),dx=delta.x/n,dz=delta.z/n,b=bounds(inside);
  for(let i=0;i<n;i++){const x=Math.max(b.left,Math.min(b.right,p.x+dx)),z=Math.max(b.back,Math.min(b.front,p.z+dz));if(!blocked({x,z},inside,radius)){p.x=x;p.z=z;}else{if(!blocked({x,z:p.z},inside,radius))p.x=x;if(!blocked({x:p.x,z},inside,radius))p.z=z;}}return p;
 }
 function path(from,to,inside=false,radius=.28){const end=nearestOpen(to,inside,radius),start=nearestOpen(from,inside,radius);if(!end||!start)return null;if(clear(start,end,inside,radius))return [end];
  // A small grid search runs only when a new destination is chosen, never per frame.
  const step=.5,open=[{x:0,z:0,p:start,g:0,f:0,parent:null}],seen=new Map([['0:0',0]]);let finish=null;
  for(let count=0;open.length&&count<10000;count++){let best=0;for(let i=1;i<open.length;i++)if(open[i].f<open[best].f)best=i;const node=open.splice(best,1)[0];
   if(Math.hypot(node.p.x-end.x,node.p.z-end.z)<1.5&&clear(node.p,end,inside,radius)){finish=node;break;}
   for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const x=node.x+dx,z=node.z+dz,k=`${x}:${z}`,p={x:start.x+x*step,z:start.z+z*step},g=node.g+Math.hypot(dx,dz)*step;if(g>Math.hypot(end.x-start.x,end.z-start.z)+35||g>=(seen.get(k)??Infinity)||!clear(node.p,p,inside,radius))continue;seen.set(k,g);open.push({x,z,p,g,f:g+Math.hypot(p.x-end.x,p.z-end.z),parent:node});}
  }
  if(!finish)return null;const raw=[end];for(let n=finish;n;n=n.parent)raw.unshift(n.p);const result=[];let at=0;while(at<raw.length-1){let next=raw.length-1;while(next>at+1&&!clear(raw[at],raw[next],inside,radius))next--;result.push(raw[next]);at=next;}return result;
 }
 return {add,blocked,move,path,clear,nearestOpen,all:inside=>shapes.filter(s=>s.inside===!!inside)};
}
export function routeNurseryGoal(collisions,from,goal,inside){if(!goal||goal.navResolved)return goal;const points=collisions.path(from,goal,inside,.36);if(!points)return null;return points.reduceRight((next,p,i)=>({...p,navResolved:true,...(i===points.length-1?{action:goal.action,next:goal.next}:{next})}),null);}
