import { createMazeAudio } from './maze-audio.js';

import { ICE_CONES, ICE_FLAVORS, ICE_TOPPINGS, ICE_UNLOCKS, iceIngredientUnlocked } from './ice-settings.js';

export const ICE_CLIP_SECONDS=7.5;
const syrupKind=p=>p.kind||'sauce';
const hasSyrup=r=>r.toppings.some(t=>t==='sauce'||t==='caramel');
const syrupColor=p=>syrupKind(p)==='caramel'?'#c38532':'#633c32';
const syrupShine=p=>syrupKind(p)==='caramel'?'#f6ce78':'#a46b48';
export function createIceRecipe(){return {funny:false,cone:'waffle',flavor:'vanilla',toppings:[],sauceDrops:[]};}
export function pourIceChocolate(recipe,x,y,seconds,kind="sauce"){
  if(!['sauce','caramel'].includes(kind)||!recipe.toppings.includes(kind)||!Number.isFinite(seconds)||seconds<=0||!Number.isFinite(x)||!Number.isFinite(y))return;
  if(Math.abs(x)>240||y< -90||y>162)return;
  if((x/66)**2+((y+30)/58)**2>1){
    recipe.sauceFalling??=[];
    const top=Math.abs(x)<66?-30-58*Math.sqrt(1-(x/66)**2):null;
    const landing=top!==null&&y<top?top+.25:null;
    const nearby=recipe.sauceFalling.find(p=>syrupKind(p)===kind&&p.direct&&Math.abs(p.x-x)<3&&Math.abs(p.y-y)<5);
    if(nearby)nearby.volume+=seconds;
    else recipe.sauceFalling.push({kind,x,y,vy:18,volume:seconds,direct:true,landing});
    return;
  }
  recipe.sauceDrops??=[];
  const gx=Math.round(x/4)*4,gy=Math.round(y/4)*4;
  let drop=recipe.sauceDrops.find(p=>syrupKind(p)===kind&&p.x===gx&&p.y===gy);
  if(!drop){drop={kind,x:gx,y:gy,amount:0};recipe.sauceDrops.push(drop);}
  drop.amount=Math.min(3,drop.amount+seconds);
}
// Both syrups cling to the dessert, follow its taper, then fall under gravity.
function coneBottom(cone){return cone==='waffle'?156:cone==='cup'?100:cone==='cake'?118:120;}
function coneWidth(cone,y){
  if(cone==='cup')return 63-16*Math.min(1,(y-5)/95);
  if(cone==='cake')return y<38?50-(y-5)*.42:36-(y-38)*.13;
  const bottom=coneBottom(cone),rim=cone==='waffle'?67.26:50.16;
  return rim*Math.max(0,(bottom-y)/(bottom-5));
}
function chocolateSurfaceX(recipe,x,y){
  if(y<=20)return x;
  return x*coneWidth(recipe.cone,y)/coneWidth(recipe.cone,20);
}
export function tickIceChocolate(recipe,seconds){
  if(!hasSyrup(recipe)||!Number.isFinite(seconds)||seconds<=0)return;
  recipe.sauceFalling??=[];recipe.saucePuddles??=[];
  // Small steps keep gravity and surface flow stable at different frame rates.
  for(let remaining=Math.min(seconds,1);remaining>0;){
    const dt=Math.min(remaining,1/60);remaining-=dt;
    const end=coneBottom(recipe.cone);
    for(const drop of recipe.sauceDrops||[]){
      // New syrup stays mostly on the scoop. Existing trails never restart,
      // even when more syrup is poured onto the same spot.
      drop.age=Math.min(6,(drop.age||0)+dt);
      if(drop.age>=6)continue;
      if(drop.flowY===undefined){
        const runs=(recipe.sauceDrops||[]).filter(p=>p.flowY!==undefined);
        if(drop.amount<.18||runs.length>=2||runs.some(p=>Math.abs(p.x-drop.x)<16))continue;
        drop.flowY=drop.y;drop.flowSpeed=26+Math.min(3,drop.amount)*20;
      }
      // Viscous drag and setting steadily reduce the speed to zero.
      const speed=drop.flowSpeed*Math.exp(-.45*drop.age)*(1-drop.age/6);
      const drained=Math.min(Math.max(0,drop.amount-.15),dt*.035*(1-drop.age/6));
      drop.amount-=drained;drop.flowVolume=(drop.flowVolume||0)+drained;
      drop.flowY=Math.min(end,drop.flowY+dt*speed);
      if(drop.flowY>=end&&!drop.detached&&drop.flowVolume>=.06){
        recipe.sauceFalling.push({kind:syrupKind(drop),x:chocolateSurfaceX(recipe,drop.x,end),y:end,vy:4,volume:.06});
        drop.flowVolume-=.06;drop.detached=true;
      }
    }
    for(const drop of recipe.sauceFalling){
      drop.vy+=dt*240;drop.y+=drop.vy*dt;
      if(drop.landing!=null&&drop.y>=drop.landing){
        pourIceChocolate(recipe,drop.x,drop.landing,drop.volume,syrupKind(drop));drop.landed=true;
      }else if(drop.y>=162){
        const x=Math.round(drop.x/4)*4;
        let puddle=recipe.saucePuddles.find(p=>p.x===x&&syrupKind(p)===syrupKind(drop));
        if(!puddle){puddle={kind:syrupKind(drop),x,volume:0};recipe.saucePuddles.push(puddle);}
        puddle.volume=Math.min(30,puddle.volume+drop.volume);
      }
    }
    recipe.sauceFalling=recipe.sauceFalling.filter(drop=>drop.y<162&&!drop.landed);
  }
}
function drawChocolateSpill(ctx,recipe,showFalling=true){
  if(!hasSyrup(recipe))return;
  for(const p of recipe.saucePuddles||[]){
    const radius=4+Math.sqrt(p.volume)*15;
    iceOval(ctx,p.x,162,radius,3+radius*.13,syrupColor(p));
    iceOval(ctx,p.x-2,160,radius*.65,1.5,syrupShine(p));
  }
  for(const p of showFalling?recipe.sauceFalling||[]:[]){
    iceOval(ctx,p.x,p.y,3,4+Math.min(4,p.vy/30),syrupColor(p));
    iceOval(ctx,p.x-1,p.y-1,.8,2,syrupShine(p));
  }
}
export function drawChocolateBottle(ctx,bottle,pouring=false,kind="sauce"){
  const caramel=kind==='caramel';
  ctx.save();ctx.translate(450+bottle.x*1.15,307+bottle.y*1.15-85);
  if(pouring){
    ctx.strokeStyle=syrupColor({kind});ctx.lineWidth=5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(0,35);ctx.lineTo(0,85);ctx.stroke();
  }
  ctx.fillStyle=caramel?'#d6a04c':'#7d4a32';ctx.strokeStyle='#422e2b';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(-22,-42,44,62,12);ctx.fill();ctx.stroke();
  ctx.fillStyle=caramel?'#f5d38b':'#b67b51';ctx.beginPath();ctx.roundRect(-16,-35,6,42,3);ctx.fill();
  ctx.fillStyle='#f6dfad';ctx.fillRect(-21,-20,42,22);
  ctx.fillStyle='#633c32';ctx.textAlign='center';ctx.font='bold 9px sans-serif';ctx.fillText(caramel?'CARAMEL':'CHOCO',0,-6);
  iceShape(ctx,[[-13,20],[13,20],[4,35],[-4,35]],'#efbc6b');
  ctx.restore();
}
const iceClamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Seeded scatter stays still between frames, without rows or a repeating grid.
export function scatterIceChips(count=22,seed=9137){
  let value=seed;
  const random=()=>{value=(value*1664525+1013904223)>>>0;return value/4294967296;};
  const points=[];
  while(points.length<count){
    const x=random()*110-55,y=random()*85-75;
    if((x/60)**2+((y+30)/50)**2>1||points.some(p=>Math.hypot(p.x-x,p.y-y)<9))continue;
    points.push({x,y,angle:random()*Math.PI,size:3+random()*3});
  }
  return points;
}
const ICE_CHIP_POINTS=scatterIceChips();
export const ICE_BITES=[{x:29,y:-65,r:60},{x:-32,y:-40,r:65},{x:12,y:30,r:73},{x:0,y:113,r:66}];
const ICE_CUP_BITES=[{x:29,y:-65,r:60},{x:-32,y:-40,r:65},{x:12,y:-18,r:55},{x:0,y:-12,r:73}];
export function iceBiteCount(time){return ICE_BITES.filter((_,i)=>time>=2.1+i*.95).length;}
function iceOval(ctx,x,y,rx,ry,color){
  ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
}
function iceShape(ctx,points,color){
  ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
}
function drawIceCup(ctx){
  iceShape(ctx,[[-63,5],[63,5],[47,100],[-47,100]],'#8fcfd3');
  for(let i=0;i<5;i++){ctx.fillStyle=['#ef90ad','#f3c871','#b3d8af'][i%3];ctx.fillRect(-42+i*18,25,12,55);}
  iceOval(ctx,0,6,64,12,'#e7fcf3');iceOval(ctx,0,6,55,7,'#659ba5');
}
export function drawIceDessert(ctx,recipe,x,y,scale=1,bites=0){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  // The reusable cup is drawn outside the edible layer's bite mask.
  if(recipe.cone==='cup'){drawIceCup(ctx);if(bites>=4){ctx.restore();return;}}
  // Intersect the dessert with the outside of each bite; the remaining portion
  // keeps its original size and position, with visible scalloped bite edges.
  if(bites>0){ctx.beginPath();ctx.rect(-200,-82,400,282);ctx.clip();}
  for(const bite of (recipe.cone==='cup'?ICE_CUP_BITES:ICE_BITES).slice(0,bites)){
    ctx.beginPath();ctx.rect(-200,-200,400,400);
    ctx.moveTo(bite.x+bite.r,bite.y);ctx.arc(bite.x,bite.y,bite.r,0,Math.PI*2);
    ctx.clip('evenodd');
  }
  const coneColor={waffle:'#dca25e',sugar:'#edc88b',chocolate:'#6b4336',cup:'#8fcfd3',pretzel:'#a96f36',cookie:'#cfab73'}[recipe.cone];
  ctx.save();
  if(recipe.cone==='waffle')ctx.scale(1.18,1.04);
  else if(!['cup','cake'].includes(recipe.cone))ctx.scale(.88,.8);
  if(recipe.cone==='cake'){
    // A pale wafer bowl, rolled collar, and flat-bottomed embossed stem.
    iceShape(ctx,[[-37,38],[37,38],[26,114],[20,118],[-20,118],[-26,114]],'#dfc27f');
    ctx.save();ctx.beginPath();ctx.moveTo(-36,38);ctx.lineTo(36,38);ctx.lineTo(25,118);ctx.lineTo(-25,118);ctx.closePath();ctx.clip();
    for(let y=45;y<114;y+=15)for(let x=-35;x<36;x+=12){
      ctx.fillStyle='#c6a360';ctx.fillRect(x,y,8,10);
      ctx.fillStyle='#f5dda2';ctx.fillRect(x-2,y-2,10,2);ctx.fillRect(x-2,y-2,2,12);
      ctx.fillStyle='#e9cf91';ctx.fillRect(x+1,y+1,5,7);
    }
    ctx.restore();iceOval(ctx,0,115,26,4,'#d0b173');
    iceShape(ctx,[[-51,6],[51,6],[43,26],[33,39],[-33,39],[-43,26]],'#edd7a1');
    iceShape(ctx,[[-49,8],[-36,10],[-28,37],[-34,37],[-43,25]],'#f7e7bd');
    iceShape(ctx,[[41,9],[50,8],[42,26],[33,38],[26,38]],'#d5b77b');
    iceOval(ctx,0,39,37,8,'#d7b97b');iceOval(ctx,0,36,37,5,'#f3dfa9');
    iceOval(ctx,0,5,52,10,'#e6ca8b');iceOval(ctx,0,3,49,8,'#f9e9bd');
    iceOval(ctx,0,3,41,5,'#c8a460');iceOval(ctx,0,1,42,3,'#e2c581');
  }else if(recipe.cone!=='cup'){
    iceShape(ctx,[[-57,5],[57,5],[0,150]],coneColor);
    ctx.save();ctx.beginPath();ctx.moveTo(-55,6);ctx.lineTo(55,6);ctx.lineTo(0,148);ctx.closePath();ctx.clip();
    ctx.strokeStyle=recipe.cone==='chocolate'?'#ae7d57':'#b87a41';ctx.lineWidth=2;
    for(let i=-140;i<150;i+=19){
      ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+130,150);ctx.moveTo(i,0);ctx.lineTo(i-130,150);ctx.stroke();
    }
    if(recipe.cone==='waffle'){
      for(let y=12;y<146;y+=18)for(let x=-64;x<65;x+=18){
        const xx=x+(Math.floor(y/18)%2)*9;
        iceShape(ctx,[[xx,y-7],[xx+7,y],[xx,y+7],[xx-7,y]],'#ad6c32');
        iceShape(ctx,[[xx,y-4],[xx+4,y],[xx,y+4],[xx-4,y]],'#c88a43');
        ctx.strokeStyle='#f2c77e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(xx-8,y);ctx.lineTo(xx,y-8);ctx.lineTo(xx+8,y);ctx.stroke();
      }
      ctx.strokeStyle='#8f592c66';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(50,10);ctx.lineTo(0,150);ctx.stroke();
    }
    ctx.restore();iceOval(ctx,0,6,57,9,'#f3d29d');
    if(recipe.cone==='waffle'){iceOval(ctx,0,5,53,5,'#ae7039');iceOval(ctx,0,3,54,3,'#edbd73');}
  }
  if(recipe.cone==='pretzel'||recipe.cone==='cookie'){
    ctx.fillStyle=recipe.cone==='pretzel'?'#fff0ca':'#6f4837';
    for(const [x,y] of [[-30,25],[20,21],[0,43],[-15,69],[12,85],[0,117]])ctx.fillRect(x,y,recipe.cone==='cookie'?6:3,4);
  }
  ctx.restore();
  const flavor=ICE_FLAVORS[recipe.flavor];
  iceOval(ctx,0,-30,69,61,flavor.color);
  for(let i=0;i<6;i++)iceOval(ctx,-52+i*21,7,16,13,flavor.color);
  if(recipe.flavor==='rainbow'){
    ctx.save();ctx.beginPath();ctx.ellipse(0,-30,69,61,0,0,7);ctx.clip();
    for(let i=0;i<4;i++){ctx.fillStyle=['#a4d9e8','#b6d9a1','#f8d788','#ef9bb9'][i];ctx.fillRect(-75,-90+i*32,150,29);}
    ctx.restore();
  }
  iceOval(ctx,-22,-57,24,10,'#ffffff44');
  if(recipe.flavor==='mint'||recipe.toppings.includes('chips')){
    for(const chip of ICE_CHIP_POINTS){
      ctx.save();ctx.translate(chip.x,chip.y);ctx.rotate(chip.angle);
      iceShape(ctx,[[-chip.size,2],[0,-chip.size],[chip.size,1],[1,chip.size]],'#69463e');ctx.restore();
    }
  }
  if(recipe.flavor==='cookies'){
    for(const chip of ICE_CHIP_POINTS.filter((_,i)=>i%4===0)){
      ctx.save();ctx.translate(chip.x,chip.y);ctx.rotate(chip.angle);
      iceOval(ctx,0,2,10,8,'#221f25');iceOval(ctx,0,0,10,7,'#fff5df');iceOval(ctx,0,-3,10,7,'#302831');
      ctx.strokeStyle='#64525c';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,-3,7,4,0,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#b4a3a7';ctx.font='bold 4px sans-serif';ctx.textAlign='center';ctx.fillText('OREO',0,-2);ctx.restore();
    }
  }
  if(hasSyrup(recipe)){
    ctx.save();ctx.beginPath();ctx.ellipse(0,-30,69,61,0,0,Math.PI*2);ctx.clip();
    for(const drop of recipe.sauceDrops||[]){
      const radius=3+Math.sqrt(drop.amount)*7;
      iceOval(ctx,drop.x,drop.y,radius,radius*.7,syrupColor(drop));
      iceOval(ctx,drop.x-1,drop.y-1,radius*.45,1,syrupShine(drop));
    }
    ctx.restore();
    ctx.lineCap='round';
    for(const drop of recipe.sauceDrops||[]){
      if(drop.flowY===undefined)continue;
      ctx.beginPath();ctx.moveTo(drop.x,drop.y);
      for(let y=drop.y;y<drop.flowY;y+=3)ctx.lineTo(chocolateSurfaceX(recipe,drop.x,y),y);
      ctx.lineTo(chocolateSurfaceX(recipe,drop.x,drop.flowY),drop.flowY);
      ctx.strokeStyle=syrupColor(drop);ctx.lineWidth=3+Math.min(5,(drop.amount+(drop.flowVolume||0))*4);ctx.stroke();
      ctx.strokeStyle=syrupShine(drop);ctx.lineWidth=1;ctx.stroke();
    }
  }
  if(recipe.toppings.includes('sprinkles'))for(let i=0;i<35;i++){
    ctx.save();ctx.translate(-52+(i*29)%105,-72+(i*17)%78);ctx.rotate(i);
    ctx.fillStyle=['#df5283','#f5ce4d','#65b8c5','#fff7e1','#9c70c8'][i%5];ctx.fillRect(-3,-1,recipe.funny?11:7,recipe.funny?4:3);ctx.restore();
  }
  if(recipe.toppings.includes('stars'))for(let i=0;i<7;i++){
    const x=-44+(i*29)%90,y=-63+(i*23)%60;
    iceShape(ctx,Array.from({length:10},(_,j)=>[x+Math.cos(j*Math.PI/5-Math.PI/2)*(j%2?3:8),y+Math.sin(j*Math.PI/5-Math.PI/2)*(j%2?3:8)]),'#ffe18b');
  }
  if(recipe.toppings.includes('marshmallows'))for(const [x,y] of [[-37,-41],[5,-63],[35,-30],[-7,-12]]){
    ctx.fillStyle='#fff8ef';ctx.beginPath();ctx.roundRect(x-7,y-6,14,13,4);ctx.fill();iceOval(ctx,x,y-5,7,3,'#ffe5ee');
  }
  if(recipe.toppings.includes('berries'))for(const [x,y,i] of [[-42,-27,0],[-18,-64,1],[23,-47,0],[37,-15,1]]){
    iceOval(ctx,x,y,8,8,i?'#686ba6':'#cf5479');iceOval(ctx,x-2,y-3,2,2,'#ffffff88');
  }
  if(recipe.funny){
    for(const [x,y,r] of [[-20,-37,12],[17,-42,15]]){iceOval(ctx,x,y,r,r*1.15,'#fffef5');iceOval(ctx,x+3,y+2,4,6,'#342b3d');}
    ctx.strokeStyle='#713e52';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-21,14,0,Math.PI);ctx.stroke();iceOval(ctx,6,-9,7,5,'#f28ba4');
    if(recipe.toppings.includes('marshmallows')||recipe.toppings.includes('berries')||recipe.toppings.includes('stars')){
      for(const [x,y] of [[-40,-58],[35,-23]]){iceOval(ctx,x,y,4,5,'#fffef5');iceOval(ctx,x+7,y-1,4,5,'#fffef5');iceOval(ctx,x+1,y+1,1.5,2,'#352b3d');iceOval(ctx,x+8,y,1.5,2,'#352b3d');}
    }
  }
  if(recipe.toppings.includes('cream')){
    iceOval(ctx,0,-87,28,12,'#fffaf0');iceOval(ctx,2,-101,20,11,'#fffaf0');iceOval(ctx,5,-113,11,9,'#fffaf0');
  }
  if(recipe.toppings.includes('cherry')){
    const cy=recipe.toppings.includes('cream')?-126:-94;
    iceOval(ctx,3,cy,11,10,'#d44c65');iceOval(ctx,0,cy-3,3,2,'#ffbdba');
    if(recipe.funny){for(const x of [-1,7]){iceOval(ctx,x,cy-1,4,5,'#fffaf0');iceOval(ctx,x+1,cy,1.5,2,'#342b3d');}}
    ctx.strokeStyle='#53754b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(4,cy-7);ctx.quadraticCurveTo(1,cy-26,15,cy-25);ctx.stroke();
  }
  ctx.restore();
}
function drawIceDragon(ctx,x,y,time,mouth,headX=0,headY=0){
  ctx.save();ctx.translate(x,y);
  // A friendly, round dragon with folded wings, little horns and expressive eyes.
  iceShape(ctx,[[45,60],[130,20],[114,120],[65,105]],'#8260bb');
  iceShape(ctx,[[52,64],[114,40],[99,93],[64,100]],'#d899de');
  iceShape(ctx,[[40,139],[127,151],[148,124],[135,170],[65,174]],'#32b9b0');
  iceOval(ctx,35,118,63,75,'#32b9b0');iceOval(ctx,15,127,36,56,'#ffdb79');
  for(const [x,y,color] of [[60,94,'#a1ece0'],[73,113,'#89d9e8'],[62,139,'#bba4ee'],[50,159,'#f6b9d1']])iceOval(ctx,x,y,6,4,color);
  iceOval(ctx,-1,185,30,12,'#26949e');iceOval(ctx,67,185,30,12,'#26949e');
  for(let i=0;i<4;i++)iceShape(ctx,[[64+i*10,44+i*26],[86+i*9,54+i*26],[66+i*9,66+i*26]],['#ff8d9b','#ffc961','#aa8ce7','#ee89c1'][i]);
  ctx.strokeStyle='#55c9bd';ctx.lineWidth=48;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(28,80);ctx.quadraticCurveTo(20+headX,60+headY,headX+8,headY+28);ctx.stroke();
  ctx.save();ctx.translate(headX,headY);
  iceOval(ctx,0,19,64,62,'#55c9bd');
  iceShape(ctx,[[-34,-29],[-44,-66],[-13,-38]],'#ffcb65');
  iceShape(ctx,[[24,-34],[42,-65],[43,-17]],'#ffcb65');
  iceOval(ctx,39,21,7,5,'#b4a2ef');iceOval(ctx,47,34,5,4,'#f4aacb');
  iceOval(ctx,-46,43,44,25,'#98e4c2');
  iceOval(ctx,-17,0,15,20,'#fff7e8');iceOval(ctx,23,0,14,19,'#fff7e8');
  iceOval(ctx,-22,2,6,10,'#29464e');iceOval(ctx,18,2,6,10,'#29464e');
  iceOval(ctx,-24,-2,2,3,'#fff');iceOval(ctx,16,-2,2,3,'#fff');
  iceOval(ctx,-66,36,3,3,'#287e80');iceOval(ctx,-44,31,3,3,'#287e80');
  iceOval(ctx,-29,29,11,5,'#f58da9');
  if(mouth>0){
    iceOval(ctx,-54,56,29,8+mouth*22,'#5b3a49');
    iceOval(ctx,-56,65+mouth*10,17,5,'#eb9baf');
    iceShape(ctx,[[-73,48],[-65,48],[-68,59]],'#fff7de');
  }else{
    ctx.strokeStyle='#287e80';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-78,53);ctx.quadraticCurveTo(-56,67,-35,51);ctx.stroke();
  }
  ctx.restore();
  ctx.save();ctx.translate(-6,92);ctx.rotate(Math.sin(time*4)*.08);
  iceOval(ctx,-15,0,30,13,'#55c9bd');ctx.restore();
  ctx.restore();
}
export function iceCleanup(recipe,time){
  const puddles=hasSyrup(recipe)?(recipe.saucePuddles||[]):[];
  if(!puddles.length)return {puddles:[],licking:false,x:0,thanks:5.5,end:ICE_CLIP_SECONDS};
  const min=Math.min(...puddles.map(p=>p.x))-15,max=Math.max(...puddles.map(p=>p.x))+15;
  const progress=iceClamp((time-5.5)/3,0,1),x=min+(max-min)*progress;
  return {puddles:puddles.map(p=>({...p,volume:p.volume*(1-iceClamp((x-p.x+10)/20,0,1))})).filter(p=>p.volume>0),
    licking:time>=5.5&&time<8.5,x,thanks:8.8,end:10.8};
}
// Timeline crossings keep sound in step with bites and tongue strokes, including
// after a pause; no independent timers can keep playing while the game is paused.
export function iceEndingSounds(recipe,from,to){
  if(recipe.funny===false)return [];
  const cues=[];
  for(let i=0;i<4;i++){const at=2.1+i*.95;if(from<at&&to>=at)cues.push('iceChew');}
  if(iceCleanup(recipe,to).end>ICE_CLIP_SECONDS){
    for(let i=0;i<6;i++){const at=5.5625+i*.5;if(from<at&&to>=at)cues.push('iceSlurp');}
  }
  return cues;
}
export function drawIceScene(ctx,recipe,width,height,clipTime=null,reducedMotion=false){
  ctx.save();ctx.scale(width/900,height/620);
  ctx.fillStyle='#fff1df';ctx.fillRect(0,0,900,620);
  for(let i=0;i<12;i++){ctx.fillStyle=i%2?'#f3b8c5':'#fff5e7';ctx.fillRect(i*75,0,75,68);iceOval(ctx,i*75+37.5,68,37.5,18,ctx.fillStyle);}
  ctx.fillStyle='#e4f2ed';ctx.fillRect(55,124,790,330);
  ctx.strokeStyle='#aaccc3';ctx.lineWidth=7;ctx.strokeRect(55,124,790,330);
  ctx.fillStyle='#cbe4db';ctx.fillRect(445,124,8,330);
  ctx.fillStyle='#c79575';ctx.fillRect(0,470,900,150);ctx.fillStyle='#eec8a2';ctx.fillRect(0,456,900,24);
  ctx.textAlign='center';ctx.fillStyle='#533e4a';ctx.font='bold 28px sans-serif';
  ctx.fillText(clipTime===null?'THE LITTLE DRAGON ICE CREAM PARLOR':'A treat for your dragon!',450,111);
  if(clipTime===null){
    iceOval(ctx,450,493,145,20,'#a67c6244');
    ctx.save();ctx.translate(450,307);ctx.scale(1.15,1.15);drawChocolateSpill(ctx,recipe);ctx.restore();
    drawIceDessert(ctx,recipe,450,307,1.15);
    ctx.font='20px sans-serif';ctx.fillStyle='#fff6e8';ctx.fillText(ICE_FLAVORS[recipe.flavor].name+' · '+ICE_CONES[recipe.cone],450,566);
  }else{
    const t=clipTime,cleanup=iceCleanup(recipe,t);
    const arrive=iceClamp(t/1.4,0,1),bites=iceBiteCount(t);
    const biteTargets=recipe.cone==='cup'?ICE_CUP_BITES:ICE_BITES;
    const biteIndex=Math.min(3,Math.max(0,Math.floor((t-1.5)/.95)));
    const phase=iceClamp((t-1.5-biteIndex*.95)/.95,0,1),target=biteTargets[biteIndex];
    const lunge=t>=1.5&&t<5.35?(reducedMotion ? .65 :Math.sin(phase*Math.PI)):0;
    const mouth=lunge>.3&&phase<.65?.9:lunge>.15?.15:0;
    ctx.save();ctx.translate(450,307);ctx.scale(1.15,1.15);drawChocolateSpill(ctx,{...recipe,saucePuddles:cleanup.puddles},false);ctx.restore();
    const lickX=450+cleanup.x*1.15;
    const dragonX=cleanup.licking?lickX+54:900-arrive*330;
    drawIceDragon(ctx,dragonX,277,reducedMotion?0:t,cleanup.licking?.45:mouth,cleanup.licking?0:(420+target.x-516)*lunge,cleanup.licking?110:(314+target.y-333)*lunge);
    if(cleanup.licking){
      const reach=reducedMotion?1:.65+.35*Math.sin((t-5.5)*Math.PI*8)**2;
      ctx.strokeStyle='#eb9baf';ctx.lineWidth=13;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(lickX,450);
      ctx.quadraticCurveTo(lickX-10,478,lickX-20*reach,450+43*reach);ctx.stroke();
      ctx.fillStyle='#533e4a';ctx.font='23px sans-serif';ctx.fillText('Slurp! Cleaning up every last drop…',450,565);
    }
    if(bites<4||recipe.cone==='cup'){
      const setDown=recipe.cone==='cup'&&bites===4?79*iceClamp((t-4.95)/.55,0,1):0;
      drawIceDessert(ctx,recipe,420,314+setDown,1,bites);
    }
    if(!reducedMotion&&bites>0&&t<5.5){
      const bite=biteTargets[bites-1],elapsed=t-(2.1+(bites-1)*.95);
      if(elapsed<.35)for(let i=0;i<5;i++)iceOval(ctx,420+bite.x+(i-2)*9,314+bite.y+elapsed*95+i*4,3,3,ICE_FLAVORS[recipe.flavor].color);
    }
    if(t>=cleanup.thanks){
      ctx.fillStyle='#fff8e8';ctx.beginPath();ctx.roundRect(200,167,280,95,22);ctx.fill();
      iceShape(ctx,[[470,239],[505,270],[454,254]],'#fff8e8');
      ctx.fillStyle='#533e4a';ctx.font='bold 33px sans-serif';ctx.fillText('Yum! Thank you!',340,224);
      ctx.font='23px sans-serif';ctx.fillText('One very happy dragon.',450,565);
      for(let i=0;i<3;i++){ctx.fillStyle='#d96d8f';ctx.font='30px sans-serif';ctx.fillText('♥',610+i*45,200-i*24);}
    }
  }
  ctx.restore();
}
export function drawIcePreview(canvas){
  const ctx=canvas.getContext('2d');if(!ctx)return;
  drawIceScene(ctx,{cone:'waffle',flavor:'strawberry',toppings:['sprinkles','cream','cherry']},canvas.width,canvas.height);
}
export function createIceCream({canvas,onHud,onFinish,controls=document.querySelector('#ice-controls'),getUpgrades=()=>[]}){
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Your browser does not support canvas.');
  const audio=createMazeAudio(),controller=new AbortController();
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  let recipe=createIceRecipe(),step=0,active=false,paused=false,clip=null,spoken=false,destroyed=false,last=0,frame;
  let funny=false,userMuted=false;
  let activeTopping=null,bottle={x:0,y:-30},squeezing=false,pointer=null,drag=null;
  const stopPour=()=>{squeezing=false;pointer=null;drag=null;};
  const canPour=()=>active&&!paused&&clip===null&&step===2&&['sauce','caramel'].includes(activeTopping)&&recipe.toppings.includes(activeTopping)&&!document.hidden;
  const canvasPoint=e=>{const rect=canvas.getBoundingClientRect();return {x:(e.clientX-rect.left)*900/rect.width,y:(e.clientY-rect.top)*620/rect.height};};
  const events={signal:controller.signal};
  canvas.addEventListener?.('pointerdown',e=>{
    if(!canPour()||pointer!==null||e.button>0)return;
    const p=canvasPoint(e),bx=450+bottle.x*1.15,by=307+bottle.y*1.15-85;
    if(Math.abs(p.x-bx)>32||p.y<by-50||p.y>by+40)return;
    e.preventDefault();canvas.focus();audio.unlock();canvas.setPointerCapture?.(e.pointerId);
    pointer=e.pointerId;drag={...p,bx:bottle.x,by:bottle.y};squeezing=true;
    pourIceChocolate(recipe,bottle.x,bottle.y,.12,activeTopping);
  },events);
  canvas.addEventListener?.('pointermove',e=>{
    if(e.pointerId!==pointer||!drag||!canPour())return;
    e.preventDefault();const p=canvasPoint(e);
    const x=iceClamp(drag.bx+(p.x-drag.x)/1.15,-240,240),y=iceClamp(drag.by+(p.y-drag.y)/1.15,-75,12);
    const steps=Math.max(1,Math.ceil(Math.hypot(x-bottle.x,y-bottle.y)/3));
    for(let i=1;i<=steps;i++)pourIceChocolate(recipe,bottle.x+(x-bottle.x)*i/steps,bottle.y+(y-bottle.y)*i/steps,.015,activeTopping);
    bottle={x,y};
  },events);
  for(const event of ['pointerup','pointercancel','lostpointercapture','blur'])canvas.addEventListener?.(event,stopPour,events);
  canvas.addEventListener?.('keydown',e=>{
    if(!canPour()||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))return;
    e.preventDefault();
    if(e.key===' '){if(!squeezing)pourIceChocolate(recipe,bottle.x,bottle.y,.12,activeTopping);squeezing=true;}
    else{bottle.x=iceClamp(bottle.x+(e.key==='ArrowLeft'?-4:e.key==='ArrowRight'?4:0),-240,240);bottle.y=iceClamp(bottle.y+(e.key==='ArrowUp'?-4:e.key==='ArrowDown'?4:0),-75,12);}
  },events);
  globalThis.window?.addEventListener('keyup',e=>{if(e.key===' ')stopPour();},events);
  const steps=['Cone','Ice cream','Toppings'];
  const tabs=document.createElement('div');tabs.className='ice-steps';
  const heading=document.createElement('h3');heading.tabIndex=-1;
  const choices=document.createElement('div');choices.className='ice-choices';
  const navigation=document.createElement('div');navigation.className='ice-navigation';
  const back=document.createElement('button'),next=document.createElement('button');
  back.type=next.type='button';back.className='button outline';next.className='button dark';back.textContent='← Back';
  navigation.append(back,next);
  const sauceHelp=document.createElement('p');sauceHelp.textContent='Syrup bottle: tap to squeeze, hold for more, and drag to spread it around. Thick syrup makes up to two slow drips, then sets in place. Squeeze beside the ice cream to make a puddle on the floor. With a keyboard, focus the canvas, move with arrow keys, and hold Space to pour. Choose another topping to put the bottle away. Choose the same drizzle to bring it back; tap it again while the bottle is out to remove the syrup.';
  const modeButton=document.createElement('button');modeButton.type='button';modeButton.className='button outline';
  modeButton.onclick=()=>{funny=!funny;recipe.funny=funny;audio.stop();audio.setMuted(userMuted||!funny);renderControls();};
  controls.replaceChildren(tabs,heading,choices,navigation,sauceHelp,modeButton);
  const stepButtons=steps.map((label,index)=>{
    const button=document.createElement('button');button.type='button';button.className='button outline';button.textContent=(index+1)+'. '+label;
    button.onclick=()=>{if(active&&!paused&&clip===null){step=index;renderControls();heading.focus({preventScroll:true});}};
    tabs.append(button);return button;
  });
  function renderControls(){
    modeButton.textContent=funny?'Funny mode · switch to Normal':'Normal mode · switch to Funny';modeButton.setAttribute('aria-pressed',String(funny));
    stopPour();sauceHelp.hidden=!(step===2&&['sauce','caramel'].includes(activeTopping)&&recipe.toppings.includes(activeTopping)&&clip===null);
    const locked=!active||paused||clip!==null;
    stepButtons.forEach((button,index)=>{button.disabled=locked;button.setAttribute('aria-pressed',String(index===step));});
    heading.textContent=clip!==null?'Your dragon is enjoying its ice cream!':step===0?'Choose your cone':step===1?'Choose your ice cream':'Choose your toppings — mix as many as you like';
    choices.replaceChildren();
    const options=step===0?ICE_CONES:step===1?Object.fromEntries(Object.entries(ICE_FLAVORS).map(([id,f])=>[id,f.name])):ICE_TOPPINGS;
    for(const [id,label] of Object.entries(options)){
      const button=document.createElement('button');button.type='button';button.className='button outline';const kind=step===0?'cone':step===1?'flavor':'topping',owned=iceIngredientUnlocked(kind,id,getUpgrades());
      button.textContent=label+(!owned?' · Shop: 200 coins':ICE_UNLOCKS[kind]?.[id]?' · Owned':'');
      button.disabled=locked||!owned;
      const selected=step===0?recipe.cone===id:step===1?recipe.flavor===id:recipe.toppings.includes(id);
      button.setAttribute('aria-pressed',String(selected));
      button.onclick=()=>{
        if(!active||paused||clip!==null||!iceIngredientUnlocked(kind,id,getUpgrades()))return;
        if(step===2&&['sauce','caramel'].includes(id)&&activeTopping!==id&&recipe.toppings.includes(id)){
          activeTopping=id;renderControls();return;
        }
        if(step===2)activeTopping=id;
        if(step===0)recipe.cone=id;else if(step===1)recipe.flavor=id;
        else recipe.toppings=recipe.toppings.includes(id)?recipe.toppings.filter(item=>item!==id):[...recipe.toppings,id];
        if(step===2&&['sauce','caramel'].includes(id)){
          for(const key of ['sauceDrops','sauceFalling','saucePuddles'])recipe[key]=(recipe[key]||[]).filter(p=>syrupKind(p)!==id);bottle={x:0,y:-30};
        }
        audio.play('gem');renderControls();
        if(step===2&&['sauce','caramel'].includes(id)&&recipe.toppings.includes(id))canvas.scrollIntoView?.({block:'center',behavior:reduced?'auto':'smooth'});
        choices.children[Object.keys(options).indexOf(id)]?.focus({preventScroll:true});
      };
      choices.append(button);
    }
    back.disabled=locked||step===0;next.disabled=locked;
    next.textContent=step===2?'Done — feed the dragon!':'Next: '+steps[step+1]+' →';
    onHud({text:clip!==null?'Watch your dragon enjoy the treat!':steps[step]+' · '+recipe.toppings.length+' toppings · More ingredients in the Appearance shop'});
  }
  back.onclick=()=>{if(active&&!paused&&clip===null&&step>0){step--;renderControls();heading.focus({preventScroll:true});}};
  next.onclick=()=>{
    if(!active||paused||clip!==null)return;
    if(step<2)step++;else{
      // Finish any airborne drops before the dragon begins its cleanup.
      for(const drop of recipe.sauceFalling||[]){
        recipe.saucePuddles??=[];
        const x=Math.round(drop.x/4)*4;let puddle=recipe.saucePuddles.find(p=>p.x===x&&syrupKind(p)===syrupKind(drop));
        if(!puddle){puddle={kind:syrupKind(drop),x,volume:0};recipe.saucePuddles.push(puddle);}puddle.volume=Math.min(30,puddle.volume+drop.volume);
      }
      recipe.sauceFalling=[];clip=0;spoken=false;audio.play('win');
    }
    renderControls();heading.focus({preventScroll:true});
  };
  function finish(){
    if(!active)return;active=false;
    onFinish(5,{title:'Your dragon loved it!',detail:'Make another delicious creation!'});
  }
  function tick(now){
    if(destroyed)return;
    const dt=last?Math.min(.1,(now-last)/1000):0;last=now;
    if(active&&!paused&&!document.hidden&&clip!==null){
      const cleanup=iceCleanup(recipe,clip),previousClip=clip;
      clip=Math.min(cleanup.end,clip+dt);
      for(const cue of iceEndingSounds(recipe,previousClip,clip))audio.play(cue);
      if(clip>=cleanup.thanks&&!spoken){spoken=true;if(funny)audio.say('Yum! Thank you!',1.1);}
      if(clip>=cleanup.end)finish();
    }
    if(canPour()&&squeezing)pourIceChocolate(recipe,bottle.x,bottle.y,dt,activeTopping);
    if(active&&!paused&&!document.hidden&&clip===null)tickIceChocolate(recipe,dt);
    drawIceScene(ctx,recipe,canvas.width,canvas.height,clip,reduced);
    if(active&&step===2&&['sauce','caramel'].includes(activeTopping)&&clip===null&&recipe.toppings.includes(activeTopping)){
      ctx.save();ctx.scale(canvas.width/900,canvas.height/620);drawChocolateBottle(ctx,bottle,squeezing&&!paused,activeTopping);ctx.restore();
    }
    frame=requestAnimationFrame(tick);
  }
  document.addEventListener?.('visibilitychange',()=>{last=0;stopPour();if(document.hidden)audio.stop();},{signal:controller.signal});
  renderControls();frame=requestAnimationFrame(tick);
  return {
    start(){stopPour();activeTopping=null;bottle={x:0,y:-30};audio.stop();audio.unlock();recipe=createIceRecipe();recipe.funny=funny;audio.setMuted(userMuted||!funny);step=0;clip=null;spoken=false;active=true;paused=false;last=0;renderControls();stepButtons[0].focus({preventScroll:true});},
    pause(value){paused=value;last=0;if(value)audio.stop();renderControls();},
    setMuted:value=>{userMuted=value;audio.setMuted(userMuted||!funny);},
    destroy(){if(destroyed)return;destroyed=true;active=false;stopPour();controller.abort();audio.destroy();cancelAnimationFrame(frame);controls.replaceChildren();}
  };
}
