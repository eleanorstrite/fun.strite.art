import test from 'node:test';
import assert from 'node:assert/strict';
import {iceToppingScatter,drawIceToppingScatter} from '../src/ice-topping-scatter.js';
import {ICE_TOPPINGS,ICE_SYRUPS} from '../src/ice-settings.js';
import {ICE_ART} from '../src/ice-art-bounds.js';
test('loose toppings cover the scoop without rows, clumps, or changes between redraws',()=>{
 for(const id of Object.keys(ICE_TOPPINGS).filter(id=>!ICE_SYRUPS[id]&&!['cream','redVelvetWhip','cherry','waferRolls','orangeSlice'].includes(id))){
  const points=iceToppingScatter([id]);assert.ok(points.length>=5,id);assert.deepEqual(points,iceToppingScatter([id]));
  assert.ok(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x))>55,id);assert.ok(Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y))>35,id);
  for(const p of points){assert.ok((p.x/49)**2+((p.y+34)/34)**2<=1.0001);for(const q of points)if(p!==q)assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>14,id);}
  const mean=points.reduce((a,p)=>({x:a.x+p.x/points.length,y:a.y+p.y/points.length}),{x:0,y:0});const xy=points.reduce((a,p)=>a+(p.x-mean.x)*(p.y-mean.y),0),xx=points.reduce((a,p)=>a+(p.x-mean.x)**2,0),yy=points.reduce((a,p)=>a+(p.y-mean.y)**2,0);assert.ok(Math.abs(xy/Math.sqrt(xx*yy))<.8,id);
 }
});
test('bowl toppings cover every chosen scoop and omit syrup and centered garnishes',()=>{
 const surfaces=[{x:-65,y:-64,rx:47,ry:30},{x:0,y:-92,rx:47,ry:30},{x:65,y:-64,rx:47,ry:30}],points=iceToppingScatter(['oreo','banana','sauce','cream','cherry'],surfaces);assert.ok(points.every(p=>['oreo','banana'].includes(p.id)));for(const id of ['oreo','banana']){const group=points.filter(p=>p.id===id);assert.ok(group.some(p=>p.x< -40));assert.ok(group.some(p=>p.x>40));}assert.deepEqual(iceToppingScatter(['oreo']),iceToppingScatter(['oreo','sauce']));
});
test('scattered toppings draw the exact source artwork used by the chooser',t=>{
 const old=globalThis.Image;t.after(()=>globalThis.Image=old);globalThis.Image=class{complete=true;naturalWidth=ICE_ART.toppings.width;set src(v){this.url=v;}};
 const draws=[],c=new Proxy({drawImage:(...a)=>draws.push(a)},{get:(o,k)=>o[k]||(()=>{})});
 for(const id of ['oreo','banana','stars','berries','marshmallows','sprinkles']){draws.length=0;drawIceToppingScatter(c,[id]);assert.ok(draws.length>0);const b=ICE_ART.toppings.bounds[ICE_ART.toppings.ids.indexOf(id)];for(const a of draws)assert.deepEqual(a.slice(1,5),[b.x,b.y,b.w,b.h]);}
});
