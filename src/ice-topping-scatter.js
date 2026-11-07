import {ICE_SYRUPS} from './ice-settings.js';
import {drawIceIngredient} from './ice-art.js';
const garnish=new Set(['cream','redVelvetWhip','cherry','waferRolls']);
const fine=new Set(['sprinkles','pinkSprinkles','chocolateSprinkles','pearlSprinkles','cookieCrumbs']);
// Stable seeded sampling avoids rows, diagonal sequences, and moving toppings on redraw.
export function iceToppingScatter(ids,surfaces=[{x:0,y:-34,rx:49,ry:34}]){
 const points=[];
 for(const id of [...new Set(ids)]){
  if(ICE_SYRUPS[id]||garnish.has(id)||!surfaces.length)continue;
  let seed=2166136261;for(const ch of id)seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const count=fine.has(id)?10:id==='orangeSlice'?2:5,size=fine.has(id)?16:id==='orangeSlice'?30:27,placed=[];
  for(let i=0;i<count;i++){
   let candidate,best=-1;
   // Pick the most separated of several random surface points to spread the pieces evenly.
   for(let attempt=0;attempt<48;attempt++){
    const surface=surfaces[(i+Math.floor(attempt/16))%surfaces.length],angle=random()*Math.PI*2,radius=Math.sqrt(random()),x=surface.x+Math.cos(angle)*radius*surface.rx,y=surface.y+Math.sin(angle)*radius*surface.ry;
    const gap=placed.length?Math.min(...placed.map(p=>Math.hypot(p.x-x,p.y-y))):1;
    if(gap>best){best=gap;candidate={id,x,y,size:size*(.9+random()*.2),angle:(random()-.5)*.65};}
   }
   placed.push(candidate);points.push(candidate);
  }
 }
 return points.sort((a,b)=>a.y-b.y);
}
export function drawIceToppingScatter(c,ids,surfaces){
 for(const p of iceToppingScatter(ids,surfaces)){
  c.save();c.translate(p.x,p.y);c.rotate(p.angle);
  if(!drawIceIngredient(c,'toppings',p.id,-p.size/2,-p.size/2,p.size,p.size)){c.fillStyle='#b78a67';c.beginPath();c.ellipse(0,0,p.size*.24,p.size*.18,0,0,Math.PI*2);c.fill();}
  c.restore();
 }
}
