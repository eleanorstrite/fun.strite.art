const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const TAG_3D_BOUNDS={minX:-53,maxX:48,minZ:-45,maxZ:43};
export const TAG_3D_DECKS=[
 {id:'racer',x:-26,z:-13,w:13,d:8,y:6,color:'#f3bf38',name:'Rainbow racer slides'},
 {id:'forest-low',x:22,z:-22,r:3.7,y:4,color:'#279fb2',name:'Forest tower'},
 {id:'forest-high',x:31,z:-22,r:3.7,y:7.8,color:'#258fad',name:'Sky bridge'},
 {id:'forest-top',x:31,z:-31,r:3.7,y:10.5,color:'#2389a2',name:'Treetop lookout'},
 {id:'softplay',x:28,z:17,w:13,d:7,y:4,color:'#ef62a6',name:'Soft-play slide deck'},
];
export const TAG_3D_FLOATS=[[-27,16],[-27,22],[-36,22],[-36,30],[-27,30],[-18,30],[-18,22],[-12,22]].map(([x,z],i)=>({id:'float-'+i,x,z,w:4,d:4,y:1,color:i%2?'#e8cc35':'#35bf94',name:'Floating obstacle'}));
export const TAG_3D_RAMPS=[
 {id:'sky-bridge',a:{x:24.5,y:4,z:-22},b:{x:28.5,y:7.8,z:-22},width:2.7,kind:'net'},
 {id:'canopy-bridge',a:{x:31,y:7.8,z:-24.5},b:{x:31,y:10.5,z:-28.5},width:2.7,kind:'net'},
 {id:'soft-stairs',a:{x:22,y:0,z:27},b:{x:22,y:4,z:17},width:2.7,kind:'stairs'},
 {id:'float-entry',a:{x:-27,y:0,z:11},b:{x:-27,y:1,z:16},width:3,kind:'float'},
 ...[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[1,6]].map(([a,b],i)=>({id:'float-bridge-'+i,a:{...TAG_3D_FLOATS[a]},b:{...TAG_3D_FLOATS[b]},width:1.65,kind:'float'})),
];
export const TAG_3D_LADDERS=[
 {id:'racer-ladder',name:'Racer ladder',a:{x:-26,y:0,z:-18.4},b:{x:-26,y:6,z:-16.1}},
 {id:'forest-ladder',name:'Forest ladder',a:{x:22,y:0,z:-17.3},b:{x:22,y:4,z:-20}},
 {id:'net-wall',name:'Climbing net',a:{x:18.5,y:0,z:-23},b:{x:20.4,y:4,z:-23}},
];
export const TAG_3D_SLIDES=[
 ...[-30,-26,-22].map((x,i)=>({id:'racer-'+i,name:['Blue racer','Golden racer','Blue racer'][i],color:i===1?'#f5c639':'#238dd4',speed:11,points:[{x,y:6,z:-9},{x,y:5.4,z:-5},{x,y:2,z:3},{x,y:.15,z:12}]})),
 {id:'forest-spiral',name:'Forest spiral slide',color:'#188fc4',speed:8,points:[{x:20,y:4,z:-22},{x:17,y:3.8,z:-24},{x:15,y:3,z:-21},{x:17,y:2,z:-17},{x:20,y:1,z:-15},{x:18,y:.15,z:-10}]},
 {id:'treetop-slide',name:'Treetop super slide',color:'#ee7138',speed:12,points:[{x:33,y:10.5,z:-30},{x:38,y:10,z:-27},{x:39,y:6,z:-19},{x:36,y:2,z:-12},{x:36,y:.15,z:-5}]},
 ...[27,30,33].map((x,i)=>({id:'soft-slide-'+i,name:'Ball-pit slide',color:['#4dd071','#f3ce39','#2fc3ad'][i],speed:8,points:[{x,y:4,z:20},{x,y:3.7,z:23},{x,y:1,z:29},{x,y:.25,z:34}]})),
];
export const TAG_3D_ZONES=[
 {id:'dash',name:'Rainbow speed strip',x:-7,z:-12,w:10,d:4,speed:1.55,cue:'whoosh'},
 {id:'mud',name:'Squishy mud slows you down',x:4,z:7,w:8,d:7,speed:.48,cue:'pumpkinScoop'},
 {id:'balls',name:'Ball pit: wade and bounce',x:29,z:31,w:19,d:17,speed:.55,cue:'bounce'},
 ...[-4,-2,0,2,4].map((x,i)=>({id:'music-'+i,name:'Musical stepping keys ♪',x,z:-3,w:1.8,d:4,speed:1,cue:['gem','bell','sword','gem','bell'][i]})),
];
export const TAG_3D_SWING={id:'basket-swing',x:0,z:22,height:5};
export const TAG_3D_TRAMPOLINE={x:-4,z:-30,r:2.6};
export function tag3DWater(x,z){return x> -48&&x< -6&&z>12&&z<39;}
export function tag3DPoint(path,t){const points=path.points,times=points.map((p,i)=>i?Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y,p.z-points[i-1].z):0),length=times.reduce((a,b)=>a+b,0);let at=clamp(t,0,1)*length;for(let i=1;i<points.length;i++){if(at<=times[i]||i===points.length-1){const f=times[i]?clamp(at/times[i],0,1):0,a=points[i-1],b=points[i];const before=points[Math.max(0,i-2)],after=points[Math.min(points.length-1,i+1)],out={};for(const key of ['x','y','z'])out[key]=.5*((2*a[key])+(-before[key]+b[key])*f+(2*before[key]-5*a[key]+4*b[key]-after[key])*f*f+(-before[key]+3*a[key]-3*b[key]+after[key])*f*f*f);out.y=Math.max(.12,out.y);return out;}at-=times[i];}return {...points.at(-1)};}
export function tag3DPathLength(path){return path.points.reduce((sum,p,i,a)=>sum+(i?Math.hypot(p.x-a[i-1].x,p.y-a[i-1].y,p.z-a[i-1].z):0),0);}
export function tag3DRampPoint(ramp,x,z){const dx=ramp.b.x-ramp.a.x,dz=ramp.b.z-ramp.a.z,length=dx*dx+dz*dz,t=length?((x-ramp.a.x)*dx+(z-ramp.a.z)*dz)/length:0;if(t<-.04||t>1.04)return null;const u=clamp(t,0,1),near=Math.hypot(x-ramp.a.x-u*dx,z-ramp.a.z-u*dz);return near<=ramp.width/2?ramp.a.y+(ramp.b.y-ramp.a.y)*u:null;}
export function tag3DFloor(x,z,maxY=Infinity){let floor=tag3DWater(x,z)?-.25:0;for(const deck of [...TAG_3D_DECKS,...TAG_3D_FLOATS]){const inside=deck.r?Math.hypot(x-deck.x,z-deck.z)<=deck.r:Math.abs(x-deck.x)<=deck.w/2&&Math.abs(z-deck.z)<=deck.d/2;if(inside&&deck.y<=maxY)floor=Math.max(floor,deck.y);}for(const ramp of TAG_3D_RAMPS){const y=tag3DRampPoint(ramp,x,z);if(y!==null&&y<=maxY)floor=Math.max(floor,y);}return floor;}
export function tag3DFeature(p){if(p.y>.5)return null;return TAG_3D_ZONES.find(f=>Math.abs(p.x-f.x)<f.w/2&&Math.abs(p.z-f.z)<f.d/2)|| (tag3DWater(p.x,p.z)?{id:'water',name:'Water slows your steps',speed:.5,cue:'gulp'}:null);}
export function tag3DNearby(p){const ladder=TAG_3D_LADDERS.find(l=>Math.hypot(p.x-l.a.x,p.z-l.a.z)<1.6&&Math.abs(p.y-l.a.y)<.7||Math.hypot(p.x-l.b.x,p.z-l.b.z)<1.6&&Math.abs(p.y-l.b.y)<.7);if(ladder)return {type:'climb',feature:ladder,label:'Climb '+ladder.name};if(Math.hypot(p.x-TAG_3D_SWING.x,p.z-TAG_3D_SWING.z)<2.4&&p.y<1)return {type:'swing',feature:TAG_3D_SWING,label:'Ride basket swing'};return null;}
export function tag3DAccessPath(target){
 if(target.y>1.5&&target.x< -10&&target.z<5)return [TAG_3D_LADDERS[0].a,TAG_3D_LADDERS[0].b];
 if(target.y>1.5&&target.x>10&&target.z< -10){const path=[TAG_3D_LADDERS[1].a,TAG_3D_LADDERS[1].b];if(target.y>5)path.push(TAG_3D_RAMPS[0].a,TAG_3D_RAMPS[0].b,{x:31,y:7.8,z:-22});if(target.y>8.5)path.push(TAG_3D_RAMPS[1].a,TAG_3D_RAMPS[1].b);return path;}
 if(target.y>1.5&&target.z>10)return [TAG_3D_RAMPS[2].a,TAG_3D_RAMPS[2].b];return [];
}
